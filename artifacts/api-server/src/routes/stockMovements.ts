import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db, stockMovementsTable, productsTable } from "@workspace/db";
import { z } from "zod";
import { requirePermission } from "../middleware/permissions";

const router: IRouter = Router();

const MovementInput = z.object({
  productId: z.number().int(),
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.number().int(),
  reason: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.number().int().optional(),
});

router.get("/stock-movements", requirePermission("products"), async (req: Request, res: Response): Promise<void> => {
  const productId = req.query.productId ? parseInt(String(req.query.productId)) : undefined;
  const rows = productId
    ? await db.select().from(stockMovementsTable).where(eq(stockMovementsTable.productId, productId)).orderBy(desc(stockMovementsTable.createdAt)).limit(500)
    : await db.select().from(stockMovementsTable).orderBy(desc(stockMovementsTable.createdAt)).limit(500);
  res.json(rows);
});

router.post("/stock-movements", requirePermission("products"), async (req: Request, res: Response): Promise<void> => {
  const parsed = MovementInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { productId, type, quantity, reason, referenceType, referenceId } = parsed.data;

  let delta = quantity;
  if (type === "out") delta = -Math.abs(quantity);
  else if (type === "in") delta = Math.abs(quantity);

  const s = req.session as any;

  try {
    const movement = await db.transaction(async (tx) => {
      const [product] = await tx.select().from(productsTable).where(eq(productsTable.id, productId)).for("update");
      if (!product) throw new Error("Product not found");
      const newBalance = product.stock + delta;
      if (newBalance < 0) throw new Error("Insufficient stock");
      const newStatus = newBalance === 0 ? "unavailable" : newBalance <= product.reorderPoint ? "low_stock" : "available";
      await tx.update(productsTable).set({ stock: newBalance, status: newStatus, updatedAt: new Date() }).where(eq(productsTable.id, productId));
      const [m] = await tx.insert(stockMovementsTable).values({
        productId, type, quantity: delta, balanceAfter: newBalance,
        reason: reason || null, referenceType: referenceType || null, referenceId: referenceId || null,
        userId: s?.userId || null, username: s?.username || null,
      }).returning();
      return m;
    });
    res.status(201).json(movement);
  } catch (e: any) {
    const msg = e?.message || "Stock update failed";
    const code = msg === "Product not found" ? 404 : msg === "Insufficient stock" ? 400 : 500;
    res.status(code).json({ error: msg });
  }
});

export default router;
