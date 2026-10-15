import { CustomError } from "./custom.error";

export class UnauthorizedError extends CustomError {
  readonly statusCode = 401;

  constructor(message: string = "Unauthorized") {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
