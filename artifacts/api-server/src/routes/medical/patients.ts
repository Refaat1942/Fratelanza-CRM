import { Router, type IRouter } from "express";
import { and, eq, or, ilike, sql, desc, isNull } from "drizzle-orm";
import { db, patientsTable, activityTable, getCurrentTenant, isFeatureEnabled } from "@workspace/db";
import { branchWhere } from "../../lib/branchScope";
import { z } from "zod";
import crypto from "node:crypto";

function newQrToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

const router: IRouter = Router();

function qrFeatureDisabled(res: import("express").Response): boolean {
  const tenant = getCurrentTenant();
  if (tenant && !isFeatureEnabled(tenant.features, "medical_patient_qr")) {
    res.status(403).json({ error: "feature_disabled", feature: "medical_patient_qr" });
    return true;
  }
  return false;
}

const PatientInput = z.object({
  firstName: z.string().min(1),
  firstNameAr: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  lastNameAr: z.string().nullable().optional(),
  gender: z.enum(["male", "female", "other"]).nullable().optional(),
  dateOfBirth: z.string().nullable().optional(), // YYYY-MM-DD
  nationalId: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("").transform(() => null)),
  address: z.string().nullable().optional(),
  addressAr: z.string().nullable().optional(),
  bloodType: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
  chronicConditions: z.string().nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  notesAr: z.string().nullable().optional(),
  branchId: z.number().int().positive().nullable().optional(),
});

router.get("/patients/stats", async (req, res): Promise<void> => {
  const bw = branchWhere(req, patientsTable.branchId);
  const recentClause = sql`${patientsTable.createdAt} > now() - interval '30 days'`;
  const totalQ = db.select({ total: sql<number>`cast(count(*) as int)` }).from(patientsTable).$dynamic();
  const recentQ = db.select({ recent: sql<number>`cast(count(*) as int)` }).from(patientsTable).$dynamic();
  const [{ total }] = await (bw ? totalQ.where(bw) : totalQ);
  const [{ recent }] = await (bw ? recentQ.where(and(recentClause, bw)!) : recentQ.where(recentClause));
  res.json({ total, recent });
});

router.get("/patients", async (req, res): Promise<void> => {
  const bw = branchWhere(req, patientsTable.branchId);
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const searchCond = search
    ? or(
        ilike(patientsTable.firstName, `%${search}%`),
        ilike(patientsTable.firstNameAr, `%${search}%`),
        ilike(patientsTable.lastName, `%${search}%`),
        ilike(patientsTable.lastNameAr, `%${search}%`),
        ilike(patientsTable.phone, `%${search}%`),
        ilike(patientsTable.nationalId, `%${search}%`),
      )
    : undefined;
  const where = searchCond && bw ? and(searchCond, bw) : (searchCond ?? bw);
  let query = db.select().from(patientsTable).$dynamic();
  if (where) query = query.where(where);
  const rows = await query.orderBy(desc(patientsTable.createdAt)).limit(500);
  res.json(rows);
});

router.post("/patients", async (req, res): Promise<void> => {
  const parsed = PatientInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [patient] = await db.insert(patientsTable).values({
    ...(parsed.data as any),
    qrToken: newQrToken(),
  }).returning();
  await db.insert(activityTable).values({
    type: "patient_added",
    description: `Patient added: ${patient.firstName}${patient.lastName ? " " + patient.lastName : ""}`,
    descriptionAr: patient.firstNameAr
      ? `تمت إضافة مريض: ${patient.firstNameAr}${patient.lastNameAr ? " " + patient.lastNameAr : ""}`
      : null,
  });
  res.status(201).json(patient);
});

router.get("/patients/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
  res.json(patient);
});

router.patch("/patients/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  // Use .partial() to allow updating any subset, but still enforce firstName non-empty if provided.
  const UpdateInput = PatientInput.partial().refine(
    d => d.firstName === undefined || d.firstName.length > 0,
    { message: "firstName cannot be empty", path: ["firstName"] },
  );
  const parsed = UpdateInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [patient] = await db
    .update(patientsTable)
    .set(parsed.data as any)
    .where(eq(patientsTable.id, id))
    .returning();
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
  res.json(patient);
});

/** Ensure every patient has a QR token (backfill for records created before this feature). */
router.post("/patients/backfill-qr", async (_req, res): Promise<void> => {
  if (qrFeatureDisabled(res)) return;
  const missing = await db.select({ id: patientsTable.id }).from(patientsTable).where(isNull(patientsTable.qrToken));
  for (const p of missing) {
    await db.update(patientsTable).set({ qrToken: newQrToken() }).where(eq(patientsTable.id, p.id));
  }
  res.json({ updated: missing.length });
});

router.post("/patients/:id/regenerate-qr", async (req, res): Promise<void> => {
  if (qrFeatureDisabled(res)) return;
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [patient] = await db
    .update(patientsTable)
    .set({ qrToken: newQrToken() })
    .where(eq(patientsTable.id, id))
    .returning();
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
  res.json({ qrToken: patient.qrToken });
});

router.delete("/patients/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [patient] = await db.delete(patientsTable).where(eq(patientsTable.id, id)).returning();
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
  res.sendStatus(204);
});

export default router;
