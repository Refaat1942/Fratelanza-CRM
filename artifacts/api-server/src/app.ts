import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import path from "path";
import session from "express-session";
import router from "./routes";
import { tenantMiddleware } from "./middleware/tenant";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", true);

// ----- Session secret hard-fail -----
// In production, refuse to boot with the default secret. Forged session
// cookies are a real risk if the secret leaks or is left at the default.
const SESSION_SECRET = process.env.SESSION_SECRET;
const isProd = process.env.NODE_ENV === "production";
if (isProd && (!SESSION_SECRET || SESSION_SECRET === "fratelanza-secret-key" || SESSION_SECRET.length < 32)) {
  logger.error("SESSION_SECRET must be set to a strong random value (32+ chars) in production");
  process.exit(1);
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);

// ----- Helmet security headers -----
// CSP is intentionally not set here: the frontend is a Vite SPA whose CSP is
// managed by the static host / reverse proxy. Helmet still applies safe
// defaults for X-Frame-Options, Referrer-Policy, X-Content-Type-Options, etc.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

app.use(cors({ credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use(session({
  secret: SESSION_SECRET || "fratelanza-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,           // Require HTTPS in production
    httpOnly: true,           // Block JS access (XSS defense)
    sameSite: "lax",          // CSRF defense for cross-site form submits
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use("/api", tenantMiddleware);

const PUBLIC_PATHS = ["/api/auth/login", "/api/healthz", "/api/branding/public", "/api/public/patient/"];

// Paths still allowed when the user must change their password.
// Everything else is blocked until the default password is rotated.
const MUST_CHANGE_ALLOWED = [
  "/api/auth/me",
  "/api/auth/change-password",
  "/api/auth/logout",
  "/api/healthz",
];

app.use((req: Request, res: Response, next: NextFunction) => {
  if (PUBLIC_PATHS.some(p => req.path.startsWith(p))) return next();
  if (req.path.startsWith("/api/")) {
    const s = req.session as any;
    if (!s.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    // Server-side enforcement of force-change-password (UI is a hint, this is the lock).
    if (s.mustChangePassword && !MUST_CHANGE_ALLOWED.some(p => req.path.startsWith(p))) {
      res.status(403).json({ error: "password_change_required" });
      return;
    }
  }
  next();
});

// Serve uploaded files (rental docs, tenant logos) statically.
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadDir));

app.use("/api", router);

if (process.env.STATIC_DIR) {
  const staticDir = process.env.STATIC_DIR;
  app.use(express.static(staticDir));
  app.get("/{*splat}", (_req, res) => { res.sendFile(path.join(staticDir, "index.html")); });
}

// ----- Global error handler -----
// Never leak stack traces or error internals to clients in production.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const id = (req as any).id;
  (req as any).log?.error({ err, id }, "Unhandled request error");
  if (res.headersSent) return;
  res.status(500).json({ error: "internal_error", requestId: id });
});

export default app;
