import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import ExcelJS from "exceljs";
import { branchAndFragment, branchWhereFragment } from "../../lib/branchScope";

const router: IRouter = Router();

// Overview: KPIs for the medical module
router.get("/medical-reports/overview", async (req, res): Promise<void> => {
  const bP = branchWhereFragment(req, "branch_id");           // patients
  const bV = branchAndFragment(req, "branch_id");              // visits (already has WHERE)
  const bA = branchAndFragment(req, "branch_id");              // medical_appointments
  const bI = branchAndFragment(req, "branch_id");              // medical_invoices
  const r = await db.execute<{
    patients: number; visits_today: number; visits_week: number; visits_month: number;
    appts_today: number; revenue_today: number; revenue_week: number; revenue_month: number;
    outstanding: number; upcoming_followups: number;
  }>(sql`
    SELECT
      (SELECT COUNT(*) FROM patients${bP})::int AS patients,
      (SELECT COUNT(*) FROM visits WHERE visit_date::date = current_date${bV})::int AS visits_today,
      (SELECT COUNT(*) FROM visits WHERE visit_date >= current_date - INTERVAL '7 days'${bV})::int AS visits_week,
      (SELECT COUNT(*) FROM visits WHERE visit_date >= date_trunc('month', current_date)${bV})::int AS visits_month,
      (SELECT COUNT(*) FROM medical_appointments
        WHERE start_at::date = current_date AND status NOT IN ('cancelled','no_show')${bA})::int AS appts_today,
      COALESCE((SELECT SUM(paid_amount) FROM medical_invoices
        WHERE invoice_date::date = current_date AND status <> 'cancelled'${bI}), 0)::float AS revenue_today,
      COALESCE((SELECT SUM(paid_amount) FROM medical_invoices
        WHERE invoice_date >= current_date - INTERVAL '7 days' AND status <> 'cancelled'${bI}), 0)::float AS revenue_week,
      COALESCE((SELECT SUM(paid_amount) FROM medical_invoices
        WHERE invoice_date >= date_trunc('month', current_date) AND status <> 'cancelled'${bI}), 0)::float AS revenue_month,
      COALESCE((SELECT SUM(total - paid_amount) FROM medical_invoices
        WHERE status IN ('unpaid','partial')${bI}), 0)::float AS outstanding,
      (SELECT COUNT(*) FROM visits WHERE follow_up_date >= current_date${bV})::int AS upcoming_followups
  `);
  res.json(r.rows?.[0] ?? null);
});

// Visits per day for the last N days (default 30)
router.get("/medical-reports/visits-per-day", async (req, res): Promise<void> => {
  const days = Math.min(Math.max(parseInt(String(req.query.days || "30"), 10) || 30, 7), 180);
  const bV = branchAndFragment(req, "v.branch_id");
  const r = await db.execute<{ day: string; count: number }>(sql`
    SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
           COALESCE(COUNT(v.id), 0)::int AS count
    FROM generate_series(current_date - (${days - 1} || ' days')::interval, current_date, '1 day') d
    LEFT JOIN visits v ON v.visit_date::date = d::date${bV}
    GROUP BY d ORDER BY d
  `);
  res.json(r.rows ?? []);
});

// Revenue per doctor (last 90 days, top 10)
router.get("/medical-reports/revenue-per-doctor", async (req, res): Promise<void> => {
  const bMi = branchAndFragment(req, "mi.branch_id");
  const r = await db.execute<{ doctor_id: number | null; doctor_name: string; doctor_name_ar: string | null; total_paid: number; invoice_count: number }>(sql`
    SELECT mi.doctor_id,
           COALESCE(e.name, 'Unassigned')   AS doctor_name,
           e.name_ar                         AS doctor_name_ar,
           COALESCE(SUM(mi.paid_amount), 0)::float AS total_paid,
           COUNT(*)::int                     AS invoice_count
    FROM medical_invoices mi
    LEFT JOIN employees e ON e.id = mi.doctor_id
    WHERE mi.invoice_date >= current_date - INTERVAL '90 days'
      AND mi.status <> 'cancelled'${bMi}
    GROUP BY mi.doctor_id, e.name, e.name_ar
    ORDER BY total_paid DESC
    LIMIT 10
  `);
  res.json(r.rows ?? []);
});

// Top procedures by revenue (last 90 days, top 10)
router.get("/medical-reports/top-procedures", async (req, res): Promise<void> => {
  const bMi = branchAndFragment(req, "mi.branch_id");
  const r = await db.execute<{ procedure_id: number | null; name: string; name_ar: string | null; count: number; revenue: number }>(sql`
    SELECT mil.procedure_id,
           COALESCE(p.name, mil.description, 'Custom') AS name,
           p.name_ar                                    AS name_ar,
           COUNT(*)::int                                AS count,
           COALESCE(SUM(mil.total), 0)::float           AS revenue
    FROM medical_invoice_lines mil
    LEFT JOIN medical_procedures p ON p.id = mil.procedure_id
    LEFT JOIN medical_invoices mi  ON mi.id = mil.invoice_id
    WHERE mi.invoice_date >= current_date - INTERVAL '90 days'
      AND mi.status <> 'cancelled'${bMi}
    GROUP BY mil.procedure_id, COALESCE(p.name, mil.description, 'Custom'), p.name_ar
    ORDER BY revenue DESC
    LIMIT 10
  `);
  res.json(r.rows ?? []);
});

// Monthly revenue trend (last 6 months)
router.get("/medical-reports/monthly-trend", async (req, res): Promise<void> => {
  const bMi = branchAndFragment(req, "mi.branch_id");
  const r = await db.execute<{ month: string; billed: number; collected: number }>(sql`
    SELECT to_char(m, 'YYYY-MM') AS month,
           COALESCE(SUM(mi.total), 0)::float       AS billed,
           COALESCE(SUM(mi.paid_amount), 0)::float AS collected
    FROM generate_series(date_trunc('month', current_date) - INTERVAL '5 months', date_trunc('month', current_date), '1 month') m
    LEFT JOIN medical_invoices mi
      ON date_trunc('month', mi.invoice_date::date) = m AND mi.status <> 'cancelled'${bMi}
    GROUP BY m ORDER BY m
  `);
  res.json(r.rows ?? []);
});

// Excel export: one workbook with KPI summary + per-doctor + top procedures + monthly trend + 30-day visits.
router.get("/medical-reports/export.xlsx", async (req, res): Promise<void> => {
  const bP = branchWhereFragment(req, "branch_id");
  const bV = branchAndFragment(req, "branch_id");
  const bA = branchAndFragment(req, "branch_id");
  const bI = branchAndFragment(req, "branch_id");
  const bMi = branchAndFragment(req, "mi.branch_id");
  const bVv = branchAndFragment(req, "v.branch_id");
  const [ov, docs, top, trend, daily] = await Promise.all([
    db.execute<any>(sql`
      SELECT
        (SELECT COUNT(*) FROM patients${bP})::int AS patients,
        (SELECT COUNT(*) FROM visits WHERE visit_date::date = current_date${bV})::int AS visits_today,
        (SELECT COUNT(*) FROM visits WHERE visit_date >= current_date - INTERVAL '7 days'${bV})::int AS visits_week,
        (SELECT COUNT(*) FROM visits WHERE visit_date >= date_trunc('month', current_date)${bV})::int AS visits_month,
        (SELECT COUNT(*) FROM medical_appointments WHERE start_at::date = current_date AND status NOT IN ('cancelled','no_show')${bA})::int AS appts_today,
        COALESCE((SELECT SUM(paid_amount) FROM medical_invoices WHERE invoice_date::date = current_date AND status <> 'cancelled'${bI}),0)::float AS revenue_today,
        COALESCE((SELECT SUM(paid_amount) FROM medical_invoices WHERE invoice_date >= current_date - INTERVAL '7 days' AND status <> 'cancelled'${bI}),0)::float AS revenue_week,
        COALESCE((SELECT SUM(paid_amount) FROM medical_invoices WHERE invoice_date >= date_trunc('month', current_date) AND status <> 'cancelled'${bI}),0)::float AS revenue_month,
        COALESCE((SELECT SUM(total - paid_amount) FROM medical_invoices WHERE status IN ('unpaid','partial')${bI}),0)::float AS outstanding,
        (SELECT COUNT(*) FROM visits WHERE follow_up_date >= current_date${bV})::int AS upcoming_followups
    `),
    db.execute<any>(sql`
      SELECT COALESCE(e.name, 'Unassigned') AS doctor_name, e.name_ar AS doctor_name_ar,
             COALESCE(SUM(mi.paid_amount),0)::float AS total_paid, COUNT(*)::int AS invoice_count
      FROM medical_invoices mi LEFT JOIN employees e ON e.id = mi.doctor_id
      WHERE mi.invoice_date >= current_date - INTERVAL '90 days' AND mi.status <> 'cancelled'${bMi}
      GROUP BY mi.doctor_id, e.name, e.name_ar ORDER BY total_paid DESC
    `),
    db.execute<any>(sql`
      SELECT COALESCE(p.name, mil.description, 'Custom') AS name, p.name_ar AS name_ar,
             COUNT(*)::int AS count, COALESCE(SUM(mil.total),0)::float AS revenue
      FROM medical_invoice_lines mil
      LEFT JOIN medical_procedures p ON p.id = mil.procedure_id
      LEFT JOIN medical_invoices mi ON mi.id = mil.invoice_id
      WHERE mi.invoice_date >= current_date - INTERVAL '90 days' AND mi.status <> 'cancelled'${bMi}
      GROUP BY mil.procedure_id, COALESCE(p.name, mil.description, 'Custom'), p.name_ar
      ORDER BY revenue DESC
    `),
    db.execute<any>(sql`
      SELECT to_char(m, 'YYYY-MM') AS month,
             COALESCE(SUM(mi.total),0)::float AS billed,
             COALESCE(SUM(mi.paid_amount),0)::float AS collected
      FROM generate_series(date_trunc('month', current_date) - INTERVAL '5 months', date_trunc('month', current_date), '1 month') m
      LEFT JOIN medical_invoices mi ON date_trunc('month', mi.invoice_date::date) = m AND mi.status <> 'cancelled'${bMi}
      GROUP BY m ORDER BY m
    `),
    db.execute<any>(sql`
      SELECT to_char(d::date, 'YYYY-MM-DD') AS day, COALESCE(COUNT(v.id),0)::int AS count
      FROM generate_series(current_date - INTERVAL '29 days', current_date, '1 day') d
      LEFT JOIN visits v ON v.visit_date::date = d::date${bVv}
      GROUP BY d ORDER BY d
    `),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Fratelanza Hub";
  wb.created = new Date();

  const headerStyle = { font: { bold: true, color: { argb: "FFFFFFFF" } }, fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1E40AF" } } };

  // Sheet 1: KPI summary
  const s1 = wb.addWorksheet("Summary");
  const o = ov.rows?.[0] ?? {};
  s1.columns = [{ header: "Metric", key: "k", width: 32 }, { header: "Value", key: "v", width: 18 }];
  s1.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  [
    ["Patients (total)", o.patients],
    ["Visits today", o.visits_today],
    ["Visits last 7 days", o.visits_week],
    ["Visits this month", o.visits_month],
    ["Appointments today", o.appts_today],
    ["Revenue today (EGP)", o.revenue_today],
    ["Revenue last 7 days (EGP)", o.revenue_week],
    ["Revenue this month (EGP)", o.revenue_month],
    ["Outstanding (EGP)", o.outstanding],
    ["Upcoming follow-ups", o.upcoming_followups],
  ].forEach(([k, v]) => s1.addRow({ k, v }));

  // Sheet 2: Revenue per doctor (90d)
  const s2 = wb.addWorksheet("Revenue per Doctor (90d)");
  s2.columns = [
    { header: "Doctor (EN)", key: "name", width: 28 },
    { header: "Doctor (AR)", key: "name_ar", width: 28 },
    { header: "Invoices", key: "invoice_count", width: 12 },
    { header: "Total Paid (EGP)", key: "total_paid", width: 18 },
  ];
  s2.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (docs.rows ?? []).forEach((r: any) => s2.addRow(r));

  // Sheet 3: Top procedures (90d)
  const s3 = wb.addWorksheet("Top Procedures (90d)");
  s3.columns = [
    { header: "Procedure (EN)", key: "name", width: 32 },
    { header: "Procedure (AR)", key: "name_ar", width: 32 },
    { header: "Count", key: "count", width: 10 },
    { header: "Revenue (EGP)", key: "revenue", width: 18 },
  ];
  s3.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (top.rows ?? []).forEach((r: any) => s3.addRow(r));

  // Sheet 4: Monthly trend (6 months)
  const s4 = wb.addWorksheet("Monthly Trend");
  s4.columns = [
    { header: "Month", key: "month", width: 12 },
    { header: "Billed (EGP)", key: "billed", width: 18 },
    { header: "Collected (EGP)", key: "collected", width: 18 },
  ];
  s4.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (trend.rows ?? []).forEach((r: any) => s4.addRow(r));

  // Sheet 5: Visits per day (30d)
  const s5 = wb.addWorksheet("Visits per Day (30d)");
  s5.columns = [
    { header: "Day", key: "day", width: 14 },
    { header: "Visits", key: "count", width: 10 },
  ];
  s5.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (daily.rows ?? []).forEach((r: any) => s5.addRow(r));

  // ===== Detailed raw-data sheets (last 12 months) — full audit trail =====
  const bMiRaw = branchAndFragment(req, "mi.branch_id");
  const bVRaw  = branchAndFragment(req, "v.branch_id");
  const bTxRaw = branchAndFragment(req, "t.branch_id");
  const [invLines, allVisits, allTx] = await Promise.all([
    db.execute<any>(sql`
      SELECT mi.id AS invoice_id, mi.invoice_date, mi.status, mi.total AS invoice_total, mi.paid_amount,
             COALESCE(p.first_name || ' ' || COALESCE(p.last_name,''), '') AS patient_name,
             COALESCE(e.name, 'Unassigned') AS doctor_name,
             COALESCE(pr.name, mil.description) AS procedure_name,
             mil.quantity, mil.unit_price, mil.total AS line_total
      FROM medical_invoice_lines mil
      JOIN medical_invoices mi ON mi.id = mil.invoice_id
      LEFT JOIN patients p ON p.id = mi.patient_id
      LEFT JOIN employees e ON e.id = mi.doctor_id
      LEFT JOIN medical_procedures pr ON pr.id = mil.procedure_id
      WHERE mi.invoice_date >= current_date - INTERVAL '12 months'${bMiRaw}
      ORDER BY mi.invoice_date DESC, mi.id DESC
    `),
    db.execute<any>(sql`
      SELECT v.id, v.visit_date,
             COALESCE(p.first_name || ' ' || COALESCE(p.last_name,''), '') AS patient_name,
             COALESCE(e.name, '') AS doctor_name,
             v.chief_complaint, v.diagnosis, v.treatment,
             v.materials_used, v.tooth_number, v.follow_up_date, v.notes
      FROM visits v
      LEFT JOIN patients p ON p.id = v.patient_id
      LEFT JOIN employees e ON e.id = v.doctor_id
      WHERE v.visit_date >= current_date - INTERVAL '12 months'${bVRaw}
      ORDER BY v.visit_date DESC
    `),
    db.execute<any>(sql`
      SELECT t.id, t.date, t.type, t.category, t.amount, t.description, t.created_at
      FROM transactions t
      WHERE t.date >= current_date - INTERVAL '12 months'${bTxRaw}
      ORDER BY t.date DESC, t.id DESC
    `),
  ]);

  // Sheet 6: Invoice Lines (raw, 12 months)
  const s6 = wb.addWorksheet("Invoice Lines (raw)");
  s6.columns = [
    { header: "Invoice #", key: "invoice_id", width: 10 },
    { header: "Date", key: "invoice_date", width: 12 },
    { header: "Status", key: "status", width: 10 },
    { header: "Patient", key: "patient_name", width: 24 },
    { header: "Doctor", key: "doctor_name", width: 20 },
    { header: "Procedure / Item", key: "procedure_name", width: 32 },
    { header: "Qty", key: "quantity", width: 8 },
    { header: "Unit Price (EGP)", key: "unit_price", width: 16 },
    { header: "Line Total (EGP)", key: "line_total", width: 16 },
    { header: "Invoice Total (EGP)", key: "invoice_total", width: 18 },
    { header: "Paid (EGP)", key: "paid_amount", width: 14 },
  ];
  s6.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (invLines.rows ?? []).forEach((r: any) => s6.addRow(r));

  // Sheet 7: Visits (raw, 12 months) — includes new materials + tooth columns
  const s7 = wb.addWorksheet("Visits (raw)");
  s7.columns = [
    { header: "Visit #", key: "id", width: 10 },
    { header: "Date", key: "visit_date", width: 18 },
    { header: "Patient", key: "patient_name", width: 24 },
    { header: "Doctor", key: "doctor_name", width: 20 },
    { header: "Chief Complaint", key: "chief_complaint", width: 32 },
    { header: "Diagnosis", key: "diagnosis", width: 32 },
    { header: "Treatment", key: "treatment", width: 32 },
    { header: "Materials Used", key: "materials_used", width: 28 },
    { header: "Tooth #", key: "tooth_number", width: 10 },
    { header: "Follow-up", key: "follow_up_date", width: 14 },
    { header: "Notes", key: "notes", width: 28 },
  ];
  s7.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (allVisits.rows ?? []).forEach((r: any) => s7.addRow(r));

  // Sheet 8: Transactions (raw, 12 months) — full finance ledger incl. medical bridge
  const s8 = wb.addWorksheet("Transactions (raw)");
  s8.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Date", key: "date", width: 12 },
    { header: "Type", key: "type", width: 10 },
    { header: "Category", key: "category", width: 14 },
    { header: "Amount (EGP)", key: "amount", width: 14 },
    { header: "Description", key: "description", width: 40 },
    { header: "Created At", key: "created_at", width: 22 },
  ];
  s8.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (allTx.rows ?? []).forEach((r: any) => s8.addRow(r));

  const filename = `medical-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
});

export default router;
