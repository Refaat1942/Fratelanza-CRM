import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, dentalProceduresTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const DENTAL_CATEGORIES = [
  "cleaning", "filling", "root_canal", "crown", "braces", "whitening", "extraction", "implant", "bridge", "other",
] as const;

const ProcedureInput = z.object({
  name: z.string().min(1).nullable().optional(),
  nameAr: z.string().min(1).nullable().optional(),
  category: z.enum(DENTAL_CATEGORIES).nullable().optional(),
  price: z.number().nonnegative(),
  active: z.enum(["true", "false"]).default("true"),
}).refine(d => (d.name && d.name.length > 0) || (d.nameAr && d.nameAr.length > 0), {
  message: "Either name or nameAr is required",
  path: ["name"],
});

router.get("/dental-procedures", async (_req, res): Promise<void> => {
  const rows = await db.select().from(dentalProceduresTable).orderBy(asc(dentalProceduresTable.name));
  res.json(rows);
});

router.post("/dental-procedures", async (req, res): Promise<void> => {
  const parsed = ProcedureInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  // Ensure `name` is a non-null string since the column is NOT NULL — fall back to AR text.
  const name: string = parsed.data.name || parsed.data.nameAr || "Untitled";
  const [row] = await db.insert(dentalProceduresTable).values({
    name,
    nameAr: parsed.data.nameAr ?? null,
    category: parsed.data.category ?? null,
    price: parsed.data.price,
    active: parsed.data.active,
  }).returning();
  res.status(201).json(row);
});

router.patch("/dental-procedures/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = z.object({
    name: z.string().min(1).optional(),
    nameAr: z.string().nullable().optional(),
    category: z.enum(DENTAL_CATEGORIES).nullable().optional(),
    price: z.number().nonnegative().optional(),
    active: z.enum(["true", "false"]).optional(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(dentalProceduresTable).set(parsed.data).where(eq(dentalProceduresTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Procedure not found" }); return; }
  res.json(row);
});

router.delete("/dental-procedures/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.delete(dentalProceduresTable).where(eq(dentalProceduresTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Procedure not found" }); return; }
  res.sendStatus(204);
});

// Seed common dental procedures (idempotent — only inserts if catalog is empty).
router.post("/dental-procedures/seed", async (_req, res): Promise<void> => {
  const existing = await db.select({ id: dentalProceduresTable.id }).from(dentalProceduresTable).limit(1);
  if (existing.length > 0) { res.json({ seeded: 0, message: "already-seeded" }); return; }
  const seed = [
    { name: "Cleaning / Scaling",        nameAr: "تنظيف الأسنان",      category: "cleaning",    price: 350 },
    { name: "Composite Filling",         nameAr: "حشو تجميلي",         category: "filling",     price: 500 },
    { name: "Amalgam Filling",           nameAr: "حشو معدني",          category: "filling",     price: 400 },
    { name: "Root Canal (single canal)", nameAr: "علاج عصب (قناة واحدة)", category: "root_canal", price: 1500 },
    { name: "Porcelain Crown",           nameAr: "تاج بورسلين",        category: "crown",       price: 3500 },
    { name: "Zirconia Crown",            nameAr: "تاج زيركون",         category: "crown",       price: 4500 },
    { name: "Teeth Whitening",           nameAr: "تبييض الأسنان",      category: "whitening",   price: 2500 },
    { name: "Simple Extraction",         nameAr: "خلع بسيط",           category: "extraction",  price: 250 },
    { name: "Surgical Extraction",       nameAr: "خلع جراحي",          category: "extraction",  price: 700 },
    { name: "Dental Implant",            nameAr: "زراعة الأسنان",      category: "implant",     price: 8000 },
    { name: "Braces Adjustment",         nameAr: "ضبط التقويم",        category: "braces",      price: 600 },
  ] as const;
  const rows = await db.insert(dentalProceduresTable).values(seed.map(s => ({ ...s, active: "true" as const }))).returning();
  res.json({ seeded: rows.length });
});

export default router;
