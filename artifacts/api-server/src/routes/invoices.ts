import { Router, type IRouter, type Request, type Response } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, invoicesTable, invoiceItemsTable, clientsTable, transactionsTable, activityTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const itemSchema = z.object({
  description: z.string().min(1),
  descriptionAr: z.string().optional().nullable(),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().min(0).default(0),
});

const createSchema = z.object({
  clientId: z.number().int().positive().optional().nullable(),
  issueDate: z.string().optional(), // ISO date
  dueDate: z.string().optional().nullable(),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional().nullable(),
  notesAr: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1),
});

const updateSchema = z.object({
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  notesAr: z.string().optional().nullable(),
  taxRate: z.number().min(0).max(100).optional(),
  items: z.array(itemSchema).optional(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  recordTransaction: z.boolean().default(true),
});

async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [{ count }] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(invoicesTable)
    .where(sql`invoice_number LIKE ${"INV-" + ym + "-%"}`);
  return `INV-${ym}-${String(count + 1).padStart(4, "0")}`;
}

function recompute(items: { quantity: number; unitPrice: number }[], taxRate: number) {
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const taxAmount = +(subtotal * (taxRate / 100)).toFixed(2);
  const total = +(subtotal + taxAmount).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), taxAmount, total };
}

router.get("/invoices/stats", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db.select({ status: invoicesTable.status, count: sql<number>`cast(count(*) as int)`, total: sql<number>`cast(coalesce(sum(total),0) as real)` })
    .from(invoicesTable).groupBy(invoicesTable.status);
  const stats: Record<string, { count: number; total: number }> = {
    draft: { count: 0, total: 0 }, sent: { count: 0, total: 0 }, paid: { count: 0, total: 0 },
    overdue: { count: 0, total: 0 }, cancelled: { count: 0, total: 0 },
  };
  for (const r of rows) if (r.status in stats) stats[r.status] = { count: r.count, total: r.total };
  res.json(stats);
});

router.get("/invoices", async (req: Request, res: Response): Promise<void> => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const clientId = typeof req.query.clientId === "string" ? parseInt(req.query.clientId) : undefined;
  let q = db.select().from(invoicesTable).$dynamic();
  if (status) q = q.where(eq(invoicesTable.status, status));
  if (clientId && !isNaN(clientId)) q = q.where(eq(invoicesTable.clientId, clientId));
  const rows = await q.orderBy(desc(invoicesTable.createdAt));
  res.json(rows);
});

router.get("/invoices/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
  if (!invoice) { res.status(404).json({ error: "Not found" }); return; }
  const items = await db.select().from(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, id)).orderBy(invoiceItemsTable.sortOrder);
  let client = null;
  if (invoice.clientId) {
    const [c] = await db.select().from(clientsTable).where(eq(clientsTable.id, invoice.clientId));
    client = c || null;
  }
  res.json({ ...invoice, items, client });
});

router.post("/invoices", async (req: Request, res: Response): Promise<void> => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() }); return; }
  const { clientId, issueDate, dueDate, taxRate, notes, notesAr, items } = parsed.data;

  let clientNameSnapshot: string | null = null;
  let clientPhoneSnapshot: string | null = null;
  if (clientId) {
    const [c] = await db.select().from(clientsTable).where(eq(clientsTable.id, clientId));
    if (c) { clientNameSnapshot = c.name; clientPhoneSnapshot = c.phone || null; }
  }

  const totals = recompute(items, taxRate);
  const invoiceNumber = await generateInvoiceNumber();

  const [invoice] = await db.insert(invoicesTable).values({
    invoiceNumber, clientId: clientId || null,
    clientNameSnapshot, clientPhoneSnapshot,
    issueDate: issueDate || new Date().toISOString().slice(0, 10),
    dueDate: dueDate || null,
    taxRate, ...totals, notes: notes || null, notesAr: notesAr || null,
  }).returning();

  if (items.length > 0) {
    await db.insert(invoiceItemsTable).values(items.map((it, i) => ({
      invoiceId: invoice.id, description: it.description, descriptionAr: it.descriptionAr || null,
      quantity: it.quantity, unitPrice: it.unitPrice,
      total: +(it.quantity * it.unitPrice).toFixed(2), sortOrder: i,
    })));
  }

  await db.insert(activityTable).values({
    type: "invoice_created",
    description: `Invoice ${invoice.invoiceNumber} created`,
    descriptionAr: `تم إنشاء فاتورة ${invoice.invoiceNumber}`,
  });

  res.status(201).json(invoice);
});

router.patch("/invoices/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data" }); return; }

  const [existing] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const updates: Record<string, any> = { updatedAt: new Date() };
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.dueDate !== undefined) updates.dueDate = parsed.data.dueDate;
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
  if (parsed.data.notesAr !== undefined) updates.notesAr = parsed.data.notesAr;

  if (parsed.data.items) {
    const taxRate = parsed.data.taxRate ?? existing.taxRate;
    const totals = recompute(parsed.data.items, taxRate);
    updates.taxRate = taxRate;
    Object.assign(updates, totals);
    await db.delete(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, id));
    await db.insert(invoiceItemsTable).values(parsed.data.items.map((it, i) => ({
      invoiceId: id, description: it.description, descriptionAr: it.descriptionAr || null,
      quantity: it.quantity, unitPrice: it.unitPrice,
      total: +(it.quantity * it.unitPrice).toFixed(2), sortOrder: i,
    })));
  } else if (parsed.data.taxRate !== undefined) {
    const items = await db.select().from(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, id));
    const totals = recompute(items, parsed.data.taxRate);
    updates.taxRate = parsed.data.taxRate;
    Object.assign(updates, totals);
  }

  await db.update(invoicesTable).set(updates).where(eq(invoicesTable.id, id));
  const [updated] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
  res.json(updated);
});

router.post("/invoices/:id/payments", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid amount" }); return; }
  const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
  if (!inv) { res.status(404).json({ error: "Not found" }); return; }
  const newPaid = +(inv.paidAmount + parsed.data.amount).toFixed(2);
  const newStatus = newPaid >= inv.total ? "paid" : inv.status === "draft" ? "sent" : inv.status;
  await db.update(invoicesTable).set({ paidAmount: newPaid, status: newStatus, updatedAt: new Date() }).where(eq(invoicesTable.id, id));

  if (parsed.data.recordTransaction) {
    await db.insert(transactionsTable).values({
      title: `Payment for invoice ${inv.invoiceNumber}`,
      titleAr: `دفعة للفاتورة ${inv.invoiceNumber}`,
      type: "income",
      amount: parsed.data.amount,
      category: "invoice_payment",
      date: new Date().toISOString().slice(0, 10),
      clientId: inv.clientId,
    });
  }

  await db.insert(activityTable).values({
    type: "invoice_payment",
    description: `Payment of EGP ${parsed.data.amount} for invoice ${inv.invoiceNumber}`,
    descriptionAr: `دفعة بقيمة ${parsed.data.amount} ج.م للفاتورة ${inv.invoiceNumber}`,
  });

  res.json({ ok: true, paidAmount: newPaid, status: newStatus });
});

router.delete("/invoices/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(invoicesTable).where(eq(invoicesTable.id, id));
  res.json({ ok: true });
});

export default router;
