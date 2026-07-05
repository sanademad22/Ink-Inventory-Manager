import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { employeesTable } from "./employees";
import { inventoryTable } from "./inventory";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employeesTable.id),
  inkId: integer("ink_id").notNull().references(() => inventoryTable.id),
  quantityWithdrawn: integer("quantity_withdrawn").notNull(),
  transactionTimestamp: timestamp("transaction_timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, transactionTimestamp: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
