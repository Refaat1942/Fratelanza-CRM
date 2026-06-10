import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db, medicalProceduresTable } from "@workspace/db";
import { parseSort, sendExcel } from "../../lib/excelExport";
import { z } from "zod";

const router: IRouter = Router();

const ProcedureInput = z.object({
  name: z.string().min(1),
  nameAr: z.string().nullable().optional(),
  category: z.string().nullable().optional(), // "general" | "dental" | custom
  price: z.number().nonnegative(),
  active: z.enum(["true", "false"]).default("true"),
});

router.get("/procedures", async (req, res): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
  const { field, dir } = parseSort(req.query as Record<string, unknown>, ["name", "price", "category"], "name");
  const orderCol = field === "price" ? medicalProceduresTable.price
    : field === "category" ? medicalProceduresTable.category
    : medicalProceduresTable.name;
  const orderFn = dir === "asc" ? asc : desc;
  const conds = [];
  if (search) conds.push(or(ilike(medicalProceduresTable.name, `%${search}%`), ilike(medicalProceduresTable.nameAr, `%${search}%`)));
  if (category) conds.push(eq(medicalProceduresTable.category, category));
  let q = db.select().from(medicalProceduresTable).$dynamic();
  if (conds.length) q = q.where(and(...conds));
  res.json(await q.orderBy(orderFn(orderCol)).limit(500));
});

router.get("/procedures/export.xlsx", async (_req, res): Promise<void> => {
  const rows = await db.select().from(medicalProceduresTable).orderBy(asc(medicalProceduresTable.category), asc(medicalProceduresTable.name));
  await sendExcel(res, "procedures.xlsx", "Procedures", [
    { header: "Name", key: "name" },
    { header: "Name (AR)", key: "nameAr" },
    { header: "Category", key: "category" },
    { header: "Price (EGP)", key: "price" },
    { header: "Active", key: "active" },
  ], rows as Record<string, unknown>[]);
});

router.post("/procedures", async (req, res): Promise<void> => {
  const parsed = ProcedureInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(medicalProceduresTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.patch("/procedures/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = ProcedureInput.partial().refine(
    d => d.name === undefined || d.name.length > 0,
    { message: "name cannot be empty", path: ["name"] },
  ).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(medicalProceduresTable).set(parsed.data).where(eq(medicalProceduresTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Procedure not found" }); return; }
  res.json(row);
});

router.delete("/procedures/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.delete(medicalProceduresTable).where(eq(medicalProceduresTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Procedure not found" }); return; }
  res.sendStatus(204);
});

export default router;
