import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const ProductInput = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  price: z.number().min(0).default(0),
  stock: z.number().int().min(0).default(0),
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

router.get("/products", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(productsTable.createdAt);
  res.json(products);
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = ProductInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [p] = await db.insert(productsTable).values(parsed.data).returning();
  res.status(201).json(p);
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const [p] = await db.select().from(productsTable).where(eq(productsTable.id, parseInt(req.params.id)));
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  res.json(p);
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const parsed = ProductInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [p] = await db.update(productsTable).set(parsed.data).where(eq(productsTable.id, parseInt(req.params.id))).returning();
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  res.json(p);
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  await db.delete(productsTable).where(eq(productsTable.id, parseInt(req.params.id)));
  res.status(204).send();
});

export default router;
