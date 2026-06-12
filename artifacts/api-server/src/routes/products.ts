import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { branchWhere } from "../lib/branchScope";
import { listMedicationProducts, medicationCategoryWhere } from "../lib/medicationProducts";
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

router.get("/products/stats", async (req, res): Promise<void> => {
  const bw = branchWhere(req, productsTable.branchId);
  const q = db.select({ status: productsTable.status, count: sql<number>`cast(count(*) as int)` })
    .from(productsTable).$dynamic();
  const rows = await (bw ? q.where(bw) : q).groupBy(productsTable.status);
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

/** Clinic medicines (for prescriptions) — products tagged as medication/pharmacy. */
router.get("/products/medications", async (req, res): Promise<void> => {
  const bw = branchWhere(req, productsTable.branchId);
  const medWhere = medicationCategoryWhere();
  const rows = bw
    ? await db.select().from(productsTable).where(and(medWhere!, bw)).orderBy(productsTable.name)
    : await listMedicationProducts();
  res.json(rows);
});

/** Remove all medicine products so you can re-import from Excel. */
router.delete("/products/medications", async (req, res): Promise<void> => {
  const bw = branchWhere(req, productsTable.branchId);
  const medWhere = medicationCategoryWhere();
  const rows = bw
    ? await db.delete(productsTable).where(and(medWhere!, bw)).returning({ id: productsTable.id })
    : await db.delete(productsTable).where(medWhere!).returning({ id: productsTable.id });
  res.json({ deleted: rows.length });
});

const BulkMedicationInput = z.object({
  items: z.array(z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
    sku: z.string().optional(),
    price: z.number().min(0).default(0),
    stock: z.number().int().min(0).default(0),
    costPrice: z.number().min(0).optional(),
  })).min(1).max(5000),
  branchId: z.number().int().positive().nullable().optional(),
});

router.post("/products/medications/bulk", async (req, res): Promise<void> => {
  const parsed = BulkMedicationInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const branchId = parsed.data.branchId ?? null;
  const inserted = [];
  for (const item of parsed.data.items) {
    const [row] = await db.insert(productsTable).values({
      name: item.name,
      nameAr: item.nameAr ?? null,
      sku: item.sku ?? null,
      price: item.price,
      costPrice: item.costPrice ?? 0,
      stock: item.stock,
      reorderPoint: 5,
      category: "medication",
      categoryAr: "دواء",
      status: "available",
      branchId,
    }).returning();
    inserted.push(row);
  }
  res.status(201).json({ imported: inserted.length, items: inserted });
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
