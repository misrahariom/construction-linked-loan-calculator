import { pgTable, text, serial, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We define a schema for saving calculations, though the app is primarily client-side.
export const calculations = pgTable("calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // User friendly name for the saved calculation
  totalLoanAmount: numeric("total_loan_amount").notNull(),
  loanTenureYears: numeric("loan_tenure_years").notNull(),
  interestRate: numeric("interest_rate").notNull(),
  startDate: timestamp("start_date").notNull(),
  disbursals: jsonb("disbursals").$type<{ date: string; amount: number }[]>().notNull(),
  interestRateChanges: jsonb("interest_rate_changes").$type<{ date: string; rate: number }[]>().notNull().default([]),
  extraPayments: jsonb("extra_payments").$type<{ date: string; amount: number }[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCalculationSchema = createInsertSchema(calculations).omit({ 
  id: true, 
  createdAt: true 
});

export type Calculation = typeof calculations.$inferSelect;
export type InsertCalculation = z.infer<typeof insertCalculationSchema>;
