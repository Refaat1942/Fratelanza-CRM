import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, employeesTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const EmployeeInput = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  departmentAr: z.string().optional(),
  role: z.string().optional(),
  roleAr: z.string().optional(),
  status: z.enum(["active", "inactive", "on_leave"]).default("active"),
  salary: z.string().optional(),
  joinDate: z.string().optional(),
  notes: z.string().optional(),
});

router.get("/employees/stats", async (req, res): Promise<void> => {
  const rows = await db
    .select({ status: employeesTable.status, count: sql<number>`cast(count(*) as int)` })
    .from(employeesTable)
    .groupBy(employeesTable.status);
  const stats = { active: 0, inactive: 0, on_leave: 0 };
  for (const row of rows) {
    if (row.status in stats) stats[row.status as keyof typeof stats] = row.count;
  }
  res.json(stats);
});

router.get("/employees", async (_req, res): Promise<void> => {
  const employees = await db.select().from(employeesTable).orderBy(employeesTable.createdAt);
  res.json(employees);
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = EmployeeInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [emp] = await db.insert(employeesTable).values(parsed.data).returning();
  res.status(201).json(emp);
});

router.get("/employees/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, id));
  if (!emp) { res.status(404).json({ error: "Not found" }); return; }
  res.json(emp);
});

router.patch("/employees/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = EmployeeInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [emp] = await db.update(employeesTable).set(parsed.data).where(eq(employeesTable.id, id)).returning();
  if (!emp) { res.status(404).json({ error: "Not found" }); return; }
  res.json(emp);
});

router.delete("/employees/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  await db.delete(employeesTable).where(eq(employeesTable.id, id));
  res.status(204).send();
});

export default router;
