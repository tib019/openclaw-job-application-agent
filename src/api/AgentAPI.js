/**
 * Agent REST API
 * 
 * Provides HTTP endpoints for the Telegram Bot to interact with the agent.
 * 
 * Endpoints:
 * - GET  /api/queue/stats - Get queue statistics
 * - GET  /api/queue/stats/detailed - Get detailed statistics
 * - GET  /api/queue/list/:status - List applications by status
 * - GET  /api/queue/get/:id - Get single application
 * - POST /api/queue/approve/:id - Approve application
 * - POST /api/queue/approve-all - Approve all pending
 * - POST /api/queue/reject/:id - Reject application
 * - POST /api/queue/send-all - Send all approved applications
 * - GET  /api/health - Health check
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const express = require('express');
const ApplicationQueue = require('../utils/ApplicationQueue');
const EmailSenderSkill = require('../skills/EmailSenderSkill');

class AgentAPI {
    constructor(config) {
        this.config = config;
        this.app = express();
        this.queue = null;
        this.emailSender = null;
        this.githubService = null;

        // Middleware
        this.app.use(express.json());
        this.app.use(this._logRequest.bind(this));

        // Initialize routes
        this._setupRoutes();
    }

    /**
     * Initialize the API
     */
    async initialize() {
        // Initialize queue
        this.queue = new ApplicationQueue('/app/data/application_queue.json');
        await this.queue.initialize();

        // Initialize email sender
        this.emailSender = new EmailSenderSkill(this.config.email);
        await this.emailSender.initialize();

        // Initialize GitHub service
        const GitHubService = require('../services/GitHubService');
        this.githubService = new GitHubService({
            githubToken: process.env.GITHUB_TOKEN,
            githubUsername: process.env.GITHUB_USERNAME
        });
        await this.githubService.initialize();

        console.log('✅ Agent API initialized');
    }

    /**
     * Setup all routes
     */
    _setupRoutes() {
        // Health check
        this.app.get('/api/health', this._handleHealth.bind(this));

        // Queue statistics
        this.app.get('/api/queue/stats', this._handleGetStats.bind(this));
        this.app.get('/api/queue/stats/detailed', this._handleGetDetailedStats.bind(this));

        // Queue operations
        this.app.get('/api/queue/list/:status', this._handleListByStatus.bind(this));
        this.app.get('/api/queue/get/:id', this._handleGetApplication.bind(this));
        this.app.post('/api/queue/approve/:id', this._handleApprove.bind(this));
        this.app.post('/api/queue/approve-all', this._handleApproveAll.bind(this));
        this.app.post('/api/queue/reject/:id', this._handleReject.bind(this));
        this.app.post('/api/queue/send-all', this._handleSendAll.bind(this));
        
        // Batch operations (for LLM Function Calling)
        this.app.post('/api/queue/reject-batch', this._handleRejectBatch.bind(this));
        this.app.post('/api/queue/approve-batch', this._handleApproveBatch.bind(this));
        this.app.get('/api/queue/list-filtered', this._handleListFiltered.bind(this));
        
        // ML training data export
        this.app.get('/api/ml/export-training-data', this._handleExportTrainingData.bind(this));

        // Prompt processing (LLM Function Calling)
        this.app.post('/api/prompt/process', this._handleProcessPrompt.bind(this));

        // GitHub repository analysis
        this.app.get('/api/github/repos', this._handleGetRepos.bind(this));
        this.app.post('/api/github/refresh', this._handleRefreshRepos.bind(this));
    }

    /**
     * Middleware: Log all requests
     */
    _logRequest(req, res, next) {
        console.log(`📡 ${req.method} ${req.path}`);
        next();
    }

    /**
     * GET /api/health
     */
    async _handleHealth(req, res) {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '0.1.0'
        });
    }

    /**
     * GET /api/queue/stats
     */
    async _handleGetStats(req, res) {
        try {
            const stats = this.queue.getStats();
            res.json(stats);
        } catch (error) {
            console.error('❌ Error getting stats:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /api/queue/stats/detailed
     */
    async _handleGetDetailedStats(req, res) {
        try {
            const stats = this.queue.getStats();
            const recentlySent = this.queue.getRecentlySent(30);

            const total = stats.total;
            const sent = stats.sent;
            const failed = stats.failed;
            const successRate = total > 0 
                ? Math.round((sent / (sent + failed)) * 100) 
                : 0;

            res.json({
                ...stats,
                sent_last_30_days: recentlySent.length,
                success_rate: successRate
            });
        } catch (error) {
            console.error('❌ Error getting detailed stats:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /api/queue/list/:status
     */
    async _handleListByStatus(req, res) {
        try {
            const status = req.params.status.toUpperCase();
            const applications = this.queue.getByStatus(status);
            res.json(applications);
        } catch (error) {
            console.error('❌ Error listing applications:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /api/queue/get/:id
     */
    async _handleGetApplication(req, res) {
        try {
            const id = parseInt(req.params.id);
            const application = this.queue.get(id);

            if (!application) {
                return res.status(404).json({ error: 'Application not found' });
            }

            res.json(application);
        } catch (error) {
            console.error('❌ Error getting application:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /api/queue/approve/:id
     */
    async _handleApprove(req, res) {
        try {
            const id = parseInt(req.params.id);
            const success = await this.queue.approve(id);

            if (!success) {
                return res.status(404).json({ error: 'Application not found' });
            }

            res.json({ success: true, id });
        } catch (error) {
            console.error('❌ Error approving application:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /api/queue/approve-all
     */
    async _handleApproveAll(req, res) {
        try {
            const count = await this.queue.approveAll();
            res.json({ success: true, count });
        } catch (error) {
            console.error('❌ Error approving all:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /api/queue/reject/:id
     */
    async _handleReject(req, res) {
        try {
            const id = parseInt(req.params.id);
            const success = await this.queue.reject(id);

            if (!success) {
                return res.status(404).json({ error: 'Application not found' });
            }

            res.json({ success: true, id });
        } catch (error) {
            console.error('❌ Error rejecting application:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * POST /api/queue/send-all
     */
    async _handleSendAll(req, res) {
        try {
            const approved = this.queue.getByStatus('APPROVED');
            let sent = 0;
            let failed = 0;

            console.log(`📤 Sending ${approved.length} approved applications...`);

            for (const app of approved) {
                try {
                    // Send application
                    const result = await this.emailSender.sendApplication(app);
                    
                    if (result.success) {
                        await this.queue.markAsSent(app.id, result);
                        sent++;
                        console.log(`✅ Sent application #${app.id}`);
                    } else {
                        await this.queue.markAsFailed(app.id, result.error);
                        failed++;
                        console.error(`❌ Failed to send application #${app.id}: ${result.error}`);
                    }
                } catch (error) {
                    await this.queue.markAsFailed(app.id, error.message);
                    failed++;
                    console.error(`❌ Error sending application #${app.id}:`, error);
                }
            }

            console.log(`📊 Send complete: ${sent} sent, ${failed} failed`);

            res.json({
                success: true,
                sent,
                failed,
                total: approved.length
            });
        } catch (error) {
            console.error('❌ Error in send-all:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Start the API server
     */
    async start(port = 3000) {
        await this.initialize();

        this.app.listen(port, '0.0.0.0', () => {
            console.log(`🚀 Agent API listening on port ${port}`);
        });
    }

    /**
     * Handle: POST /api/queue/reject-batch
     * Reject multiple applications based on filter criteria
     */
    async _handleRejectBatch(req, res) {
        try {
            const { filter } = req.body;
            
            if (!filter) {
                return res.status(400).json({ error: 'Filter criteria required' });
            }

            const applications = this.queue.getByStatus('PENDING_REVIEW');
            let rejectedCount = 0;

            for (const app of applications) {
                let shouldReject = false;

                // Filter by match score
                if (filter.maxScore !== undefined && app.matchScore <= filter.maxScore) {
                    shouldReject = true;
                }

                // Filter by company size
                if (filter.maxCompanySize !== undefined && 
                    app.features?.companySize <= filter.maxCompanySize) {
                    shouldReject = true;
                }

                // Filter by keywords in position
                if (filter.excludeKeywords && Array.isArray(filter.excludeKeywords)) {
                    const positionLower = app.position.toLowerCase();
                    if (filter.excludeKeywords.some(keyword => 
                        positionLower.includes(keyword.toLowerCase()))) {
                        shouldReject = true;
                    }
                }

                if (shouldReject) {
                    await this.queue.reject(app.id);
                    rejectedCount++;
                }
            }

            res.json({
                success: true,
                rejectedCount,
                message: `Rejected ${rejectedCount} applications`
            });
        } catch (error) {
            console.error('❌ Error in reject-batch:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Handle: POST /api/queue/approve-batch
     * Approve multiple applications based on filter criteria
     */
    async _handleApproveBatch(req, res) {
        try {
            const { filter } = req.body;
            
            if (!filter) {
                return res.status(400).json({ error: 'Filter criteria required' });
            }

            const applications = this.queue.getByStatus('PENDING_REVIEW');
            let approvedCount = 0;

            for (const app of applications) {
                let shouldApprove = false;

                // Filter by match score
                if (filter.minScore !== undefined && app.matchScore >= filter.minScore) {
                    shouldApprove = true;
                }

                // Filter by keywords in position
                if (filter.includeKeywords && Array.isArray(filter.includeKeywords)) {
                    const positionLower = app.position.toLowerCase();
                    if (filter.includeKeywords.some(keyword => 
                        positionLower.includes(keyword.toLowerCase()))) {
                        shouldApprove = true;
                    }
                }

                // Filter by remote option
                if (filter.remoteOnly && app.features?.remote === 'remote') {
                    shouldApprove = true;
                }

                if (shouldApprove) {
                    await this.queue.approve(app.id);
                    approvedCount++;
                }
            }

            res.json({
                success: true,
                approvedCount,
                message: `Approved ${approvedCount} applications`
            });
        } catch (error) {
            console.error('❌ Error in approve-batch:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Handle: GET /api/queue/list-filtered
     * List applications with advanced filtering
     */
    async _handleListFiltered(req, res) {
        try {
            const { minScore, maxScore, status, keywords } = req.query;
            
            let applications = status 
                ? this.queue.getByStatus(status)
                : this.queue.queue;

            // Filter by score
            if (minScore !== undefined) {
                applications = applications.filter(app => 
                    app.matchScore >= parseInt(minScore));
            }
            if (maxScore !== undefined) {
                applications = applications.filter(app => 
                    app.matchScore <= parseInt(maxScore));
            }

            // Filter by keywords
            if (keywords) {
                const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
                applications = applications.filter(app => {
                    const positionLower = app.position.toLowerCase();
                    return keywordList.some(keyword => positionLower.includes(keyword));
                });
            }

            res.json({
                success: true,
                count: applications.length,
                applications
            });
        } catch (error) {
            console.error('❌ Error in list-filtered:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Handle: GET /api/ml/export-training-data
     * Export training data for ML model
     */
    async _handleExportTrainingData(req, res) {
        try {
            // Get all applications with decisions
            const trainingData = this.queue.queue
                .filter(app => app.decision !== null)
                .map(app => ({
                    features: app.features,
                    matchScore: app.matchScore,
                    decision: app.decision,
                    position: app.position,
                    company: app.company
                }));

            res.json({
                success: true,
                count: trainingData.length,
                data: trainingData
            });
        } catch (error) {
            console.error('❌ Error in export-training-data:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Handle: POST /api/prompt/process
     * Process natural language prompt via LLM Function Calling
     */
    async _handleProcessPrompt(req, res) {
        try {
            const { prompt } = req.body;
            
            if (!prompt) {
                return res.status(400).json({ error: 'Prompt required' });
            }

            // Initialize PromptService if not already done
            if (!this.promptService) {
                const PromptService = require('../services/PromptService');
                this.promptService = new PromptService({
                    openaiApiKey: process.env.OPENAI_API_KEY,
                    apiBaseUrl: 'http://localhost:3000'
                });
            }

            // Process the prompt
            const result = await this.promptService.processPrompt(prompt);

            res.json(result);
        } catch (error) {
            console.error('❌ Error in process-prompt:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/github/repos[?filter=<technology>]
     * Returns all analyzed GitHub repositories, optionally filtered by technology.
     */
    async _handleGetRepos(req, res) {
        try {
            if (!this.githubService) {
                return res.status(503).json({ error: 'GitHub service not available. Check GITHUB_TOKEN and GITHUB_USERNAME.' });
            }

            let repos = this.githubService.getAllRepositories();

            const filter = req.query.filter ? req.query.filter.toLowerCase() : null;
            if (filter) {
                repos = repos.filter(repo => {
                    const inTech = repo.technologies.some(t => t.toLowerCase().includes(filter));
                    const inLang = repo.languages.some(l => l.toLowerCase().includes(filter));
                    const inTopics = repo.topics.some(t => t.toLowerCase().includes(filter));
                    const inPrimary = (repo.language || '').toLowerCase().includes(filter);
                    return inTech || inLang || inTopics || inPrimary;
                });
            }

            repos = repos
                .sort((a, b) => b.stars - a.stars)
                .map(r => ({
                    name: r.name,
                    description: r.description,
                    url: r.url,
                    language: r.language,
                    languages: r.languages,
                    technologies: r.technologies,
                    topics: r.topics,
                    stars: r.stars,
                    forks: r.forks,
                    updatedAt: r.updatedAt
                }));

            res.json({
                success: true,
                total: repos.length,
                filter: filter || null,
                fetchedAt: this.githubService.cache ? this.githubService.cache.fetchedAt : null,
                repos
            });
        } catch (error) {
            console.error('❌ Error in get-repos:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/github/refresh
     * Forces a full re-fetch and re-analysis of all GitHub repositories.
     */
    async _handleRefreshRepos(req, res) {
        try {
            if (!this.githubService) {
                return res.status(503).json({ error: 'GitHub service not available. Check GITHUB_TOKEN and GITHUB_USERNAME.' });
            }

            await this.githubService.refreshCache();
            const count = this.githubService.getAllRepositories().length;

            res.json({
                success: true,
                count,
                message: `${count} Repositories erfolgreich analysiert`,
                fetchedAt: this.githubService.cache.fetchedAt
            });
        } catch (error) {
            console.error('❌ Error in refresh-repos:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = AgentAPI;

// Start server if run directly
if (require.main === module) {
    const config = {
        email: {
            smtp: {
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            },
            from: {
                name: process.env.EMAIL_FROM_NAME || 'Applicant',
                address: process.env.EMAIL_FROM_ADDRESS
            }
        }
    };

    const api = new AgentAPI(config);
    api.start(3000);
}
