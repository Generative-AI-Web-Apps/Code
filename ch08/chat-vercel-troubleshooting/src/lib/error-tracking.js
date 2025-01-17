import { logger } from '@/lib/logger';
import { generateId } from 'ai';

export const ErrorType = {
  CONTENT_FILTER: 'CONTENT_FILTER',
  TOKEN_LIMIT: 'TOKEN_LIMIT',
  RATE_LIMIT: 'RATE_LIMIT',
  STREAM_ERROR: 'STREAM_ERROR',
  MODEL_ERROR: 'MODEL_ERROR',
  API_ERROR: 'API_ERROR',
  UNKNOWN: 'UNKNOWN',
};

const ERROR_PATTERNS = {
  [ErrorType.CONTENT_FILTER]: ['content management policy', 'content was filtered', 'content policy violation'],
  [ErrorType.TOKEN_LIMIT]: ['maximum context length', 'max tokens exceeded', 'token limit'],
  [ErrorType.RATE_LIMIT]: ['rate limit exceeded', 'too many requests', 'quota exceeded'],
  [ErrorType.STREAM_ERROR]: ['stream interrupted', 'connection closed', 'stream error'],
};
export const AIErrorTracker = {
  determineErrorType(error) {
    for (const [type, patterns] of Object.entries(ERROR_PATTERNS)) {
      if (patterns.some((pattern) => error.message.toLowerCase().includes(pattern))) {
        return type;
      }
    }
    return ErrorType.UNKNOWN;
  },

  sanitizeInput(input) {
    if (!input) return '';
    return input.substring(0, 100) + '...';
  },

  async trackError(error, { provider, model, input }) {
    const errorType = this.determineErrorType(error);
    const timestamp = new Date().toISOString();
    const requestId = error.requestId || generateId();

    const errorData = {
      type: errorType,
      provider,
      model,
      message: error.message,
      timestamp,
      requestId,
      statusCode: error.status || error.statusCode,
      input: this.sanitizeInput(input),
    };

    logger.error('AI Provider Error', errorData);

    return errorData;
  },

  createUserFacingError(errorData) {
    const messages = {
      [ErrorType.CONTENT_FILTER]:
        'Your request contained content that cannot be processed. Please modify and try again.',
      [ErrorType.TOKEN_LIMIT]: 'The request was too long. Please try with a shorter message.',
      [ErrorType.RATE_LIMIT]: 'Too many requests. Please try again in a moment.',
      [ErrorType.STREAM_ERROR]: 'Connection interrupted. Please try again.',
      [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.',
    };

    return {
      message: messages[errorData.type] || messages[ErrorType.UNKNOWN],
      requestId: errorData.requestId,
    };
  },
};
