import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";

const router: IRouter = Router();

const ALL_PERMISSIONS = ["dashboard","tasks","crm","finance","team","products","rentals","suppliers","purchase_orders","invoicing","reports","notifications","settings"];

// Default seed password — used to detect first-login + force a change.
const DEFAULT_ADMIN_PASSWORD = "admin123";

async function ensureAdminExists() {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, "admin"));
  if (!existing) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD, 10);
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

// ----- Brute-force protection: max 10 login attempts per IP per 10 minutes.
// On exceed, returns 429 for the rest of the window. Disabled in tests.
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait 10 minutes and try again." },
  skip: () => process.env.NODE_ENV === "test",
});

router.post("/auth/login", loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const ua = req.get("user-agent") || "";
  const log = (req as any).log;

  if (!username || !password) {
    log?.warn({ ip, username, ua }, "login_missing_fields");
    res.status(400).json({ error: "Username and password required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    // Audit log: failed login attempt
    log?.warn({ ip, username, ua, event: "login_failed" }, "login_failed");
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (user.isActive === false) {
    log?.warn({ ip, username, ua, event: "login_blocked" }, "login_blocked_account");
    res.status(403).json({ error: "Account is blocked. Contact your administrator." });
    return;
  }

  // Force password change for default admin who still has the seed password.
  const mustChangePassword =
    user.username === "admin" && password === DEFAULT_ADMIN_PASSWORD;

  const permissions: string[] = user.role === "admin" ? ALL_PERMISSIONS : (JSON.parse(user.permissions || "[]") as string[]);
  (req.session as any).userId = user.id;
  (req.session as any).username = user.username;
  (req.session as any).role = user.role;
  (req.session as any).permissions = permissions;
  (req.session as any).branchId = (user as any).branchId ?? null;
  (req.session as any).mustChangePassword = mustChangePassword;

  log?.info({ ip, username, ua, event: "login_success", mustChangePassword }, "login_success");

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    permissions,
    branchId: (user as any).branchId ?? null,
    mustChangePassword,
  });
});

router.post("/auth/logout", (req: Request, res: Response): void => {
  req.session.destroy(() => {});
  res.json({ ok: true });
});

router.get("/auth/me", (req: Request, res: Response): void => {
  const s = req.session as any;
  if (!s.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const permissions: string[] = s.role === "admin" ? ALL_PERMISSIONS : (s.permissions || []);
  res.json({
    id: s.userId,
    username: s.username,
    role: s.role,
    permissions,
    branchId: s.branchId ?? null,
    mustChangePassword: !!s.mustChangePassword,
  });
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
  if (!newPassword || String(newPassword).length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters." }); return;
  }
  if (newPassword === DEFAULT_ADMIN_PASSWORD) {
    res.status(400).json({ error: "Please choose a different password from the default." }); return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, s.userId));
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    res.status(401).json({ error: "Current password is incorrect" }); return;
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash, updatedAt: new Date() }).where(eq(usersTable.id, s.userId));
  // Clear the force-change flag now that the password has been changed.
  s.mustChangePassword = false;
  (req as any).log?.info({ userId: s.userId, username: s.username, event: "password_changed" }, "password_changed");
  res.json({ ok: true });
});

export default router;
