import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, branchesTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

function requireAdmin(req: Request, res: Response): boolean {
  if ((req.session as any).role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

const BranchInput = z.object({
  name: z.string().min(1).optional(),
  nameAr: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  addressAr: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  manager: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Branches are readable by any logged-in user (for branch picker dropdowns),
// but only admins can create/update/delete.
router.get("/branches", async (_req, res): Promise<void> => {
  const rows = await db.select().from(branchesTable).orderBy(branchesTable.id);
  res.json(rows);
});

// Admin-only: set or clear the per-session branch override.
// Body: { branchId: number | null }  (null clears the override)
router.post("/branches/select-override", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const raw = (req.body as { branchId?: unknown })?.branchId;
  const s = req.session as any;
  if (raw === null) {
    s.branchOverride = null;
    res.json({ branchOverride: null });
    return;
  }
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    res.status(400).json({ error: "branchId must be a positive integer or null" });
    return;
  }
  const [b] = await db.select().from(branchesTable).where(eq(branchesTable.id, n));
  if (!b) { res.status(404).json({ error: "Branch not found" }); return; }
  s.branchOverride = n;
  res.json({ branchOverride: n });
});

router.post("/branches", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const parsed = BranchInput.safeParse(req.body);
  if (!parsed.success || !parsed.data.name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const [b] = await db.insert(branchesTable).values({
    name: parsed.data.name,
    nameAr: parsed.data.nameAr ?? null,
    address: parsed.data.address ?? null,
    addressAr: parsed.data.addressAr ?? null,
    phone: parsed.data.phone ?? null,
    manager: parsed.data.manager ?? null,
    isActive: parsed.data.isActive ?? true,
  }).returning();
  res.status(201).json(b);
});

router.patch("/branches/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = BranchInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [b] = await db.update(branchesTable).set(parsed.data).where(eq(branchesTable.id, id)).returning();
  if (!b) { res.status(404).json({ error: "Not found" }); return; }
  res.json(b);
});

router.delete("/branches/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(branchesTable).where(eq(branchesTable.id, id));
  res.status(204).send();
});

export default router;
