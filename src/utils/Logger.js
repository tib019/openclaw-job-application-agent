/**
 * Logger Utility
 * 
 * Provides structured logging with levels, timestamps, and file output.
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const fs = require('fs').promises;
const path = require('path');

class Logger {
    constructor(config = {}) {
        this.config = {
            level: config.level || 'info',
            logToFile: config.logToFile !== false,
            logDir: config.logDir || '/app/logs',
            maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10 MB
            maxFiles: config.maxFiles || 5
        };

        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };

        this.currentLevel = this.levels[this.config.level] || this.levels.info;
    }

    /**
     * Log debug message
     */
    debug(message, context = {}) {
        this._log('debug', message, context);
    }

    /**
     * Log info message
     */
    info(message, context = {}) {
        this._log('info', message, context);
    }

    /**
     * Log warning message
     */
    warn(message, context = {}) {
        this._log('warn', message, context);
    }

    /**
     * Log error message
     */
    error(message, error = null, context = {}) {
        const errorContext = error ? {
            ...context,
            error: {
                message: error.message,
                stack: error.stack,
                code: error.code,
                name: error.name
            }
        } : context;

        this._log('error', message, errorContext);
    }

    /**
     * Internal log method
     */
    async _log(level, message, context) {
        if (this.levels[level] < this.currentLevel) {
            return;
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...context
        };

        // Console output with colors
        this._consoleLog(level, timestamp, message, context);

        // File output
        if (this.config.logToFile) {
            await this._fileLog(logEntry);
        }
    }

    /**
     * Console output with colors
     */
    _consoleLog(level, timestamp, message, context) {
        const colors = {
            debug: '\x1b[36m', // Cyan
            info: '\x1b[32m',  // Green
            warn: '\x1b[33m',  // Yellow
            error: '\x1b[31m'  // Red
        };
        const reset = '\x1b[0m';

        const color = colors[level] || '';
        const levelStr = level.toUpperCase().padEnd(5);
        const timeStr = timestamp.split('T')[1].split('.')[0]; // HH:MM:SS

        console.log(`${color}[${timeStr}] ${levelStr}${reset} ${message}`);

        if (context && Object.keys(context).length > 0) {
            console.log(`${color}       Context:${reset}`, JSON.stringify(context, null, 2));
        }
    }

    /**
     * File output
     */
    async _fileLog(logEntry) {
        try {
            const logFile = path.join(this.config.logDir, 'agent.log');
            const logLine = JSON.stringify(logEntry) + '\n';

            // Ensure log directory exists
            await fs.mkdir(this.config.logDir, { recursive: true });

            // Check file size and rotate if needed
            try {
                const stats = await fs.stat(logFile);
                if (stats.size > this.config.maxFileSize) {
                    await this._rotateLog(logFile);
                }
            } catch (error) {
                // File doesn't exist yet, that's fine
            }

            // Append to log file
            await fs.appendFile(logFile, logLine);
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    /**
     * Rotate log files
     */
    async _rotateLog(logFile) {
        try {
            // Rotate existing files
            for (let i = this.config.maxFiles - 1; i > 0; i--) {
                const oldFile = `${logFile}.${i}`;
                const newFile = `${logFile}.${i + 1}`;

                try {
                    await fs.rename(oldFile, newFile);
                } catch (error) {
                    // File doesn't exist, continue
                }
            }

            // Move current log to .1
            await fs.rename(logFile, `${logFile}.1`);

            this.info('Log file rotated');
        } catch (error) {
            console.error('Failed to rotate log file:', error.message);
        }
    }

    /**
     * Create child logger with context
     */
    child(context) {
        const childLogger = new Logger(this.config);
        childLogger.defaultContext = { ...this.defaultContext, ...context };
        return childLogger;
    }

    /**
     * Set log level
     */
    setLevel(level) {
        if (this.levels[level] !== undefined) {
            this.currentLevel = this.levels[level];
            this.config.level = level;
        }
    }

    /**
     * Get recent logs
     */
    async getRecentLogs(lines = 100) {
        try {
            const logFile = path.join(this.config.logDir, 'agent.log');
            const content = await fs.readFile(logFile, 'utf8');
            const logLines = content.trim().split('\n');
            
            return logLines
                .slice(-lines)
                .map(line => JSON.parse(line))
                .reverse();
        } catch (error) {
            return [];
        }
    }
}

// Global logger instance
let globalLogger = null;

/**
 * Get or create global logger
 */
function getLogger(config) {
    if (!globalLogger) {
        globalLogger = new Logger(config);
    }
    return globalLogger;
}

module.exports = { Logger, getLogger };
