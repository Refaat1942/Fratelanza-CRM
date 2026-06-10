import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  db,
  nutritionAssessmentsTable,
  nutritionConsultationsTable,
  nutritionFoodCatalogTable,
  nutritionMealPlanItemsTable,
  nutritionMealPlansTable,
} from "@workspace/db";
import { branchWhere } from "../../lib/branchScope";
import { parseSort, sendExcel } from "../../lib/excelExport";
import { z } from "zod";

const router: IRouter = Router();

const AssessmentInput = z.object({
  patientId: z.number().int().positive(),
  dietitianId: z.number().int().positive().nullable().optional(),
  assessmentDate: z.string(),
  weightKg: z.number().positive().nullable().optional(),
  heightCm: z.number().positive().nullable().optional(),
  waistCm: z.number().positive().nullable().optional(),
  activityLevel: z.string().nullable().optional(),
  medicalConditions: z.string().nullable().optional(),
  medicalConditionsAr: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
  dietaryRestrictions: z.string().nullable().optional(),
  goals: z.string().nullable().optional(),
  goalsAr: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  branchId: z.number().int().positive().nullable().optional(),
});

const MealPlanInput = z.object({
  patientId: z.number().int().positive(),
  assessmentId: z.number().int().positive().nullable().optional(),
  dietitianId: z.number().int().positive().nullable().optional(),
  title: z.string().min(1),
  titleAr: z.string().nullable().optional(),
  dailyCaloriesTarget: z.number().positive().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  status: z.enum(["active", "completed", "paused"]).optional(),
  notes: z.string().nullable().optional(),
  notesAr: z.string().nullable().optional(),
  branchId: z.number().int().positive().nullable().optional(),
});

const MealItemInput = z.object({
  mealPlanId: z.number().int().positive(),
  mealType: z.enum(["breakfast", "snack", "lunch", "dinner"]),
  foodName: z.string().min(1),
  foodNameAr: z.string().nullable().optional(),
  portion: z.string().nullable().optional(),
  caloriesKcal: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

const ConsultationInput = z.object({
  patientId: z.number().int().positive(),
  mealPlanId: z.number().int().positive().nullable().optional(),
  dietitianId: z.number().int().positive().nullable().optional(),
  consultationDate: z.string(),
  weightKg: z.number().positive().nullable().optional(),
  adherenceScore: z.number().int().min(1).max(10).nullable().optional(),
  summary: z.string().nullable().optional(),
  summaryAr: z.string().nullable().optional(),
  recommendations: z.string().nullable().optional(),
  recommendationsAr: z.string().nullable().optional(),
  feeEgp: z.number().nullable().optional(),
  status: z.string().optional(),
  branchId: z.number().int().positive().nullable().optional(),
});

const FoodInput = z.object({
  name: z.string().min(1),
  nameAr: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  servingSize: z.string().nullable().optional(),
  caloriesKcal: z.number().nullable().optional(),
  proteinG: z.number().nullable().optional(),
  carbsG: z.number().nullable().optional(),
  fatG: z.number().nullable().optional(),
  fiberG: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  active: z.string().optional(),
});

function calcBmi(weightKg?: number | null, heightCm?: number | null): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

// ---- Assessments ----
router.get("/nutrition-assessments", async (req, res): Promise<void> => {
  const bw = branchWhere(req, nutritionAssessmentsTable.branchId);
  const patientId = parseInt(String(req.query.patientId || ""), 10);
  const { field, dir } = parseSort(req.query as Record<string, unknown>, ["assessmentDate", "bmi", "createdAt"], "assessmentDate");
  const orderCol = field === "bmi" ? nutritionAssessmentsTable.bmi
    : field === "createdAt" ? nutritionAssessmentsTable.createdAt
    : nutritionAssessmentsTable.assessmentDate;
  const orderFn = dir === "asc" ? asc : desc;
  const conds = [];
  if (bw) conds.push(bw);
  if (Number.isFinite(patientId)) conds.push(eq(nutritionAssessmentsTable.patientId, patientId));
  let q = db.select().from(nutritionAssessmentsTable).$dynamic();
  if (conds.length) q = q.where(and(...conds));
  res.json(await q.orderBy(orderFn(orderCol)).limit(500));
});

router.get("/nutrition-assessments/export.xlsx", async (req, res): Promise<void> => {
  const rows = await db.select().from(nutritionAssessmentsTable).orderBy(desc(nutritionAssessmentsTable.assessmentDate)).limit(5000);
  await sendExcel(res, "nutrition-assessments.xlsx", "Assessments", [
    { header: "Patient ID", key: "patientId" },
    { header: "Date", key: "assessmentDate" },
    { header: "Weight (kg)", key: "weightKg" },
    { header: "Height (cm)", key: "heightCm" },
    { header: "BMI", key: "bmi" },
    { header: "Activity", key: "activityLevel" },
    { header: "Goals", key: "goals" },
  ], rows as Record<string, unknown>[]);
});

router.post("/nutrition-assessments", async (req, res): Promise<void> => {
  const parsed = AssessmentInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data = { ...parsed.data, bmi: calcBmi(parsed.data.weightKg, parsed.data.heightCm) };
  const [row] = await db.insert(nutritionAssessmentsTable).values(data as any).returning();
  res.status(201).json(row);
});

router.patch("/nutrition-assessments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = AssessmentInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const bmi = calcBmi(parsed.data.weightKg, parsed.data.heightCm);
  const patch = { ...parsed.data, ...(bmi != null ? { bmi } : {}) };
  const [row] = await db.update(nutritionAssessmentsTable).set(patch as any).where(eq(nutritionAssessmentsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// ---- Meal plans ----
router.get("/nutrition-meal-plans", async (req, res): Promise<void> => {
  const bw = branchWhere(req, nutritionMealPlansTable.branchId);
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const conds = [];
  if (bw) conds.push(bw);
  if (status) conds.push(eq(nutritionMealPlansTable.status, status));
  let q = db.select().from(nutritionMealPlansTable).$dynamic();
  if (conds.length) q = q.where(and(...conds));
  res.json(await q.orderBy(desc(nutritionMealPlansTable.createdAt)).limit(500));
});

router.get("/nutrition-meal-plans/:id/items", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const rows = await db.select().from(nutritionMealPlanItemsTable)
    .where(eq(nutritionMealPlanItemsTable.mealPlanId, id))
    .orderBy(asc(nutritionMealPlanItemsTable.sortOrder), asc(nutritionMealPlanItemsTable.mealType));
  res.json(rows);
});

router.get("/nutrition-meal-plans/export.xlsx", async (req, res): Promise<void> => {
  const rows = await db.select().from(nutritionMealPlansTable).orderBy(desc(nutritionMealPlansTable.createdAt)).limit(5000);
  await sendExcel(res, "nutrition-meal-plans.xlsx", "Meal Plans", [
    { header: "Patient ID", key: "patientId" },
    { header: "Title", key: "title" },
    { header: "Calories/day", key: "dailyCaloriesTarget" },
    { header: "Status", key: "status" },
    { header: "Start", key: "startDate" },
    { header: "End", key: "endDate" },
  ], rows as Record<string, unknown>[]);
});

router.post("/nutrition-meal-plans", async (req, res): Promise<void> => {
  const parsed = MealPlanInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(nutritionMealPlansTable).values(parsed.data as any).returning();
  res.status(201).json(row);
});

router.post("/nutrition-meal-plan-items", async (req, res): Promise<void> => {
  const parsed = MealItemInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(nutritionMealPlanItemsTable).values(parsed.data as any).returning();
  res.status(201).json(row);
});

router.delete("/nutrition-meal-plan-items/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(nutritionMealPlanItemsTable).where(eq(nutritionMealPlanItemsTable.id, id));
  res.status(204).end();
});

// ---- Consultations ----
router.get("/nutrition-consultations", async (req, res): Promise<void> => {
  const bw = branchWhere(req, nutritionConsultationsTable.branchId);
  const patientId = parseInt(String(req.query.patientId || ""), 10);
  const { field, dir } = parseSort(req.query as Record<string, unknown>, ["consultationDate", "adherenceScore", "feeEgp"], "consultationDate");
  const orderCol = field === "adherenceScore" ? nutritionConsultationsTable.adherenceScore
    : field === "feeEgp" ? nutritionConsultationsTable.feeEgp
    : nutritionConsultationsTable.consultationDate;
  const orderFn = dir === "asc" ? asc : desc;
  const conds = [];
  if (bw) conds.push(bw);
  if (Number.isFinite(patientId)) conds.push(eq(nutritionConsultationsTable.patientId, patientId));
  let q = db.select().from(nutritionConsultationsTable).$dynamic();
  if (conds.length) q = q.where(and(...conds));
  res.json(await q.orderBy(orderFn(orderCol)).limit(500));
});

router.get("/nutrition-consultations/export.xlsx", async (req, res): Promise<void> => {
  const rows = await db.select().from(nutritionConsultationsTable).orderBy(desc(nutritionConsultationsTable.consultationDate)).limit(5000);
  await sendExcel(res, "nutrition-consultations.xlsx", "Consultations", [
    { header: "Patient ID", key: "patientId" },
    { header: "Date", key: "consultationDate", format: (r) => String(r.consultationDate ?? "") },
    { header: "Weight (kg)", key: "weightKg" },
    { header: "Adherence (1-10)", key: "adherenceScore" },
    { header: "Fee (EGP)", key: "feeEgp" },
    { header: "Summary", key: "summary" },
  ], rows as Record<string, unknown>[]);
});

router.post("/nutrition-consultations", async (req, res): Promise<void> => {
  const parsed = ConsultationInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(nutritionConsultationsTable).values(parsed.data as any).returning();
  res.status(201).json(row);
});

// ---- Food catalog (Egyptian dishes & staples) ----
router.get("/nutrition-food-catalog", async (req, res): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const category = typeof req.query.category === "string" ? req.query.category : "";
  let q = db.select().from(nutritionFoodCatalogTable).$dynamic();
  const conds = [];
  if (search) conds.push(or(ilike(nutritionFoodCatalogTable.name, `%${search}%`), ilike(nutritionFoodCatalogTable.nameAr, `%${search}%`)));
  if (category) conds.push(eq(nutritionFoodCatalogTable.category, category));
  if (conds.length) q = q.where(and(...conds));
  res.json(await q.orderBy(asc(nutritionFoodCatalogTable.name)).limit(500));
});

router.get("/nutrition-food-catalog/export.xlsx", async (req, res): Promise<void> => {
  const rows = await db.select().from(nutritionFoodCatalogTable).orderBy(asc(nutritionFoodCatalogTable.category), asc(nutritionFoodCatalogTable.name));
  await sendExcel(res, "nutrition-food-catalog.xlsx", "Food Catalog", [
    { header: "Name", key: "name" },
    { header: "Name (AR)", key: "nameAr" },
    { header: "Category", key: "category" },
    { header: "Serving", key: "servingSize" },
    { header: "Calories", key: "caloriesKcal" },
    { header: "Protein (g)", key: "proteinG" },
    { header: "Carbs (g)", key: "carbsG" },
    { header: "Fat (g)", key: "fatG" },
  ], rows as Record<string, unknown>[]);
});

router.post("/nutrition-food-catalog", async (req, res): Promise<void> => {
  const parsed = FoodInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(nutritionFoodCatalogTable).values(parsed.data as any).returning();
  res.status(201).json(row);
});

router.get("/nutrition/stats", async (_req, res): Promise<void> => {
  const [{ assessments }] = await db.select({ assessments: sql<number>`cast(count(*) as int)` }).from(nutritionAssessmentsTable);
  const [{ mealPlans }] = await db.select({ mealPlans: sql<number>`cast(count(*) as int)` }).from(nutritionMealPlansTable).where(eq(nutritionMealPlansTable.status, "active"));
  const [{ consultations }] = await db.select({ consultations: sql<number>`cast(count(*) as int)` }).from(nutritionConsultationsTable);
  res.json({ assessments, mealPlans, consultations });
});

export default router;
