/**
 * Token bucket rate limiter for API throttling
 */

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(requestsPerSecond: number) {
    this.maxTokens = requestsPerSecond;
    this.tokens = requestsPerSecond;
    this.refillRate = requestsPerSecond / 1000;
    this.lastRefill = Date.now();
  }

  /**
   * Wait for a token to become available
   */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Calculate wait time for next token
    const tokensNeeded = 1 - this.tokens;
    const waitMs = Math.ceil(tokensNeeded / this.refillRate);

    await sleep(waitMs);
    this.refill();
    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const newTokens = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    retryableStatusCodes: readonly number[];
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      const isRetryable = isRetryableError(error, options.retryableStatusCodes);

      if (!isRetryable || attempt === options.maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        options.initialDelayMs * Math.pow(2, attempt),
        options.maxDelayMs
      );

      options.onRetry?.(attempt + 1, lastError);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Check if an error is retryable based on status code
 */
function isRetryableError(
  error: unknown,
  retryableCodes: readonly number[]
): boolean {
  if (error instanceof Error) {
    // Check for timeout errors
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return true;
    }

    // Check for HTTP status code in error message or properties
    const statusMatch = error.message.match(/status[:\s]+(\d{3})/i);
    if (statusMatch) {
      const status = parseInt(statusMatch[1], 10);
      return retryableCodes.includes(status);
    }

    // Check for status property on error object
    if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
      return retryableCodes.includes((error as { status: number }).status);
    }
  }

  return false;
}
