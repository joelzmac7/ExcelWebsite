/**
 * Logger Utility
 * 
 * This utility provides a consistent logging interface throughout the application.
 * It supports different log levels, structured logging, and can be configured
 * to output logs in different formats based on the environment.
 */

/**
 * Log levels
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service?: string;
  [key: string]: any;
}

/**
 * Logger options
 */
export interface LoggerOptions {
  /**
   * Minimum log level to output
   */
  level: LogLevel;
  
  /**
   * Service name for the logger
   */
  service?: string;
  
  /**
   * Whether to pretty print logs (useful for development)
   */
  prettyPrint?: boolean;
  
  /**
   * Additional default fields to include in all logs
   */
  defaultFields?: Record<string, any>;
  
  /**
   * Custom log handler function
   */
  logHandler?: (entry: LogEntry) => void;
}

/**
 * Default logger options
 */
const defaultOptions: LoggerOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  prettyPrint: process.env.NODE_ENV !== 'production',
  defaultFields: {}
};

/**
 * Log level priorities (higher number = more verbose)
 */
const LOG_LEVEL_PRIORITIES: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4
};

/**
 * Logger implementation
 */
export class Logger {
  private readonly options: LoggerOptions;
  
  /**
   * Create a new logger
   * 
   * @param options Logger options
   */
  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = {
      ...defaultOptions,
      ...options,
      defaultFields: {
        ...defaultOptions.defaultFields,
        ...options.defaultFields
      }
    };
  }
  
  /**
   * Log an error message
   * 
   * @param messageOrObject Message or object to log
   */
  error(messageOrObject: string | Record<string, any>): void {
    this.log('error', messageOrObject);
  }
  
  /**
   * Log a warning message
   * 
   * @param messageOrObject Message or object to log
   */
  warn(messageOrObject: string | Record<string, any>): void {
    this.log('warn', messageOrObject);
  }
  
  /**
   * Log an info message
   * 
   * @param messageOrObject Message or object to log
   */
  info(messageOrObject: string | Record<string, any>): void {
    this.log('info', messageOrObject);
  }
  
  /**
   * Log a debug message
   * 
   * @param messageOrObject Message or object to log
   */
  debug(messageOrObject: string | Record<string, any>): void {
    this.log('debug', messageOrObject);
  }
  
  /**
   * Log a trace message
   * 
   * @param messageOrObject Message or object to log
   */
  trace(messageOrObject: string | Record<string, any>): void {
    this.log('trace', messageOrObject);
  }
  
  /**
   * Log a message at the specified level
   * 
   * @param level Log level
   * @param messageOrObject Message or object to log
   */
  log(level: LogLevel, messageOrObject: string | Record<string, any>): void {
    // Check if this log level should be output
    if (LOG_LEVEL_PRIORITIES[level] > LOG_LEVEL_PRIORITIES[this.options.level]) {
      return;
    }
    
    // Create log entry
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      ...this.options.defaultFields
    };
    
    // Add service name if provided
    if (this.options.service) {
      entry.service = this.options.service;
    }
    
    // Handle string or object message
    if (typeof messageOrObject === 'string') {
      entry.message = messageOrObject;
    } else {
      Object.assign(entry, messageOrObject);
    }
    
    // Use custom log handler if provided, otherwise use console
    if (this.options.logHandler) {
      this.options.logHandler(entry);
    } else {
      this.consoleLog(entry);
    }
  }
  
  /**
   * Log to console with appropriate formatting
   * 
   * @param entry Log entry
   */
  private consoleLog(entry: LogEntry): void {
    const { level, timestamp, message, ...rest } = entry;
    
    // Choose console method based on log level
    let consoleMethod: 'error' | 'warn' | 'info' | 'debug' | 'log';
    switch (level) {
      case 'error':
        consoleMethod = 'error';
        break;
      case 'warn':
        consoleMethod = 'warn';
        break;
      case 'info':
        consoleMethod = 'info';
        break;
      case 'debug':
        consoleMethod = 'debug';
        break;
      default:
        consoleMethod = 'log';
    }
    
    // Format log output
    if (this.options.prettyPrint) {
      // Pretty print for development
      const levelColor = this.getLevelColor(level);
      const reset = '\x1b[0m';
      const prefix = `${levelColor}[${level.toUpperCase()}]\x1b[0m [${timestamp}]`;
      
      if (Object.keys(rest).length > 0) {
        console[consoleMethod](`${prefix} ${message}`, rest);
      } else {
        console[consoleMethod](`${prefix} ${message}`);
      }
    } else {
      // JSON format for production
      console[consoleMethod](JSON.stringify(entry));
    }
  }
  
  /**
   * Get ANSI color code for log level
   * 
   * @param level Log level
   * @returns ANSI color code
   */
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case 'error':
        return '\x1b[31m'; // Red
      case 'warn':
        return '\x1b[33m'; // Yellow
      case 'info':
        return '\x1b[32m'; // Green
      case 'debug':
        return '\x1b[36m'; // Cyan
      case 'trace':
        return '\x1b[90m'; // Gray
      default:
        return '\x1b[0m'; // Reset
    }
  }
  
  /**
   * Create a child logger with additional default fields
   * 
   * @param fields Additional default fields
   * @returns Child logger
   */
  child(fields: Record<string, any>): Logger {
    return new Logger({
      ...this.options,
      defaultFields: {
        ...this.options.defaultFields,
        ...fields
      }
    });
  }
  
  /**
   * Create a child logger for a specific service
   * 
   * @param service Service name
   * @returns Child logger
   */
  service(service: string): Logger {
    return this.child({ service });
  }
}

/**
 * Create the default application logger
 */
export const createLogger = (service?: string): Logger => {
  return new Logger({
    level: (process.env.LOG_LEVEL as LogLevel) || defaultOptions.level,
    service,
    prettyPrint: process.env.NODE_ENV !== 'production'
  });
};

/**
 * Default application logger
 */
export const logger = createLogger('app');