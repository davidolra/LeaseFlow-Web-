/**
 * Centralized Error Handler
 * Handles error logging, classification, and transformation
 */

import {
  AppError,
  ApiError,
  NetworkError,
  ValidationError,
  AuthError,
  PermissionError,
  NotFoundError,
  ConflictError,
  ServerError,
  ErrorType,
  ErrorSeverity,
} from './AppError';

interface ErrorResponse {
  message: string;
  status?: number;
  message_es?: string;
  validationErrors?: Record<string, string>;
}

/**
 * Classify unknown error into AppError instance
 */
export function classifyError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof TypeError) {
    if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
      return new NetworkError(
        'No se pudo conectar con el servidor. Verifica tu conexión de internet.',
        error
      );
    }
  }

  if (error instanceof Response || (error && typeof error === 'object' && 'status' in error)) {
    const response = error as Response;
    const statusCode = response.status;
    const errorMsg = `Error ${statusCode}: ${response.statusText}`;

    switch (statusCode) {
      case 400:
        return new ValidationError(errorMsg, undefined, error);
      case 401:
        return new AuthError(
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          error
        );
      case 403:
        return new PermissionError(
          'No tienes permisos para realizar esta acción.',
          error
        );
      case 404:
        return new NotFoundError('El recurso solicitado no fue encontrado.', error);
      case 409:
        return new ConflictError(
          'Hay un conflicto con los datos (posiblemente duplicados o recursos asociados).',
          error
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return new ServerError(
          'El servidor no está disponible. Intenta más tarde.',
          error
        );
      default:
        return new ApiError(errorMsg, statusCode, error);
    }
  }

  if (error && typeof error === 'object' && 'status' in error) {
    const apiError = error as ErrorResponse;
    const statusCode = apiError.status;
    const message = apiError.message_es || apiError.message || 'Error desconocido';

    if (statusCode && statusCode >= 400) {
      switch (statusCode) {
        case 400:
          return new ValidationError(message, apiError.validationErrors, error);
        case 401:
          return new AuthError('Autenticación requerida. Por favor, inicia sesión.', error);
        case 403:
          return new PermissionError('No tienes permisos para esta acción.', error);
        case 404:
          return new NotFoundError('El recurso no fue encontrado.', error);
        case 409:
          return new ConflictError(message, error);
        case 500:
          return new ServerError(message, error);
      }
    }

    return new ApiError(message, statusCode, error);
  }

  if (error instanceof Error) {
    return new AppError(error.message, ErrorType.UNKNOWN, ErrorSeverity.MEDIUM, undefined, error);
  }

  if (typeof error === 'string') {
    return new AppError(error, ErrorType.UNKNOWN, ErrorSeverity.MEDIUM);
  }

  return new AppError(
    'Ocurrió un error inesperado',
    ErrorType.UNKNOWN,
    ErrorSeverity.MEDIUM,
    undefined,
    error
  );
}

/**
 * Error Handler Singleton
 * Centralizes error logging and handling
 */
class ErrorHandlerService {
  /**
   * Handle error with logging and classification
   */
  static handle(error: unknown, context?: string): AppError {
    const appError = classifyError(error);
    this.log(appError, context);
    return appError;
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: unknown): string {
    const appError = classifyError(error);
    return appError.message;
  }

  /**
   * Log error based on severity
   */
  private static log(error: AppError, context?: string): void {
    const prefix = context ? `[${context}]` : '';

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error(`🔴 CRITICAL ERROR ${prefix}:`, error.name, error.toJSON());
        break;
      case ErrorSeverity.HIGH:
        console.error(`❌ ERROR ${prefix}:`, error.name, error.message);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(`⚠️  WARNING ${prefix}:`, error.name, error.message);
        break;
      case ErrorSeverity.LOW:
        console.info(`ℹ️  INFO ${prefix}:`, error.name, error.message);
        break;
    }

    if (error.originalError) {
      console.debug(`Original error ${prefix}:`, error.originalError);
    }
  }

  /**
   * Check if error is a specific type
   */
  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  static isNetworkError(error: unknown): error is NetworkError {
    return error instanceof NetworkError;
  }

  static isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError;
  }

  static isValidationError(error: unknown): error is ValidationError {
    return error instanceof ValidationError;
  }

  static isPermissionError(error: unknown): error is PermissionError {
    return error instanceof PermissionError;
  }

  static isNotFoundError(error: unknown): error is NotFoundError {
    return error instanceof NotFoundError;
  }

  static isConflictError(error: unknown): error is ConflictError {
    return error instanceof ConflictError;
  }
}

export { ErrorHandlerService };
export default ErrorHandlerService;
