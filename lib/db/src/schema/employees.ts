import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const employeesTable = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  email: text("email"),
  phone: text("phone"),
  department: text("department"),
  departmentAr: text("department_ar"),
  role: text("role"),
  roleAr: text("role_ar"),
  status: text("status").notNull().default("active"),
  salary: text("salary"),
  payType: text("pay_type").default("monthly"),
  hourlyRate: text("hourly_rate"),
  clockToken: text("clock_token").unique(),
  joinDate: text("join_date"),
  notes: text("notes"),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;
