import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  db,
  prescriptionsTable,
  visitsTable,
  patientsTable,
  employeesTable,
  medicineMasterTable,
} from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const PrescriptionBase = z.object({
  visitId: z.number().int().positive(),
  medicineMasterId: z.number().int().positive().nullable().optional(),
  medicineName: z.string().nullable().optional(),
  medicineNameAr: z.string().nullable().optional(),
  dosage: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  durationDays: z.number().int().positive().nullable().optional(),
  instructions: z.string().nullable().optional(),
  instructionsAr: z.string().nullable().optional(),
});
const PrescriptionInput = PrescriptionBase.refine(d => !!d.medicineMasterId || !!d.medicineName?.trim(), {
  message: "medicineName or medicineMasterId is required",
  path: ["medicineName"],
});

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
      medicineMaterial: prescriptionsTable.medicineMaterial,
      medicineUnit: prescriptionsTable.medicineUnit,
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
      doctorId: visitsTable.doctorId,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
    })
    .from(prescriptionsTable)
    .leftJoin(visitsTable, eq(visitsTable.id, prescriptionsTable.visitId))
    .leftJoin(patientsTable, eq(patientsTable.id, visitsTable.patientId))
    .leftJoin(employeesTable, eq(employeesTable.id, visitsTable.doctorId))
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
  const values: typeof prescriptionsTable.$inferInsert = {
    visitId: parsed.data.visitId,
    medicineName: parsed.data.medicineName?.trim() || "",
    medicineNameAr: parsed.data.medicineNameAr || null,
    dosage: parsed.data.dosage || null,
    frequency: parsed.data.frequency || null,
    durationDays: parsed.data.durationDays ?? null,
    instructions: parsed.data.instructions || null,
    instructionsAr: parsed.data.instructionsAr || null,
  };
  if (parsed.data.medicineMasterId) {
    const [master] = await db
      .select()
      .from(medicineMasterTable)
      .where(eq(medicineMasterTable.id, parsed.data.medicineMasterId));
    if (!master) { res.status(400).json({ error: "medicine_not_found" }); return; }
    values.medicineMasterId = master.id;
    values.medicineMaterial = master.material;
    values.medicineUnit = master.bun || null;
    values.medicineName = master.materialDescription;
  }
  const [row] = await db.insert(prescriptionsTable).values(values).returning();
  res.status(201).json(row);
});

router.patch("/prescriptions/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = PrescriptionBase.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates: Partial<typeof prescriptionsTable.$inferInsert> = { ...parsed.data } as any;
  if (parsed.data.medicineMasterId) {
    const [master] = await db
      .select()
      .from(medicineMasterTable)
      .where(eq(medicineMasterTable.id, parsed.data.medicineMasterId));
    if (!master) { res.status(400).json({ error: "medicine_not_found" }); return; }
    updates.medicineMasterId = master.id;
    updates.medicineMaterial = master.material;
    updates.medicineUnit = master.bun || null;
    updates.medicineName = master.materialDescription;
  } else if (parsed.data.medicineMasterId === null) {
    updates.medicineMasterId = null;
    updates.medicineMaterial = null;
    updates.medicineUnit = null;
  }
  const [row] = await db.update(prescriptionsTable).set(updates).where(eq(prescriptionsTable.id, id)).returning();
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
