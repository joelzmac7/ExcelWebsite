/**
 * Circuit Breaker Utility
 * 
 * Implements the Circuit Breaker pattern to prevent cascading failures
 * by temporarily disabling operations that are likely to fail.
 */

const { Logger } = require('./logger');

/**
 * Circuit breaker states
 */
const State = {
  CLOSED: 'CLOSED',     // Circuit is closed, requests are allowed
  OPEN: 'OPEN',         // Circuit is open, requests are not allowed
  HALF_OPEN: 'HALF_OPEN' // Circuit is half-open, limited requests are allowed
};

class CircuitBreaker {
  /**
   * Create a new CircuitBreaker
   * @param {Object} options Circuit breaker options
   * @param {number} options.failureThreshold Number of failures before opening circuit
   * @param {number} options.resetTimeout Time in ms before attempting to close circuit
   * @param {number} options.halfOpenSuccessThreshold Number of successes in half-open state to close circuit
   */
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold || 2;
    
    this.state = State.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    
    this.logger = new Logger({ service: 'CircuitBreaker' });
    
    this.logger.info({
      message: 'Circuit breaker initialized',
      failureThreshold: this.failureThreshold,
      resetTimeout: this.resetTimeout,
      halfOpenSuccessThreshold: this.halfOpenSuccessThreshold
    });
  }
  
  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn Function to execute
   * @returns {Promise<any>} Result of the function
   * @throws {Error} If circuit is open or function execution fails
   */
  async execute(fn) {
    if (this.state === State.OPEN) {
      if (Date.now() < this.nextAttempt) {
        this.logger.warn({
          message: 'Circuit is open, rejecting request',
          nextAttempt: new Date(this.nextAttempt).toISOString()
        });
        throw new Error('Circuit is open');
      }
      
      this.logger.info({
        message: 'Circuit is switching to half-open state'
      });
      this.state = State.HALF_OPEN;
      this.successCount = 0;
    }
    
    try {
      const result = await fn();
      
      this.handleSuccess();
      return result;
    } catch (error) {
      this.handleFailure(error);
      throw error;
    }
  }
  
  /**
   * Handle successful execution
   */
  handleSuccess() {
    if (this.state === State.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        this.logger.info({
          message: 'Circuit is closing after successful half-open executions',
          successCount: this.successCount,
          threshold: this.halfOpenSuccessThreshold
        });
        
        this.state = State.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
      } else {
        this.logger.debug({
          message: 'Successful execution in half-open state',
          successCount: this.successCount,
          threshold: this.halfOpenSuccessThreshold
        });
      }
    } else if (this.state === State.CLOSED && this.failureCount > 0) {
      // Reset failure count after a successful execution in closed state
      this.failureCount = 0;
      this.logger.debug({
        message: 'Resetting failure count after successful execution'
      });
    }
  }
  
  /**
   * Handle failed execution
   * @param {Error} error Error that occurred
   */
  handleFailure(error) {
    this.failureCount++;
    
    if (this.state === State.CLOSED && this.failureCount >= this.failureThreshold) {
      this.logger.warn({
        message: 'Circuit is opening due to too many failures',
        failureCount: this.failureCount,
        threshold: this.failureThreshold,
        error: error.message
      });
      
      this.state = State.OPEN;
      this.nextAttempt = Date.now() + this.resetTimeout;
    } else if (this.state === State.HALF_OPEN) {
      this.logger.warn({
        message: 'Circuit is re-opening after failure in half-open state',
        error: error.message
      });
      
      this.state = State.OPEN;
      this.nextAttempt = Date.now() + this.resetTimeout;
    } else {
      this.logger.debug({
        message: 'Failed execution in closed state',
        failureCount: this.failureCount,
        threshold: this.failureThreshold,
        error: error.message
      });
    }
  }
  
  /**
   * Get current circuit state
   * @returns {string} Current state
   */
  getState() {
    return this.state;
  }
  
  /**
   * Force circuit to open
   */
  forceOpen() {
    this.state = State.OPEN;
    this.nextAttempt = Date.now() + this.resetTimeout;
    this.logger.info({
      message: 'Circuit forced open',
      nextAttempt: new Date(this.nextAttempt).toISOString()
    });
  }
  
  /**
   * Force circuit to close
   */
  forceClose() {
    this.state = State.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.logger.info({
      message: 'Circuit forced closed'
    });
  }
  
  /**
   * Reset circuit breaker to initial state
   */
  reset() {
    this.state = State.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    this.logger.info({
      message: 'Circuit breaker reset'
    });
  }
}

module.exports = { CircuitBreaker, State };