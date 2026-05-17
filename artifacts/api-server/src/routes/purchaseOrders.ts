import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db, purchaseOrdersTable, purchaseOrderItemsTable, productsTable, stockMovementsTable } from "@workspace/db";
import { z } from "zod";
import { requirePermission } from "../middleware/permissions";

const router: IRouter = Router();

router.use(requirePermission("purchase_orders"));

const POItem = z.object({
  productId: z.number().int(),
  quantity: z.number().int().positive(),
  unitCost: z.number().min(0),
});

const POInput = z.object({
  supplierId: z.number().int(),
  status: z.enum(["draft", "ordered", "received", "cancelled"]).default("draft"),
  orderDate: z.string(),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(POItem).default([]),
});

router.get("/purchase-orders", async (_req, res): Promise<void> => {
  const orders = await db.select().from(purchaseOrdersTable).orderBy(desc(purchaseOrdersTable.createdAt));
  res.json(orders);
});

router.get("/purchase-orders/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const [order] = await db.select().from(purchaseOrdersTable).where(eq(purchaseOrdersTable.id, id));
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  const items = await db.select().from(purchaseOrderItemsTable).where(eq(purchaseOrderItemsTable.poId, id));
  res.json({ ...order, items });
});

router.post("/purchase-orders", async (req: Request, res: Response): Promise<void> => {
  const parsed = POInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { supplierId, status, orderDate, expectedDate, notes, items } = parsed.data;
  const total = items.reduce((sum, it) => sum + it.quantity * it.unitCost, 0);
  const poNumber = `PO-${Date.now()}`;
  const po = await db.transaction(async (tx) => {
    const [created] = await tx.insert(purchaseOrdersTable).values({
      poNumber, supplierId, status, orderDate, expectedDate: expectedDate || null, notes: notes || null, total,
    }).returning();
    if (items.length > 0) {
      await tx.insert(purchaseOrderItemsTable).values(items.map(it => ({
        poId: created.id, productId: it.productId, quantity: it.quantity, unitCost: it.unitCost,
        subtotal: it.quantity * it.unitCost,
      })));
    }
    return created;
  });
  res.status(201).json(po);
});

router.patch("/purchase-orders/:id/receive", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const s = req.session as any;
  try {
    await db.transaction(async (tx) => {
      const [po] = await tx.select().from(purchaseOrdersTable).where(eq(purchaseOrdersTable.id, id)).for("update");
      if (!po) throw new Error("Not found");
      if (po.status === "received") throw new Error("Already received");
      const items = await tx.select().from(purchaseOrderItemsTable).where(eq(purchaseOrderItemsTable.poId, id));
      for (const it of items) {
        const [product] = await tx.select().from(productsTable).where(eq(productsTable.id, it.productId)).for("update");
        if (!product) continue;
        const newBalance = product.stock + it.quantity;
        const newStatus = newBalance === 0 ? "unavailable" : newBalance <= product.reorderPoint ? "low_stock" : "available";
        await tx.update(productsTable).set({ stock: newBalance, status: newStatus, costPrice: it.unitCost, updatedAt: new Date() }).where(eq(productsTable.id, it.productId));
        await tx.insert(stockMovementsTable).values({
          productId: it.productId, type: "in", quantity: it.quantity, balanceAfter: newBalance,
          reason: `PO ${po.poNumber} received`, referenceType: "purchase_order", referenceId: id,
          userId: s?.userId || null, username: s?.username || null,
        });
      }
      await tx.update(purchaseOrdersTable).set({ status: "received", receivedDate: new Date().toISOString().split("T")[0] }).where(eq(purchaseOrdersTable.id, id));
    });
    res.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message || "Receive failed";
    const code = msg === "Not found" ? 404 : msg === "Already received" ? 400 : 500;
    res.status(code).json({ error: msg });
  }
});

router.patch("/purchase-orders/:id", async (req: Request, res: Response): Promise<void> => {
  const parsed = z.object({ status: z.enum(["draft", "ordered", "received", "cancelled"]).optional(), notes: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [po] = await db.update(purchaseOrdersTable).set(parsed.data).where(eq(purchaseOrdersTable.id, parseInt(String(req.params.id)))).returning();
  if (!po) { res.status(404).json({ error: "Not found" }); return; }
  res.json(po);
});

router.delete("/purchase-orders/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  await db.transaction(async (tx) => {
    await tx.delete(purchaseOrderItemsTable).where(eq(purchaseOrderItemsTable.poId, id));
    await tx.delete(purchaseOrdersTable).where(eq(purchaseOrdersTable.id, id));
  });
  res.status(204).send();
});

export default router;
