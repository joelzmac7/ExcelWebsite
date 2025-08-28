/**
 * Logger Utility
 * 
 * Provides a consistent logging interface throughout the application
 * with support for different log levels, structured logging, and
 * context-aware logging.
 */

const winston = require('winston');

class Logger {
  constructor(options = {}) {
    const { service, level = 'info' } = options;

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    // Create logger instance
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || level,
      format: logFormat,
      defaultMeta: { service },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
              return `${timestamp} [${service}] ${level}: ${typeof message === 'object' ? JSON.stringify(message) : message} ${
                Object.keys(meta).length ? JSON.stringify(meta) : ''
              }`;
            })
          )
        })
      ]
    });

    // Add file transports for production
    if (process.env.NODE_ENV === 'production') {
      this.logger.add(
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
      );
      this.logger.add(
        new winston.transports.File({ filename: 'logs/combined.log' })
      );
    }
  }

  /**
   * Create a child logger with additional context
   * @param {Object} context Additional context to include in logs
   * @returns {Logger} Child logger instance
   */
  child(context) {
    const childLogger = new Logger();
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }

  /**
   * Log a debug message
   * @param {string|Object} message Message or object to log
   */
  debug(message) {
    this.logger.debug(message);
  }

  /**
   * Log an info message
   * @param {string|Object} message Message or object to log
   */
  info(message) {
    this.logger.info(message);
  }

  /**
   * Log a warning message
   * @param {string|Object} message Message or object to log
   */
  warn(message) {
    this.logger.warn(message);
  }

  /**
   * Log an error message
   * @param {string|Object} message Message or object to log
   */
  error(message) {
    this.logger.error(message);
  }

  /**
   * Log a critical message
   * @param {string|Object} message Message or object to log
   */
  critical(message) {
    this.logger.error({ ...message, level: 'critical' });
  }

  /**
   * Log a request
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @param {number} responseTime Response time in milliseconds
   */
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      responseTime,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id
    };

    if (res.statusCode >= 400) {
      this.warn({ message: 'Request failed', ...logData });
    } else {
      this.debug({ message: 'Request completed', ...logData });
    }
  }

  /**
   * Log an API call
   * @param {string} service Service name
   * @param {string} method HTTP method
   * @param {number} status HTTP status code
   * @param {number} duration Duration in milliseconds
   */
  logApiCall(service, method, status, duration) {
    const logData = {
      service,
      method,
      status,
      duration
    };

    if (status >= 400) {
      this.warn({ message: 'API call failed', ...logData });
    } else {
      this.debug({ message: 'API call completed', ...logData });
    }
  }
}

module.exports = { Logger };