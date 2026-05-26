import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ErrorHandlerService,
  classifyError,
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
} from '../core/errors';

describe('ErrorHandlerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to suppress logging during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('classifyError', () => {
    it('should return AppError if already AppError instance', () => {
      const error = new ApiError('Test error', 400);
      const result = classifyError(error);

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Test error');
    });

    it('should classify TypeError as NetworkError for Failed to fetch', () => {
      const error = new TypeError('Failed to fetch');
      const result = classifyError(error);

      expect(result).toBeInstanceOf(NetworkError);
      expect(result.type).toBe(ErrorType.NETWORK);
    });

    it('should classify string as AppError', () => {
      const result = classifyError('Simple error message');

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Simple error message');
    });

    it('should classify Error instance as AppError', () => {
      const error = new Error('Generic error');
      const result = classifyError(error);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Generic error');
    });

    it('should classify HTTP 400 as ValidationError', () => {
      const error = { status: 400, message: 'Invalid data' };
      const result = classifyError(error);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.type).toBe(ErrorType.VALIDATION);
    });

    it('should classify HTTP 401 as AuthError', () => {
      const error = { status: 401, message: 'Unauthorized' };
      const result = classifyError(error);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.statusCode).toBe(401);
    });

    it('should classify HTTP 403 as PermissionError', () => {
      const error = { status: 403, message: 'Forbidden' };
      const result = classifyError(error);

      expect(result).toBeInstanceOf(PermissionError);
      expect(result.statusCode).toBe(403);
    });

    it('should classify HTTP 404 as NotFoundError', () => {
      const error = { status: 404, message: 'Not Found' };
      const result = classifyError(error);

      expect(result).toBeInstanceOf(NotFoundError);
      expect(result.statusCode).toBe(404);
    });

    it('should classify HTTP 409 as ConflictError', () => {
      const error = { status: 409, message: 'Conflict' };
      const result = classifyError(error);

      expect(result).toBeInstanceOf(ConflictError);
      expect(result.statusCode).toBe(409);
    });

    it('should classify HTTP 500 as ServerError', () => {
      const error = { status: 500, message: 'Internal Server Error' };
      const result = classifyError(error);

      expect(result).toBeInstanceOf(ServerError);
      expect(result.statusCode).toBe(500);
    });

    it('should handle unknown error gracefully', () => {
      const result = classifyError(null);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Ocurrió un error inesperado');
    });
  });

  describe('handle', () => {
    it('should handle error and return AppError', () => {
      const error = new Error('Test error');
      const result = ErrorHandlerService.handle(error, 'testOperation');

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Test error');
    });

    it('should include context in handler', () => {
      const error = new Error('Test error');
      const result = ErrorHandlerService.handle(error, 'myFunction');

      expect(result).toBeInstanceOf(AppError);
    });
  });

  describe('getUserMessage', () => {
    it('should return user-friendly message', () => {
      const error = new Error('Technical error');
      const message = ErrorHandlerService.getUserMessage(error);

      expect(typeof message).toBe('string');
      expect(message).toBe('Technical error');
    });

    it('should provide spanish message for auth error', () => {
      const error = { status: 401, message: 'Unauthorized' };
      const message = ErrorHandlerService.getUserMessage(error);

      expect(message).toContain('sesión');
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify ApiError', () => {
      const error = new ApiError('API error', 400);

      expect(ErrorHandlerService.isApiError(error)).toBe(true);
      expect(ErrorHandlerService.isNetworkError(error)).toBe(false);
    });

    it('should correctly identify NetworkError', () => {
      const error = new NetworkError('Network error');

      expect(ErrorHandlerService.isNetworkError(error)).toBe(true);
      expect(ErrorHandlerService.isApiError(error)).toBe(false);
    });

    it('should correctly identify AuthError', () => {
      const error = new AuthError('Auth error');

      expect(ErrorHandlerService.isAuthError(error)).toBe(true);
    });

    it('should correctly identify ValidationError', () => {
      const error = new ValidationError('Validation error', { field: 'error' });

      expect(ErrorHandlerService.isValidationError(error)).toBe(true);
    });

    it('should correctly identify PermissionError', () => {
      const error = new PermissionError('Permission error');

      expect(ErrorHandlerService.isPermissionError(error)).toBe(true);
    });

    it('should correctly identify NotFoundError', () => {
      const error = new NotFoundError('Not found');

      expect(ErrorHandlerService.isNotFoundError(error)).toBe(true);
    });

    it('should correctly identify ConflictError', () => {
      const error = new ConflictError('Conflict');

      expect(ErrorHandlerService.isConflictError(error)).toBe(true);
    });
  });

  describe('Error Properties', () => {
    it('should have correct severity levels', () => {
      const apiError = new ApiError('API error', 400);
      const networkError = new NetworkError('Network error');
      const authError = new AuthError('Auth error');
      const notFoundError = new NotFoundError('Not found');

      expect(apiError.severity).toBe(ErrorSeverity.HIGH);
      expect(networkError.severity).toBe(ErrorSeverity.HIGH);
      expect(authError.severity).toBe(ErrorSeverity.HIGH);
      expect(notFoundError.severity).toBe(ErrorSeverity.LOW);
    });

    it('should preserve original error', () => {
      const original = new Error('Original error');
      const error = new ApiError('Wrapped error', 500, original);

      expect(error.originalError).toBe(original);
    });

    it('should have timestamp', () => {
      const error = new AppError('Test error');

      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should serialize to JSON', () => {
      const error = new ApiError('API error', 400);
      const json = error.toJSON();

      expect(json.name).toBe('ApiError');
      expect(json.message).toBe('API error');
      expect(json.statusCode).toBe(400);
      expect(json.type).toBe(ErrorType.API);
    });
  });
});
