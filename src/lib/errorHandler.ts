// ============================================================
// CENTRALIZED ERROR HANDLING — Payatas Ledger
// ============================================================

import * as Sentry from '@sentry/react';

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: unknown;
  context?: Record<string, unknown>;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Classify and log errors consistently across the app
   */
  handleError(error: unknown, context?: Record<string, unknown>): AppError {
    const appError: AppError = this.classifyError(error, context);
    this.errorLog.push(appError);
    this.logToConsole(appError);
    return appError;
  }

  private classifyError(error: unknown, context?: Record<string, unknown>): AppError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      // Network errors
      if (message.includes('fetch') || message.includes('network') || message.includes('offline')) {
        return {
          type: ErrorType.NETWORK,
          message: 'Network connection failed. Please check your internet connection.',
          originalError: error,
          context,
        };
      }

      // Auth errors
      if (message.includes('auth') || message.includes('unauthorized') || message.includes('login')) {
        return {
          type: ErrorType.AUTH,
          message: 'Authentication failed. Please log in again.',
          originalError: error,
          context,
        };
      }

      // Database errors
      if (message.includes('database') || message.includes('supabase') || message.includes('rpc')) {
        return {
          type: ErrorType.DATABASE,
          message: 'Database operation failed. Please try again.',
          originalError: error,
          context,
        };
      }

      // Validation errors
      if (message.includes('invalid') || message.includes('required') || message.includes('format')) {
        return {
          type: ErrorType.VALIDATION,
          message: 'Invalid input. Please check your data.',
          originalError: error,
          context,
        };
      }
    }

    // Unknown error type
    return {
      type: ErrorType.UNKNOWN,
      message: 'An unexpected error occurred.',
      originalError: error,
      context,
    };
  }

  private logToConsole(error: AppError): void {
    console.error(`[${error.type}] ${error.message}`, {
      originalError: error.originalError,
      context: error.context,
    });
    if (typeof Sentry !== "undefined") {
      Sentry.captureException(error.originalError instanceof Error ? error.originalError : error.message, {
        tags: { errorType: error.type },
        extra: { context: error.context },
      });
    }
  }

  /**
   * Get user-friendly error message for UI display
   */
  getUserMessage(error: AppError): string {
    return error.message;
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(count: number = 10): AppError[] {
    return this.errorLog.slice(-count);
  }

  /**
   * Clear error log
   */
  clearLog(): void {
    this.errorLog = [];
  }
}

export const errorHandler = ErrorHandler.getInstance();

/**
 * Wrapper function for async operations with automatic error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const appError = errorHandler.handleError(error, context);
    return { data: null, error: appError };
  }
}
