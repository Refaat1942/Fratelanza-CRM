import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import {
  pool,
  initSchema,
  seedAdmin,
  FEATURE_KEYS,
  FEATURE_LABELS,
  FEATURE_GROUPS,
  defaultFeatures,
  normalizeCustomerFeatures,
  BILLING_CYCLES,
  PAYMENT_STATUSES,
  withTenantPool,
  advanceBillingDate,
  monthlyEquivalent,
  type FeatureKey,
  type BillingCycle,
} from "./db.js";
import { provisionInBackground } from "./provision.js";
import {
  SPECIALIZATION_KEYS,
  SPECIALIZATION_LABELS,
  SPECIALIZATION_PRESETS,
  isSpecializationKey,
} from "@workspace/db";
import {
  fmtDateDisplay,
  fmtDateInput,
  parseDateField,
  addDaysYmd,
  todayYmd,
  toDateOnlyString,
} from "./dates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
    flash?: { type: "success" | "error" | "info"; message: string } | undefined;
    revealed?: { customerId: number; username: string; password: string } | undefined;
  }
}

const PORT = Number(process.env.PORT || 5050);
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

function fmtMoney(n: number | string | null | undefined): string {
  const v = typeof n === "number" ? n : Number(n || 0);
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseBillingAmount(raw: string | undefined): number {
  const n = Number(String(raw ?? "").trim() || 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseFeaturesFromBody(
  body: Record<string, string | string[] | undefined>,
): Record<FeatureKey, boolean> {
  const features = {} as Record<FeatureKey, boolean>;
  for (const k of FEATURE_KEYS) {
    const raw = body[`feature_${k}`];
    if (raw === "on") features[k] = true;
    else if (Array.isArray(raw)) features[k] = raw.includes("on");
    else features[k] = false;
  }
  return features;
}

function applyTrialDefaults(body: Record<string, string | string[] | undefined>): {
  subscription_start: string | null;
  subscription_end: string | null;
  next_billing_date: string | null;
  payment_status: string;
} {
  const payment_status = String(body.payment_status || "trial");
  let subscription_start = String(body.subscription_start || "").trim() || null;
  let subscription_end = String(body.subscription_end || "").trim() || null;
  let next_billing_date = String(body.next_billing_date || "").trim() || null;
  if (payment_status === "trial" && !subscription_end) {
    const today = todayYmd();
    subscription_start = subscription_start || today;
    subscription_end = addDaysYmd(today, 14);
    if (!next_billing_date) next_billing_date = subscription_end;
  }
  return { subscription_start, subscription_end, next_billing_date, payment_status };
}

function daysBetween(a: Date, b: Date): number {
  const aYmd = toDateOnlyString(a);
  const bYmd = toDateOnlyString(b);
  if (!aYmd || !bYmd) return 0;
  const ad = new Date(`${aYmd}T12:00:00`);
  const bd = new Date(`${bYmd}T12:00:00`);
  return Math.round((bd.getTime() - ad.getTime()) / (1000 * 60 * 60 * 24));
}

function generatePassword(): string {
  // 12 chars, mix of alphanumeric, easy to read
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  const bytes = crypto.randomBytes(12);
  for (let i = 0; i < 12; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

async function main() {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && (SESSION_SECRET === "dev-secret-change-me" || SESSION_SECRET.length < 32)) {
    console.error("SESSION_SECRET must be set to a strong random value (32+ chars) in production");
    process.exit(1);
  }
  // Hard-fail if the admin password is left at the well-known default in prod.
  // The admin control plane is internet-facing (admin.fratelanza.com) — leaving
  // admin/admin123 would mean total tenant takeover for anyone who finds the host.
  if (isProd && (ADMIN_PASSWORD === "admin123" || ADMIN_PASSWORD.length < 10)) {
    console.error("ADMIN_PASSWORD must be set to a strong value (10+ chars, not the default) in production");
    process.exit(1);
  }

  await initSchema();
  await seedAdmin(ADMIN_USERNAME, await bcrypt.hash(ADMIN_PASSWORD, 10));

  const app = express();
  app.set("view engine", "ejs");
  app.set("views", path.resolve(__dirname, "../views"));
  app.set("trust proxy", 1);

  // Helmet security headers. CSP is loose because we use the Tailwind CDN.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(express.json({ limit: "2mb" }));

  const PgStore = connectPgSimple(session);
  app.use(
    session({
      store: new PgStore({ pool, tableName: "admin_session", createTableIfMissing: false }),
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProd,
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    }),
  );

  // Brute-force protection on the admin login endpoint.
  const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
  });
  app.use("/login", loginLimiter);

  // Locals available to all templates + flash consumption.
  app.use((req, res, next) => {
    res.locals.username = req.session.username;
    res.locals.currentPath = req.path;
    res.locals.flash = req.session.flash;
    res.locals.fmtMoney = fmtMoney;
    res.locals.fmtDate = fmtDateDisplay;
    res.locals.fmtDateInput = fmtDateInput;
    req.session.flash = undefined;
    next();
  });

  function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) return res.redirect("/login");
    next();
  }

  // ----- Auth -----
  app.get("/login", (req, res) => {
    if (req.session.userId) return res.redirect("/");
    res.render("login", { error: null });
  });

  app.post("/login", async (req, res): Promise<void> => {
    const { username, password } = req.body as { username?: string; password?: string };
    const ip = req.ip || req.socket.remoteAddress || "unknown";
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
      console.warn(`[admin] login_failed ip=${ip} username=${username}`);
      res.status(401).render("login", { error: "Invalid username or password." });
      return;
    }
    console.info(`[admin] login_success ip=${ip} username=${username}`);
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
      total: string; active: string; blocked: string; online: string;
    }>(`SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE status = 'active')::text AS active,
          COUNT(*) FILTER (WHERE status = 'blocked')::text AS blocked,
          COUNT(*) FILTER (WHERE last_seen_at >= NOW() - INTERVAL '5 minutes')::text AS online
        FROM admin_customers`);
    const stats = rows[0] || { total: "0", active: "0", blocked: "0", online: "0" };

    const billing = await pool.query<{ mrr: string; due_soon: string; overdue: string }>(`
      SELECT
        COALESCE(SUM(CASE
          WHEN billing_cycle='monthly' THEN billing_amount
          WHEN billing_cycle='quarterly' THEN billing_amount/3
          WHEN billing_cycle='yearly' THEN billing_amount/12
          ELSE 0 END), 0)::text AS mrr,
        COUNT(*) FILTER (WHERE next_billing_date IS NOT NULL
                          AND next_billing_date BETWEEN CURRENT_DATE
                          AND CURRENT_DATE + INTERVAL '7 days')::text AS due_soon,
        COUNT(*) FILTER (WHERE payment_status = 'overdue')::text AS overdue
      FROM admin_customers WHERE status = 'active'
    `);

    // Payment alerts: overdue + due within 3 days (active customers only)
    const alerts = await pool.query(`
      SELECT id, name, subdomain, payment_status, next_billing_date, billing_amount,
             (next_billing_date - CURRENT_DATE) AS days_until
      FROM admin_customers
      WHERE status = 'active'
        AND (payment_status = 'overdue'
             OR (next_billing_date IS NOT NULL
                 AND next_billing_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
                 AND payment_status <> 'paid'))
      ORDER BY (payment_status = 'overdue') DESC, next_billing_date ASC NULLS LAST
      LIMIT 10
    `);

    // Live activity: most recently seen tenants
    const liveActivity = await pool.query(`
      SELECT id, name, subdomain, last_seen_at,
             EXTRACT(EPOCH FROM (NOW() - last_seen_at))::int AS seconds_ago
      FROM admin_customers
      WHERE last_seen_at IS NOT NULL
      ORDER BY last_seen_at DESC
      LIMIT 8
    `);

    const recent = await pool.query(
      "SELECT id, name, subdomain, status, created_at FROM admin_customers ORDER BY created_at DESC LIMIT 5",
    );

    res.render("dashboard", {
      stats,
      billing: billing.rows[0] || { mrr: "0", due_soon: "0", overdue: "0" },
      alerts: alerts.rows,
      liveActivity: liveActivity.rows,
      recent: recent.rows,
    });
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
      `SELECT id, name, subdomain, db_name, status, features, provision_status, provision_error,
              plan_name, billing_amount, billing_cycle, payment_status, next_billing_date, created_at
       FROM admin_customers ${where}
       ORDER BY created_at DESC`,
      params,
    );
    res.render("customers/list", { customers: rows, q, featureLabels: FEATURE_LABELS });
  });

  // ----- New customer form -----
  app.get("/customers/new", requireAuth, (_req, res) => {
    const today = todayYmd();
    const trialEnd = addDaysYmd(today, 14);
    res.render("customers/form", {
      mode: "new",
      customer: {
        name: "",
        subdomain: "",
        db_name: "",
        notes: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        plan_name: "",
        billing_amount: "",
        billing_cycle: "monthly",
        subscription_start: today,
        subscription_end: trialEnd,
        next_billing_date: trialEnd,
        payment_status: "trial",
        specialization: "general",
      },
      features: defaultFeatures(),
      featureLabels: FEATURE_LABELS,
      featureKeys: FEATURE_KEYS,
      featureGroups: FEATURE_GROUPS,
      billingCycles: BILLING_CYCLES,
      paymentStatuses: PAYMENT_STATUSES,
      specializationKeys: SPECIALIZATION_KEYS,
      specializationLabels: SPECIALIZATION_LABELS,
      specializationPresets: SPECIALIZATION_PRESETS,
      error: null,
    });
  });

  app.post("/customers/new", requireAuth, async (req, res) => {
    const body = req.body as Record<string, string | string[] | undefined>;
    const name = String(body.name || "").trim();
    const subdomain = String(body.subdomain || "").trim().toLowerCase();
    const dbNameInput = String(body.db_name || "").trim().toLowerCase();
    const notes = String(body.notes || "").trim();
    const contact_name = String(body.contact_name || "").trim();
    const contact_email = String(body.contact_email || "").trim();
    const contact_phone = String(body.contact_phone || "").trim();
    const plan_name = String(body.plan_name || "").trim();
    const billing_amount = parseBillingAmount(String(body.billing_amount ?? ""));
    const billing_cycle = String(body.billing_cycle || "monthly");
    const trialDefaults = applyTrialDefaults(body);
    let subscription_start = parseDateField(String(body.subscription_start ?? "")) ?? trialDefaults.subscription_start;
    let subscription_end = parseDateField(String(body.subscription_end ?? "")) ?? trialDefaults.subscription_end;
    let next_billing_date = parseDateField(String(body.next_billing_date ?? "")) ?? trialDefaults.next_billing_date;
    const payment_status = trialDefaults.payment_status;
    const specializationRaw = String(body.specialization || "general").trim();
    const specialization = isSpecializationKey(specializationRaw) ? specializationRaw : "general";

    const features = parseFeaturesFromBody(body);

    const errors: string[] = [];
    if (!name) errors.push("Name is required.");
    if (!/^[a-z0-9-]{2,40}$/.test(subdomain))
      errors.push("Subdomain must be 2-40 chars: lowercase letters, digits, dashes.");
    const dbName = dbNameInput || `fratelanza_${subdomain.replace(/-/g, "_")}`;
    if (!/^[a-z][a-z0-9_]{1,59}$/.test(dbName))
      errors.push("DB name must start with a letter and be 2-60 chars: lowercase letters, digits, underscores.");

    if (errors.length) {
      return res.status(400).render("customers/form", {
        mode: "new",
        customer: {
          name, subdomain, db_name: dbName, notes,
          contact_name, contact_email, contact_phone,
          plan_name, billing_amount, billing_cycle,
          subscription_start, subscription_end, next_billing_date, payment_status,
        },
        features,
        featureLabels: FEATURE_LABELS,
        featureKeys: FEATURE_KEYS,
        featureGroups: FEATURE_GROUPS,
        billingCycles: BILLING_CYCLES,
        paymentStatuses: PAYMENT_STATUSES,
        specializationKeys: SPECIALIZATION_KEYS,
        specializationLabels: SPECIALIZATION_LABELS,
        specializationPresets: SPECIALIZATION_PRESETS,
        error: errors.join(" "),
      });
    }

    let newCustomerId: number;
    try {
      const inserted = await pool.query<{ id: number }>(
        `INSERT INTO admin_customers
           (name, subdomain, db_name, features, notes, provision_status,
            contact_name, contact_email, contact_phone,
            plan_name, billing_amount, billing_cycle,
            subscription_start, subscription_end, next_billing_date, payment_status, specialization)
         VALUES ($1,$2,$3,$4::jsonb,$5,'pending',$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING id`,
        [
          name, subdomain, dbName, JSON.stringify(features), notes || null,
          contact_name || null, contact_email || null, contact_phone || null,
          plan_name || null, billing_amount, billing_cycle,
          subscription_start, subscription_end, next_billing_date, payment_status,
          specialization,
        ],
      );
      newCustomerId = inserted.rows[0]!.id;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create customer.";
      return res.status(400).render("customers/form", {
        mode: "new",
        customer: {
          name, subdomain, db_name: dbName, notes,
          contact_name, contact_email, contact_phone,
          plan_name, billing_amount, billing_cycle,
          subscription_start, subscription_end, next_billing_date, payment_status,
          specialization,
        },
        features,
        featureLabels: FEATURE_LABELS,
        featureKeys: FEATURE_KEYS,
        featureGroups: FEATURE_GROUPS,
        billingCycles: BILLING_CYCLES,
        paymentStatuses: PAYMENT_STATUSES,
        specializationKeys: SPECIALIZATION_KEYS,
        specializationLabels: SPECIALIZATION_LABELS,
        specializationPresets: SPECIALIZATION_PRESETS,
        error: msg.includes("duplicate") ? "Subdomain or DB name already in use." : msg,
      });
    }
    provisionInBackground(newCustomerId, dbName);
    res.redirect(`/customers/${newCustomerId}`);
  });

  app.post("/customers/:id/reprovision", requireAuth, async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const { rows } = await pool.query<{ db_name: string }>(
      "SELECT db_name FROM admin_customers WHERE id=$1",
      [id],
    );
    if (!rows[0]) {
      res.status(404).send("Customer not found");
      return;
    }
    provisionInBackground(id, rows[0].db_name);
    req.session.flash = { type: "info", message: "Re-provisioning started in background." };
    res.redirect(`/customers/${id}`);
  });

  // ----- Customer DETAIL view -----
  app.get("/customers/:id", requireAuth, async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      `SELECT * FROM admin_customers WHERE id = $1`,
      [id],
    );
    const customer = rows[0];
    if (!customer) {
      res.status(404).send("Customer not found");
      return;
    }
    const payments = await pool.query(
      `SELECT id, amount, payment_date, method, reference, notes, created_at
       FROM admin_payments WHERE customer_id=$1 ORDER BY payment_date DESC, id DESC LIMIT 50`,
      [id],
    );
    const features = normalizeCustomerFeatures(customer.features as Record<string, boolean> | undefined);
    const today = new Date();
    const daysUntilBilling = customer.next_billing_date
      ? daysBetween(today, new Date(customer.next_billing_date))
      : null;
    const daysUntilEnd = customer.subscription_end
      ? daysBetween(today, new Date(customer.subscription_end))
      : null;
    const totalPaid = await pool.query<{ total: string }>(
      "SELECT COALESCE(SUM(amount),0)::text AS total FROM admin_payments WHERE customer_id=$1",
      [id],
    );
    const revealed =
      req.session.revealed && req.session.revealed.customerId === id
        ? req.session.revealed
        : null;
    req.session.revealed = undefined;

    res.render("customers/detail", {
      customer,
      features,
      featureLabels: FEATURE_LABELS,
      featureGroups: FEATURE_GROUPS,
      payments: payments.rows,
      daysUntilBilling,
      daysUntilEnd,
      totalPaid: totalPaid.rows[0]?.total || "0",
      revealed,
    });
  });

  // ----- Edit customer -----
  app.get("/customers/:id/edit", requireAuth, async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const { rows } = await pool.query("SELECT * FROM admin_customers WHERE id = $1", [id]);
    const customer = rows[0];
    if (!customer) {
      res.status(404).send("Customer not found");
      return;
    }
    const features = normalizeCustomerFeatures(customer.features as Record<string, boolean> | undefined);
    res.render("customers/form", {
      mode: "edit",
      customer,
      features,
      featureLabels: FEATURE_LABELS,
      featureKeys: FEATURE_KEYS,
      featureGroups: FEATURE_GROUPS,
      billingCycles: BILLING_CYCLES,
      paymentStatuses: PAYMENT_STATUSES,
      specializationKeys: SPECIALIZATION_KEYS,
      specializationLabels: SPECIALIZATION_LABELS,
      specializationPresets: SPECIALIZATION_PRESETS,
      error: null,
    });
  });

  app.post("/customers/:id/edit", requireAuth, async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).send("Invalid customer id");
      return;
    }

    const { rows: existingRows } = await pool.query("SELECT * FROM admin_customers WHERE id = $1", [id]);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).send("Customer not found");
      return;
    }

    const body = req.body as Record<string, string | string[] | undefined>;
    const name = String(body.name || "").trim();
    const notes = String(body.notes || "").trim();
    const contact_name = String(body.contact_name || "").trim();
    const contact_email = String(body.contact_email || "").trim();
    const contact_phone = String(body.contact_phone || "").trim();
    const plan_name = String(body.plan_name || "").trim();
    const billing_amount = parseBillingAmount(String(body.billing_amount ?? ""));
    const billing_cycle = String(body.billing_cycle || "monthly");
    const subscription_start = parseDateField(String(body.subscription_start ?? ""));
    const subscription_end = parseDateField(String(body.subscription_end ?? ""));
    const next_billing_date = parseDateField(String(body.next_billing_date ?? ""));
    const payment_status = String(body.payment_status || "trial");
    const specializationRaw = String(body.specialization || "general").trim();
    const specialization = isSpecializationKey(specializationRaw) ? specializationRaw : "general";
    const features = parseFeaturesFromBody(body);

    const formCustomer = {
      ...existing,
      name,
      notes: notes || null,
      contact_name: contact_name || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      plan_name: plan_name || null,
      billing_amount,
      billing_cycle,
      subscription_start,
      subscription_end,
      next_billing_date,
      payment_status,
      specialization,
    };

    const renderFormError = (error: string) => {
      res.status(400).render("customers/form", {
        mode: "edit",
        customer: formCustomer,
        features,
        featureLabels: FEATURE_LABELS,
        featureKeys: FEATURE_KEYS,
        featureGroups: FEATURE_GROUPS,
        billingCycles: BILLING_CYCLES,
        paymentStatuses: PAYMENT_STATUSES,
        specializationKeys: SPECIALIZATION_KEYS,
        specializationLabels: SPECIALIZATION_LABELS,
        specializationPresets: SPECIALIZATION_PRESETS,
        error,
      });
    };

    if (!name) {
      renderFormError("Customer name is required.");
      return;
    }

    try {
      const updated = await pool.query(
        `UPDATE admin_customers SET
           name=$1, features=$2::jsonb, notes=$3,
           contact_name=$4, contact_email=$5, contact_phone=$6,
           plan_name=$7, billing_amount=$8, billing_cycle=$9,
           subscription_start=$10, subscription_end=$11, next_billing_date=$12, payment_status=$13,
           specialization=$14, updated_at=NOW()
         WHERE id=$15
         RETURNING id`,
        [
          name, JSON.stringify(features), notes || null,
          contact_name || null, contact_email || null, contact_phone || null,
          plan_name || null, billing_amount, billing_cycle,
          subscription_start, subscription_end, next_billing_date, payment_status,
          specialization,
          id,
        ],
      );
      if (!updated.rowCount) {
        renderFormError("Save failed — customer record was not updated.");
        return;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Database error while saving.";
      renderFormError(msg);
      return;
    }

    req.session.flash = { type: "success", message: "Customer updated." };
    res.redirect(`/customers/${id}`);
  });

  // ----- Record a payment -----
  app.post("/customers/:id/payments", requireAuth, async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const body = req.body as Record<string, string | undefined>;
    const amount = Number(body.amount || 0);
    const payment_date = String(body.payment_date || "").trim() || new Date().toISOString().slice(0, 10);
    const method = String(body.method || "").trim();
    const reference = String(body.reference || "").trim();
    const notes = String(body.notes || "").trim();
    if (!amount || amount <= 0) {
      req.session.flash = { type: "error", message: "Amount must be greater than zero." };
      res.redirect(`/customers/${id}`);
      return;
    }
    const { rows } = await pool.query<{ billing_cycle: string; next_billing_date: string | null }>(
      "SELECT billing_cycle, next_billing_date FROM admin_customers WHERE id=$1",
      [id],
    );
    if (!rows[0]) {
      res.status(404).send("Customer not found");
      return;
    }
    await pool.query(
      `INSERT INTO admin_payments (customer_id, amount, payment_date, method, reference, notes)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, amount, payment_date, method || null, reference || null, notes || null],
    );
    // Advance next_billing_date by one cycle, update last_payment_date, mark paid
    const cycle = (rows[0].billing_cycle || "monthly") as BillingCycle;
    const baseDate = rows[0].next_billing_date ? new Date(rows[0].next_billing_date) : new Date(payment_date);
    const newNext = advanceBillingDate(baseDate, cycle);
    await pool.query(
      `UPDATE admin_customers SET
         last_payment_date=$1,
         next_billing_date=$2,
         payment_status='paid',
         updated_at=NOW()
       WHERE id=$3`,
      [payment_date, toDateOnlyString(newNext), id],
    );
    req.session.flash = { type: "success", message: `Payment of ${fmtMoney(amount)} EGP recorded.` };
    res.redirect(`/customers/${id}`);
  });

  // ----- Reset TENANT ADMIN password (the 'admin' user inside tenant DB) -----
  app.post("/customers/:id/reset-admin-password", requireAuth, async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const { rows } = await pool.query<{ db_name: string }>(
      "SELECT db_name FROM admin_customers WHERE id=$1",
      [id],
    );
    if (!rows[0]) {
      res.status(404).send("Customer not found");
      return;
    }
    const newPass = generatePassword();
    const hash = await bcrypt.hash(newPass, 10);
    try {
      await withTenantPool(rows[0].db_name, async (p) => {
        const r = await p.query(
          `UPDATE users SET password_hash=$1, updated_at=NOW() WHERE username='admin' RETURNING id`,
          [hash],
        );
        if (r.rowCount === 0) {
          throw new Error("No 'admin' user found in tenant DB.");
        }
      });
      req.session.revealed = { customerId: id, username: "admin", password: newPass };
      req.session.flash = { type: "success", message: "Admin password reset. Copy it now — it won't be shown again." };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      req.session.flash = { type: "error", message: `Reset failed: ${msg}` };
    }
    res.redirect(`/customers/${id}`);
  });

  // ----- List tenant users -----
  app.get("/customers/:id/users", requireAuth, async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const { rows } = await pool.query<{ name: string; db_name: string }>(
      "SELECT name, db_name FROM admin_customers WHERE id=$1",
      [id],
    );
    if (!rows[0]) {
      res.status(404).send("Customer not found");
      return;
    }
    let users: Array<{ id: number; username: string; role: string; created_at: string }> = [];
    let loadError: string | null = null;
    try {
      users = await withTenantPool(rows[0].db_name, async (p) => {
        const r = await p.query(
          `SELECT id, username, role, created_at FROM users ORDER BY id`,
        );
        return r.rows;
      });
    } catch (err: unknown) {
      loadError = err instanceof Error ? err.message : String(err);
    }
    const revealed =
      req.session.revealed && req.session.revealed.customerId === id
        ? req.session.revealed
        : null;
    req.session.revealed = undefined;
    res.render("customers/users", {
      customer: { id, name: rows[0].name, db_name: rows[0].db_name },
      users,
      loadError,
      revealed,
    });
  });

  // ----- Reset a specific tenant user password -----
  app.post(
    "/customers/:id/users/:userId/reset-password",
    requireAuth,
    async (req, res): Promise<void> => {
      const id = Number(req.params.id);
      const userId = Number(req.params.userId);
      const { rows } = await pool.query<{ db_name: string }>(
        "SELECT db_name FROM admin_customers WHERE id=$1",
        [id],
      );
      if (!rows[0]) {
        res.status(404).send("Customer not found");
        return;
      }
      const newPass = generatePassword();
      const hash = await bcrypt.hash(newPass, 10);
      try {
        const username = await withTenantPool(rows[0].db_name, async (p) => {
          const r = await p.query(
            `UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2 RETURNING username`,
            [hash, userId],
          );
          if (r.rowCount === 0) throw new Error("User not found in tenant DB.");
          return (r.rows[0] as { username: string }).username;
        });
        req.session.revealed = { customerId: id, username, password: newPass };
        req.session.flash = { type: "success", message: `Password reset for ${username}. Copy it now.` };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        req.session.flash = { type: "error", message: `Reset failed: ${msg}` };
      }
      res.redirect(`/customers/${id}/users`);
    },
  );

  // ----- Block / Unblock -----
  app.post("/customers/:id/block", requireAuth, async (req, res) => {
    await pool.query("UPDATE admin_customers SET status='blocked', updated_at=NOW() WHERE id=$1", [
      Number(req.params.id),
    ]);
    req.session.flash = { type: "info", message: "Customer blocked." };
    res.redirect(`/customers/${req.params.id}`);
  });
  app.post("/customers/:id/unblock", requireAuth, async (req, res) => {
    await pool.query("UPDATE admin_customers SET status='active', updated_at=NOW() WHERE id=$1", [
      Number(req.params.id),
    ]);
    req.session.flash = { type: "success", message: "Customer unblocked." };
    res.redirect(`/customers/${req.params.id}`);
  });

  // ----- Delete -----
  app.post("/customers/:id/delete", requireAuth, async (req, res) => {
    await pool.query("DELETE FROM admin_customers WHERE id=$1", [Number(req.params.id)]);
    res.redirect("/customers");
  });

  // ----- Reports -----
  app.get("/reports", requireAuth, async (_req, res) => {
    const summary = await pool.query<{
      total: string;
      active: string;
      blocked: string;
      trial: string;
      paid: string;
      due: string;
      overdue: string;
      cancelled: string;
      mrr: string;
      total_paid_lifetime: string;
    }>(`
      SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE status='active')::text AS active,
        COUNT(*) FILTER (WHERE status='blocked')::text AS blocked,
        COUNT(*) FILTER (WHERE payment_status='trial')::text AS trial,
        COUNT(*) FILTER (WHERE payment_status='paid')::text AS paid,
        COUNT(*) FILTER (WHERE payment_status='due')::text AS due,
        COUNT(*) FILTER (WHERE payment_status='overdue')::text AS overdue,
        COUNT(*) FILTER (WHERE payment_status='cancelled')::text AS cancelled,
        COALESCE(SUM(CASE
          WHEN status='active' AND billing_cycle='monthly' THEN billing_amount
          WHEN status='active' AND billing_cycle='quarterly' THEN billing_amount/3
          WHEN status='active' AND billing_cycle='yearly' THEN billing_amount/12
          ELSE 0 END), 0)::text AS mrr,
        (SELECT COALESCE(SUM(amount),0)::text FROM admin_payments) AS total_paid_lifetime
      FROM admin_customers
    `);
    const byPlan = await pool.query(`
      SELECT COALESCE(NULLIF(plan_name,''),'(no plan)') AS plan,
             COUNT(*)::int AS count,
             COALESCE(SUM(billing_amount),0)::numeric AS total
      FROM admin_customers WHERE status='active'
      GROUP BY plan ORDER BY count DESC
    `);
    const dueSoon = await pool.query(`
      SELECT id, name, subdomain, plan_name, billing_amount, billing_cycle,
             next_billing_date, payment_status,
             (next_billing_date - CURRENT_DATE)::int AS days_until
      FROM admin_customers
      WHERE status='active' AND next_billing_date IS NOT NULL
        AND next_billing_date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY next_billing_date ASC
    `);
    const overdue = await pool.query(`
      SELECT id, name, subdomain, plan_name, billing_amount, billing_cycle,
             next_billing_date, payment_status
      FROM admin_customers
      WHERE payment_status='overdue' OR (next_billing_date IS NOT NULL AND next_billing_date < CURRENT_DATE)
      ORDER BY next_billing_date ASC NULLS LAST
    `);
    const recentPayments = await pool.query(`
      SELECT p.id, p.amount, p.payment_date, p.method, p.reference,
             c.id AS customer_id, c.name AS customer_name, c.subdomain
      FROM admin_payments p JOIN admin_customers c ON c.id = p.customer_id
      ORDER BY p.payment_date DESC, p.id DESC LIMIT 20
    `);
    res.render("reports", {
      summary: summary.rows[0],
      byPlan: byPlan.rows,
      dueSoon: dueSoon.rows,
      overdue: overdue.rows,
      recentPayments: recentPayments.rows,
    });
  });

  // ----- Reports Excel export -----
  app.get("/reports/export.xlsx", requireAuth, async (_req, res): Promise<void> => {
    const { rows: customers } = await pool.query(`
      SELECT id, name, subdomain, db_name, status, payment_status,
             plan_name, billing_amount, billing_cycle,
             subscription_start, subscription_end, next_billing_date, last_payment_date,
             contact_name, contact_email, contact_phone,
             created_at
      FROM admin_customers ORDER BY created_at DESC
    `);
    const { rows: payments } = await pool.query(`
      SELECT p.id, c.name AS customer_name, c.subdomain, p.amount, p.payment_date,
             p.method, p.reference, p.notes, p.created_at
      FROM admin_payments p JOIN admin_customers c ON c.id = p.customer_id
      ORDER BY p.payment_date DESC, p.id DESC
    `);

    const wb = new ExcelJS.Workbook();
    wb.creator = "Fratelanza Admin";
    wb.created = new Date();

    const cs = wb.addWorksheet("Customers");
    cs.columns = [
      { header: "ID", key: "id", width: 6 },
      { header: "Name", key: "name", width: 28 },
      { header: "Subdomain", key: "subdomain", width: 16 },
      { header: "DB Name", key: "db_name", width: 20 },
      { header: "Status", key: "status", width: 10 },
      { header: "Payment Status", key: "payment_status", width: 14 },
      { header: "Plan", key: "plan_name", width: 16 },
      { header: "Amount (EGP)", key: "billing_amount", width: 14, style: { numFmt: "#,##0.00" } },
      { header: "Cycle", key: "billing_cycle", width: 12 },
      { header: "MRR (EGP)", key: "mrr", width: 12, style: { numFmt: "#,##0.00" } },
      { header: "Sub Start", key: "subscription_start", width: 12 },
      { header: "Sub End", key: "subscription_end", width: 12 },
      { header: "Next Billing", key: "next_billing_date", width: 14 },
      { header: "Last Payment", key: "last_payment_date", width: 14 },
      { header: "Contact Name", key: "contact_name", width: 22 },
      { header: "Contact Email", key: "contact_email", width: 26 },
      { header: "Contact Phone", key: "contact_phone", width: 18 },
      { header: "Created", key: "created_at", width: 20 },
    ];
    cs.getRow(1).font = { bold: true };
    for (const c of customers) {
      cs.addRow({
        ...c,
        mrr: monthlyEquivalent(Number(c.billing_amount || 0), (c.billing_cycle || "monthly") as BillingCycle),
        subscription_start: fmtDateDisplay(c.subscription_start),
        subscription_end: fmtDateDisplay(c.subscription_end),
        next_billing_date: fmtDateDisplay(c.next_billing_date),
        last_payment_date: fmtDateDisplay(c.last_payment_date),
        created_at: c.created_at ? new Date(c.created_at).toISOString().slice(0, 19).replace("T", " ") : "",
      });
    }

    const ps = wb.addWorksheet("Payments");
    ps.columns = [
      { header: "ID", key: "id", width: 6 },
      { header: "Customer", key: "customer_name", width: 28 },
      { header: "Subdomain", key: "subdomain", width: 16 },
      { header: "Amount (EGP)", key: "amount", width: 14, style: { numFmt: "#,##0.00" } },
      { header: "Payment Date", key: "payment_date", width: 14 },
      { header: "Method", key: "method", width: 14 },
      { header: "Reference", key: "reference", width: 22 },
      { header: "Notes", key: "notes", width: 40 },
      { header: "Recorded At", key: "created_at", width: 20 },
    ];
    ps.getRow(1).font = { bold: true };
    for (const p of payments) {
      ps.addRow({
        ...p,
        payment_date: fmtDateDisplay(p.payment_date),
        created_at: p.created_at ? new Date(p.created_at).toISOString().slice(0, 19).replace("T", " ") : "",
      });
    }

    const filename = `fratelanza-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  });

  // ----- Monitor: per-tenant health snapshot -----
  app.get("/monitor", requireAuth, async (_req, res) => {
    const { rows: customers } = await pool.query<{
      id: number;
      name: string;
      subdomain: string;
      db_name: string;
      status: string;
      provision_status: string;
    }>(
      "SELECT id, name, subdomain, db_name, status, provision_status FROM admin_customers ORDER BY name",
    );

    const results = await Promise.all(
      customers.map(async (c) => {
        if (c.provision_status !== "ready") {
          return {
            ...c,
            ok: false,
            users_count: null as number | null,
            last_activity: null as string | null,
            error: `provision_status=${c.provision_status}`,
          };
        }
        try {
          return await withTenantPool(c.db_name, async (p) => {
            const u = await p.query<{ n: string }>("SELECT COUNT(*)::text AS n FROM users");
            let last: string | null = null;
            try {
              const a = await p.query<{ t: string | null }>(
                "SELECT MAX(created_at)::text AS t FROM activity",
              );
              last = a.rows[0]?.t || null;
            } catch {
              // activity table may not exist on very old tenants
            }
            return {
              ...c,
              ok: true,
              users_count: Number(u.rows[0]?.n || 0),
              last_activity: last,
              error: null as string | null,
            };
          });
        } catch (err: unknown) {
          return {
            ...c,
            ok: false,
            users_count: null,
            last_activity: null,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }),
    );
    res.render("monitor", { tenants: results });
  });

  // ----- Public API for the CRM to look up tenant config by subdomain -----
  app.get("/api/tenants/:subdomain", async (req, res): Promise<void> => {
    const apiKey = req.header("x-admin-api-key");
    if (process.env.ADMIN_API_KEY && apiKey !== process.env.ADMIN_API_KEY) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const sub = req.params.subdomain.toLowerCase();
    const { rows } = await pool.query(
      `SELECT id, name, subdomain, db_name, status, features, payment_status, subscription_end
       FROM admin_customers WHERE subdomain=$1`,
      [sub],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    // Heartbeat — record last_seen so the admin dashboard can show online/offline.
    // Fire-and-forget; failures must not block the tenant lookup.
    pool.query("UPDATE admin_customers SET last_seen_at = NOW() WHERE id=$1", [rows[0].id])
      .catch((err) => console.warn(`[admin] heartbeat update failed for ${sub}:`, err.message));
    const { id: _id, ...payload } = rows[0];
    res.json({
      ...payload,
      subscription_end: toDateOnlyString(payload.subscription_end),
    });
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
