import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";

export const rentalsTable = pgTable("rentals", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id"),
  clientName: text("client_name"),
  employeeId: integer("employee_id"),
  employeeName: text("employee_name"),
  productId: integer("product_id"),
  productName: text("product_name"),
  quantity: integer("quantity").notNull().default(1),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  returnDate: text("return_date"),
  dailyRate: real("daily_rate"),
  totalAmount: real("total_amount"),
  depositAmount: real("deposit_amount"),
  status: text("status").notNull().default("new"),
  notes: text("notes"),
  documentPath: text("document_path"),
  documentName: text("document_name"),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Rental = typeof rentalsTable.$inferSelect;
