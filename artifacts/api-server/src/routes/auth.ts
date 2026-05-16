import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

async function ensureAdminExists() {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, "admin"));
  if (!existing) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);
    await db.insert(usersTable).values({ username: "admin", passwordHash, role: "admin", displayName: "Administrator" });
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
  (req.session as any).userId = user.id;
  (req.session as any).username = user.username;
  (req.session as any).role = user.role;
  res.json({ id: user.id, username: user.username, displayName: user.displayName, role: user.role });
});

router.post("/auth/logout", (req: Request, res: Response): void => {
  req.session.destroy(() => {});
  res.json({ ok: true });
});

router.get("/auth/me", (req: Request, res: Response): void => {
  const s = req.session as any;
  if (!s.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  res.json({ id: s.userId, username: s.username, role: s.role });
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
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, s.userId));
  res.json({ ok: true });
});

export default router;
