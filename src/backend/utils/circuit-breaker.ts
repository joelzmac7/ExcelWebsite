/**
 * Circuit Breaker Utility
 * 
 * This utility implements the Circuit Breaker pattern to prevent cascading failures
 * when a service is experiencing issues. It helps improve system resilience by
 * failing fast when a service is known to be unavailable.
 */

/**
 * Circuit breaker states
 */
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Options for circuit breaker
 */
export interface CircuitBreakerOptions {
  /**
   * Number of failures before opening the circuit
   */
  failureThreshold: number;
  
  /**
   * Time in milliseconds before attempting to close the circuit again
   */
  resetTimeout: number;
  
  /**
   * Function to determine if an error should count as a failure
   */
  isFailure?: (error: Error) => boolean;
  
  /**
   * Function called when circuit state changes
   */
  onStateChange?: (from: CircuitBreakerState, to: CircuitBreakerState) => void;
}

/**
 * Default circuit breaker options
 */
const defaultOptions: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 30000
};

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number | null = null;
  private readonly options: CircuitBreakerOptions;
  
  /**
   * Create a new circuit breaker
   * 
   * @param options Circuit breaker options
   */
  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      ...defaultOptions,
      ...options
    };
  }
  
  /**
   * Execute a function with circuit breaker protection
   * 
   * @param fn Function to execute
   * @returns Promise with the function result
   * @throws Error if circuit is open or function execution fails
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // Check if reset timeout has elapsed
      if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.setState('HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      // Execute the function
      const result = await fn();
      
      // If successful and in HALF_OPEN state, close the circuit
      if (this.state === 'HALF_OPEN') {
        this.setState('CLOSED');
      }
      
      // Reset failure count on success
      this.failureCount = 0;
      
      return result;
    } catch (error) {
      // Handle failure
      return this.handleFailure(error as Error);
    }
  }
  
  /**
   * Handle a failure
   * 
   * @param error Error that occurred
   * @throws The original error
   */
  private handleFailure<T>(error: Error): never {
    // Check if this error counts as a failure
    if (!this.options.isFailure || this.options.isFailure(error)) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      // If in HALF_OPEN state, any failure opens the circuit
      if (this.state === 'HALF_OPEN') {
        this.setState('OPEN');
      }
      // If failure threshold is reached, open the circuit
      else if (this.state === 'CLOSED' && this.failureCount >= this.options.failureThreshold) {
        this.setState('OPEN');
      }
    }
    
    throw error;
  }
  
  /**
   * Change the circuit breaker state
   * 
   * @param newState New state
   */
  private setState(newState: CircuitBreakerState): void {
    if (this.state !== newState) {
      const previousState = this.state;
      this.state = newState;
      
      // Reset failure count when closing the circuit
      if (newState === 'CLOSED') {
        this.failureCount = 0;
      }
      
      // Call state change callback if provided
      if (this.options.onStateChange) {
        this.options.onStateChange(previousState, newState);
      }
    }
  }
  
  /**
   * Get the current state of the circuit breaker
   * 
   * @returns Current state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }
  
  /**
   * Get the current failure count
   * 
   * @returns Current failure count
   */
  getFailureCount(): number {
    return this.failureCount;
  }
  
  /**
   * Reset the circuit breaker to its initial state
   */
  reset(): void {
    this.setState('CLOSED');
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
  
  /**
   * Force the circuit breaker to open
   */
  forceOpen(): void {
    this.setState('OPEN');
    this.lastFailureTime = Date.now();
  }
  
  /**
   * Force the circuit breaker to close
   */
  forceClose(): void {
    this.setState('CLOSED');
  }
}

/**
 * Create a circuit breaker for a specific service
 * 
 * @param serviceName Name of the service
 * @param options Circuit breaker options
 * @returns Circuit breaker instance
 */
export function createCircuitBreaker(
  serviceName: string,
  options: Partial<CircuitBreakerOptions> = {}
): CircuitBreaker {
  return new CircuitBreaker({
    ...options,
    onStateChange: (from, to) => {
      console.log(`Circuit breaker for ${serviceName} changed from ${from} to ${to}`);
      if (options.onStateChange) {
        options.onStateChange(from, to);
      }
    }
  });
}