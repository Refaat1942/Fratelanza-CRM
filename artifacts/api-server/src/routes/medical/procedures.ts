import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, medicalProceduresTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const ProcedureInput = z.object({
  name: z.string().min(1),
  nameAr: z.string().nullable().optional(),
  category: z.string().nullable().optional(), // "general" | "dental" | custom
  price: z.number().nonnegative(),
  active: z.enum(["true", "false"]).default("true"),
});

router.get("/procedures", async (_req, res): Promise<void> => {
  const rows = await db.select().from(medicalProceduresTable).orderBy(asc(medicalProceduresTable.name));
  res.json(rows);
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
