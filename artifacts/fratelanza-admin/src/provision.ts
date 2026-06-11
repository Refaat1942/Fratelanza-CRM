import pg from "pg";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool as adminPool } from "./db.js";
import {
  SPECIALIZATION_PRESETS,
  isSpecializationKey,
  type SpecializationKey,
} from "@workspace/db";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCHEMA_SQL = fs.readFileSync(path.join(__dirname, "tenant-schema.sql"), "utf8");

const ALL_PERMISSIONS = [
  "dashboard","tasks","crm","finance","team","products","rentals","suppliers","purchase_orders","reports","notifications","settings",
];

// Strict validator — dbName is interpolated as an identifier (no parameter
// binding for CREATE DATABASE), so this is the only thing standing between us
// and SQL injection. Keep this matching the admin form validator.
function assertSafeDbName(name: string): void {
  if (!/^[a-z][a-z0-9_]{1,59}$/.test(name)) {
    throw new Error(`Unsafe db name: ${name}`);
  }
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

// Connect to the maintenance DB ("postgres") on the same server as
// DATABASE_URL so we can CREATE/DROP DATABASE. Allows override via
// TENANT_MAINTENANCE_DB_URL for setups where the admin DB user can't reach
// the postgres DB.
function maintenancePool(): pg.Pool {
  const override = process.env.TENANT_MAINTENANCE_DB_URL;
  if (override) return new Pool({ connectionString: override });
  const base = process.env.DATABASE_URL!;
  const url = base.replace(/\/[^/?]+(\?|$)/, `/postgres$1`);
  return new Pool({ connectionString: url });
}

function buildTenantUrl(dbName: string): string {
  const tmpl = process.env.TENANT_DB_URL_TEMPLATE;
  if (tmpl) return tmpl.replace("{db}", dbName);
  const base = process.env.DATABASE_URL!;
  return base.replace(/\/[^/?]+(\?|$)/, `/${dbName}$1`);
}

async function seedSpecializationData(
  client: pg.PoolClient,
  specialization: SpecializationKey,
): Promise<void> {
  const preset = SPECIALIZATION_PRESETS[specialization] ?? SPECIALIZATION_PRESETS.general;
  const diagCount = await client.query(`SELECT COUNT(*)::int AS c FROM diagnoses_master`);
  if ((diagCount.rows[0]?.c ?? 0) === 0) {
    for (const d of preset.diagnoses) {
      await client.query(
        `INSERT INTO diagnoses_master (code, name, name_ar, specialization, active) VALUES ($1, $2, $3, $4, 1)`,
        [d.code, d.name, d.nameAr, specialization],
      );
    }
  }
  const featCount = await client.query(`SELECT COUNT(*)::int AS c FROM medical_features_master`);
  if ((featCount.rows[0]?.c ?? 0) === 0) {
    for (const f of preset.features) {
      await client.query(
        `INSERT INTO medical_features_master (category, name, name_ar, specialization, active) VALUES ($1, $2, $3, $4, 1)`,
        [f.category, f.name, f.nameAr, specialization],
      );
    }
  }
}

async function seedTenantAdmin(tenantPool: pg.Pool): Promise<void> {
  const passwordHash = await bcrypt.hash(process.env.TENANT_DEFAULT_ADMIN_PASSWORD || "admin123", 10);
  await tenantPool.query(
    `INSERT INTO users (username, password_hash, role, display_name, permissions)
     VALUES ($1, $2, 'admin', 'Administrator', $3)
     ON CONFLICT (username) DO NOTHING`,
    ["admin", passwordHash, JSON.stringify(ALL_PERMISSIONS)],
  );
}

export type ProvisionOutcome = { status: "ready" | "failed"; error?: string };

export async function provisionTenantDb(
  dbName: string,
  specialization: SpecializationKey = "general",
): Promise<ProvisionOutcome> {
  assertSafeDbName(dbName);
  // Create the database if it doesn't exist. Treat "duplicate_database"
  // (SQLSTATE 42P04) as a non-fatal race winner so concurrent runs converge.
  const maint = maintenancePool();
  try {
    try {
      await maint.query(`CREATE DATABASE ${quoteIdent(dbName)}`);
    } catch (err: unknown) {
      const code = (err as { code?: string } | null)?.code;
      if (code !== "42P04") throw err;
    }
  } finally {
    await maint.end().catch(() => {});
  }

  // Apply schema + seed inside a single transaction so a partial failure
  // leaves the DB clean and the next reprovision starts from an empty DB.
  const tenantPool = new Pool({ connectionString: buildTenantUrl(dbName) });
  const client = await tenantPool.connect();
  try {
    await client.query("BEGIN");
    await client.query(SCHEMA_SQL);
    const passwordHash = await bcrypt.hash(process.env.TENANT_DEFAULT_ADMIN_PASSWORD || "admin123", 10);
    await client.query(
      `INSERT INTO users (username, password_hash, role, display_name, permissions)
       VALUES ($1, $2, 'admin', 'Administrator', $3)
       ON CONFLICT (username) DO NOTHING`,
      ["admin", passwordHash, JSON.stringify(ALL_PERMISSIONS)],
    );
    await seedSpecializationData(client, specialization);
    await client.query("COMMIT");
    return { status: "ready" };
  } catch (err: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    // If schema was already applied by a previous successful run, the
    // CREATE TABLE statements will raise duplicate_table (42P07). That means
    // the DB is already provisioned — just ensure the seed user exists and
    // call it ready.
    const code = (err as { code?: string } | null)?.code;
    if (code === "42P07") {
      await seedTenantAdmin(tenantPool);
      return { status: "ready" };
    }
    throw err;
  } finally {
    client.release();
    await tenantPool.end().catch(() => {});
  }
}

// Background wrapper: claims the customer row (concurrency guard), runs
// provisioning, and writes the final status. A second concurrent invocation
// for the same customer is a no-op while one is in flight.
export function provisionInBackground(customerId: number, dbName: string): void {
  (async () => {
    // Atomic claim: only proceed if the row is NOT currently being provisioned.
    const claim = await adminPool.query(
      `UPDATE admin_customers
         SET provision_status='provisioning', provision_error=NULL, updated_at=NOW()
       WHERE id=$1 AND provision_status <> 'provisioning'`,
      [customerId],
    );
    if (claim.rowCount === 0) return; // already in progress

    try {
      const specRow = await adminPool.query<{ specialization: string | null }>(
        `SELECT specialization FROM admin_customers WHERE id=$1`,
        [customerId],
      );
      const rawSpec = specRow.rows[0]?.specialization || "general";
      const specialization = isSpecializationKey(rawSpec) ? rawSpec : "general";
      await provisionTenantDb(dbName, specialization);
      await adminPool.query(
        `UPDATE admin_customers SET provision_status='ready', provision_error=NULL, updated_at=NOW() WHERE id=$1`,
        [customerId],
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[provision] customer=${customerId} db=${dbName} failed:`, msg);
      await adminPool
        .query(
          `UPDATE admin_customers SET provision_status='failed', provision_error=$2, updated_at=NOW() WHERE id=$1`,
          [customerId, msg],
        )
        .catch(() => {});
    }
  })();
}
