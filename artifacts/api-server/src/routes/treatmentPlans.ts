import { Router, type IRouter } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { branchWhere, branchWhereFragment, effectiveBranchId } from "../lib/branchScope";
import {
  db,
  treatmentPlansTable,
  treatmentPlanItemsTable,
  patientsTable,
  employeesTable,
} from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

// ---------- Plans ----------
const PlanInput = z.object({
  patientId: z.number().int().positive(),
  doctorId: z.number().int().positive().nullable().optional(),
  title: z.string().nullable().optional(),
  titleAr: z.string().nullable().optional(),
  status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
  notes: z.string().nullable().optional(),
  notesAr: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  targetCompletionDate: z.string().nullable().optional(),
  branchId: z.number().int().positive().nullable().optional(),
});

router.get("/treatment-plans", async (req, res): Promise<void> => {
  const patientId = req.query.patient ? Number(req.query.patient) : null;
  const status = typeof req.query.status === "string" ? req.query.status : null;

  const whereParts: any[] = [];
  if (patientId && Number.isFinite(patientId)) {
    whereParts.push(eq(treatmentPlansTable.patientId, patientId));
  }
  if (status) {
    whereParts.push(eq(treatmentPlansTable.status, status));
  }
  const bw = branchWhere(req, treatmentPlansTable.branchId);
  if (bw) whereParts.push(bw);

  const rows = await db
    .select({
      id: treatmentPlansTable.id,
      patientId: treatmentPlansTable.patientId,
      doctorId: treatmentPlansTable.doctorId,
      title: treatmentPlansTable.title,
      titleAr: treatmentPlansTable.titleAr,
      status: treatmentPlansTable.status,
      notes: treatmentPlansTable.notes,
      notesAr: treatmentPlansTable.notesAr,
      estimatedTotal: treatmentPlansTable.estimatedTotal,
      startDate: treatmentPlansTable.startDate,
      targetCompletionDate: treatmentPlansTable.targetCompletionDate,
      createdAt: treatmentPlansTable.createdAt,
      updatedAt: treatmentPlansTable.updatedAt,
      patientFirstName: patientsTable.firstName,
      patientFirstNameAr: patientsTable.firstNameAr,
      patientLastName: patientsTable.lastName,
      patientLastNameAr: patientsTable.lastNameAr,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
    })
    .from(treatmentPlansTable)
    .leftJoin(patientsTable, eq(patientsTable.id, treatmentPlansTable.patientId))
    .leftJoin(employeesTable, eq(employeesTable.id, treatmentPlansTable.doctorId))
    .where(whereParts.length ? and(...whereParts) : undefined)
    .orderBy(desc(treatmentPlansTable.createdAt));

  res.json(rows);
});

router.get("/treatment-plans/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [plan] = await db.select().from(treatmentPlansTable).where(eq(treatmentPlansTable.id, id));
  if (!plan) { res.status(404).json({ error: "not_found" }); return; }
  const items = await db
    .select()
    .from(treatmentPlanItemsTable)
    .where(eq(treatmentPlanItemsTable.planId, id))
    .orderBy(treatmentPlanItemsTable.id);
  res.json({ ...plan, items });
});

router.post("/treatment-plans", async (req, res): Promise<void> => {
  const parsed = PlanInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(treatmentPlansTable).values({ ...parsed.data, estimatedTotal: 0 }).returning();
  res.status(201).json(row);
});

router.patch("/treatment-plans/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = PlanInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(treatmentPlansTable).set(parsed.data).where(eq(treatmentPlansTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not_found" }); return; }
  res.json(row);
});

router.delete("/treatment-plans/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.delete(treatmentPlansTable).where(eq(treatmentPlansTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not_found" }); return; }
  res.sendStatus(204);
});

// ---------- Items ----------
const ItemInput = z.object({
  procedureId: z.number().int().positive().nullable().optional(),
  description: z.string().nullable().optional(),
  descriptionAr: z.string().nullable().optional(),
  toothNumber: z.number().int().nullable().optional(),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative().default(0),
  status: z.enum(["planned", "scheduled", "done", "cancelled"]).optional(),
  scheduledDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

async function recomputePlanTotal(planId: number) {
  // Single atomic UPDATE with subquery — avoids read-then-write race when
  // two requests modify the same plan's items concurrently.
  await db.execute(sql`
    UPDATE treatment_plans
    SET estimated_total = COALESCE((
      SELECT SUM(total)
      FROM treatment_plan_items
      WHERE plan_id = ${planId} AND status <> 'cancelled'
    ), 0),
    updated_at = NOW()
    WHERE id = ${planId}
  `);
}

router.post("/treatment-plans/:planId/items", async (req, res): Promise<void> => {
  const planId = parseInt(req.params.planId, 10);
  if (!Number.isFinite(planId)) { res.status(400).json({ error: "Invalid planId" }); return; }
  const parsed = ItemInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const qty = parsed.data.quantity ?? 1;
  const price = parsed.data.unitPrice ?? 0;
  const total = Number((qty * price).toFixed(2));
  const [row] = await db.insert(treatmentPlanItemsTable).values({
    ...parsed.data,
    planId,
    quantity: qty,
    unitPrice: price,
    total,
  }).returning();
  await recomputePlanTotal(planId);
  res.status(201).json(row);
});

router.patch("/treatment-plan-items/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = ItemInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [existing] = await db.select().from(treatmentPlanItemsTable).where(eq(treatmentPlanItemsTable.id, id));
  if (!existing) { res.status(404).json({ error: "not_found" }); return; }
  const qty = parsed.data.quantity ?? existing.quantity;
  const price = parsed.data.unitPrice ?? existing.unitPrice;
  const total = Number((qty * price).toFixed(2));
  const patch: Record<string, unknown> = { ...parsed.data, quantity: qty, unitPrice: price, total };
  if (parsed.data.status === "done" && existing.status !== "done") {
    patch.completedAt = new Date();
  }
  if (parsed.data.status && parsed.data.status !== "done") {
    patch.completedAt = null;
  }
  const [row] = await db.update(treatmentPlanItemsTable).set(patch).where(eq(treatmentPlanItemsTable.id, id)).returning();
  await recomputePlanTotal(existing.planId);
  res.json(row);
});

router.delete("/treatment-plan-items/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.delete(treatmentPlanItemsTable).where(eq(treatmentPlanItemsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not_found" }); return; }
  await recomputePlanTotal(row.planId);
  res.sendStatus(204);
});

// ---------- Stats ----------
router.get("/treatment-plans-stats", async (req, res): Promise<void> => {
  const planWhere = branchWhereFragment(req, "branch_id");
  const itemWhere = (() => {
    const bid = effectiveBranchId(req);
    return typeof bid === "number"
      ? sql` WHERE plan_id IN (SELECT id FROM treatment_plans WHERE branch_id = ${bid})`
      : sql``;
  })();
  const [counts] = await db.execute<{ total: string; active: string; completed: string; draft: string }>(
    sql`SELECT
      COUNT(*)::text AS total,
      COUNT(*) FILTER (WHERE status='active')::text AS active,
      COUNT(*) FILTER (WHERE status='completed')::text AS completed,
      COUNT(*) FILTER (WHERE status='draft')::text AS draft
    FROM treatment_plans${planWhere}`,
  ) as unknown as [{ total: string; active: string; completed: string; draft: string }];
  const [totals] = await db.execute<{ planned_value: string; completed_value: string }>(
    sql`SELECT
      COALESCE(SUM(total) FILTER (WHERE status IN ('planned','scheduled')),0)::text AS planned_value,
      COALESCE(SUM(total) FILTER (WHERE status='done'),0)::text AS completed_value
    FROM treatment_plan_items${itemWhere}`,
  ) as unknown as [{ planned_value: string; completed_value: string }];
  res.json({
    total: Number(counts?.total ?? 0),
    active: Number(counts?.active ?? 0),
    completed: Number(counts?.completed ?? 0),
    draft: Number(counts?.draft ?? 0),
    plannedValue: Number(totals?.planned_value ?? 0),
    completedValue: Number(totals?.completed_value ?? 0),
  });
});

export default router;
