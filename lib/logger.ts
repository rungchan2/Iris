/**
 * Logger utility for the application
 *
 * Usage:
 * - Development: Logs to console
 * - Production: Can be extended to send to Sentry or other services
 *
 * Example:
 * import { logger } from '@/lib/logger'
 * logger.error('Error message', error)
 * logger.warn('Warning message', data)
 * logger.info('Info message', data)
 * logger.debug('Debug message', data)
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LoggerOptions {
  context?: string
  data?: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private log(level: LogLevel, message: string, options?: LoggerOptions) {
    const timestamp = new Date().toISOString()
    const context = options?.context ? `[${options.context}]` : ''
    const formattedMessage = `${timestamp} ${level.toUpperCase()} ${context} ${message}`

    // Development: Always log to console
    if (this.isDevelopment) {
      switch (level) {
        case 'error':
          console.error(formattedMessage, options?.data || '')
          break
        case 'warn':
          console.warn(formattedMessage, options?.data || '')
          break
        case 'info':
          console.info(formattedMessage, options?.data || '')
          break
        case 'debug':
          console.log(formattedMessage, options?.data || '')
          break
      }
    }

    // Production: Send errors and warnings to external service
    if (this.isProduction && (level === 'error' || level === 'warn')) {
      // TODO: Send to Sentry or other error tracking service
      // Example:
      // Sentry.captureMessage(formattedMessage, {
      //   level: level as Sentry.SeverityLevel,
      //   extra: options?.data
      // })
    }
  }

  error(message: string, error?: Error | unknown, context?: string) {
    this.log('error', message, {
      context,
      data: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    })
  }

  warn(message: string, data?: any, context?: string) {
    this.log('warn', message, { context, data })
  }

  info(message: string, data?: any, context?: string) {
    this.log('info', message, { context, data })
  }

  debug(message: string, data?: any, context?: string) {
    // Only log debug messages in development
    if (this.isDevelopment) {
      this.log('debug', message, { context, data })
    }
  }

  /**
   * Create a logger with a specific context
   * @param context - Context name (e.g., 'MatchingService', 'PaymentService')
   */
  withContext(context: string) {
    return {
      error: (message: string, error?: Error | unknown) => this.error(message, error, context),
      warn: (message: string, data?: any) => this.warn(message, data, context),
      info: (message: string, data?: any) => this.info(message, data, context),
      debug: (message: string, data?: any) => this.debug(message, data, context)
    }
  }
}

export const logger = new Logger()

// Export context-specific loggers for convenience
export const matchingLogger = logger.withContext('Matching')
export const paymentLogger = logger.withContext('Payment')
export const authLogger = logger.withContext('Auth')
export const photographerLogger = logger.withContext('Photographer')
export const bookingLogger = logger.withContext('Booking')
export const uploadLogger = logger.withContext('Upload')
export const webhookLogger = logger.withContext('Webhook')
export const embeddingLogger = logger.withContext('Embedding')
export const adminLogger = logger.withContext('Admin')
export const reviewLogger = logger.withContext('Review')
export const settlementLogger = logger.withContext('Settlement')
