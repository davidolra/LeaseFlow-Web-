import { ErrorHandlerService } from './ErrorHandler';

const UNKNOWN_ERROR_MESSAGE = 'Ocurrió un error inesperado';

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  const classifiedMessage = ErrorHandlerService.getUserMessage(error).trim();
  if (classifiedMessage && classifiedMessage !== UNKNOWN_ERROR_MESSAGE) {
    return classifiedMessage;
  }

  return fallback;
}
