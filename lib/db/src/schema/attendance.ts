import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { employeesTable } from "./employees";

export const attendanceRecordsTable = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employeesTable.id, { onDelete: "cascade" }),
  branchId: integer("branch_id"),
  type: text("type").notNull(), // in | out
  clockedAt: timestamp("clocked_at", { withTimezone: true }).notNull().defaultNow(),
  method: text("method").notNull().default("qr"), // qr | manual | pin | kiosk
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecordsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type AttendanceRecord = typeof attendanceRecordsTable.$inferSelect;
