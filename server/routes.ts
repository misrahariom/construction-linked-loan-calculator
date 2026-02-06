import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Calculations API
  app.get(api.calculations.list.path, async (req, res) => {
    const items = await storage.getCalculations();
    res.json(items);
  });

  app.post(api.calculations.create.path, async (req, res) => {
    try {
      const input = api.calculations.create.input.parse(req.body);
      const item = await storage.createCalculation(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.calculations.get.path, async (req, res) => {
    const item = await storage.getCalculation(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Calculation not found' });
    }
    res.json(item);
  });

  app.delete(api.calculations.delete.path, async (req, res) => {
    const item = await storage.getCalculation(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Calculation not found' });
    }
    await storage.deleteCalculation(Number(req.params.id));
    res.status(204).send();
  });

  return httpServer;
}
