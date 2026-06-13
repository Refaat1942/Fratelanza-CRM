/**
 * Postgres DATE helpers for the admin panel.
 * node-pg returns DATE columns as local-midnight Date objects — never use toISOString()
 * for display or <input type="date"> values (timezone shift shows the wrong day).
 */

export function toDateOnlyString(d: Date | string | null | undefined): string | null {
  if (d == null || d === "") return null;
  if (typeof d === "string") {
    const m = d.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
    }
    return null;
  }
  if (d instanceof Date && !isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return null;
}

export function fmtDateDisplay(d: Date | string | null | undefined): string {
  return toDateOnlyString(d) ?? "—";
}

/** For HTML date inputs — empty string when unset. */
export function fmtDateInput(d: Date | string | null | undefined): string {
  return toDateOnlyString(d) ?? "";
}

export function parseDateField(raw: string | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, day] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, day);
  dt.setDate(dt.getDate() + days);
  return toDateOnlyString(dt)!;
}

export function todayYmd(): string {
  return toDateOnlyString(new Date())!;
}
