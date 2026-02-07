/**
 * Health Check Endpoint
 * 
 * Provides system health status for monitoring and debugging.
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const os = require('os');
const fs = require('fs').promises;

class HealthCheck {
    constructor(applicationQueue, githubService, errorHandler) {
        this.applicationQueue = applicationQueue;
        this.githubService = githubService;
        this.errorHandler = errorHandler;
        this.startTime = Date.now();
    }

    /**
     * Get full health status
     */
    async getStatus() {
        const status = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: this.getUptime(),
            system: await this.getSystemInfo(),
            services: await this.getServicesStatus(),
            queue: await this.getQueueStatus(),
            errors: this.getErrorStats()
        };

        // Determine overall status
        const servicesHealthy = Object.values(status.services).every(s => s.status === 'healthy');
        if (!servicesHealthy) {
            status.status = 'degraded';
        }

        return status;
    }

    /**
     * Get simple health check (for load balancers)
     */
    async getSimpleStatus() {
        try {
            // Check if application queue is accessible
            await this.applicationQueue.getStats();
            
            return {
                status: 'ok',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Get uptime
     */
    getUptime() {
        const uptimeMs = Date.now() - this.startTime;
        const uptimeSec = Math.floor(uptimeMs / 1000);
        
        const days = Math.floor(uptimeSec / 86400);
        const hours = Math.floor((uptimeSec % 86400) / 3600);
        const minutes = Math.floor((uptimeSec % 3600) / 60);
        const seconds = uptimeSec % 60;

        return {
            milliseconds: uptimeMs,
            formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`
        };
    }

    /**
     * Get system information
     */
    async getSystemInfo() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        return {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            cpus: os.cpus().length,
            memory: {
                total: this.formatBytes(totalMem),
                used: this.formatBytes(usedMem),
                free: this.formatBytes(freeMem),
                usagePercent: Math.round((usedMem / totalMem) * 100)
            },
            loadAverage: os.loadavg()
        };
    }

    /**
     * Get services status
     */
    async getServicesStatus() {
        const services = {};

        // Application Queue
        try {
            await this.applicationQueue.getStats();
            services.applicationQueue = {
                status: 'healthy',
                message: 'Queue is accessible'
            };
        } catch (error) {
            services.applicationQueue = {
                status: 'unhealthy',
                message: error.message
            };
        }

        // GitHub Service
        try {
            if (this.githubService && this.githubService.cache) {
                services.githubService = {
                    status: 'healthy',
                    message: 'GitHub service initialized',
                    cacheAge: this.getCacheAge(this.githubService.cacheTimestamp)
                };
            } else {
                services.githubService = {
                    status: 'degraded',
                    message: 'GitHub service not initialized'
                };
            }
        } catch (error) {
            services.githubService = {
                status: 'unhealthy',
                message: error.message
            };
        }

        // File System
        try {
            await fs.access('/app/data');
            await fs.access('/app/logs');
            services.fileSystem = {
                status: 'healthy',
                message: 'All directories accessible'
            };
        } catch (error) {
            services.fileSystem = {
                status: 'unhealthy',
                message: error.message
            };
        }

        return services;
    }

    /**
     * Get queue status
     */
    async getQueueStatus() {
        try {
            const stats = await this.applicationQueue.getStats();
            return {
                accessible: true,
                stats
            };
        } catch (error) {
            return {
                accessible: false,
                error: error.message
            };
        }
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        if (!this.errorHandler) {
            return { available: false };
        }

        try {
            return {
                available: true,
                ...this.errorHandler.getStats()
            };
        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Format bytes to human-readable
     */
    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Get cache age
     */
    getCacheAge(timestamp) {
        if (!timestamp) return 'unknown';
        const ageMs = Date.now() - timestamp;
        const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
        return `${ageHours} hours`;
    }
}

module.exports = HealthCheck;
