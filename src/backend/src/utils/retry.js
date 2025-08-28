/**
 * Retry Utility
 * 
 * Provides functionality for retrying failed operations with
 * configurable backoff strategies.
 */

const { Logger } = require('./logger');
const logger = new Logger({ service: 'RetryUtility' });

/**
 * Retry a function with exponential backoff
 * @param {Function} fn Function to retry
 * @param {Object} options Retry options
 * @param {number} options.maxRetries Maximum number of retries
 * @param {number} options.initialDelay Initial delay in milliseconds
 * @param {number} options.maxDelay Maximum delay in milliseconds
 * @param {number} options.factor Backoff factor
 * @param {Function} options.onRetry Callback function called on each retry
 * @returns {Promise<any>} Result of the function
 */
async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    onRetry = null
  } = options;

  let lastError;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      if (attempt > maxRetries) {
        logger.error({
          message: `Retry failed after ${maxRetries} attempts`,
          error: error.message,
          stack: error.stack
        });
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);
      
      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const finalDelay = delay + jitter;

      logger.warn({
        message: `Retry attempt ${attempt}/${maxRetries}`,
        error: error.message,
        delay: finalDelay
      });

      // Call onRetry callback if provided
      if (onRetry && typeof onRetry === 'function') {
        onRetry(error, attempt);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }
}

/**
 * Retry a function with linear backoff
 * @param {Function} fn Function to retry
 * @param {Object} options Retry options
 * @param {number} options.maxRetries Maximum number of retries
 * @param {number} options.delay Delay in milliseconds
 * @param {Function} options.onRetry Callback function called on each retry
 * @returns {Promise<any>} Result of the function
 */
async function withLinearRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    onRetry = null
  } = options;

  let lastError;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      if (attempt > maxRetries) {
        logger.error({
          message: `Linear retry failed after ${maxRetries} attempts`,
          error: error.message,
          stack: error.stack
        });
        throw error;
      }

      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const finalDelay = delay + jitter;

      logger.warn({
        message: `Linear retry attempt ${attempt}/${maxRetries}`,
        error: error.message,
        delay: finalDelay
      });

      // Call onRetry callback if provided
      if (onRetry && typeof onRetry === 'function') {
        onRetry(error, attempt);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }
}

/**
 * Retry a function with custom retry strategy
 * @param {Function} fn Function to retry
 * @param {Object} options Retry options
 * @param {number} options.maxRetries Maximum number of retries
 * @param {Function} options.delayFn Function to calculate delay
 * @param {Function} options.retryCondition Function to determine if retry should be attempted
 * @param {Function} options.onRetry Callback function called on each retry
 * @returns {Promise<any>} Result of the function
 */
async function withCustomRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    delayFn = (attempt) => 1000 * attempt,
    retryCondition = () => true,
    onRetry = null
  } = options;

  let lastError;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      if (attempt > maxRetries || !retryCondition(error, attempt)) {
        if (attempt > maxRetries) {
          logger.error({
            message: `Custom retry failed after ${maxRetries} attempts`,
            error: error.message,
            stack: error.stack
          });
        } else {
          logger.error({
            message: `Custom retry stopped by condition`,
            error: error.message,
            stack: error.stack,
            attempt
          });
        }
        throw error;
      }

      const delay = delayFn(attempt);

      logger.warn({
        message: `Custom retry attempt ${attempt}/${maxRetries}`,
        error: error.message,
        delay
      });

      // Call onRetry callback if provided
      if (onRetry && typeof onRetry === 'function') {
        onRetry(error, attempt);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = {
  withRetry,
  withLinearRetry,
  withCustomRetry
};