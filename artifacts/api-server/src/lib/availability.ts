import { db, doctorAvailabilityTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// Clinic operating timezone. All Fratelanza tenants are Egyptian clinics (per
// replit.md product spec), so we hard-code Africa/Cairo. If we ever sell to
// other regions, lift this into tenant_settings.
const CLINIC_TZ = process.env.CLINIC_TIMEZONE || "Africa/Cairo";

// Two pre-built formatters — one for HH:MM, one for day-of-week — both in the
// clinic's local timezone, independent of where the server actually runs.
const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: CLINIC_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const DOW_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: CLINIC_TZ,
  weekday: "short",
});

const DOW_LOOKUP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function toHHMM(d: Date): string {
  // en-GB with hour12:false yields "HH:MM"; some runtimes emit "24:00" at midnight,
  // normalize to "00:00".
  const s = TIME_FMT.format(d);
  return s === "24:00" ? "00:00" : s;
}

function clinicDayOfWeek(d: Date): number {
  const s = DOW_FMT.format(d);
  return DOW_LOOKUP[s] ?? d.getUTCDay();
}

// Check whether [startAt, endAt) falls inside any availability window for the doctor.
// Returns true if the doctor has NO availability rows at all (backward-compat:
// availability is opt-in per doctor; absence means "no schedule constraint").
// Returns false if availability is configured but the slot is outside every window.
export async function isWithinAvailability(
  doctorId: number,
  startAt: Date,
  endAt: Date,
): Promise<boolean> {
  const rows = await db
    .select()
    .from(doctorAvailabilityTable)
    .where(eq(doctorAvailabilityTable.doctorId, doctorId));

  if (rows.length === 0) return true; // no schedule defined → unrestricted

  // The appointment must start and end on the same clinic-local day for window
  // checking; an overnight appointment would need a different model. We treat
  // the whole appointment as belonging to the clinic-local day of `startAt`.
  const dow = clinicDayOfWeek(startAt); // 0..6 in clinic TZ
  const startStr = toHHMM(startAt);
  const endStr = toHHMM(endAt);

  const sameDay = rows.filter((r) => r.dayOfWeek === dow);
  if (sameDay.length === 0) return false; // doctor is off that day

  return sameDay.some((r) => startStr >= r.startTime && endStr <= r.endTime);
}
