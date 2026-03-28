/**
 * Error Handler Utility
 * 
 * Provides centralized error handling, retry logic, and error reporting.
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

class ErrorHandler {
    constructor(config = {}) {
        this.config = {
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 1000, // ms
            exponentialBackoff: config.exponentialBackoff !== false,
            logErrors: config.logErrors !== false
        };
        this.errorLog = [];
    }

    /**
     * Execute function with retry logic
     * 
     * @param {Function} fn - Function to execute
     * @param {Object} options - Retry options
     * @returns {Promise} Result of function execution
     */
    async withRetry(fn, options = {}) {
        const maxRetries = options.maxRetries || this.config.maxRetries;
        const retryDelay = options.retryDelay || this.config.retryDelay;
        const retryableErrors = options.retryableErrors || [
            'ECONNRESET',
            'ETIMEDOUT',
            'ENOTFOUND',
            'ECONNREFUSED',
            'RATE_LIMIT',
            'NETWORK_ERROR'
        ];

        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                // Check if error is retryable
                const isRetryable = retryableErrors.some(errType => 
                    error.code === errType || 
                    error.message?.includes(errType) ||
                    error.name === errType
                );

                if (!isRetryable || attempt === maxRetries) {
                    this.logError(error, { attempt, maxRetries, retryable: isRetryable });
                    throw error;
                }

                // Calculate delay with exponential backoff
                const delay = this.config.exponentialBackoff 
                    ? retryDelay * Math.pow(2, attempt)
                    : retryDelay;

 console.warn(` Attempt ${attempt + 1}/${maxRetries + 1} failed: ${error.message}`);
                console.warn(`Retrying in ${delay}ms...`);

                await this.sleep(delay);
            }
        }

        throw lastError;
    }

    /**
     * Execute function with timeout
     * 
     * @param {Function} fn - Function to execute
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise} Result of function execution
     */
    async withTimeout(fn, timeout = 30000) {
        return Promise.race([
            fn(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Operation timed out')), timeout)
            )
        ]);
    }

    /**
     * Wrap async function with error handling
     * 
     * @param {Function} fn - Function to wrap
     * @param {Object} options - Error handling options
     * @returns {Function} Wrapped function
     */
    wrap(fn, options = {}) {
        return async (...args) => {
            try {
                if (options.timeout) {
                    return await this.withTimeout(() => fn(...args), options.timeout);
                }
                if (options.retry) {
                    return await this.withRetry(() => fn(...args), options);
                }
                return await fn(...args);
            } catch (error) {
                this.logError(error, { function: fn.name, args });
                
                if (options.fallback) {
 console.warn(` Using fallback for ${fn.name}`);
                    return options.fallback;
                }
                
                if (options.silent) {
                    return null;
                }
                
                throw error;
            }
        };
    }

    /**
     * Log error with context
     * 
     * @param {Error} error - Error to log
     * @param {Object} context - Additional context
     */
    logError(error, context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            code: error.code,
            name: error.name,
            context
        };

        this.errorLog.push(errorEntry);

        if (this.config.logErrors) {
 console.error('Error:', error.message);
            if (context && Object.keys(context).length > 0) {
                console.error('Context:', JSON.stringify(context, null, 2));
            }
        }

        // Keep only last 100 errors
        if (this.errorLog.length > 100) {
            this.errorLog.shift();
        }
    }

    /**
     * Get error statistics
     * 
     * @returns {Object} Error statistics
     */
    getStats() {
        const now = Date.now();
        const last24h = this.errorLog.filter(e => 
            now - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
        );

        const errorTypes = {};
        last24h.forEach(e => {
            errorTypes[e.name] = (errorTypes[e.name] || 0) + 1;
        });

        return {
            total: this.errorLog.length,
            last24h: last24h.length,
            errorTypes,
            recentErrors: this.errorLog.slice(-10)
        };
    }

    /**
     * Clear error log
     */
    clearLog() {
        this.errorLog = [];
    }

    /**
     * Sleep utility
     * 
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create custom error
     * 
     * @param {string} name - Error name
     * @param {string} message - Error message
     * @param {Object} details - Additional details
     * @returns {Error} Custom error
     */
    static createError(name, message, details = {}) {
        const error = new Error(message);
        error.name = name;
        Object.assign(error, details);
        return error;
    }
}

// Common error types
ErrorHandler.NetworkError = (message, details) => 
    ErrorHandler.createError('NETWORK_ERROR', message, details);

ErrorHandler.RateLimitError = (message, details) => 
    ErrorHandler.createError('RATE_LIMIT', message, details);

ErrorHandler.ValidationError = (message, details) => 
    ErrorHandler.createError('VALIDATION_ERROR', message, details);

ErrorHandler.ConfigError = (message, details) => 
    ErrorHandler.createError('CONFIG_ERROR', message, details);

module.exports = ErrorHandler;
