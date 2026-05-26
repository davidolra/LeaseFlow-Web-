/**
 * Error Handling Architecture Documentation
 * 
 * This document describes the technical architecture of the centralized error handling system.
 * 
 * ## Design Principles
 * 
 * 1. **Type Safety**: Eliminate `any` type usage, use `unknown` for caught errors
 * 2. **Classification**: Automatically classify errors by HTTP status, type, and severity
 * 3. **Centralization**: Single source of truth for error handling logic
 * 4. **Consistency**: Uniform logging and error messages across the application
 * 5. **Extensibility**: Easy to add new error types without modifying existing code
 * 
 * ## System Components
 * 
 * ### 1. AppError Base Class (AppError.ts)
 * 
 * - Base class for all application errors
 * - Properties:
 *   - `type`: ErrorType enum - Categorizes error by domain
 *   - `severity`: ErrorSeverity enum - Indicates importance (LOW/MEDIUM/HIGH/CRITICAL)
 *   - `statusCode?`: HTTP status code if applicable
 *   - `originalError?`: The caught error for debugging
 *   - `timestamp`: When the error occurred
 * 
 * ### 2. Specialized Error Classes (AppError.ts)
 * 
 * Each subclass extends AppError with default severity and type:
 * 
 * - `ApiError`: HTTP API errors (severity: HIGH)
 * - `NetworkError`: Connection failures (severity: HIGH)
 * - `ValidationError`: Invalid data (severity: MEDIUM)
 * - `AuthError`: Authentication failures (severity: HIGH, statusCode: 401)
 * - `PermissionError`: Authorization failures (severity: HIGH, statusCode: 403)
 * - `NotFoundError`: Resource not found (severity: LOW, statusCode: 404)
 * - `ConflictError`: Data conflicts (severity: MEDIUM, statusCode: 409)
 * - `ServerError`: Server errors (severity: CRITICAL, statusCode: 500)
 * 
 * ### 3. ErrorHandlerService Singleton (ErrorHandler.ts)
 * 
 * Main entry point for error handling with two core functions:
 * 
 * #### classifyError(error: unknown): AppError
 * 
 * Converts any error into an AppError instance through intelligent classification:
 * 
 * 1. If already AppError → return as-is
 * 2. If TypeError with "Failed to fetch" → NetworkError
 * 3. If object with status property (HTTP-like) → classify by status code
 * 4. If Error instance → wrap in AppError
 * 5. If string → create AppError with message
 * 6. Default → AppError with generic message
 * 
 * Status code mapping:
 * - 400 → ValidationError
 * - 401 → AuthError
 * - 403 → PermissionError
 * - 404 → NotFoundError
 * - 409 → ConflictError
 * - 5xx → ServerError
 * - Others → ApiError
 * 
 * #### handle(error: unknown, context?: string): AppError
 * 
 * Public API that:
 * 1. Classifies the error
 * 2. Logs it appropriately
 * 3. Returns the AppError instance
 * 
 * Context string is used for logging (e.g., "createUser", "fetchProperties")
 * 
 * #### Type Guards
 * 
 * For runtime type checking:
 * - isApiError(error): error is ApiError
 * - isNetworkError(error): error is NetworkError
 * - isAuthError(error): error is AuthError
 * - etc.
 * 
 * These use instanceof checks internally.
 * 
 * ## Integration Points
 * 
 * ### API Services (userService.ts, documentService.ts, etc.)
 * 
 * Pattern for all API service methods:
 * 
 * ```typescript
 * async method(params): Promise<ReturnType> {
 *   try {
 *     const response = await fetch(url, options);
 *     
 *     if (!response.ok) {
 *       const errorData = await parseErrorResponse(response);
 *       throw ErrorHandlerService.handle(
 *         { status: response.status, message: errorData.message },
 *         'methodName'
 *       );
 *     }
 *     
 *     return await response.json();
 *   } catch (error: unknown) {
 *     throw ErrorHandlerService.handle(error, 'methodName');
 *   }
 * }
 * ```
 * 
 * ### React Hooks (useUsuarios.ts, etc.)
 * 
 * Pattern for state management:
 * 
 * ```typescript
 * const [error, setError] = useState<string | null>(null);
 * 
 * try {
 *   const result = await service.method(params);
 *   setData(result);
 * } catch (err: unknown) {
 *   setError(ErrorHandlerService.getUserMessage(err));
 * }
 * ```
 * 
 * ### React Components
 * 
 * Pattern for user feedback:
 * 
 * ```typescript
 * try {
 *   await operation();
 * } catch (error: unknown) {
 *   if (ErrorHandlerService.isAuthError(error)) {
 *     navigate('/login');
 *   } else if (ErrorHandlerService.isValidationError(error)) {
 *     showValidationErrors(error.details);
 *   } else {
 *     showToast(ErrorHandlerService.getUserMessage(error));
 *   }
 * }
 * ```
 * 
 * ## Data Flow
 * 
 * ```
 * Error Occurs
 *        ↓
 * catch (error: unknown)
 *        ↓
 * ErrorHandlerService.handle(error, context)
 *        ↓
 * classifyError(error)
 *        ↓
 * [HTTP Status Analysis / Error Instance Check]
 *        ↓
 * Return AppError Subclass Instance
 *        ↓
 * Log with severity/context
 *        ↓
 * Return to caller
 *        ↓
 * Application handles based on error.type
 * ```
 * 
 * ## Logging Strategy
 * 
 * Severity-based console output:
 * 
 * - **CRITICAL**: console.error() → Shows stack trace
 * - **HIGH**: console.error() → Error message only
 * - **MEDIUM**: console.warn() → Warning message
 * - **LOW**: console.info() → Info message
 * 
 * Each log includes:
 * - Severity indicator (emoji)
 * - Error context [operation name]
 * - Error name/type
 * - Relevant message
 * 
 * Example output:
 * ```
 * ❌ ERROR [createUser]: ApiError Failed to create user
 * ⚠️  WARNING [validateForm]: ValidationError Email is invalid
 * ℹ️  INFO [fetchUser]: NotFoundError User not found
 * ```
 * 
 * ## Extension Points
 * 
 * ### Adding New Error Types
 * 
 * 1. Create new class extending AppError in AppError.ts:
 * ```typescript
 * export class RateLimitError extends AppError {
 *   constructor(message: string, originalError?: unknown) {
 *     super(message, ErrorType.RATE_LIMIT, ErrorSeverity.MEDIUM, 429, originalError);
 *     this.name = 'RateLimitError';
 *     Object.setPrototypeOf(this, RateLimitError.prototype);
 *   }
 * }
 * ```
 * 
 * 2. Add type constant in ErrorType (if not exists):
 * ```typescript
 * const ErrorType = {
 *   // ...
 *   RATE_LIMIT: 'RATE_LIMIT',
 * } as const;
 * ```
 * 
 * 3. Update classifyError() switch case:
 * ```typescript
 * case 429:
 *   return new RateLimitError(message, error);
 * ```
 * 
 * 4. Add type guard in ErrorHandlerService:
 * ```typescript
 * static isRateLimitError(error: unknown): error is RateLimitError {
 *   return error instanceof RateLimitError;
 * }
 * ```
 * 
 * ### Custom Error Context
 * 
 * Enhance context string for better logging:
 * ```typescript
 * ErrorHandlerService.handle(error, 'userService.createUser')
 * ErrorHandlerService.handle(error, 'auth.validateToken')
 * ```
 * 
 * ## Performance Considerations
 * 
 * - Classification is O(1) - simple switch statements
 * - Logging is asynchronous-friendly
 * - Original errors are preserved for debugging, not re-thrown
 * - Type guards use instanceof (cached by JavaScript engine)
 * 
 * ## Testing Strategy
 * 
 * See src/test/errorHandler.test.ts:
 * 
 * - Unit test each error subclass
 * - Test classification logic for all HTTP codes
 * - Test type guards for each error type
 * - Test logging with different severities
 * - Test getUserMessage() output
 * 
 * ## Migration from Old Pattern
 * 
 * Before:
 * ```typescript
 * catch (error: any) {
 *   console.error('Error:', error.message);
 *   throw error;
 * }
 * ```
 * 
 * After:
 * ```typescript
 * catch (error: unknown) {
 *   throw ErrorHandlerService.handle(error, 'operationName');
 * }
 * ```
 * 
 * Benefits:
 * - Type-safe
 * - Consistent logging
 * - Automatic error classification
 * - Contextual information preserved
 * 
 * ## Future Enhancements
 * 
 * 1. Error tracking (Sentry integration)
 * 2. Error analytics (count by type/severity)
 * 3. Retry logic based on error type
 * 4. Error recovery strategies
 * 5. User notification system
 * 
 * ---
 * Architecture Version: 1.0  
 * Last Updated: 2026-05-26  
 * Stability: Production Ready
 */
