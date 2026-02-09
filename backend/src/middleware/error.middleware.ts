import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: ApiError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation Error",
      message: "Invalid input data",
      details: err.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  if ('statusCode' in err && err.statusCode) {
    res.status(err.statusCode).json({
      error: err.name || "Error",
      message: err.message,
      ...('code' in err && err.code && { code: err.code }),
    });
    return;
  }

  if (err.name === "PrismaClientKnownRequestError") {
    const prismaError = err as any;
    if (prismaError.code === "P2002") {
      res.status(409).json({
        error: "Conflict",
        message: "A record with this value already exists",
      });
      return;
    }
    if (prismaError.code === "P2025") {
      res.status(404).json({
        error: "Not Found",
        message: "The requested resource was not found",
      });
      return;
    }
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" 
      ? "An unexpected error occurred" 
      : err.message,
  });
};
