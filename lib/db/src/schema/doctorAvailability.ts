import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

// Weekly recurring availability windows per doctor.
// dayOfWeek: 0=Sunday .. 6=Saturday (matches JS Date.getDay()).
// startTime / endTime: stored as "HH:MM" 24-hour strings (e.g. "09:00", "17:30").
// branchId: optional — when set, this window only applies for that branch.
export const doctorAvailabilityTable = pgTable("doctor_availability", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DoctorAvailability = typeof doctorAvailabilityTable.$inferSelect;
