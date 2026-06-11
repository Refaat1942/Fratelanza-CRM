import { Router, type IRouter, type Request, type Response } from "express";
import { desc, eq, ilike, or } from "drizzle-orm";
import { db, medicineMasterTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const MedicineInput = z.object({
  material: z.string().trim().min(1),
  materialDescription: z.string().trim().min(1),
  bun: z.string().trim().nullable().optional(),
  active: z.number().int().min(0).max(1).default(1),
});

const ImportInput = z.object({
  rows: z.array(MedicineInput).min(1).max(5000),
});

router.get("/medicine-master", async (req: Request, res: Response): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const limit = Math.min(Math.max(Number(req.query.limit || 500), 1), 2000);
  let query = db.select().from(medicineMasterTable).$dynamic();
  if (search) {
    query = query.where(or(
      ilike(medicineMasterTable.material, `%${search}%`),
      ilike(medicineMasterTable.materialDescription, `%${search}%`),
      ilike(medicineMasterTable.bun, `%${search}%`),
    ));
  }
  const rows = await query.orderBy(desc(medicineMasterTable.updatedAt)).limit(limit);
  res.json(rows);
});

router.post("/medicine-master", async (req: Request, res: Response): Promise<void> => {
  const parsed = MedicineInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_input", issues: parsed.error.issues }); return; }
  const row = parsed.data;
  const [saved] = await db
    .insert(medicineMasterTable)
    .values({
      material: row.material,
      materialDescription: row.materialDescription,
      bun: row.bun || null,
      active: row.active,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: medicineMasterTable.material,
      set: {
        materialDescription: row.materialDescription,
        bun: row.bun || null,
        active: row.active,
        updatedAt: new Date(),
      },
    })
    .returning();
  res.status(201).json(saved);
});

router.post("/medicine-master/import", async (req: Request, res: Response): Promise<void> => {
  const parsed = ImportInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_input", issues: parsed.error.issues }); return; }
  let imported = 0;
  for (const row of parsed.data.rows) {
    await db
      .insert(medicineMasterTable)
      .values({
        material: row.material,
        materialDescription: row.materialDescription,
        bun: row.bun || null,
        active: row.active,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: medicineMasterTable.material,
        set: {
          materialDescription: row.materialDescription,
          bun: row.bun || null,
          active: row.active,
          updatedAt: new Date(),
        },
      });
    imported += 1;
  }
  res.status(201).json({ imported });
});

router.patch("/medicine-master/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = MedicineInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_input", issues: parsed.error.issues }); return; }
  const [row] = await db
    .update(medicineMasterTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(medicineMasterTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "not_found" }); return; }
  res.json(row);
});

router.delete("/medicine-master/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.delete(medicineMasterTable).where(eq(medicineMasterTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not_found" }); return; }
  res.sendStatus(204);
});

export default router;
