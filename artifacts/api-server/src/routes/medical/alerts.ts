import { Router, type IRouter, type Request, type Response } from "express";
import { sql } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";

const router: IRouter = Router();

/**
 * Scan for follow-up and missed-appointment situations and create notifications.
 * Idempotent within a 24h window: skips creating duplicate notifications by
 * matching on a `[follow-up #ID]` / `[missed #ID]` tag inside the message.
 *
 * Triggers covered:
 *  - visits with follow_up_date = today or tomorrow → reminder
 *  - appointments scheduled/confirmed whose start_at < NOW() - 1h and still not
 *    completed/cancelled → missed-appointment alert
 */
async function runAlertsScanInternal(): Promise<{ followUps: number; missed: number }> {
  // ---------- Follow-up reminders ----------
  // SQL inserts directly into notifications to keep this fast, single-tx, and
  // ALS-friendly (uses the tenant-scoped pool via the drizzle proxy).
  const followUpResult = await db.execute(sql`
    WITH due_visits AS (
      SELECT v.id, v.patient_id, v.follow_up_date,
             p.first_name, p.first_name_ar, p.last_name, p.last_name_ar
      FROM visits v
      LEFT JOIN patients p ON p.id = v.patient_id
      WHERE v.follow_up_date IS NOT NULL
        AND v.follow_up_date >= CURRENT_DATE
        AND v.follow_up_date <= CURRENT_DATE + INTERVAL '1 day'
    ), to_insert AS (
      SELECT d.* FROM due_visits d
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.message LIKE '%[follow-up #' || d.id || ']%'
          AND n.created_at >= NOW() - INTERVAL '24 hours'
      )
    )
    INSERT INTO notifications (title, title_ar, message, message_ar, type, is_read, created_at)
    SELECT
      'Follow-up due',
      'موعد متابعة',
      'Patient ' || COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') ||
        ' has a follow-up scheduled on ' || follow_up_date || '. [follow-up #' || id || ']',
      'مريض ' || COALESCE(first_name_ar, first_name, '') || ' ' || COALESCE(last_name_ar, last_name, '') ||
        ' لديه متابعة بتاريخ ' || follow_up_date || '. [follow-up #' || id || ']',
      'info',
      false,
      NOW()
    FROM to_insert
    RETURNING id
  `);

  // ---------- Missed appointments ----------
  const missedResult = await db.execute(sql`
    WITH stale_appts AS (
      SELECT a.id, a.start_at, a.patient_id,
             p.first_name, p.first_name_ar, p.last_name, p.last_name_ar
      FROM medical_appointments a
      LEFT JOIN patients p ON p.id = a.patient_id
      WHERE a.status IN ('scheduled', 'confirmed')
        AND a.start_at < NOW() - INTERVAL '1 hour'
        AND a.start_at >= NOW() - INTERVAL '7 days'
    ), to_insert AS (
      SELECT s.* FROM stale_appts s
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.message LIKE '%[missed #' || s.id || ']%'
      )
    )
    INSERT INTO notifications (title, title_ar, message, message_ar, type, is_read, created_at)
    SELECT
      'Missed appointment',
      'موعد فائت',
      'Appointment for ' || COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') ||
        ' at ' || to_char(start_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI') ||
        ' is past due and still not completed. [missed #' || id || ']',
      'موعد المريض ' || COALESCE(first_name_ar, first_name, '') || ' ' || COALESCE(last_name_ar, last_name, '') ||
        ' في ' || to_char(start_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI') ||
        ' فات ولم يتم استكماله. [missed #' || id || ']',
      'warning',
      false,
      NOW()
    FROM stale_appts s
    JOIN to_insert ti ON ti.id = s.id
    RETURNING notifications.id
  `);

  return {
    followUps: (followUpResult as any).rowCount ?? 0,
    missed: (missedResult as any).rowCount ?? 0,
  };
}

// Exposed manually so admins can trigger from the UI; also used by the periodic
// runner started in src/index.ts. Returns counts created.
router.post("/medical-alerts/run", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await runAlertsScanInternal();
    req.log.info({ ...result }, "medical_alerts_scan");
    res.json(result);
  } catch (err: any) {
    req.log.error({ err }, "medical_alerts_scan_failed");
    res.status(500).json({ error: err?.message ?? "scan_failed" });
  }
});

export default router;
export { runAlertsScanInternal };
