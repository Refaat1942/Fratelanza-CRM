import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, suppliersTable } from "@workspace/db";
import { z } from "zod";
import { requirePermission } from "../middleware/permissions";

const router: IRouter = Router();

router.use(requirePermission("suppliers"));

const SupplierInput = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

router.get("/suppliers", async (_req, res): Promise<void> => {
  const rows = await db.select().from(suppliersTable).orderBy(suppliersTable.createdAt);
  res.json(rows);
});

router.post("/suppliers", async (req, res): Promise<void> => {
  const parsed = SupplierInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [s] = await db.insert(suppliersTable).values(parsed.data).returning();
  res.status(201).json(s);
});

router.patch("/suppliers/:id", async (req, res): Promise<void> => {
  const parsed = SupplierInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [s] = await db.update(suppliersTable).set(parsed.data).where(eq(suppliersTable.id, parseInt(String(req.params.id)))).returning();
  if (!s) { res.status(404).json({ error: "Not found" }); return; }
  res.json(s);
});

router.delete("/suppliers/:id", async (req, res): Promise<void> => {
  await db.delete(suppliersTable).where(eq(suppliersTable.id, parseInt(String(req.params.id))));
  res.status(204).send();
});

export default router;
