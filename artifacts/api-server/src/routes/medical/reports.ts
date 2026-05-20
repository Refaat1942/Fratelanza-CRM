import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import ExcelJS from "exceljs";

const router: IRouter = Router();

// Overview: KPIs for the medical module
router.get("/medical-reports/overview", async (_req, res): Promise<void> => {
  const r = await db.execute<{
    patients: number; visits_today: number; visits_week: number; visits_month: number;
    appts_today: number; revenue_today: number; revenue_week: number; revenue_month: number;
    outstanding: number; upcoming_followups: number;
  }>(sql`
    SELECT
      (SELECT COUNT(*) FROM patients)::int AS patients,
      (SELECT COUNT(*) FROM visits WHERE visit_date::date = current_date)::int AS visits_today,
      (SELECT COUNT(*) FROM visits WHERE visit_date >= current_date - INTERVAL '7 days')::int AS visits_week,
      (SELECT COUNT(*) FROM visits WHERE visit_date >= date_trunc('month', current_date))::int AS visits_month,
      (SELECT COUNT(*) FROM medical_appointments
        WHERE start_at::date = current_date AND status NOT IN ('cancelled','no_show'))::int AS appts_today,
      COALESCE((SELECT SUM(paid_amount) FROM medical_invoices
        WHERE invoice_date::date = current_date AND status <> 'cancelled'), 0)::float AS revenue_today,
      COALESCE((SELECT SUM(paid_amount) FROM medical_invoices
        WHERE invoice_date >= current_date - INTERVAL '7 days' AND status <> 'cancelled'), 0)::float AS revenue_week,
      COALESCE((SELECT SUM(paid_amount) FROM medical_invoices
        WHERE invoice_date >= date_trunc('month', current_date) AND status <> 'cancelled'), 0)::float AS revenue_month,
      COALESCE((SELECT SUM(total - paid_amount) FROM medical_invoices
        WHERE status IN ('unpaid','partial')), 0)::float AS outstanding,
      (SELECT COUNT(*) FROM visits WHERE follow_up_date >= current_date)::int AS upcoming_followups
  `);
  res.json(r.rows?.[0] ?? null);
});

// Visits per day for the last N days (default 30)
router.get("/medical-reports/visits-per-day", async (req, res): Promise<void> => {
  const days = Math.min(Math.max(parseInt(String(req.query.days || "30"), 10) || 30, 7), 180);
  const r = await db.execute<{ day: string; count: number }>(sql`
    SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
           COALESCE(COUNT(v.id), 0)::int AS count
    FROM generate_series(current_date - (${days - 1} || ' days')::interval, current_date, '1 day') d
    LEFT JOIN visits v ON v.visit_date::date = d::date
    GROUP BY d ORDER BY d
  `);
  res.json(r.rows ?? []);
});

// Revenue per doctor (last 90 days, top 10)
router.get("/medical-reports/revenue-per-doctor", async (_req, res): Promise<void> => {
  const r = await db.execute<{ doctor_id: number | null; doctor_name: string; doctor_name_ar: string | null; total_paid: number; invoice_count: number }>(sql`
    SELECT mi.doctor_id,
           COALESCE(e.name, 'Unassigned')   AS doctor_name,
           e.name_ar                         AS doctor_name_ar,
           COALESCE(SUM(mi.paid_amount), 0)::float AS total_paid,
           COUNT(*)::int                     AS invoice_count
    FROM medical_invoices mi
    LEFT JOIN employees e ON e.id = mi.doctor_id
    WHERE mi.invoice_date >= current_date - INTERVAL '90 days'
      AND mi.status <> 'cancelled'
    GROUP BY mi.doctor_id, e.name, e.name_ar
    ORDER BY total_paid DESC
    LIMIT 10
  `);
  res.json(r.rows ?? []);
});

// Top procedures by revenue (last 90 days, top 10)
router.get("/medical-reports/top-procedures", async (_req, res): Promise<void> => {
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
      AND mi.status <> 'cancelled'
    GROUP BY mil.procedure_id, COALESCE(p.name, mil.description, 'Custom'), p.name_ar
    ORDER BY revenue DESC
    LIMIT 10
  `);
  res.json(r.rows ?? []);
});

// Monthly revenue trend (last 6 months)
router.get("/medical-reports/monthly-trend", async (_req, res): Promise<void> => {
  const r = await db.execute<{ month: string; billed: number; collected: number }>(sql`
    SELECT to_char(m, 'YYYY-MM') AS month,
           COALESCE(SUM(mi.total), 0)::float       AS billed,
           COALESCE(SUM(mi.paid_amount), 0)::float AS collected
    FROM generate_series(date_trunc('month', current_date) - INTERVAL '5 months', date_trunc('month', current_date), '1 month') m
    LEFT JOIN medical_invoices mi
      ON date_trunc('month', mi.invoice_date::date) = m AND mi.status <> 'cancelled'
    GROUP BY m ORDER BY m
  `);
  res.json(r.rows ?? []);
});

// Excel export: one workbook with KPI summary + per-doctor + top procedures + monthly trend + 30-day visits.
router.get("/medical-reports/export.xlsx", async (_req, res): Promise<void> => {
  const [ov, docs, top, trend, daily] = await Promise.all([
    db.execute<any>(sql`
      SELECT
        (SELECT COUNT(*) FROM patients)::int AS patients,
        (SELECT COUNT(*) FROM visits WHERE visit_date::date = current_date)::int AS visits_today,
        (SELECT COUNT(*) FROM visits WHERE visit_date >= current_date - INTERVAL '7 days')::int AS visits_week,
        (SELECT COUNT(*) FROM visits WHERE visit_date >= date_trunc('month', current_date))::int AS visits_month,
        (SELECT COUNT(*) FROM medical_appointments WHERE start_at::date = current_date AND status NOT IN ('cancelled','no_show'))::int AS appts_today,
        COALESCE((SELECT SUM(paid_amount) FROM medical_invoices WHERE invoice_date::date = current_date AND status <> 'cancelled'),0)::float AS revenue_today,
        COALESCE((SELECT SUM(paid_amount) FROM medical_invoices WHERE invoice_date >= current_date - INTERVAL '7 days' AND status <> 'cancelled'),0)::float AS revenue_week,
        COALESCE((SELECT SUM(paid_amount) FROM medical_invoices WHERE invoice_date >= date_trunc('month', current_date) AND status <> 'cancelled'),0)::float AS revenue_month,
        COALESCE((SELECT SUM(total - paid_amount) FROM medical_invoices WHERE status IN ('unpaid','partial')),0)::float AS outstanding,
        (SELECT COUNT(*) FROM visits WHERE follow_up_date >= current_date)::int AS upcoming_followups
    `),
    db.execute<any>(sql`
      SELECT COALESCE(e.name, 'Unassigned') AS doctor_name, e.name_ar AS doctor_name_ar,
             COALESCE(SUM(mi.paid_amount),0)::float AS total_paid, COUNT(*)::int AS invoice_count
      FROM medical_invoices mi LEFT JOIN employees e ON e.id = mi.doctor_id
      WHERE mi.invoice_date >= current_date - INTERVAL '90 days' AND mi.status <> 'cancelled'
      GROUP BY mi.doctor_id, e.name, e.name_ar ORDER BY total_paid DESC
    `),
    db.execute<any>(sql`
      SELECT COALESCE(p.name, mil.description, 'Custom') AS name, p.name_ar AS name_ar,
             COUNT(*)::int AS count, COALESCE(SUM(mil.total),0)::float AS revenue
      FROM medical_invoice_lines mil
      LEFT JOIN medical_procedures p ON p.id = mil.procedure_id
      LEFT JOIN medical_invoices mi ON mi.id = mil.invoice_id
      WHERE mi.invoice_date >= current_date - INTERVAL '90 days' AND mi.status <> 'cancelled'
      GROUP BY mil.procedure_id, COALESCE(p.name, mil.description, 'Custom'), p.name_ar
      ORDER BY revenue DESC
    `),
    db.execute<any>(sql`
      SELECT to_char(m, 'YYYY-MM') AS month,
             COALESCE(SUM(mi.total),0)::float AS billed,
             COALESCE(SUM(mi.paid_amount),0)::float AS collected
      FROM generate_series(date_trunc('month', current_date) - INTERVAL '5 months', date_trunc('month', current_date), '1 month') m
      LEFT JOIN medical_invoices mi ON date_trunc('month', mi.invoice_date::date) = m AND mi.status <> 'cancelled'
      GROUP BY m ORDER BY m
    `),
    db.execute<any>(sql`
      SELECT to_char(d::date, 'YYYY-MM-DD') AS day, COALESCE(COUNT(v.id),0)::int AS count
      FROM generate_series(current_date - INTERVAL '29 days', current_date, '1 day') d
      LEFT JOIN visits v ON v.visit_date::date = d::date
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

  const filename = `medical-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
});

export default router;
