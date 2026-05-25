import { Router, type IRouter } from "express";
import { eq, and, gte, lt, ne, sql, asc } from "drizzle-orm";
import { db, medicalAppointmentsTable, patientsTable, employeesTable } from "@workspace/db";
import { branchWhere } from "../../lib/branchScope";
import { isWithinAvailability } from "../../lib/availability";
import { z } from "zod";

const router: IRouter = Router();

const APPT_STATUSES = ["scheduled", "confirmed", "completed", "no_show", "cancelled"] as const;

const AppointmentInput = z.object({
  patientId: z.number().int().positive(),
  doctorId: z.number().int().positive().nullable().optional(),
  startAt: z.string(), // ISO datetime
  endAt: z.string().nullable().optional(),
  status: z.enum(APPT_STATUSES).default("scheduled"),
  reason: z.string().nullable().optional(),
  reasonAr: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  branchId: z.number().int().positive().nullable().optional(),
});

// Conflict detection: does the given doctor already have a non-cancelled appointment overlapping [start, end)?
async function hasConflict(
  doctorId: number,
  startAt: Date,
  endAt: Date,
  excludeId?: number,
): Promise<boolean> {
  const conditions = [
    eq(medicalAppointmentsTable.doctorId, doctorId),
    ne(medicalAppointmentsTable.status, "cancelled"),
    // overlap: existing.startAt < newEnd AND COALESCE(existing.endAt, existing.startAt + 30min) > newStart
    sql`${medicalAppointmentsTable.startAt} < ${endAt.toISOString()}::timestamptz`,
    sql`COALESCE(${medicalAppointmentsTable.endAt}, ${medicalAppointmentsTable.startAt} + interval '30 minutes') > ${startAt.toISOString()}::timestamptz`,
  ];
  if (excludeId !== undefined) conditions.push(ne(medicalAppointmentsTable.id, excludeId));
  const rows = await db
    .select({ id: medicalAppointmentsTable.id })
    .from(medicalAppointmentsTable)
    .where(and(...conditions))
    .limit(1);
  return rows.length > 0;
}

// Joined row for the list view: include patient + doctor names so frontend doesn't N+1.
async function listJoined(where?: any) {
  const q = db
    .select({
      id: medicalAppointmentsTable.id,
      patientId: medicalAppointmentsTable.patientId,
      doctorId: medicalAppointmentsTable.doctorId,
      startAt: medicalAppointmentsTable.startAt,
      endAt: medicalAppointmentsTable.endAt,
      status: medicalAppointmentsTable.status,
      reason: medicalAppointmentsTable.reason,
      reasonAr: medicalAppointmentsTable.reasonAr,
      notes: medicalAppointmentsTable.notes,
      patientFirstName: patientsTable.firstName,
      patientFirstNameAr: patientsTable.firstNameAr,
      patientLastName: patientsTable.lastName,
      patientLastNameAr: patientsTable.lastNameAr,
      patientPhone: patientsTable.phone,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
    })
    .from(medicalAppointmentsTable)
    .leftJoin(patientsTable, eq(medicalAppointmentsTable.patientId, patientsTable.id))
    .leftJoin(employeesTable, eq(medicalAppointmentsTable.doctorId, employeesTable.id))
    .$dynamic();
  return where ? await q.where(where).orderBy(asc(medicalAppointmentsTable.startAt)) : await q.orderBy(asc(medicalAppointmentsTable.startAt));
}

router.get("/appointments", async (req, res): Promise<void> => {
  const from = typeof req.query.from === "string" ? new Date(req.query.from) : null;
  const to = typeof req.query.to === "string" ? new Date(req.query.to) : null;
  let where: any = undefined;
  if (from && !isNaN(from.getTime()) && to && !isNaN(to.getTime())) {
    where = and(
      gte(medicalAppointmentsTable.startAt, from),
      lt(medicalAppointmentsTable.startAt, to),
    );
  }
  const bw = branchWhere(req, medicalAppointmentsTable.branchId);
  if (bw) where = where ? and(where, bw) : bw;
  const rows = await listJoined(where);
  res.json(rows);
});

router.get("/appointments/upcoming", async (_req, res): Promise<void> => {
  const rows = await listJoined(gte(medicalAppointmentsTable.startAt, new Date()));
  res.json(rows.slice(0, 50));
});

router.post("/appointments", async (req, res): Promise<void> => {
  const parsed = AppointmentInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const startAt = new Date(parsed.data.startAt);
  if (isNaN(startAt.getTime())) { res.status(400).json({ error: "Invalid startAt" }); return; }
  let endAt: Date;
  if (parsed.data.endAt) {
    endAt = new Date(parsed.data.endAt);
    if (isNaN(endAt.getTime()) || endAt <= startAt) { res.status(400).json({ error: "Invalid endAt" }); return; }
  } else {
    endAt = new Date(startAt.getTime() + 30 * 60 * 1000); // default 30 min
  }
  if (parsed.data.doctorId) {
    if (!(await isWithinAvailability(parsed.data.doctorId, startAt, endAt))) {
      res.status(409).json({ error: "outside_hours", message: "Appointment is outside the doctor's availability window" });
      return;
    }
    if (await hasConflict(parsed.data.doctorId, startAt, endAt)) {
      res.status(409).json({ error: "doctor_conflict", message: "Doctor already has an overlapping appointment" });
      return;
    }
  }
  const [appt] = await db.insert(medicalAppointmentsTable).values({
    patientId: parsed.data.patientId,
    doctorId: parsed.data.doctorId ?? null,
    startAt,
    endAt,
    status: parsed.data.status,
    reason: parsed.data.reason ?? null,
    reasonAr: parsed.data.reasonAr ?? null,
    notes: parsed.data.notes ?? null,
    branchId: parsed.data.branchId ?? null,
  }).returning();
  res.status(201).json(appt);
});

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const UpdateInput = AppointmentInput.partial();
  const parsed = UpdateInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const update: any = { ...parsed.data };
  if (parsed.data.startAt) update.startAt = new Date(parsed.data.startAt);
  if (parsed.data.endAt) update.endAt = new Date(parsed.data.endAt);

  // If rescheduling or changing doctor, check conflicts.
  if (update.startAt || update.endAt || parsed.data.doctorId !== undefined) {
    const [existing] = await db.select().from(medicalAppointmentsTable).where(eq(medicalAppointmentsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Appointment not found" }); return; }
    const newStart: Date = update.startAt ?? existing.startAt;
    const newEnd: Date = update.endAt ?? existing.endAt ?? new Date(newStart.getTime() + 30 * 60 * 1000);
    const newDoctor = parsed.data.doctorId !== undefined ? parsed.data.doctorId : existing.doctorId;
    const newStatus = parsed.data.status ?? existing.status;
    if (newDoctor && newStatus !== "cancelled") {
      if (!(await isWithinAvailability(newDoctor, newStart, newEnd))) {
        res.status(409).json({ error: "outside_hours" });
        return;
      }
      if (await hasConflict(newDoctor, newStart, newEnd, id)) {
        res.status(409).json({ error: "doctor_conflict" });
        return;
      }
    }
  }

  const [appt] = await db
    .update(medicalAppointmentsTable)
    .set(update)
    .where(eq(medicalAppointmentsTable.id, id))
    .returning();
  if (!appt) { res.status(404).json({ error: "Appointment not found" }); return; }
  res.json(appt);
});

router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [appt] = await db.delete(medicalAppointmentsTable).where(eq(medicalAppointmentsTable.id, id)).returning();
  if (!appt) { res.status(404).json({ error: "Appointment not found" }); return; }
  res.sendStatus(204);
});

export default router;
