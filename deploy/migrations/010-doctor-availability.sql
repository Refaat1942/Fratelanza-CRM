-- Phase H: Doctor Availability Windows
-- Idempotent. Safe to re-run.
BEGIN;

CREATE TABLE IF NOT EXISTS doctor_availability (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  branch_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS doctor_availability_doctor_idx ON doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS doctor_availability_doctor_day_idx ON doctor_availability(doctor_id, day_of_week);

COMMIT;
