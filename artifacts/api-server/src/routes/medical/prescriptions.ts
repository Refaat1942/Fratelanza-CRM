import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  db,
  prescriptionsTable,
  visitsTable,
  patientsTable,
  employeesTable,
  medicineMasterTable,
  clinicStaffTable,
} from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const PrescriptionShape = z.object({
  visitId: z.number().int().positive(),
  medicineMasterId: z.number().int().positive().nullable().optional(),
  medicineName: z.string().trim().optional(),
  medicineNameAr: z.string().nullable().optional(),
  dosage: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  durationDays: z.number().int().positive().nullable().optional(),
  instructions: z.string().nullable().optional(),
  instructionsAr: z.string().nullable().optional(),
});
const PrescriptionInput = PrescriptionShape.refine(d => !!d.medicineMasterId || !!d.medicineName?.trim(), {
  message: "medicineMasterId or medicineName is required",
  path: ["medicineName"],
});
const PrescriptionUpdateInput = PrescriptionShape.partial();

async function buildPrescriptionValues(input: z.infer<typeof PrescriptionUpdateInput>, requireMedicine: boolean) {
  const values: Record<string, unknown> = { ...input };
  if (input.medicineMasterId) {
    const [medicine] = await db.select().from(medicineMasterTable).where(eq(medicineMasterTable.id, input.medicineMasterId));
    if (!medicine) throw new Error("medicine_not_found");
    values.medicineName = medicine.materialDescription;
  } else if (requireMedicine && !input.medicineName?.trim()) {
    throw new Error("medicine_required");
  }
  if (typeof values.medicineName === "string") values.medicineName = values.medicineName.trim();
  return values;
}

// List — joins visit + patient for display. Optional ?patient=&visit= filters.
router.get("/prescriptions", async (req: Request, res: Response): Promise<void> => {
  const patientId = req.query.patient ? Number(req.query.patient) : null;
  const visitId = req.query.visit ? Number(req.query.visit) : null;
  const whereParts: any[] = [];
  if (visitId && Number.isFinite(visitId)) whereParts.push(eq(prescriptionsTable.visitId, visitId));
  if (patientId && Number.isFinite(patientId)) whereParts.push(eq(visitsTable.patientId, patientId));

  const rows = await db
    .select({
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
      patientId: visitsTable.patientId,
      visitDate: visitsTable.visitDate,
      patientFirstName: patientsTable.firstName,
      patientFirstNameAr: patientsTable.firstNameAr,
      patientLastName: patientsTable.lastName,
      patientLastNameAr: patientsTable.lastNameAr,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
      medicineMaterial: medicineMasterTable.material,
      medicineBun: medicineMasterTable.bun,
      doctorPrescriptionTemplateUrl: clinicStaffTable.prescriptionTemplateUrl,
      doctorPrescriptionHeader: clinicStaffTable.prescriptionHeader,
      doctorPrescriptionHeaderAr: clinicStaffTable.prescriptionHeaderAr,
      doctorPrescriptionFooter: clinicStaffTable.prescriptionFooter,
      doctorPrescriptionFooterAr: clinicStaffTable.prescriptionFooterAr,
    })
    .from(prescriptionsTable)
    .leftJoin(visitsTable, eq(visitsTable.id, prescriptionsTable.visitId))
    .leftJoin(patientsTable, eq(patientsTable.id, visitsTable.patientId))
    .leftJoin(employeesTable, eq(employeesTable.id, visitsTable.doctorId))
    .leftJoin(medicineMasterTable, eq(medicineMasterTable.id, prescriptionsTable.medicineMasterId))
    .leftJoin(clinicStaffTable, sql`lower(coalesce(${clinicStaffTable.name}, '')) = lower(coalesce(${employeesTable.name}, '')) and ${clinicStaffTable.role} = 'doctor'`)
    .where(whereParts.length ? and(...whereParts) : undefined)
    .orderBy(desc(prescriptionsTable.createdAt))
    .limit(500);
  res.json(rows);
});

router.post("/prescriptions", async (req: Request, res: Response): Promise<void> => {
  const parsed = PrescriptionInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  // Make sure the visit exists so we don't end up with orphan prescriptions.
  const [v] = await db.select({ id: visitsTable.id }).from(visitsTable).where(eq(visitsTable.id, parsed.data.visitId));
  if (!v) { res.status(400).json({ error: "visit_not_found" }); return; }
  let values: Record<string, unknown>;
  try {
    values = await buildPrescriptionValues(parsed.data, true);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "invalid_medicine" });
    return;
  }
  const [row] = await db.insert(prescriptionsTable).values(values as any).returning();
  res.status(201).json(row);
});

router.patch("/prescriptions/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = PrescriptionUpdateInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  let values: Record<string, unknown>;
  try {
    values = await buildPrescriptionValues(parsed.data, false);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "invalid_medicine" });
    return;
  }
  const [row] = await db.update(prescriptionsTable).set(values as any).where(eq(prescriptionsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/prescriptions/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.delete(prescriptionsTable).where(eq(prescriptionsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

// Quick stats for the page header
router.get("/prescriptions-stats", async (_req: Request, res: Response): Promise<void> => {
  const [counts] = await db.execute<{ total: string; last7: string; last30: string }>(
    sql`SELECT
      COUNT(*)::text AS total,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS last7,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS last30
    FROM prescriptions`
  ) as unknown as [{ total: string; last7: string; last30: string }];
  res.json({
    total: Number(counts?.total ?? 0),
    last7: Number(counts?.last7 ?? 0),
    last30: Number(counts?.last30 ?? 0),
  });
});

export default router;
