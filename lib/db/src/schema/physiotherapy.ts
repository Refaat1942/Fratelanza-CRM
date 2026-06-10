import { pgTable, text, serial, timestamp, integer, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/** Body regions common in Egyptian physio clinics (EN stored; AR in companion fields). */
export const physioAssessmentsTable = pgTable("physio_assessments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  therapistId: integer("therapist_id"),
  assessmentDate: date("assessment_date").notNull(),
  bodyRegion: text("body_region"), // e.g. cervical, lumbar, knee, shoulder
  bodyRegionAr: text("body_region_ar"),
  painScale: integer("pain_scale"), // 0-10
  romNotes: text("rom_notes"),
  romNotesAr: text("rom_notes_ar"),
  diagnosis: text("diagnosis"),
  diagnosisAr: text("diagnosis_ar"),
  goals: text("goals"),
  goalsAr: text("goals_ar"),
  contraindications: text("contraindications"),
  notes: text("notes"),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const physioExercisesTable = pgTable("physio_exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  category: text("category"), // strengthening, stretching, balance, manual, electrotherapy
  bodyRegion: text("body_region"),
  instructions: text("instructions"),
  instructionsAr: text("instructions_ar"),
  durationMinutes: integer("duration_minutes"),
  active: text("active").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const physioTreatmentPlansTable = pgTable("physio_treatment_plans", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  assessmentId: integer("assessment_id"),
  therapistId: integer("therapist_id"),
  title: text("title").notNull(),
  titleAr: text("title_ar"),
  sessionsPlanned: integer("sessions_planned").notNull().default(10),
  sessionsCompleted: integer("sessions_completed").notNull().default(0),
  frequencyPerWeek: integer("frequency_per_week").default(2),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: text("status").notNull().default("active"), // active|completed|paused|cancelled
  notes: text("notes"),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const physioSessionsTable = pgTable("physio_sessions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  planId: integer("plan_id"),
  therapistId: integer("therapist_id"),
  sessionDate: timestamp("session_date", { withTimezone: true }).notNull(),
  sessionNumber: integer("session_number"),
  bodyRegion: text("body_region"),
  painBefore: integer("pain_before"),
  painAfter: integer("pain_after"),
  modalities: text("modalities"), // ultrasound, TENS, hot pack, etc.
  modalitiesAr: text("modalities_ar"),
  exercisesPerformed: text("exercises_performed"),
  exercisesPerformedAr: text("exercises_performed_ar"),
  homeProgram: text("home_program"),
  homeProgramAr: text("home_program_ar"),
  status: text("status").notNull().default("completed"), // scheduled|completed|no_show|cancelled
  feeEgp: real("fee_egp").default(0),
  notes: text("notes"),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPhysioAssessmentSchema = createInsertSchema(physioAssessmentsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type PhysioAssessment = typeof physioAssessmentsTable.$inferSelect;
export type PhysioSession = typeof physioSessionsTable.$inferSelect;
export type PhysioTreatmentPlan = typeof physioTreatmentPlansTable.$inferSelect;
export type PhysioExercise = typeof physioExercisesTable.$inferSelect;
