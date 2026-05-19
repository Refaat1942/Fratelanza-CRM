import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  pool,
  initSchema,
  seedAdmin,
  FEATURE_KEYS,
  FEATURE_LABELS,
  defaultFeatures,
  type FeatureKey,
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
  }
}

const PORT = Number(process.env.PORT || 5050);
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

async function main() {
  await initSchema();
  await seedAdmin(ADMIN_USERNAME, await bcrypt.hash(ADMIN_PASSWORD, 10));

  const app = express();
  app.set("view engine", "ejs");
  app.set("views", path.resolve(__dirname, "../views"));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  const PgStore = connectPgSimple(session);
  app.use(
    session({
      store: new PgStore({ pool, tableName: "admin_session", createTableIfMissing: false }),
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 24 * 7 },
    }),
  );

  // Locals available to all templates
  app.use((req, res, next) => {
    res.locals.username = req.session.username;
    res.locals.currentPath = req.path;
    next();
  });

  function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) {
      return res.redirect("/login");
    }
    next();
  }

  // ----- Auth -----
  app.get("/login", (req, res) => {
    if (req.session.userId) return res.redirect("/");
    res.render("login", { error: null });
  });

  app.post("/login", async (req, res): Promise<void> => {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) {
      res.status(400).render("login", { error: "Username and password are required." });
      return;
    }
    const { rows } = await pool.query(
      "SELECT id, username, password_hash FROM admin_users WHERE username = $1",
      [username],
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).render("login", { error: "Invalid username or password." });
      return;
    }
    req.session.userId = user.id;
    req.session.username = user.username;
    res.redirect("/");
  });

  app.post("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/login"));
  });

  // ----- Dashboard -----
  app.get("/", requireAuth, async (_req, res) => {
    const { rows } = await pool.query<{
      total: string;
      active: string;
      blocked: string;
    }>(`SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE status = 'active')::text AS active,
          COUNT(*) FILTER (WHERE status = 'blocked')::text AS blocked
        FROM admin_customers`);
    const stats = rows[0] || { total: "0", active: "0", blocked: "0" };
    const recent = await pool.query(
      "SELECT id, name, subdomain, status, created_at FROM admin_customers ORDER BY created_at DESC LIMIT 5",
    );
    res.render("dashboard", { stats, recent: recent.rows });
  });

  // ----- Customers list -----
  app.get("/customers", requireAuth, async (req, res) => {
    const q = ((req.query.q as string) || "").trim();
    const params: unknown[] = [];
    let where = "";
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      where = `WHERE LOWER(name) LIKE $1 OR LOWER(subdomain) LIKE $1`;
    }
    const { rows } = await pool.query(
      `SELECT id, name, subdomain, db_name, status, features, created_at
       FROM admin_customers ${where}
       ORDER BY created_at DESC`,
      params,
    );
    res.render("customers/list", { customers: rows, q, featureLabels: FEATURE_LABELS });
  });

  // ----- New customer form -----
  app.get("/customers/new", requireAuth, (_req, res) => {
    res.render("customers/form", {
      mode: "new",
      customer: { name: "", subdomain: "", db_name: "", notes: "" },
      features: defaultFeatures(),
      featureLabels: FEATURE_LABELS,
      featureKeys: FEATURE_KEYS,
      error: null,
    });
  });

  app.post("/customers/new", requireAuth, async (req, res) => {
    const body = req.body as Record<string, string | string[] | undefined>;
    const name = String(body.name || "").trim();
    const subdomain = String(body.subdomain || "").trim().toLowerCase();
    const dbNameInput = String(body.db_name || "").trim().toLowerCase();
    const notes = String(body.notes || "").trim();

    const features = {} as Record<FeatureKey, boolean>;
    for (const k of FEATURE_KEYS) features[k] = body[`feature_${k}`] === "on";

    const errors: string[] = [];
    if (!name) errors.push("Name is required.");
    if (!/^[a-z0-9-]{2,40}$/.test(subdomain))
      errors.push("Subdomain must be 2-40 chars: lowercase letters, digits, dashes.");
    const dbName = dbNameInput || `fratelanza_${subdomain.replace(/-/g, "_")}`;
    if (!/^[a-z0-9_]{2,60}$/.test(dbName))
      errors.push("DB name must be 2-60 chars: lowercase letters, digits, underscores.");

    if (errors.length) {
      return res.status(400).render("customers/form", {
        mode: "new",
        customer: { name, subdomain, db_name: dbName, notes },
        features,
        featureLabels: FEATURE_LABELS,
        featureKeys: FEATURE_KEYS,
        error: errors.join(" "),
      });
    }

    try {
      await pool.query(
        `INSERT INTO admin_customers (name, subdomain, db_name, features, notes)
         VALUES ($1, $2, $3, $4::jsonb, $5)`,
        [name, subdomain, dbName, JSON.stringify(features), notes || null],
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create customer.";
      return res.status(400).render("customers/form", {
        mode: "new",
        customer: { name, subdomain, db_name: dbName, notes },
        features,
        featureLabels: FEATURE_LABELS,
        featureKeys: FEATURE_KEYS,
        error: msg.includes("duplicate") ? "Subdomain or DB name already in use." : msg,
      });
    }
    res.redirect("/customers");
  });

  // ----- Edit customer -----
  app.get("/customers/:id/edit", requireAuth, async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      "SELECT id, name, subdomain, db_name, status, features, notes FROM admin_customers WHERE id = $1",
      [id],
    );
    const customer = rows[0];
    if (!customer) {
      res.status(404).send("Customer not found");
      return;
    }
    const features = { ...defaultFeatures(), ...(customer.features || {}) };
    res.render("customers/form", {
      mode: "edit",
      customer,
      features,
      featureLabels: FEATURE_LABELS,
      featureKeys: FEATURE_KEYS,
      error: null,
    });
  });

  app.post("/customers/:id/edit", requireAuth, async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const body = req.body as Record<string, string | undefined>;
    const name = String(body.name || "").trim();
    const notes = String(body.notes || "").trim();
    const features = {} as Record<FeatureKey, boolean>;
    for (const k of FEATURE_KEYS) features[k] = body[`feature_${k}`] === "on";

    if (!name) {
      res.status(400).send("Name is required");
      return;
    }
    await pool.query(
      `UPDATE admin_customers
         SET name = $1, features = $2::jsonb, notes = $3, updated_at = NOW()
         WHERE id = $4`,
      [name, JSON.stringify(features), notes || null, id],
    );
    res.redirect("/customers");
  });

  // ----- Block / Unblock -----
  app.post("/customers/:id/block", requireAuth, async (req, res) => {
    await pool.query("UPDATE admin_customers SET status='blocked', updated_at=NOW() WHERE id=$1", [
      Number(req.params.id),
    ]);
    res.redirect("/customers");
  });
  app.post("/customers/:id/unblock", requireAuth, async (req, res) => {
    await pool.query("UPDATE admin_customers SET status='active', updated_at=NOW() WHERE id=$1", [
      Number(req.params.id),
    ]);
    res.redirect("/customers");
  });

  // ----- Delete -----
  app.post("/customers/:id/delete", requireAuth, async (req, res) => {
    await pool.query("DELETE FROM admin_customers WHERE id=$1", [Number(req.params.id)]);
    res.redirect("/customers");
  });

  // ----- Public API for the CRM to look up tenant config by subdomain -----
  // Future: the CRM calls this to resolve subdomain -> { dbName, status, features }.
  app.get("/api/tenants/:subdomain", async (req, res): Promise<void> => {
    const apiKey = req.header("x-admin-api-key");
    if (process.env.ADMIN_API_KEY && apiKey !== process.env.ADMIN_API_KEY) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const { rows } = await pool.query(
      "SELECT name, subdomain, db_name, status, features FROM admin_customers WHERE subdomain=$1",
      [req.params.subdomain.toLowerCase()],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(rows[0]);
  });

  app.get("/healthz", (_req, res) => res.json({ ok: true }));

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fratelanza Admin listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start admin app:", err);
  process.exit(1);
});
