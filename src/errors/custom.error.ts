export abstract class CustomError extends Error {
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    
    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }

  abstract serializeErrors(): {
    message: string;
    field?: string;
  }[];
}
