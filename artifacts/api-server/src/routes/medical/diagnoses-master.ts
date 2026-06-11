import { Router, type IRouter } from "express";
import { eq, ilike, or, and } from "drizzle-orm";
import { db, diagnosesMasterTable, medicalFeaturesMasterTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

router.get("/diagnoses-master", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const spec = typeof req.query.specialization === "string" ? req.query.specialization.trim() : "";
  const parts = [];
  if (search) {
    parts.push(or(
      ilike(diagnosesMasterTable.name, `%${search}%`),
      ilike(diagnosesMasterTable.nameAr, `%${search}%`),
      ilike(diagnosesMasterTable.code, `%${search}%`),
    ));
  }
  if (spec) parts.push(eq(diagnosesMasterTable.specialization, spec));
  parts.push(eq(diagnosesMasterTable.active, 1));

  let q = db.select().from(diagnosesMasterTable).$dynamic();
  if (parts.length) q = q.where(and(...parts));
  const rows = await q.limit(500);
  res.json(rows);
});

router.get("/medical-features-master", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const spec = typeof req.query.specialization === "string" ? req.query.specialization.trim() : "";
  const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
  const parts = [];
  if (search) {
    parts.push(or(
      ilike(medicalFeaturesMasterTable.name, `%${search}%`),
      ilike(medicalFeaturesMasterTable.nameAr, `%${search}%`),
    ));
  }
  if (spec) parts.push(eq(medicalFeaturesMasterTable.specialization, spec));
  if (category) parts.push(eq(medicalFeaturesMasterTable.category, category));
  parts.push(eq(medicalFeaturesMasterTable.active, 1));

  let q = db.select().from(medicalFeaturesMasterTable).$dynamic();
  if (parts.length) q = q.where(and(...parts));
  const rows = await q.limit(500);
  res.json(rows);
});

const DiagnosisInput = z.object({
  code: z.string().nullable().optional(),
  name: z.string().min(1),
  nameAr: z.string().nullable().optional(),
  specialization: z.string().nullable().optional(),
});

router.post("/diagnoses-master", async (req, res): Promise<void> => {
  const parsed = DiagnosisInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(diagnosesMasterTable).values(parsed.data).returning();
  res.status(201).json(row);
});

const FeatureInput = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  nameAr: z.string().nullable().optional(),
  specialization: z.string().nullable().optional(),
});

router.post("/medical-features-master", async (req, res): Promise<void> => {
  const parsed = FeatureInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(medicalFeaturesMasterTable).values(parsed.data).returning();
  res.status(201).json(row);
});

export default router;
