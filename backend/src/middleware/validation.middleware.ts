import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      const validatedData = parsed as any;

      req.body = validatedData.body;
      req.params = validatedData.params;
      req.query = validatedData.query;

      next();

    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Validation Error",
          message: "Invalid input data",
          details: error.issues,
        });
        return;
      }
      next(error);
    }
  };
};