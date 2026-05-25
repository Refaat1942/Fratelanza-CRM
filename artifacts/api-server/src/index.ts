import app from "./app";
import { logger } from "./lib/logger";
import { runAlertsScanInternal } from "./routes/medical/alerts";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Periodic medical follow-up / missed-appointment scan.
  // Runs every 30 minutes against the *default* tenant DB (no ALS context).
  // For multi-tenant production, a per-tenant cron would be ideal; this single
  // scan still covers the default tenant and admins can hit POST
  // /api/medical-alerts/run from any tenant context for an on-demand sweep.
  const ALERT_INTERVAL_MS = 30 * 60 * 1000;
  const scheduleScan = () => {
    runAlertsScanInternal()
      .then((r) => {
        if (r.followUps > 0 || r.missed > 0) {
          logger.info({ ...r }, "medical_alerts_scan_periodic");
        }
      })
      .catch((scanErr) => {
        logger.warn({ err: scanErr }, "medical_alerts_scan_periodic_failed");
      });
  };
  setTimeout(scheduleScan, 60 * 1000);
  setInterval(scheduleScan, ALERT_INTERVAL_MS);
});
