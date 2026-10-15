import type { Response } from "express";

export class ApiResponse {
  /**
   * Enforces standard success formats
   */
  static success<T>(
    res: Response,
    message: string,
    data: T = null as any,
    statusCode: number = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Enforces standard error formats for manual validation failures
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = 400,
    errors: any[] = []
  ): Response {
    return res.status(statusCode).json({
      success: false,
      errors: errors.length > 0 ? errors : [{ message }],
    });
  }
}
