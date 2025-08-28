/**
 * Retry Utility
 * 
 * This utility provides a function to retry operations with exponential backoff.
 * It's useful for handling transient errors in API calls and other operations.
 */

/**
 * Options for retry function
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   */
  maxRetries: number;
  
  /**
   * Initial delay in milliseconds
   */
  initialDelay: number;
  
  /**
   * Maximum delay in milliseconds
   */
  maxDelay: number;
  
  /**
   * Exponential backoff factor
   */
  factor: number;
  
  /**
   * Function to call on retry
   */
  onRetry?: (error: Error, attempt: number) => void;
  
  /**
   * Function to determine if an error is retryable
   */
  retryableError?: (error: Error) => boolean;
}

/**
 * Default retry options
 */
const defaultOptions: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  factor: 2
};

/**
 * Execute a function with retry logic and exponential backoff
 * 
 * @param fn Function to execute
 * @param options Retry options
 * @returns Promise with the function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  // Merge options with defaults
  const retryOptions: RetryOptions = {
    ...defaultOptions,
    ...options
  };
  
  let attempt = 0;
  let delay = retryOptions.initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      // Check if we've reached the maximum number of retries
      if (attempt >= retryOptions.maxRetries) {
        throw error;
      }
      
      // Check if the error is retryable
      if (retryOptions.retryableError && !retryOptions.retryableError(error as Error)) {
        throw error;
      }
      
      // Call onRetry callback if provided
      if (retryOptions.onRetry) {
        retryOptions.onRetry(error as Error, attempt);
      }
      
      // Wait before retrying
      await sleep(delay);
      
      // Calculate next delay with exponential backoff
      delay = Math.min(delay * retryOptions.factor, retryOptions.maxDelay);
    }
  }
}

/**
 * Sleep for a specified number of milliseconds
 * 
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determine if an error is retryable based on common patterns
 * 
 * @param error Error to check
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors are generally retryable
  if (error.code === 'ECONNRESET' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND') {
    return true;
  }
  
  // Axios errors
  if (error.isAxiosError) {
    // No response means network error
    if (!error.response) {
      return true;
    }
    
    // Certain status codes are retryable
    const statusCode = error.response.status;
    
    // 429 (Too Many Requests) - Rate limiting
    // 500, 502, 503, 504 - Server errors
    if (statusCode === 429 || 
        statusCode === 500 || 
        statusCode === 502 || 
        statusCode === 503 || 
        statusCode === 504) {
      return true;
    }
  }
  
  return false;
}

/**
 * Retry a function with a delay between attempts
 * 
 * @param fn Function to retry
 * @param retries Number of retries
 * @param delay Delay between retries in milliseconds
 * @param onRetry Function to call on retry
 * @returns Promise with the function result
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  onRetry?: (error: Error, attempt: number) => void
): Promise<T> {
  return withRetry(fn, {
    maxRetries: retries,
    initialDelay: delay,
    maxDelay: delay,
    factor: 1,
    onRetry
  });
}