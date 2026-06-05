/**
 * Error Classifier
 * Inspired by NousResearch/hermes-agent agent/error_classifier.py
 * Classifies errors by severity and provides recovery strategies.
 */

import { ClassifiedError, ErrorSeverity } from '../../types/hermes';

export class ErrorClassifier {
  private static readonly CLASSIFICATION_RULES: Array<{
    pattern: RegExp | ((err: Error) => boolean);
    severity: ErrorSeverity;
    userMessage: string;
    retryDelay: number;
    suggestedAction: string;
  }> = [
    // Rate limiting
    {
      pattern: /rate.?limit|too many requests|429|quota exceeded|RESOURCE_EXHAUSTED/i,
      severity: 'rate_limit',
      userMessage: 'Rate limit reached. The service is temporarily limiting requests.',
      retryDelay: 5000,
      suggestedAction: 'Wait a moment before retrying, or switch to a different provider.',
    },
    // Authentication errors
    {
      pattern: /unauthorized|invalid api key|401|403|AUTHENTICATION/i,
      severity: 'auth',
      userMessage: 'Authentication failed. Please check your API credentials.',
      retryDelay: 0,
      suggestedAction: 'Verify your API key in settings and try again.',
    },
    // Context overflow
    {
      pattern: /context.?length|token.?limit|max.?tokens?|context.?window|too long|PROMPT_TOO_LONG/i,
      severity: 'context_overflow',
      userMessage: 'The conversation context has exceeded the model\'s limit.',
      retryDelay: 0,
      suggestedAction: 'Start a new conversation or use context compression.',
    },
    // Timeout errors
    {
      pattern: /timeout|timed out|TIMEOUT|deadline exceeded/i,
      severity: 'timeout',
      userMessage: 'The operation timed out.',
      retryDelay: 2000,
      suggestedAction: 'Try again or simplify the request.',
    },
    // Network transient errors
    {
      pattern: /network|ECONNREFUSED|ENOTFOUND|fetch failed|socket hang up|connection reset/i,
      severity: 'transient',
      userMessage: 'A network error occurred. This is usually temporary.',
      retryDelay: 3000,
      suggestedAction: 'Check your internet connection and try again.',
    },
    // Retryable API errors
    {
      pattern: /500|502|503|internal server error|service unavailable|OVERLOADED/i,
      severity: 'retryable',
      userMessage: 'The AI service is temporarily unavailable.',
      retryDelay: 5000,
      suggestedAction: 'Wait a few seconds and retry.',
    },
    // CORS / browser security
    {
      pattern: /cors|blocked by cors policy|not allowed by access-control/i,
      severity: 'permanent',
      userMessage: 'A browser security restriction prevented the request.',
      retryDelay: 0,
      suggestedAction: 'This is a configuration issue. Please check the server settings.',
    },
  ];

  /**
   * Classify an error into a structured ClassifiedError.
   */
  static classify(error: Error | unknown, toolName?: string): ClassifiedError {
    const err = error instanceof Error ? error : new Error(String(error));

    for (const rule of this.CLASSIFICATION_RULES) {
      let matches = false;
      if (rule.pattern instanceof RegExp) {
        matches = rule.pattern.test(err.message);
      } else if (typeof rule.pattern === 'function') {
        matches = rule.pattern(err);
      }

      if (matches) {
        return {
          originalError: err,
          severity: rule.severity,
          userMessage: rule.userMessage,
          shouldRetry: ['transient', 'retryable', 'timeout', 'rate_limit'].includes(rule.severity),
          retryDelay: rule.retryDelay,
          suggestedAction: rule.suggestedAction,
          toolName,
        };
      }
    }

    // Default classification
    return {
      originalError: err,
      severity: 'permanent',
      userMessage: 'An unexpected error occurred.',
      shouldRetry: false,
      retryDelay: 0,
      suggestedAction: 'Please try a different approach or start a new conversation.',
      toolName,
    };
  }

  /**
   * Check if an error should trigger a fallback to an alternative model/provider.
   */
  static shouldFallbackToAlternative(classified: ClassifiedError): boolean {
    return ['rate_limit', 'auth', 'context_overflow', 'permanent'].includes(classified.severity);
  }

  /**
   * Get the appropriate retry delay with exponential backoff.
   */
  static getRetryDelay(classified: ClassifiedError, attempt: number): number {
    if (!classified.shouldRetry) return 0;
    const baseDelay = classified.retryDelay;
    const maxDelay = 30000; // 30 seconds max
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // 0-1 second jitter
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * Format a user-friendly error message with recovery suggestions.
   */
  static formatUserMessage(classified: ClassifiedError): string {
    let message = classified.userMessage;
    if (classified.toolName) {
      message = `[${classified.toolName}] ${message}`;
    }
    if (classified.shouldRetry) {
      message += ` ${classified.suggestedAction}`;
    } else {
      message += ` Suggestion: ${classified.suggestedAction}`;
    }
    return message;
  }
}
