import { Router, type IRouter } from "express";
import { eq, and, asc } from "drizzle-orm";
import { db, doctorAvailabilityTable, employeesTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const InputBase = z.object({
  doctorId: z.number().int().positive(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(HHMM, "Expected HH:MM"),
  endTime: z.string().regex(HHMM, "Expected HH:MM"),
  branchId: z.number().int().positive().nullable().optional(),
});
const Input = InputBase.refine((v) => v.endTime > v.startTime, { message: "endTime must be after startTime", path: ["endTime"] });

// List all availability windows, optionally filtered by doctor.
router.get("/doctor-availability", async (req, res): Promise<void> => {
  const doctorId = req.query.doctorId ? parseInt(String(req.query.doctorId), 10) : null;
  const rows = await db
    .select({
      id: doctorAvailabilityTable.id,
      doctorId: doctorAvailabilityTable.doctorId,
      dayOfWeek: doctorAvailabilityTable.dayOfWeek,
      startTime: doctorAvailabilityTable.startTime,
      endTime: doctorAvailabilityTable.endTime,
      branchId: doctorAvailabilityTable.branchId,
      createdAt: doctorAvailabilityTable.createdAt,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
    })
    .from(doctorAvailabilityTable)
    .leftJoin(employeesTable, eq(doctorAvailabilityTable.doctorId, employeesTable.id))
    .where(doctorId && Number.isFinite(doctorId) ? eq(doctorAvailabilityTable.doctorId, doctorId) : undefined)
    .orderBy(asc(doctorAvailabilityTable.doctorId), asc(doctorAvailabilityTable.dayOfWeek), asc(doctorAvailabilityTable.startTime));
  res.json(rows);
});

router.post("/doctor-availability", async (req, res): Promise<void> => {
  const parsed = Input.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(doctorAvailabilityTable).values({
    doctorId: parsed.data.doctorId,
    dayOfWeek: parsed.data.dayOfWeek,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    branchId: parsed.data.branchId ?? null,
  }).returning();
  res.status(201).json(row);
});

router.patch("/doctor-availability/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = InputBase.partial().safeParse(req.body);
  if (parsed.success && parsed.data.startTime && parsed.data.endTime && parsed.data.endTime <= parsed.data.startTime) {
    res.status(400).json({ error: "endTime must be after startTime" }); return;
  }
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(doctorAvailabilityTable).set(parsed.data).where(eq(doctorAvailabilityTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/doctor-availability/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.delete(doctorAvailabilityTable).where(eq(doctorAvailabilityTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

// Bulk replace all windows for a doctor on a day (handy for the grid editor).
router.put("/doctor-availability/bulk", async (req, res): Promise<void> => {
  const BulkInput = z.object({
    doctorId: z.number().int().positive(),
    dayOfWeek: z.number().int().min(0).max(6),
    windows: z.array(z.object({
      startTime: z.string().regex(HHMM),
      endTime: z.string().regex(HHMM),
      branchId: z.number().int().positive().nullable().optional(),
    })),
  });
  const parsed = BulkInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  for (const w of parsed.data.windows) {
    if (w.endTime <= w.startTime) { res.status(400).json({ error: "endTime must be after startTime" }); return; }
  }
  await db.delete(doctorAvailabilityTable).where(and(
    eq(doctorAvailabilityTable.doctorId, parsed.data.doctorId),
    eq(doctorAvailabilityTable.dayOfWeek, parsed.data.dayOfWeek),
  ));
  if (parsed.data.windows.length > 0) {
    await db.insert(doctorAvailabilityTable).values(parsed.data.windows.map((w) => ({
      doctorId: parsed.data.doctorId,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: w.startTime,
      endTime: w.endTime,
      branchId: w.branchId ?? null,
    })));
  }
  res.sendStatus(204);
});

export default router;
