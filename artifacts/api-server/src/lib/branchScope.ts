import type { Request } from "express";
import { eq, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

/**
 * Returns the branch the current request should be scoped to:
 *   - `number`: filter list endpoints to this branch only
 *   - `undefined`: no filter (see all branches)
 *
 * Rules:
 *   - Admin role: no filter unless they set a branchOverride (via POST /branches/select-override).
 *   - Non-admin: filter to their own branchId. If they have none (null), no filter
 *     (treated as a global user — owner / accountant who sees everything).
 */
export function effectiveBranchId(req: Request): number | undefined {
  const s = req.session as any;
  if (!s) return undefined;
  if (s.role === "admin") {
    return typeof s.branchOverride === "number" ? s.branchOverride : undefined;
  }
  return typeof s.branchId === "number" ? s.branchId : undefined;
}

/** Builds an `eq(col, branchId)` SQL filter, or undefined when no scope applies. */
export function branchWhere(req: Request, col: PgColumn): SQL | undefined {
  const bid = effectiveBranchId(req);
  return typeof bid === "number" ? eq(col, bid) : undefined;
}

/**
 * Returns ` AND <qualified_column> = <bid>` for use inside raw `sql\`\`` queries
 * that already have a WHERE clause, OR an empty fragment when no scope applies.
 * `qualifiedColumn` should be a SQL-safe column reference (e.g. `mi.branch_id`,
 * `visits.branch_id`). Caller is responsible for using only trusted identifiers.
 */
export function branchAndFragment(req: Request, qualifiedColumn: string): SQL {
  const bid = effectiveBranchId(req);
  if (typeof bid !== "number") return sql``;
  return sql` AND ${sql.raw(qualifiedColumn)} = ${bid}`;
}

/**
 * Like {@link branchAndFragment} but emits ` WHERE ... = X` instead of ` AND ... = X`.
 * Use for subqueries that have no existing WHERE clause.
 */
export function branchWhereFragment(req: Request, qualifiedColumn: string): SQL {
  const bid = effectiveBranchId(req);
  if (typeof bid !== "number") return sql``;
  return sql` WHERE ${sql.raw(qualifiedColumn)} = ${bid}`;
}
