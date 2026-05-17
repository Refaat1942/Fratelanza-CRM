import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

const ALL_PERMISSIONS = ["dashboard","tasks","crm","finance","team","products","rentals","suppliers","purchase_orders","reports","notifications","settings"];

async function ensureAdminExists() {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, "admin"));
  if (!existing) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);
    await db.insert(usersTable).values({
      username: "admin",
      passwordHash,
      role: "admin",
      displayName: "Administrator",
      permissions: JSON.stringify(ALL_PERMISSIONS),
    });
  } else if (existing.role !== "admin") {
    await db.update(usersTable).set({ role: "admin", permissions: JSON.stringify(ALL_PERMISSIONS) }).where(eq(usersTable.username, "admin"));
  }
}
ensureAdminExists().catch(() => {});

router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) { res.status(400).json({ error: "Username and password required" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" }); return;
  }
  if (user.isActive === false) {
    res.status(403).json({ error: "Account is blocked. Contact your administrator." }); return;
  }
  const permissions: string[] = user.role === "admin" ? ALL_PERMISSIONS : (JSON.parse(user.permissions || "[]") as string[]);
  (req.session as any).userId = user.id;
  (req.session as any).username = user.username;
  (req.session as any).role = user.role;
  (req.session as any).permissions = permissions;
  res.json({ id: user.id, username: user.username, displayName: user.displayName, role: user.role, permissions });
});

router.post("/auth/logout", (req: Request, res: Response): void => {
  req.session.destroy(() => {});
  res.json({ ok: true });
});

router.get("/auth/me", (req: Request, res: Response): void => {
  const s = req.session as any;
  if (!s.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const permissions: string[] = s.role === "admin" ? ALL_PERMISSIONS : (s.permissions || []);
  res.json({ id: s.userId, username: s.username, role: s.role, permissions });
});

router.post("/auth/verify-password", async (req: Request, res: Response): Promise<void> => {
  const s = req.session as any;
  if (!s.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { password } = req.body;
  if (!password) { res.status(400).json({ error: "Password required" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, s.userId));
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Incorrect password" }); return;
  }
  res.json({ ok: true });
});

router.post("/auth/change-password", async (req: Request, res: Response): Promise<void> => {
  const s = req.session as any;
  if (!s.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { currentPassword, newPassword } = req.body;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, s.userId));
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    res.status(401).json({ error: "Current password is incorrect" }); return;
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash, updatedAt: new Date() }).where(eq(usersTable.id, s.userId));
  res.json({ ok: true });
});

export default router;
