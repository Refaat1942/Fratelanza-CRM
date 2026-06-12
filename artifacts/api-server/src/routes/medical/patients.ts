import { Router, type IRouter } from "express";
import { and, asc, eq, or, ilike, sql, desc, isNull } from "drizzle-orm";
import crypto from "node:crypto";
import { db, patientsTable, activityTable } from "@workspace/db";
import { branchWhere } from "../../lib/branchScope";
import { parseSort, sendExcel } from "../../lib/excelExport";
import { z } from "zod";

const router: IRouter = Router();

function newQrToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

const PatientInput = z.object({
  firstName: z.string().min(1),
  firstNameAr: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  lastNameAr: z.string().nullable().optional(),
  gender: z.enum(["male", "female", "other"]).nullable().optional(),
  dateOfBirth: z.string().nullable().optional(), // YYYY-MM-DD
  nationalId: z.string().nullable().optional(),
  governorate: z.string().nullable().optional(),
  governorateAr: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  cityAr: z.string().nullable().optional(),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).nullable().optional(),
  occupation: z.string().nullable().optional(),
  occupationAr: z.string().nullable().optional(),
  insuranceType: z.enum(["none", "general_authority", "private", "corporate", "other"]).nullable().optional(),
  insuranceNumber: z.string().nullable().optional(),
  insuranceProvider: z.string().nullable().optional(),
  insuranceProviderAr: z.string().nullable().optional(),
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
  const governorate = typeof req.query.governorate === "string" ? req.query.governorate.trim() : "";
  const insuranceType = typeof req.query.insuranceType === "string" ? req.query.insuranceType.trim() : "";
  const { field, dir } = parseSort(req.query as Record<string, unknown>, ["createdAt", "firstName", "dateOfBirth", "governorate"], "createdAt");
  const orderCol = field === "firstName" ? patientsTable.firstName
    : field === "dateOfBirth" ? patientsTable.dateOfBirth
    : field === "governorate" ? patientsTable.governorate
    : patientsTable.createdAt;
  const orderFn = dir === "asc" ? asc : desc;

  const conds = [];
  if (bw) conds.push(bw);
  if (governorate) conds.push(eq(patientsTable.governorate, governorate));
  if (insuranceType) conds.push(eq(patientsTable.insuranceType, insuranceType));
  if (search) {
    conds.push(or(
      ilike(patientsTable.firstName, `%${search}%`),
      ilike(patientsTable.firstNameAr, `%${search}%`),
      ilike(patientsTable.lastName, `%${search}%`),
      ilike(patientsTable.lastNameAr, `%${search}%`),
      ilike(patientsTable.phone, `%${search}%`),
      ilike(patientsTable.nationalId, `%${search}%`),
      ilike(patientsTable.governorate, `%${search}%`),
      ilike(patientsTable.city, `%${search}%`),
    ));
  }
  let query = db.select().from(patientsTable).$dynamic();
  if (conds.length) query = query.where(and(...conds));
  const rows = await query.orderBy(orderFn(orderCol)).limit(500);
  res.json(rows);
});

router.get("/patients/export.xlsx", async (req, res): Promise<void> => {
  const bw = branchWhere(req, patientsTable.branchId);
  let query = db.select().from(patientsTable).$dynamic();
  if (bw) query = query.where(bw);
  const rows = await query.orderBy(desc(patientsTable.createdAt)).limit(10000);
  await sendExcel(res, "patients.xlsx", "Patients", [
    { header: "ID", key: "id" },
    { header: "First Name", key: "firstName" },
    { header: "Last Name", key: "lastName" },
    { header: "National ID", key: "nationalId" },
    { header: "Governorate", key: "governorate" },
    { header: "City", key: "city" },
    { header: "Phone", key: "phone" },
    { header: "Insurance", key: "insuranceType" },
    { header: "Insurance #", key: "insuranceNumber" },
    { header: "Blood Type", key: "bloodType" },
    { header: "DOB", key: "dateOfBirth" },
  ], rows as Record<string, unknown>[]);
});

/** Lookup patient by QR token (staff scan screen). */
router.get("/patients/scan/:token", async (req, res): Promise<void> => {
  const token = String(req.params.token || "").trim();
  if (!token) { res.status(400).json({ error: "missing_token" }); return; }
  const bw = branchWhere(req, patientsTable.branchId);
  const [patient] = await db.select().from(patientsTable)
    .where(bw ? and(eq(patientsTable.qrToken, token), bw) : eq(patientsTable.qrToken, token))
    .limit(1);
  if (!patient) { res.status(404).json({ error: "patient_not_found" }); return; }
  res.json(patient);
});

/** Assign QR tokens to patients created before this feature. */
router.post("/patients/backfill-qr-tokens", async (req, res): Promise<void> => {
  const bw = branchWhere(req, patientsTable.branchId);
  const rows = await db.select().from(patientsTable)
    .where(bw ? and(isNull(patientsTable.qrToken), bw) : isNull(patientsTable.qrToken));
  let updated = 0;
  for (const p of rows) {
    await db.update(patientsTable).set({ qrToken: newQrToken() }).where(eq(patientsTable.id, p.id));
    updated++;
  }
  res.json({ updated });
});

router.post("/patients", async (req, res): Promise<void> => {
  const parsed = PatientInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [patient] = await db.insert(patientsTable).values({ ...parsed.data, qrToken: newQrToken() } as any).returning();
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

router.delete("/patients/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [patient] = await db.delete(patientsTable).where(eq(patientsTable.id, id)).returning();
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
  res.sendStatus(204);
});

export default router;
