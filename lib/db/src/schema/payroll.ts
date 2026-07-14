import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { employeesTable } from "./employees";

export const payrollRunsTable = pgTable("payroll_runs", {
  id: serial("id").primaryKey(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  status: text("status").notNull().default("draft"), // draft | finalized | paid
  branchId: integer("branch_id"),
  totalAmount: real("total_amount").notNull().default(0),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const payrollLinesTable = pgTable("payroll_lines", {
  id: serial("id").primaryKey(),
  payrollRunId: integer("payroll_run_id").notNull().references(() => payrollRunsTable.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employeesTable.id, { onDelete: "cascade" }),
  baseSalary: real("base_salary").notNull().default(0),
  hoursWorked: real("hours_worked").notNull().default(0),
  overtimeHours: real("overtime_hours").notNull().default(0),
  overtimePay: real("overtime_pay").notNull().default(0),
  deductions: real("deductions").notNull().default(0),
  netAmount: real("net_amount").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPayrollRunSchema = createInsertSchema(payrollRunsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPayrollLineSchema = createInsertSchema(payrollLinesTable).omit({ id: true, createdAt: true });
export type PayrollRun = typeof payrollRunsTable.$inferSelect;
export type PayrollLine = typeof payrollLinesTable.$inferSelect;
