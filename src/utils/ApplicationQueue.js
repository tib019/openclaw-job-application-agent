/**
 * Application Queue System
 * 
 * Manages the lifecycle of job applications through different states:
 * - PENDING_REVIEW: Application prepared, waiting for user approval
 * - APPROVED: User approved, ready to send
 * - SENT: Application successfully sent
 * - FAILED: Sending failed, needs manual intervention
 * - REJECTED: User rejected this application
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const fs = require('fs').promises;
const path = require('path');

class ApplicationQueue {
    constructor(queueFilePath = '/app/data/application_queue.json') {
        this.queueFilePath = queueFilePath;
        this.queue = [];
    }

    /**
     * Initialize the queue by loading from file
     */
    async initialize() {
        try {
            const data = await fs.readFile(this.queueFilePath, 'utf8');
            this.queue = JSON.parse(data);
 console.log(`Loaded ${this.queue.length} applications from queue`);
        } catch (error) {
            if (error.code === 'ENOENT') {
 console.log('No existing queue found, starting fresh');
                this.queue = [];
                await this.save();
            } else {
                throw error;
            }
        }
    }

    /**
     * Save the queue to file
     */
    async save() {
        await fs.writeFile(
            this.queueFilePath,
            JSON.stringify(this.queue, null, 2),
            'utf8'
        );
    }

    /**
     * Add a new application to the queue
     * 
     * @param {Object} application - Application data
     * @param {string} application.company - Company name
     * @param {string} application.position - Job position
     * @param {string} application.url - Job posting URL
     * @param {string} application.source - Source (email, linkedin, etc.)
     * @param {Object} application.documents - Generated documents
     * @param {Object} application.metadata - Additional metadata
     * @param {Object} application.features - ML features (for training data)
     * @param {number} application.matchScore - Match score (0-100)
     * @returns {number} Application ID
     */
    async add(application) {
        const id = this.queue.length > 0 
            ? Math.max(...this.queue.map(a => a.id)) + 1 
            : 1;

        const newApplication = {
            id,
            status: 'PENDING_REVIEW',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            decision: null, // Will be set when user approves/rejects
            ...application,
            // Ensure features exist for ML training
            features: application.features || {}
        };

        this.queue.push(newApplication);
        await this.save();

 console.log(`Added application #${id}: ${application.company} - ${application.position}`);
        return id;
    }

    /**
     * Get application by ID
     * 
     * @param {number} id - Application ID
     * @returns {Object|null} Application or null if not found
     */
    get(id) {
        return this.queue.find(app => app.id === id) || null;
    }

    /**
     * Get all applications with a specific status
     * 
     * @param {string} status - Status to filter by
     * @returns {Array} Applications with the given status
     */
    getByStatus(status) {
        return this.queue.filter(app => app.status === status);
    }

    /**
     * Update application status
     * 
     * @param {number} id - Application ID
     * @param {string} newStatus - New status
     * @param {Object} additionalData - Additional data to merge
     * @returns {boolean} Success
     */
    async updateStatus(id, newStatus, additionalData = {}) {
        const app = this.get(id);
        if (!app) {
 console.error(`Application #${id} not found`);
            return false;
        }

        app.status = newStatus;
        app.updatedAt = new Date().toISOString();
        Object.assign(app, additionalData);

        await this.save();
 console.log(`️ Updated application #${id} to status: ${newStatus}`);
        return true;
    }

    /**
     * Approve an application
     * 
     * @param {number} id - Application ID
     * @returns {boolean} Success
     */
    async approve(id) {
        return await this.updateStatus(id, 'APPROVED', { decision: 'approved' });
    }

    /**
     * Approve all pending applications
     * 
     * @returns {number} Number of approved applications
     */
    async approveAll() {
        const pending = this.getByStatus('PENDING_REVIEW');
        let count = 0;

        for (const app of pending) {
            if (await this.approve(app.id)) {
                count++;
            }
        }

 console.log(`Approved ${count} applications`);
        return count;
    }

    /**
     * Reject an application
     * 
     * @param {number} id - Application ID
     * @returns {boolean} Success
     */
    async reject(id) {
        return await this.updateStatus(id, 'REJECTED', { decision: 'rejected' });
    }

    /**
     * Mark application as sent
     * 
     * @param {number} id - Application ID
     * @param {Object} sendResult - Result of the send operation
     * @returns {boolean} Success
     */
    async markAsSent(id, sendResult = {}) {
        return await this.updateStatus(id, 'SENT', {
            sentAt: new Date().toISOString(),
            sendResult
        });
    }

    /**
     * Mark application as failed
     * 
     * @param {number} id - Application ID
     * @param {string} error - Error message
     * @returns {boolean} Success
     */
    async markAsFailed(id, error) {
        return await this.updateStatus(id, 'FAILED', {
            failedAt: new Date().toISOString(),
            error
        });
    }

    /**
     * Get statistics
     * 
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            total: this.queue.length,
            pending: this.getByStatus('PENDING_REVIEW').length,
            approved: this.getByStatus('APPROVED').length,
            sent: this.getByStatus('SENT').length,
            failed: this.getByStatus('FAILED').length,
            rejected: this.getByStatus('REJECTED').length
        };
    }

    /**
     * Get applications sent in the last N days
     * 
     * @param {number} days - Number of days to look back
     * @returns {Array} Applications
     */
    getRecentlySent(days = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        return this.queue.filter(app => 
            app.status === 'SENT' && 
            new Date(app.sentAt) >= cutoff
        );
    }
}

module.exports = ApplicationQueue;
