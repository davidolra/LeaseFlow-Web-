/**
 * Core Error Handling Export
 */

export { AppError } from './AppError';
export type { AppError as IAppError } from './AppError';

export {
  ApiError,
  NetworkError,
  ValidationError,
  AuthError,
  PermissionError,
  NotFoundError,
  ConflictError,
  ServerError,
  ErrorSeverity,
  ErrorType,
} from './AppError';

export { ErrorHandlerService, classifyError } from './ErrorHandler';

import { ErrorHandlerService } from './ErrorHandler';
export default ErrorHandlerService;
