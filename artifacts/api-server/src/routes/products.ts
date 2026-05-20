import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { branchWhere } from "../lib/branchScope";
import { z } from "zod";

const router: IRouter = Router();

const ProductInput = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  price: z.number().min(0).default(0),
  costPrice: z.number().min(0).default(0),
  stock: z.number().int().min(0).default(0),
  reorderPoint: z.number().int().min(0).default(5),
  category: z.string().optional(),
  categoryAr: z.string().optional(),
  sku: z.string().optional(),
  status: z.enum(["available", "unavailable", "low_stock"]).default("available"),
});

router.get("/products/stats", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ status: productsTable.status, count: sql<number>`cast(count(*) as int)` })
    .from(productsTable).groupBy(productsTable.status);
  const stats = { available: 0, unavailable: 0, low_stock: 0, total: 0 };
  for (const r of rows) { if (r.status in stats) stats[r.status as keyof typeof stats] = r.count; stats.total += r.count; }
  res.json(stats);
});

router.get("/products", async (req, res): Promise<void> => {
  const bw = branchWhere(req, productsTable.branchId);
  const products = bw
    ? await db.select().from(productsTable).where(bw).orderBy(productsTable.createdAt)
    : await db.select().from(productsTable).orderBy(productsTable.createdAt);
  res.json(products);
});

router.get("/products/low-stock", async (req, res): Promise<void> => {
  const bw = branchWhere(req, productsTable.branchId);
  const lowStock = sql`${productsTable.stock} <= ${productsTable.reorderPoint}`;
  const rows = await db.select().from(productsTable)
    .where(bw ? and(lowStock, bw) : lowStock)
    .orderBy(productsTable.stock);
  res.json(rows);
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = ProductInput.safeParse(req.body);
  const rawBranchId = (req.body as { branchId?: unknown })?.branchId;
  const branchIdExtra: { branchId?: number | null } = typeof rawBranchId === "number" && Number.isInteger(rawBranchId) && rawBranchId > 0
    ? { branchId: rawBranchId }
    : rawBranchId === null ? { branchId: null } : {};
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [p] = await db.insert(productsTable).values({ ...parsed.data, ...branchIdExtra }).returning();
  res.status(201).json(p);
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const [p] = await db.select().from(productsTable).where(eq(productsTable.id, parseInt(String(req.params.id))));
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  res.json(p);
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const parsed = ProductInput.partial().safeParse(req.body);
  const rawB = (req.body as { branchId?: unknown })?.branchId;
  const bExtra: { branchId?: number | null } = typeof rawB === "number" && Number.isInteger(rawB) && rawB > 0
    ? { branchId: rawB }
    : rawB === null ? { branchId: null } : {};
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [p] = await db.update(productsTable).set({ ...parsed.data, ...bExtra }).where(eq(productsTable.id, parseInt(String(req.params.id)))).returning();
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  res.json(p);
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  await db.delete(productsTable).where(eq(productsTable.id, parseInt(String(req.params.id))));
  res.status(204).send();
});

export default router;
