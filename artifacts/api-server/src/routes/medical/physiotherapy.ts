import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  db,
  physioAssessmentsTable,
  physioExercisesTable,
  physioSessionsTable,
  physioTreatmentPlansTable,
} from "@workspace/db";
import { branchWhere } from "../../lib/branchScope";
import { parseSort, sendExcel } from "../../lib/excelExport";
import { z } from "zod";

const router: IRouter = Router();

const AssessmentInput = z.object({
  patientId: z.number().int().positive(),
  therapistId: z.number().int().positive().nullable().optional(),
  assessmentDate: z.string(),
  bodyRegion: z.string().nullable().optional(),
  bodyRegionAr: z.string().nullable().optional(),
  painScale: z.number().int().min(0).max(10).nullable().optional(),
  romNotes: z.string().nullable().optional(),
  romNotesAr: z.string().nullable().optional(),
  diagnosis: z.string().nullable().optional(),
  diagnosisAr: z.string().nullable().optional(),
  goals: z.string().nullable().optional(),
  goalsAr: z.string().nullable().optional(),
  contraindications: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  branchId: z.number().int().positive().nullable().optional(),
});

const SessionInput = z.object({
  patientId: z.number().int().positive(),
  planId: z.number().int().positive().nullable().optional(),
  therapistId: z.number().int().positive().nullable().optional(),
  sessionDate: z.string(),
  sessionNumber: z.number().int().nullable().optional(),
  bodyRegion: z.string().nullable().optional(),
  painBefore: z.number().int().min(0).max(10).nullable().optional(),
  painAfter: z.number().int().min(0).max(10).nullable().optional(),
  modalities: z.string().nullable().optional(),
  modalitiesAr: z.string().nullable().optional(),
  exercisesPerformed: z.string().nullable().optional(),
  exercisesPerformedAr: z.string().nullable().optional(),
  homeProgram: z.string().nullable().optional(),
  homeProgramAr: z.string().nullable().optional(),
  status: z.enum(["scheduled", "completed", "no_show", "cancelled"]).optional(),
  feeEgp: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  branchId: z.number().int().positive().nullable().optional(),
});

const PlanInput = z.object({
  patientId: z.number().int().positive(),
  assessmentId: z.number().int().positive().nullable().optional(),
  therapistId: z.number().int().positive().nullable().optional(),
  title: z.string().min(1),
  titleAr: z.string().nullable().optional(),
  sessionsPlanned: z.number().int().positive().optional(),
  frequencyPerWeek: z.number().int().positive().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  status: z.enum(["active", "completed", "paused", "cancelled"]).optional(),
  notes: z.string().nullable().optional(),
  branchId: z.number().int().positive().nullable().optional(),
});

const ExerciseInput = z.object({
  name: z.string().min(1),
  nameAr: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  bodyRegion: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  instructionsAr: z.string().nullable().optional(),
  durationMinutes: z.number().int().positive().nullable().optional(),
  active: z.string().optional(),
});

// ---- Assessments ----
router.get("/physio-assessments", async (req, res): Promise<void> => {
  const bw = branchWhere(req, physioAssessmentsTable.branchId);
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const patientId = parseInt(String(req.query.patientId || ""), 10);
  const { field, dir } = parseSort(req.query as Record<string, unknown>, ["assessmentDate", "createdAt", "painScale"], "assessmentDate");
  const orderCol = field === "painScale" ? physioAssessmentsTable.painScale
    : field === "createdAt" ? physioAssessmentsTable.createdAt
    : physioAssessmentsTable.assessmentDate;
  const orderFn = dir === "asc" ? asc : desc;

  const conds = [];
  if (bw) conds.push(bw);
  if (Number.isFinite(patientId)) conds.push(eq(physioAssessmentsTable.patientId, patientId));
  if (search) {
    conds.push(or(
      ilike(physioAssessmentsTable.diagnosis, `%${search}%`),
      ilike(physioAssessmentsTable.bodyRegion, `%${search}%`),
      ilike(physioAssessmentsTable.diagnosisAr, `%${search}%`),
    ));
  }
  let q = db.select().from(physioAssessmentsTable).$dynamic();
  if (conds.length) q = q.where(and(...conds));
  const rows = await q.orderBy(orderFn(orderCol)).limit(500);
  res.json(rows);
});

router.get("/physio-assessments/export.xlsx", async (req, res): Promise<void> => {
  const bw = branchWhere(req, physioAssessmentsTable.branchId);
  let q = db.select().from(physioAssessmentsTable).$dynamic();
  if (bw) q = q.where(bw);
  const rows = await q.orderBy(desc(physioAssessmentsTable.assessmentDate)).limit(5000);
  await sendExcel(res, "physio-assessments.xlsx", "Assessments", [
    { header: "ID", key: "id" },
    { header: "Patient ID", key: "patientId" },
    { header: "Date", key: "assessmentDate" },
    { header: "Body Region", key: "bodyRegion" },
    { header: "Pain (0-10)", key: "painScale" },
    { header: "Diagnosis", key: "diagnosis" },
    { header: "Goals", key: "goals" },
  ], rows as Record<string, unknown>[]);
});

router.post("/physio-assessments", async (req, res): Promise<void> => {
  const parsed = AssessmentInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(physioAssessmentsTable).values(parsed.data as any).returning();
  res.status(201).json(row);
});

router.patch("/physio-assessments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = AssessmentInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(physioAssessmentsTable).set(parsed.data as any).where(eq(physioAssessmentsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/physio-assessments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(physioAssessmentsTable).where(eq(physioAssessmentsTable.id, id));
  res.status(204).end();
});

// ---- Sessions ----
router.get("/physio-sessions", async (req, res): Promise<void> => {
  const bw = branchWhere(req, physioSessionsTable.branchId);
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const patientId = parseInt(String(req.query.patientId || ""), 10);
  const { field, dir } = parseSort(req.query as Record<string, unknown>, ["sessionDate", "createdAt", "feeEgp"], "sessionDate");
  const orderCol = field === "feeEgp" ? physioSessionsTable.feeEgp
    : field === "createdAt" ? physioSessionsTable.createdAt
    : physioSessionsTable.sessionDate;
  const orderFn = dir === "asc" ? asc : desc;
  const conds = [];
  if (bw) conds.push(bw);
  if (Number.isFinite(patientId)) conds.push(eq(physioSessionsTable.patientId, patientId));
  if (status) conds.push(eq(physioSessionsTable.status, status));
  let q = db.select().from(physioSessionsTable).$dynamic();
  if (conds.length) q = q.where(and(...conds));
  res.json(await q.orderBy(orderFn(orderCol)).limit(500));
});

router.get("/physio-sessions/export.xlsx", async (req, res): Promise<void> => {
  const bw = branchWhere(req, physioSessionsTable.branchId);
  let q = db.select().from(physioSessionsTable).$dynamic();
  if (bw) q = q.where(bw);
  const rows = await q.orderBy(desc(physioSessionsTable.sessionDate)).limit(5000);
  await sendExcel(res, "physio-sessions.xlsx", "Sessions", [
    { header: "ID", key: "id" },
    { header: "Patient ID", key: "patientId" },
    { header: "Session #", key: "sessionNumber" },
    { header: "Date", key: "sessionDate", format: (r) => String(r.sessionDate ?? "") },
    { header: "Region", key: "bodyRegion" },
    { header: "Pain Before", key: "painBefore" },
    { header: "Pain After", key: "painAfter" },
    { header: "Fee (EGP)", key: "feeEgp" },
    { header: "Status", key: "status" },
  ], rows as Record<string, unknown>[]);
});

router.post("/physio-sessions", async (req, res): Promise<void> => {
  const parsed = SessionInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(physioSessionsTable).values(parsed.data as any).returning();
  if (row.planId) {
    await db.update(physioTreatmentPlansTable)
      .set({ sessionsCompleted: sql`${physioTreatmentPlansTable.sessionsCompleted} + 1` })
      .where(eq(physioTreatmentPlansTable.id, row.planId));
  }
  res.status(201).json(row);
});

router.patch("/physio-sessions/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = SessionInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(physioSessionsTable).set(parsed.data as any).where(eq(physioSessionsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/physio-sessions/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(physioSessionsTable).where(eq(physioSessionsTable.id, id));
  res.status(204).end();
});

// ---- Treatment plans ----
router.get("/physio-plans", async (req, res): Promise<void> => {
  const bw = branchWhere(req, physioTreatmentPlansTable.branchId);
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const patientId = parseInt(String(req.query.patientId || ""), 10);
  const conds = [];
  if (bw) conds.push(bw);
  if (Number.isFinite(patientId)) conds.push(eq(physioTreatmentPlansTable.patientId, patientId));
  if (status) conds.push(eq(physioTreatmentPlansTable.status, status));
  let q = db.select().from(physioTreatmentPlansTable).$dynamic();
  if (conds.length) q = q.where(and(...conds));
  res.json(await q.orderBy(desc(physioTreatmentPlansTable.createdAt)).limit(500));
});

router.get("/physio-plans/export.xlsx", async (req, res): Promise<void> => {
  const rows = await db.select().from(physioTreatmentPlansTable).orderBy(desc(physioTreatmentPlansTable.createdAt)).limit(5000);
  await sendExcel(res, "physio-plans.xlsx", "Plans", [
    { header: "ID", key: "id" },
    { header: "Patient ID", key: "patientId" },
    { header: "Title", key: "title" },
    { header: "Sessions", key: "sessionsPlanned", format: (r) => `${r.sessionsCompleted}/${r.sessionsPlanned}` },
    { header: "Status", key: "status" },
    { header: "Start", key: "startDate" },
    { header: "End", key: "endDate" },
  ], rows as Record<string, unknown>[]);
});

router.post("/physio-plans", async (req, res): Promise<void> => {
  const parsed = PlanInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(physioTreatmentPlansTable).values(parsed.data as any).returning();
  res.status(201).json(row);
});

router.patch("/physio-plans/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = PlanInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(physioTreatmentPlansTable).set(parsed.data as any).where(eq(physioTreatmentPlansTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// ---- Exercise catalog ----
router.get("/physio-exercises", async (req, res): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  let q = db.select().from(physioExercisesTable).$dynamic();
  if (search) {
    q = q.where(or(ilike(physioExercisesTable.name, `%${search}%`), ilike(physioExercisesTable.nameAr, `%${search}%`)));
  }
  res.json(await q.orderBy(asc(physioExercisesTable.name)).limit(500));
});

router.get("/physio-exercises/export.xlsx", async (req, res): Promise<void> => {
  const rows = await db.select().from(physioExercisesTable).orderBy(asc(physioExercisesTable.name));
  await sendExcel(res, "physio-exercises.xlsx", "Exercises", [
    { header: "Name", key: "name" },
    { header: "Name (AR)", key: "nameAr" },
    { header: "Category", key: "category" },
    { header: "Body Region", key: "bodyRegion" },
    { header: "Duration (min)", key: "durationMinutes" },
  ], rows as Record<string, unknown>[]);
});

router.post("/physio-exercises", async (req, res): Promise<void> => {
  const parsed = ExerciseInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(physioExercisesTable).values(parsed.data as any).returning();
  res.status(201).json(row);
});

router.get("/physio/stats", async (req, res): Promise<void> => {
  const bA = branchWhere(req, physioAssessmentsTable.branchId);
  const bS = branchWhere(req, physioSessionsTable.branchId);
  let aq = db.select({ assessments: sql<number>`cast(count(*) as int)` }).from(physioAssessmentsTable).$dynamic();
  if (bA) aq = aq.where(bA);
  const [{ assessments }] = await aq;
  let sq = db.select({ sessions: sql<number>`cast(count(*) as int)` }).from(physioSessionsTable).$dynamic();
  if (bS) sq = sq.where(bS);
  const [{ sessions }] = await sq;
  const [{ activePlans }] = await db.select({ activePlans: sql<number>`cast(count(*) as int)` }).from(physioTreatmentPlansTable).where(eq(physioTreatmentPlansTable.status, "active"));
  res.json({ assessments, sessions, activePlans });
});

export default router;
