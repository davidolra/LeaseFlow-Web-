/**
 * Base Error Class
 * All application errors should extend this class
 */

const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

type ErrorSeverity = (typeof ErrorSeverity)[keyof typeof ErrorSeverity];

const ErrorType = {
  NETWORK: 'NETWORK',
  API: 'API',
  VALIDATION: 'VALIDATION',
  AUTH: 'AUTH',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION: 'PERMISSION',
  CONFLICT: 'CONFLICT',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
} as const;

type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly statusCode?: number;
  public readonly originalError?: unknown;
  public readonly timestamp: Date;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode?: number,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.timestamp = new Date();

    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

export class ApiError extends AppError {
  constructor(message: string, statusCode?: number, originalError?: unknown) {
    super(message, ErrorType.API, ErrorSeverity.HIGH, statusCode, originalError);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class NetworkError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, ErrorType.NETWORK, ErrorSeverity.HIGH, undefined, originalError);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class ValidationError extends AppError {
  public readonly details?: Record<string, string>;

  constructor(message: string, details?: Record<string, string>, originalError?: unknown) {
    super(message, ErrorType.VALIDATION, ErrorSeverity.MEDIUM, undefined, originalError);
    this.name = 'ValidationError';
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, ErrorType.AUTH, ErrorSeverity.HIGH, 401, originalError);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class PermissionError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, ErrorType.PERMISSION, ErrorSeverity.HIGH, 403, originalError);
    this.name = 'PermissionError';
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, ErrorType.NOT_FOUND, ErrorSeverity.LOW, 404, originalError);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, ErrorType.CONFLICT, ErrorSeverity.MEDIUM, 409, originalError);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class ServerError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, ErrorType.SERVER, ErrorSeverity.CRITICAL, 500, originalError);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

export { ErrorSeverity, ErrorType };
