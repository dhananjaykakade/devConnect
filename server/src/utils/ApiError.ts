import { config } from "../config/config.service";

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: unknown[];
  public stackTrace?: string;

  constructor(
    statusCode: number,
    message: string,
    errors: unknown[] = [],
    stack?: string
  ) {
    super(message);

    // Fix prototype chain (important for instanceof checks)
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    if (config.isDev) {
      this.stackTrace = stack || this.stack;
    }
  }

  // Optional: Create ApiError from any error object
  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error;
    if (error instanceof Error) {
      return new ApiError(500, error.message, [], error.stack);
    }
    return new ApiError(500, "Unknown error occurred", [error]);
  }

  // Optional: Serialize error for API responses
  toJSON() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      errors: this.errors,
      ...(config.isDev && { stack: this.stackTrace }),
    };
  }
}
