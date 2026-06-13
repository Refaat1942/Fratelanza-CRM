import { Router, type IRouter, type Request, type Response } from "express";
import { eq, ne } from "drizzle-orm";
import {
  db,
  usersTable,
  getCurrentTenant,
  filterPermissionsForTenant,
  normalizePermissionList,
  ROLE_PERMISSION_PRESETS,
} from "@workspace/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const router: IRouter = Router();

function requireAdmin(req: Request, res: Response): boolean {
  if ((req.session as any).role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

function sanitizePermissions(raw: unknown): string[] {
  const tenant = getCurrentTenant();
  const normalized = normalizePermissionList(raw);
  return filterPermissionsForTenant(normalized, tenant?.features ?? null);
}

router.get("/users", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    displayName: usersTable.displayName,
    role: usersTable.role,
    permissions: usersTable.permissions,
    isActive: usersTable.isActive,
    branchId: usersTable.branchId,
    createdAt: usersTable.createdAt,
  }).from(usersTable);
  res.json(users);
});

const ROLE_VALUES = ["admin", "manager", "doctor", "receptionist", "accountant", "assistant", "user"] as const;

const createSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(4),
  displayName: z.string().optional(),
  role: z.enum(ROLE_VALUES).default("user"),
  permissions: z.array(z.string()).optional(),
  branchId: z.number().int().nullable().optional(),
});

router.post("/users", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() }); return; }
  const { username, password, displayName, role, branchId } = parsed.data;
  const preset = ROLE_PERMISSION_PRESETS[role] ?? ROLE_PERMISSION_PRESETS.user!;
  const permissions = sanitizePermissions(parsed.data.permissions ?? preset);
  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing.length > 0) { res.status(409).json({ error: "Username already exists" }); return; }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    username, passwordHash, displayName, role,
    permissions: JSON.stringify(permissions),
    branchId: branchId ?? null,
  }).returning({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, role: usersTable.role, permissions: usersTable.permissions, branchId: usersTable.branchId });
  res.status(201).json(user);
});

const updateSchema = z.object({
  displayName: z.string().optional(),
  role: z.enum(ROLE_VALUES).optional(),
  permissions: z.array(z.string()).optional(),
  password: z.string().min(4).optional(),
  isActive: z.boolean().optional(),
  branchId: z.number().int().nullable().optional(),
});

router.patch("/users/:id", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data" }); return; }
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;
  if (parsed.data.permissions !== undefined) {
    updates.permissions = JSON.stringify(sanitizePermissions(parsed.data.permissions));
  }
  if (parsed.data.password) updates.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;
  if (parsed.data.branchId !== undefined) updates.branchId = parsed.data.branchId;
  await db.update(usersTable).set(updates).where(eq(usersTable.id, id));
  const [user] = await db.select({
    id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName,
    role: usersTable.role, permissions: usersTable.permissions, isActive: usersTable.isActive,
    branchId: usersTable.branchId,
  }).from(usersTable).where(eq(usersTable.id, id));
  res.json(user);
});

router.delete("/users/:id", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const id = parseInt(String(req.params.id));
  const selfId = (req.session as any).userId;
  if (id === selfId) { res.status(400).json({ error: "Cannot delete your own account" }); return; }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ ok: true });
});

export default router;
