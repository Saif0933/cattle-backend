import type { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../errors/bad-request.error";

interface SimpleValidator {
  parse?: (data: any) => any;
  validate?: (data: any) => { error?: { message: string } | any; value?: any };
}

/**
 * Higher-order middleware that validates request data against a Joi, Zod, or Custom validator schema.
 * Automatically throws BadRequestError with details if verification fails.
 */
export const validateSchema = (
  schema: SimpleValidator,
  source: "body" | "query" | "params" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[source];

      // Support for Zod validators
      if (typeof schema.parse === "function") {
        req[source] = schema.parse(dataToValidate);
      } 
      // Support for Joi validators
      else if (typeof schema.validate === "function") {
        const { error, value } = schema.validate(dataToValidate);
        if (error) {
          throw new BadRequestError(
            error.message || "Request validation failed."
          );
        }
        req[source] = value;
      }

      next();
    } catch (error: any) {
      // Catch custom schema parse exceptions
      if (error instanceof BadRequestError) {
        next(error);
      } else {
        next(new BadRequestError(error.message || "Invalid payload format."));
      }
    }
  };
};
