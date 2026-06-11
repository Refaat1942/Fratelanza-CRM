import { Router, type IRouter } from "express";
import { and, eq, or, ilike, sql, desc } from "drizzle-orm";
import {
  db,
  patientsTable,
  activityTable,
  visitsTable,
  prescriptionsTable,
  medicalAppointmentsTable,
  medicalInvoicesTable,
  employeesTable,
  medicineMasterTable,
} from "@workspace/db";
import { branchWhere } from "../../lib/branchScope";
import { z } from "zod";

const router: IRouter = Router();

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
  const [patient] = await db.insert(patientsTable).values(parsed.data as any).returning();
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

router.get("/patients/:id/history", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

  const [visits, prescriptions, appointments, invoices] = await Promise.all([
    db.select({
      id: visitsTable.id,
      visitDate: visitsTable.visitDate,
      chiefComplaint: visitsTable.chiefComplaint,
      chiefComplaintAr: visitsTable.chiefComplaintAr,
      diagnosis: visitsTable.diagnosis,
      diagnosisAr: visitsTable.diagnosisAr,
      treatment: visitsTable.treatment,
      treatmentAr: visitsTable.treatmentAr,
      materialsUsed: visitsTable.materialsUsed,
      materialsUsedAr: visitsTable.materialsUsedAr,
      toothNumber: visitsTable.toothNumber,
      followUpDate: visitsTable.followUpDate,
      notes: visitsTable.notes,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
    })
      .from(visitsTable)
      .leftJoin(employeesTable, eq(employeesTable.id, visitsTable.doctorId))
      .where(eq(visitsTable.patientId, id))
      .orderBy(desc(visitsTable.visitDate))
      .limit(100),
    db.select({
      id: prescriptionsTable.id,
      visitId: prescriptionsTable.visitId,
      medicineMasterId: prescriptionsTable.medicineMasterId,
      medicineName: prescriptionsTable.medicineName,
      medicineNameAr: prescriptionsTable.medicineNameAr,
      dosage: prescriptionsTable.dosage,
      frequency: prescriptionsTable.frequency,
      durationDays: prescriptionsTable.durationDays,
      instructions: prescriptionsTable.instructions,
      instructionsAr: prescriptionsTable.instructionsAr,
      createdAt: prescriptionsTable.createdAt,
      material: medicineMasterTable.material,
      bun: medicineMasterTable.bun,
      visitDate: visitsTable.visitDate,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
    })
      .from(prescriptionsTable)
      .innerJoin(visitsTable, eq(visitsTable.id, prescriptionsTable.visitId))
      .leftJoin(employeesTable, eq(employeesTable.id, visitsTable.doctorId))
      .leftJoin(medicineMasterTable, eq(medicineMasterTable.id, prescriptionsTable.medicineMasterId))
      .where(eq(visitsTable.patientId, id))
      .orderBy(desc(prescriptionsTable.createdAt))
      .limit(100),
    db.select({
      id: medicalAppointmentsTable.id,
      startAt: medicalAppointmentsTable.startAt,
      endAt: medicalAppointmentsTable.endAt,
      status: medicalAppointmentsTable.status,
      reason: medicalAppointmentsTable.reason,
      reasonAr: medicalAppointmentsTable.reasonAr,
      notes: medicalAppointmentsTable.notes,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
    })
      .from(medicalAppointmentsTable)
      .leftJoin(employeesTable, eq(employeesTable.id, medicalAppointmentsTable.doctorId))
      .where(eq(medicalAppointmentsTable.patientId, id))
      .orderBy(desc(medicalAppointmentsTable.startAt))
      .limit(100),
    db.select().from(medicalInvoicesTable)
      .where(eq(medicalInvoicesTable.patientId, id))
      .orderBy(desc(medicalInvoicesTable.invoiceDate))
      .limit(100),
  ]);

  res.json({ patient, visits, prescriptions, appointments, invoices });
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
