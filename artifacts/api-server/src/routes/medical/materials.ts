import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, medicalMaterialsTable, medicineMasterTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const baseShape = z.object({
  name: z.string().min(1).optional().nullable(),
  nameAr: z.string().min(1).optional().nullable(),
  sku: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  quantityInStock: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(0),
  unitPrice: z.number().min(0).default(0),
  supplier: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  notesAr: z.string().optional().nullable(),
  branchId: z.number().int().positive().optional().nullable(),
  active: z.number().int().min(0).max(1).default(1),
});
const createSchema = baseShape.refine(
  d => (d.name && d.name.trim()) || (d.nameAr && d.nameAr.trim()),
  { message: "name or nameAr is required", path: ["name"] }
);

const adjustSchema = z.object({
  delta: z.number(), // positive to add, negative to consume
  note: z.string().optional().nullable(),
});

const medicineImportSchema = z.object({
  rows: z.array(z.object({
    material: z.string().optional().nullable(),
    Material: z.string().optional().nullable(),
    materialDescription: z.string().optional().nullable(),
    "Material description": z.string().optional().nullable(),
    bun: z.string().optional().nullable(),
    BUn: z.string().optional().nullable(),
  })).min(1).max(5000),
});

function normalizeMedicineRow(row: z.infer<typeof medicineImportSchema>["rows"][number]) {
  const material = (row.material ?? row.Material ?? "").trim();
  const materialDescription = (row.materialDescription ?? row["Material description"] ?? "").trim();
  const bun = (row.bun ?? row.BUn ?? "").trim();
  if (!material || !materialDescription || !bun) return null;
  return { material, materialDescription, bun, active: 1 };
}

router.get("/medical-materials/stats", async (_req, res) => {
  const rows = await db.select({
    total: sql<number>`cast(count(*) as int)`,
    lowStock: sql<number>`cast(count(*) filter (where quantity_in_stock <= reorder_level and reorder_level > 0) as int)`,
    outOfStock: sql<number>`cast(count(*) filter (where quantity_in_stock = 0) as int)`,
    totalValue: sql<number>`cast(coalesce(sum(quantity_in_stock * unit_price),0) as real)`,
  }).from(medicalMaterialsTable);
  res.json(rows[0]);
});

router.get("/medical-materials", async (req: Request, res: Response): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search.toLowerCase().trim() : "";
  let q = db.select().from(medicalMaterialsTable).$dynamic();
  if (search) {
    q = q.where(sql`lower(coalesce(name,'')) like ${"%" + search + "%"} or lower(coalesce(name_ar,'')) like ${"%" + search + "%"} or lower(coalesce(sku,'')) like ${"%" + search + "%"}`);
  }
  const rows = await q.orderBy(desc(medicalMaterialsTable.updatedAt));
  res.json(rows);
});

router.get("/medicine-master", async (req: Request, res: Response): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search.toLowerCase().trim() : "";
  let q = db.select().from(medicineMasterTable).$dynamic();
  if (search) {
    q = q.where(sql`lower(coalesce(material,'')) like ${"%" + search + "%"} or lower(coalesce(material_description,'')) like ${"%" + search + "%"} or lower(coalesce(bun,'')) like ${"%" + search + "%"}`);
  }
  const rows = await q.orderBy(medicineMasterTable.materialDescription).limit(1000);
  res.json(rows);
});

router.post("/medicine-master/import", async (req: Request, res: Response): Promise<void> => {
  const parsed = medicineImportSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() }); return; }

  const seen = new Set<string>();
  const values = parsed.data.rows
    .map(normalizeMedicineRow)
    .filter((row): row is NonNullable<ReturnType<typeof normalizeMedicineRow>> => {
      if (!row || seen.has(row.material)) return false;
      seen.add(row.material);
      return true;
    });

  if (!values.length) {
    res.status(400).json({ error: "No valid rows. Required columns: Material, Material description, BUn." });
    return;
  }

  const rows = await db.insert(medicineMasterTable)
    .values(values)
    .onConflictDoUpdate({
      target: medicineMasterTable.material,
      set: {
        materialDescription: sql`excluded.material_description`,
        bun: sql`excluded.bun`,
        active: 1,
        updatedAt: new Date(),
      },
    })
    .returning();

  res.status(201).json({ imported: rows.length, rows });
});

router.post("/medical-materials", async (req: Request, res: Response): Promise<void> => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() }); return; }
  try {
    const [row] = await db.insert(medicalMaterialsTable).values({
      name: parsed.data.name || parsed.data.nameAr || "",
      nameAr: parsed.data.nameAr || null,
      sku: parsed.data.sku || null,
      category: parsed.data.category || null,
      unit: parsed.data.unit || null,
      quantityInStock: parsed.data.quantityInStock,
      reorderLevel: parsed.data.reorderLevel,
      unitPrice: parsed.data.unitPrice,
      supplier: parsed.data.supplier || null,
      notes: parsed.data.notes || null,
      notesAr: parsed.data.notesAr || null,
      branchId: parsed.data.branchId || null,
      active: parsed.data.active,
    }).returning();
    res.status(201).json(row);
  } catch (err: any) {
    (req as any).log?.error?.({ err }, "material_create_failed");
    res.status(500).json({ error: err?.message || "create_failed" });
  }
});

router.patch("/medical-materials/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = baseShape.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data" }); return; }
  const updates: Record<string, any> = { updatedAt: new Date() };
  for (const k of ["name","nameAr","sku","category","unit","supplier","notes","notesAr","branchId"] as const) {
    if (parsed.data[k] !== undefined) updates[k] = parsed.data[k] || null;
  }
  for (const k of ["quantityInStock","reorderLevel","unitPrice","active"] as const) {
    if (parsed.data[k] !== undefined) updates[k] = parsed.data[k];
  }
  await db.update(medicalMaterialsTable).set(updates).where(eq(medicalMaterialsTable.id, id));
  const [row] = await db.select().from(medicalMaterialsTable).where(eq(medicalMaterialsTable.id, id));
  res.json(row);
});

router.post("/medical-materials/:id/adjust", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = adjustSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data" }); return; }
  // Atomic update — prevents lost updates when two clients adjust the same row concurrently.
  const [row] = await db.update(medicalMaterialsTable)
    .set({
      quantityInStock: sql`GREATEST(0, ${medicalMaterialsTable.quantityInStock} + ${parsed.data.delta})`,
      updatedAt: new Date(),
    })
    .where(eq(medicalMaterialsTable.id, id))
    .returning({ id: medicalMaterialsTable.id, quantityInStock: medicalMaterialsTable.quantityInStock });
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/medical-materials/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(medicalMaterialsTable).where(eq(medicalMaterialsTable.id, id));
  res.status(204).end();
});

export default router;
