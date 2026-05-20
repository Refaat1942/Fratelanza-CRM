import { Router, type IRouter } from "express";
import { and, eq, desc, sql } from "drizzle-orm";
import { branchWhere } from "../../lib/branchScope";
import {
  db, medicalInvoicesTable, medicalInvoiceLinesTable,
  patientsTable, employeesTable, transactionsTable,
} from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const LineInput = z.object({
  procedureId: z.number().int().positive().nullable().optional(),
  description: z.string().optional().default(""),
  descriptionAr: z.string().nullable().optional(),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().nonnegative(),
}).refine(
  (l) => (l.description && l.description.length > 0) || (l.descriptionAr && l.descriptionAr.length > 0),
  { message: "Each line needs either description or descriptionAr", path: ["description"] },
);

const InvoiceInput = z.object({
  patientId: z.number().int().positive(),
  visitId: z.number().int().positive().nullable().optional(),
  doctorId: z.number().int().positive().nullable().optional(),
  invoiceDate: z.string(), // YYYY-MM-DD
  paymentMethod: z.enum(["cash", "card", "transfer", "other"]).nullable().optional(),
  status: z.enum(["unpaid", "partial", "paid", "cancelled"]).default("unpaid"),
  paidAmount: z.number().nonnegative().default(0),
  notes: z.string().nullable().optional(),
  notesAr: z.string().nullable().optional(),
  lines: z.array(LineInput).min(1, "At least one line is required"),
});

async function selectInvoices(where?: any) {
  const q = db
    .select({
      id: medicalInvoicesTable.id,
      patientId: medicalInvoicesTable.patientId,
      visitId: medicalInvoicesTable.visitId,
      doctorId: medicalInvoicesTable.doctorId,
      invoiceDate: medicalInvoicesTable.invoiceDate,
      total: medicalInvoicesTable.total,
      paidAmount: medicalInvoicesTable.paidAmount,
      status: medicalInvoicesTable.status,
      paymentMethod: medicalInvoicesTable.paymentMethod,
      transactionId: medicalInvoicesTable.transactionId,
      notes: medicalInvoicesTable.notes,
      notesAr: medicalInvoicesTable.notesAr,
      createdAt: medicalInvoicesTable.createdAt,
      patientFirstName: patientsTable.firstName,
      patientFirstNameAr: patientsTable.firstNameAr,
      patientLastName: patientsTable.lastName,
      patientLastNameAr: patientsTable.lastNameAr,
      patientPhone: patientsTable.phone,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
    })
    .from(medicalInvoicesTable)
    .leftJoin(patientsTable, eq(medicalInvoicesTable.patientId, patientsTable.id))
    .leftJoin(employeesTable, eq(medicalInvoicesTable.doctorId, employeesTable.id))
    .$dynamic();
  return where
    ? await q.where(where).orderBy(desc(medicalInvoicesTable.invoiceDate), desc(medicalInvoicesTable.id))
    : await q.orderBy(desc(medicalInvoicesTable.invoiceDate), desc(medicalInvoicesTable.id));
}

router.get("/medical-invoices", async (req, res): Promise<void> => {
  const pidWhere = typeof req.query.patientId === "string"
    ? eq(medicalInvoicesTable.patientId, parseInt(req.query.patientId, 10))
    : undefined;
  const bw = branchWhere(req, medicalInvoicesTable.branchId);
  const where = pidWhere && bw ? and(pidWhere, bw) : (pidWhere ?? bw);
  const rows = await selectInvoices(where);
  res.json(rows);
});

router.get("/medical-invoices/stats", async (req, res): Promise<void> => {
  const bw_ = branchWhere(req, medicalInvoicesTable.branchId);
  const [tot] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${medicalInvoicesTable.total}),0)::float`,
      paid: sql<number>`COALESCE(SUM(${medicalInvoicesTable.paidAmount}),0)::float`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(medicalInvoicesTable)
    .where(bw_ ? and(sql`${medicalInvoicesTable.status} <> 'cancelled'`, bw_)! : sql`${medicalInvoicesTable.status} <> 'cancelled'`);
  const [thisMonth] = await db
    .select({ revenue: sql<number>`COALESCE(SUM(${medicalInvoicesTable.paidAmount}),0)::float` })
    .from(medicalInvoicesTable)
    .where(bw_
      ? and(sql`date_trunc('month', ${medicalInvoicesTable.invoiceDate}::date) = date_trunc('month', current_date) AND ${medicalInvoicesTable.status} <> 'cancelled'`, bw_)!
      : sql`date_trunc('month', ${medicalInvoicesTable.invoiceDate}::date) = date_trunc('month', current_date) AND ${medicalInvoicesTable.status} <> 'cancelled'`);
  res.json({
    total: tot?.total ?? 0,
    paid: tot?.paid ?? 0,
    outstanding: (tot?.total ?? 0) - (tot?.paid ?? 0),
    count: tot?.count ?? 0,
    monthRevenue: thisMonth?.revenue ?? 0,
  });
});

router.get("/medical-invoices/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [inv] = await selectInvoices(eq(medicalInvoicesTable.id, id));
  if (!inv) { res.status(404).json({ error: "Invoice not found" }); return; }
  const lines = await db.select().from(medicalInvoiceLinesTable).where(eq(medicalInvoiceLinesTable.invoiceId, id));
  res.json({ ...inv, lines });
});

async function patientNames(tx: typeof db, patientId: number) {
  const [pat] = await tx.select({
    firstName: patientsTable.firstName,
    firstNameAr: patientsTable.firstNameAr,
    lastName: patientsTable.lastName,
    lastNameAr: patientsTable.lastNameAr,
  }).from(patientsTable).where(eq(patientsTable.id, patientId));
  const en = pat ? `${pat.firstName} ${pat.lastName || ""}`.trim() : `#${patientId}`;
  const ar = pat ? `${pat.firstNameAr || pat.firstName} ${pat.lastNameAr || pat.lastName || ""}`.trim() : null;
  return { en, ar };
}

router.post("/medical-invoices", async (req, res): Promise<void> => {
  const parsed = InvoiceInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const d = parsed.data;
  const rawBranchId = (req.body as { branchId?: unknown })?.branchId;
  const invoiceBranchId: number | null = typeof rawBranchId === "number" && Number.isInteger(rawBranchId) && rawBranchId > 0
    ? rawBranchId
    : null;

  // Normalize lines: ensure description (EN) is always set even when only AR provided
  const normalizedLines = d.lines.map(l => {
    const en = l.description && l.description.length > 0 ? l.description : (l.descriptionAr || "");
    return { ...l, description: en };
  });

  const total = normalizedLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const paidAmount = Math.min(d.paidAmount, total);
  let status = d.status;
  if (paidAmount >= total && total > 0) status = "paid";
  else if (paidAmount > 0 && paidAmount < total) status = "partial";
  else if (status !== "cancelled") status = "unpaid";

  try {
    const result = await db.transaction(async (tx) => {
      const names = await patientNames(tx as any, d.patientId);

      const [invoice] = await tx.insert(medicalInvoicesTable).values({
        patientId: d.patientId,
        visitId: d.visitId ?? null,
        doctorId: d.doctorId ?? null,
        invoiceDate: d.invoiceDate,
        total,
        paidAmount,
        status,
        paymentMethod: d.paymentMethod ?? null,
        notes: d.notes ?? null,
        notesAr: d.notesAr ?? null,
        branchId: invoiceBranchId,
      }).returning();

      await tx.insert(medicalInvoiceLinesTable).values(
        normalizedLines.map(l => ({
          invoiceId: invoice.id,
          procedureId: l.procedureId ?? null,
          description: l.description,
          descriptionAr: l.descriptionAr ?? null,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          total: l.quantity * l.unitPrice,
        }))
      );

      if (paidAmount > 0) {
        const [txn] = await tx.insert(transactionsTable).values({
          title: `Medical invoice #${invoice.id} — ${names.en}`,
          titleAr: names.ar ? `فاتورة طبية #${invoice.id} — ${names.ar}` : null,
          description: `Auto-generated from medical invoice ${invoice.id}`,
          amount: paidAmount,
          type: "income",
          category: "medical",
          date: d.invoiceDate,
        }).returning();
        const [linked] = await tx.update(medicalInvoicesTable)
          .set({ transactionId: txn.id })
          .where(eq(medicalInvoicesTable.id, invoice.id))
          .returning();
        return linked;
      }
      return invoice;
    });

    res.status(201).json(result);
  } catch (err) {
    req.log?.error({ err }, "create medical invoice failed");
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

router.post("/medical-invoices/:id/pay", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const schema = z.object({
    amount: z.number().positive(),
    paymentMethod: z.enum(["cash", "card", "transfer", "other"]).default("cash"),
    paymentDate: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  try {
    const result = await db.transaction(async (tx) => {
      // Lock the invoice row so concurrent payments serialize
      const locked = await tx.execute(sql`
        SELECT id, patient_id, total, paid_amount, status, transaction_id
        FROM medical_invoices WHERE id = ${id} FOR UPDATE
      `);
      const inv = (locked as any).rows?.[0];
      if (!inv) return { error: "not_found" as const };
      if (inv.status === "cancelled") return { error: "cancelled" as const };

      const remaining = Number(inv.total) - Number(inv.paid_amount);
      const payment = Math.min(parsed.data.amount, remaining);
      if (payment <= 0) return { error: "already_paid" as const };

      const newPaid = Number(inv.paid_amount) + payment;
      const newStatus = newPaid >= Number(inv.total) ? "paid" : "partial";

      const names = await patientNames(tx as any, Number(inv.patient_id));

      const [txn] = await tx.insert(transactionsTable).values({
        title: `Medical payment — invoice #${id} — ${names.en}`,
        titleAr: names.ar ? `دفعة طبية — فاتورة #${id} — ${names.ar}` : null,
        description: `Payment for medical invoice ${id}`,
        amount: payment,
        type: "income",
        category: "medical",
        date: parsed.data.paymentDate || new Date().toISOString().slice(0, 10),
      }).returning();

      const [updated] = await tx.update(medicalInvoicesTable).set({
        paidAmount: newPaid,
        status: newStatus,
        paymentMethod: parsed.data.paymentMethod,
        transactionId: inv.transaction_id ?? txn.id,
      }).where(eq(medicalInvoicesTable.id, id)).returning();

      return { invoice: updated, transactionId: txn.id };
    });

    if ("error" in result) {
      if (result.error === "not_found") { res.status(404).json({ error: "Invoice not found" }); return; }
      if (result.error === "cancelled") { res.status(400).json({ error: "Cannot pay a cancelled invoice" }); return; }
      if (result.error === "already_paid") { res.status(400).json({ error: "Invoice already fully paid" }); return; }
    } else {
      res.json(result);
    }
  } catch (err) {
    req.log?.error({ err }, "pay medical invoice failed");
    res.status(500).json({ error: "Failed to record payment" });
  }
});

// Cancel an invoice (preserves audit trail). If payments existed, creates a
// compensating negative income transaction in Finance so revenue is reversed.
router.post("/medical-invoices/:id/cancel", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const result = await db.transaction(async (tx) => {
      const locked = await tx.execute(sql`
        SELECT id, patient_id, paid_amount, status, invoice_date
        FROM medical_invoices WHERE id = ${id} FOR UPDATE
      `);
      const inv = (locked as any).rows?.[0];
      if (!inv) return { error: "not_found" as const };
      if (inv.status === "cancelled") return { error: "already_cancelled" as const };

      const paid = Number(inv.paid_amount);
      let reversalTxnId: number | null = null;

      if (paid > 0) {
        const names = await patientNames(tx as any, Number(inv.patient_id));
        const [rev] = await tx.insert(transactionsTable).values({
          title: `Reversal — medical invoice #${id} cancelled — ${names.en}`,
          titleAr: names.ar ? `إلغاء — فاتورة طبية #${id} — ${names.ar}` : null,
          description: `Compensating entry for cancelled medical invoice ${id}`,
          amount: -paid,
          type: "income",
          category: "medical",
          date: new Date().toISOString().slice(0, 10),
        }).returning();
        reversalTxnId = rev.id;
      }

      const [updated] = await tx.update(medicalInvoicesTable)
        .set({ status: "cancelled" })
        .where(eq(medicalInvoicesTable.id, id))
        .returning();
      return { invoice: updated, reversalTransactionId: reversalTxnId };
    });

    if ("error" in result) {
      if (result.error === "not_found") { res.status(404).json({ error: "Invoice not found" }); return; }
      if (result.error === "already_cancelled") { res.status(400).json({ error: "Invoice already cancelled" }); return; }
    } else {
      res.json(result);
    }
  } catch (err) {
    req.log?.error({ err }, "cancel medical invoice failed");
    res.status(500).json({ error: "Failed to cancel invoice" });
  }
});

// Hard delete is only allowed for invoices that never received a payment
// (preserves audit trail for anything that touched Finance).
router.delete("/medical-invoices/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.transaction(async (tx) => {
      const [inv] = await tx.select().from(medicalInvoicesTable).where(eq(medicalInvoicesTable.id, id));
      if (!inv) throw new Error("not_found");
      if (Number(inv.paidAmount) > 0 || inv.transactionId) {
        throw new Error("has_payments");
      }
      await tx.delete(medicalInvoiceLinesTable).where(eq(medicalInvoiceLinesTable.invoiceId, id));
      await tx.delete(medicalInvoicesTable).where(eq(medicalInvoicesTable.id, id));
    });
    res.sendStatus(204);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "not_found") { res.status(404).json({ error: "Invoice not found" }); return; }
    if (msg === "has_payments") {
      res.status(409).json({ error: "has_payments", message: "Cancel paid invoices instead of deleting to preserve Finance audit trail." });
      return;
    }
    req.log?.error({ err }, "delete medical invoice failed");
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

export default router;
