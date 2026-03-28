/**
 * Agent Main Loop
 * 
 * The orchestrator that coordinates all skills and runs the complete workflow:
 * 1. Check email for new job alerts (EmailReaderSkill)
 * 2. Actively search job portals (JobSearchSkill)
 * 3. Parse job postings (JobParserSkill)
 * 4. Filter by match score and application method
 * 5. Generate application documents (DocumentGeneratorSkill)
 * 6. Add to queue with PENDING_REVIEW status
 * 7. Send Telegram notification
 * 
 * Runs periodically (default: every 4 hours) or can be triggered manually.
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const EmailReaderSkill = require('../skills/EmailReaderSkill');
const JobSearchSkill = require('../skills/JobSearchSkill');
const JobParserSkill = require('../skills/JobParserSkill');
const DocumentGeneratorSkill = require('../skills/DocumentGeneratorSkill');
const ApplicationQueue = require('../utils/ApplicationQueue');
const fs = require('fs').promises;

class AgentMainLoop {
    constructor(config) {
        this.config = config;
        this.emailReader = null;
        this.jobSearch = null;
        this.jobParser = null;
        this.documentGenerator = null;
        this.queue = null;
        this.isRunning = false;
        this.intervalId = null;
    }

    /**
     * Initialize all skills and queue
     */
    async initialize() {
 console.log('Initializing Agent Main Loop...');

        // Initialize queue
        this.queue = new ApplicationQueue('/app/data/application_queue.json');
        await this.queue.initialize();

        // Initialize EmailReaderSkill
        this.emailReader = new EmailReaderSkill({
            email: this.config.email.address,
            password: this.config.email.password,
            imapHost: this.config.email.imapHost,
            imapPort: this.config.email.imapPort
        });
        await this.emailReader.initialize();

        // Initialize JobSearchSkill
        this.jobSearch = new JobSearchSkill({
            browserServiceUrl: this.config.browserServiceUrl
        });
        await this.jobSearch.initialize();

        // Initialize JobParserSkill
        this.jobParser = new JobParserSkill({
            browserServiceUrl: this.config.browserServiceUrl
        });
        await this.jobParser.initialize();

        // Initialize DocumentGeneratorSkill
        this.documentGenerator = new DocumentGeneratorSkill(this.config);
        await this.documentGenerator.initialize();

 console.log('Agent Main Loop initialized');
    }

    /**
     * Run one iteration of the main loop
     */
    async runOnce() {
        if (this.isRunning) {
 console.log('Agent is already running, skipping this iteration');
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();

        try {
 console.log('Starting agent iteration...');

            // Step 1: Check for new job alert emails
 console.log('Step 1: Checking for new job alerts...');
            const emailJobs = await this.emailReader.checkForNewEmails();
 console.log(`Found ${emailJobs.length} new job postings from emails`);

            // Step 2: Actively search job portals
 console.log('Step 2: Actively searching job portals...');
            const searchCriteria = this.config.searchCriteria || {
                keywords: ['Junior Backend Developer', 'Software Developer', 'Fachinformatiker Anwendungsentwicklung'],
                location: 'Hamburg'
            };
            const portalJobs = await this.jobSearch.searchAll(searchCriteria);
 console.log(`Found ${portalJobs.length} new job postings from portals`);

            // Combine and deduplicate
            const allJobs = [...emailJobs, ...portalJobs];
            const jobPostings = this.jobSearch.removeDuplicates(allJobs);
 console.log(`Total unique jobs: ${jobPostings.length}`);

            if (jobPostings.length === 0) {
 console.log('No new jobs found, ending iteration');
                return;
            }

            // Step 3: Parse each job posting
 console.log('Step 3: Parsing job postings...');
            const parsedJobs = [];
            for (const job of jobPostings) {
                try {
                    const parsed = await this.jobParser.parseJob(job.url, job.source);
                    parsedJobs.push(parsed);
                } catch (error) {
 console.error(`Failed to parse job ${job.url}:`, error.message);
                }
            }
 console.log(`Successfully parsed ${parsedJobs.length} jobs`);

            // Step 4: Filter jobs
 console.log('Step 4: Filtering jobs...');
            const filteredJobs = this._filterJobs(parsedJobs);
 console.log(`${filteredJobs.length} jobs passed filters`);

            if (filteredJobs.length === 0) {
 console.log('No jobs passed filters, ending iteration');
                return;
            }

            // Step 5: Generate application documents
 console.log('Step 5: Generating application documents...');
            let generatedCount = 0;
            for (const job of filteredJobs) {
                try {
                    const documents = await this.documentGenerator.generateApplication(job);
                    
                    // Add to queue
                    await this.queue.add({
                        ...job,
                        ...documents,
                        status: 'PENDING_REVIEW'
                    });

                    generatedCount++;
 console.log(`Generated application for ${job.company} - ${job.position}`);
                } catch (error) {
 console.error(`Failed to generate application for ${job.company}:`, error.message);
                }
            }

 console.log(`Generated ${generatedCount} applications`);

            // Step 6: Send Telegram notification
            if (generatedCount > 0) {
                await this._sendTelegramNotification(generatedCount);
            }

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
 console.log(`Agent iteration complete in ${duration}s`);

        } catch (error) {
 console.error('Error in agent main loop:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Filter jobs based on criteria
     */
    _filterJobs(jobs) {
        return jobs.filter(job => {
            // Filter 1: Match score must be >= 50
            if (job.matchScore && job.matchScore < 50) {
                console.log(`⏭  Skipping ${job.company} - Low match score: ${job.matchScore}`);
                return false;
            }

            // Filter 2: Must have email or LinkedIn Easy Apply
            const validMethods = ['email', 'linkedin_easy_apply'];
            if (!validMethods.includes(job.applicationMethod)) {
                console.log(`⏭  Skipping ${job.company} - Unsupported application method: ${job.applicationMethod}`);
                return false;
            }

            // Filter 3: Must have company and position
            if (!job.company || !job.position) {
                console.log(`⏭  Skipping job - Missing company or position`);
                return false;
            }

            // Filter 4: Check if already in queue
            const existing = this.queue.findByUrl(job.url);
            if (existing) {
                console.log(`⏭  Skipping ${job.company} - Already in queue`);
                return false;
            }

            return true;
        });
    }

    /**
     * Send Telegram notification about new applications
     */
    async _sendTelegramNotification(count) {
        try {
            const message = `🎉 ${count} neue Bewerbung${count > 1 ? 'en' : ''} erstellt!\n\nNutze /list pending um sie anzusehen.`;
            
            // Send via Telegram Bot API
            const fetch = require('node-fetch');
            const response = await fetch(
                `https://api.telegram.org/bot${this.config.telegram.botToken}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: this.config.telegram.chatId,
                        text: message,
                        parse_mode: 'Markdown'
                    })
                }
            );

            if (response.ok) {
 console.log('Telegram notification sent');
            } else {
 console.error('Failed to send Telegram notification:', await response.text());
            }
        } catch (error) {
 console.error('Error sending Telegram notification:', error);
        }
    }

    /**
     * Start the periodic loop
     */
    async start(intervalHours = 4) {
 console.log(`Starting agent with ${intervalHours}h interval...`);

        // Run immediately
        await this.runOnce();

        // Schedule periodic runs
        const intervalMs = intervalHours * 60 * 60 * 1000;
        this.intervalId = setInterval(() => {
            this.runOnce();
        }, intervalMs);

 console.log(`Agent started, next run in ${intervalHours} hours`);
    }

    /**
     * Stop the periodic loop
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
 console.log('Agent stopped');
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        this.stop();
        
        if (this.emailReader) {
            await this.emailReader.close();
        }
        if (this.jobSearch) {
            await this.jobSearch.close();
        }
        if (this.jobParser) {
            await this.jobParser.close();
        }

 console.log('Agent cleanup complete');
    }
}

module.exports = AgentMainLoop;

// Start agent if run directly
if (require.main === module) {
    const config = {
        email: {
            address: process.env.EMAIL_ADDRESS,
            password: process.env.EMAIL_PASSWORD,
            imapHost: process.env.IMAP_HOST,
            imapPort: parseInt(process.env.IMAP_PORT) || 993
        },
        browserServiceUrl: process.env.BROWSER_SERVICE_URL || 'http://browser-service:4444',
        telegram: {
            botToken: process.env.TELEGRAM_BOT_TOKEN,
            chatId: process.env.TELEGRAM_CHAT_ID
        }
    };

    const agent = new AgentMainLoop(config);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
 console.log('\n Received SIGINT, shutting down gracefully...');
        await agent.cleanup();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
 console.log('\n Received SIGTERM, shutting down gracefully...');
        await agent.cleanup();
        process.exit(0);
    });

    // Start agent
    agent.initialize().then(() => {
        const intervalHours = parseInt(process.env.AGENT_INTERVAL_HOURS) || 4;
        agent.start(intervalHours);
    }).catch(error => {
 console.error('Failed to start agent:', error);
        process.exit(1);
    });
}
