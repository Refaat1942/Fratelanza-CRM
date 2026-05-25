import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, clinicStaffTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

// Only admin or manager may mutate the clinic roster. Read access is granted
// to anyone with `medical` permission (gated upstream in routes/index.ts).
function requireRoster(req: Request, res: Response, next: NextFunction): void {
  const role = (req.session as any)?.user?.role;
  if (role === "admin" || role === "manager") { next(); return; }
  res.status(403).json({ error: "forbidden" });
}

const ROLES = ["doctor", "nurse", "assistant", "receptionist", "technician", "other"] as const;

const StaffInput = z.object({
  name: z.string().trim().max(120).nullable().optional(),
  nameAr: z.string().trim().max(120).nullable().optional(),
  role: z.enum(ROLES).default("doctor"),
  specialty: z.string().trim().max(120).nullable().optional(),
  specialtyAr: z.string().trim().max(120).nullable().optional(),
  licenseNumber: z.string().trim().max(80).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().max(160).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  active: z.boolean().default(true),
}).refine(d => (d.name && d.name.trim()) || (d.nameAr && d.nameAr.trim()), {
  message: "Name (EN or AR) is required",
});

router.get("/clinic-staff", async (_req: Request, res: Response) => {
  const rows = await db.select().from(clinicStaffTable).orderBy(desc(clinicStaffTable.active), clinicStaffTable.role, clinicStaffTable.name);
  res.json(rows);
});

router.post("/clinic-staff", requireRoster, async (req: Request, res: Response): Promise<void> => {
  const parsed = StaffInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_input", issues: parsed.error.issues }); return; }
  const [row] = await db.insert(clinicStaffTable).values({
    name: parsed.data.name ?? null,
    nameAr: parsed.data.nameAr ?? null,
    role: parsed.data.role,
    specialty: parsed.data.specialty ?? null,
    specialtyAr: parsed.data.specialtyAr ?? null,
    licenseNumber: parsed.data.licenseNumber ?? null,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email ?? null,
    notes: parsed.data.notes ?? null,
    active: parsed.data.active,
  }).returning();
  res.status(201).json(row);
});

router.put("/clinic-staff/:id", requireRoster, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "invalid_id" }); return; }
  const parsed = StaffInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_input", issues: parsed.error.issues }); return; }
  const [row] = await db.update(clinicStaffTable).set({
    name: parsed.data.name ?? null,
    nameAr: parsed.data.nameAr ?? null,
    role: parsed.data.role,
    specialty: parsed.data.specialty ?? null,
    specialtyAr: parsed.data.specialtyAr ?? null,
    licenseNumber: parsed.data.licenseNumber ?? null,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email ?? null,
    notes: parsed.data.notes ?? null,
    active: parsed.data.active,
  }).where(eq(clinicStaffTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not_found" }); return; }
  res.json(row);
});

router.delete("/clinic-staff/:id", requireRoster, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "invalid_id" }); return; }
  await db.delete(clinicStaffTable).where(eq(clinicStaffTable.id, id));
  res.status(204).end();
});

export default router;
