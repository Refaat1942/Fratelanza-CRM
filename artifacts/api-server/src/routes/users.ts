import { Router, type IRouter, type Request, type Response } from "express";
import { eq, ne } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
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

router.get("/users", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    displayName: usersTable.displayName,
    role: usersTable.role,
    permissions: usersTable.permissions,
    createdAt: usersTable.createdAt,
  }).from(usersTable);
  res.json(users);
});

const createSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(4),
  displayName: z.string().optional(),
  role: z.enum(["admin", "user"]).default("user"),
  permissions: z.array(z.string()).default([]),
});

router.post("/users", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() }); return; }
  const { username, password, displayName, role, permissions } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing.length > 0) { res.status(409).json({ error: "Username already exists" }); return; }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    username, passwordHash, displayName, role,
    permissions: JSON.stringify(permissions),
  }).returning({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, role: usersTable.role, permissions: usersTable.permissions });
  res.status(201).json(user);
});

const updateSchema = z.object({
  displayName: z.string().optional(),
  role: z.enum(["admin", "user"]).optional(),
  permissions: z.array(z.string()).optional(),
  password: z.string().min(4).optional(),
});

router.patch("/users/:id", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data" }); return; }
  const updates: Record<string, any> = { updatedAt: new Date() };
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;
  if (parsed.data.permissions !== undefined) updates.permissions = JSON.stringify(parsed.data.permissions);
  if (parsed.data.password) updates.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.update(usersTable).set(updates).where(eq(usersTable.id, id));
  const [user] = await db.select({
    id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName,
    role: usersTable.role, permissions: usersTable.permissions,
  }).from(usersTable).where(eq(usersTable.id, id));
  res.json(user);
});

router.delete("/users/:id", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  const selfId = (req.session as any).userId;
  if (id === selfId) { res.status(400).json({ error: "Cannot delete your own account" }); return; }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ ok: true });
});

export default router;
