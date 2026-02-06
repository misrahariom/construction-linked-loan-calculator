import { db } from "./db";
import {
  calculations,
  type InsertCalculation,
  type Calculation
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  createCalculation(calculation: InsertCalculation): Promise<Calculation>;
  getCalculations(): Promise<Calculation[]>;
  getCalculation(id: number): Promise<Calculation | undefined>;
  deleteCalculation(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createCalculation(insertCalculation: InsertCalculation): Promise<Calculation> {
    const [calculation] = await db
      .insert(calculations)
      .values(insertCalculation)
      .returning();
    return calculation;
  }

  async getCalculations(): Promise<Calculation[]> {
    return await db.select().from(calculations).orderBy(calculations.createdAt);
  }

  async getCalculation(id: number): Promise<Calculation | undefined> {
    const [calculation] = await db
      .select()
      .from(calculations)
      .where(eq(calculations.id, id));
    return calculation;
  }

  async deleteCalculation(id: number): Promise<void> {
    await db.delete(calculations).where(eq(calculations.id, id));
  }
}

export const storage = new DatabaseStorage();
