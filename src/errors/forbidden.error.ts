import { CustomError } from "./custom.error";

export class ForbiddenError extends CustomError {
  readonly statusCode = 403;

  constructor(message: string = "Access Forbidden") {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
