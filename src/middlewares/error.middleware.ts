import type { Request, Response, NextFunction } from "express";
import { CustomError } from "../errors/custom.error";
import { config } from "../config/env";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If custom error, leverage the defined serialization format
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      success: false,
      errors: err.serializeErrors(),
    });
  }

  // Fallback for standard system errors
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    errors: [{ message }],
    stack: config.NODE_ENV === "development" ? err.stack : undefined,
  });
};
