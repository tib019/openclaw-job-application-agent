/**
 * EmailReaderSkill
 * 
 * Monitors a dedicated email account for job alerts from platforms like:
 * - StepStone
 * - LinkedIn
 * - Indeed
 * - Direct company emails
 * 
 * Extracts job postings and adds them to the processing queue.
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs').promises;

class EmailReaderSkill {
    constructor(config) {
        this.config = config;
        this.imap = null;
        this.lastCheckTime = null;
    }

    /**
     * Initialize IMAP connection
     */
    async initialize() {
        this.imap = new Imap({
            user: this.config.email,
            password: this.config.password,
            host: this.config.imapHost,
            port: this.config.imapPort || 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        });

        return new Promise((resolve, reject) => {
            this.imap.once('ready', () => {
                console.log('✅ IMAP connection established');
                resolve();
            });

            this.imap.once('error', (err) => {
                console.error('❌ IMAP connection error:', err);
                reject(err);
            });

            this.imap.connect();
        });
    }

    /**
     * Check for new job alert emails
     * 
     * @returns {Array} Array of job postings
     */
    async checkForNewEmails() {
        return new Promise((resolve, reject) => {
            this.imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Search for unread emails from job platforms
                const searchCriteria = [
                    'UNSEEN',
                    ['OR', 
                        ['FROM', 'stepstone.de'],
                        ['FROM', 'linkedin.com'],
                        ['FROM', 'indeed.com']
                    ]
                ];

                this.imap.search(searchCriteria, (err, results) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (results.length === 0) {
                        console.log('📭 No new job alert emails found');
                        resolve([]);
                        return;
                    }

                    console.log(`📬 Found ${results.length} new job alert emails`);

                    const fetch = this.imap.fetch(results, { bodies: '' });
                    const jobPostings = [];

                    fetch.on('message', (msg, seqno) => {
                        msg.on('body', (stream, info) => {
                            simpleParser(stream, async (err, parsed) => {
                                if (err) {
                                    console.error(`❌ Error parsing email ${seqno}:`, err);
                                    return;
                                }

                                try {
                                    const jobs = await this.extractJobsFromEmail(parsed);
                                    jobPostings.push(...jobs);
                                } catch (error) {
                                    console.error(`❌ Error extracting jobs from email ${seqno}:`, error);
                                }
                            });
                        });
                    });

                    fetch.once('error', (err) => {
                        reject(err);
                    });

                    fetch.once('end', () => {
                        console.log(`✅ Extracted ${jobPostings.length} job postings from emails`);
                        resolve(jobPostings);
                    });
                });
            });
        });
    }

    /**
     * Extract job postings from a parsed email
     * 
     * @param {Object} email - Parsed email object
     * @returns {Array} Array of job postings
     */
    async extractJobsFromEmail(email) {
        const jobs = [];
        const from = email.from.value[0].address;

        // Determine platform
        let platform = 'unknown';
        if (from.includes('stepstone')) platform = 'stepstone';
        else if (from.includes('linkedin')) platform = 'linkedin';
        else if (from.includes('indeed')) platform = 'indeed';

        console.log(`📧 Processing email from ${platform}: ${email.subject}`);

        // Extract job URLs and details based on platform
        const html = email.html || email.textAsHtml || '';
        const text = email.text || '';

        switch (platform) {
            case 'stepstone':
                return this.extractStepStoneJobs(html, text, email);
            case 'linkedin':
                return this.extractLinkedInJobs(html, text, email);
            case 'indeed':
                return this.extractIndeedJobs(html, text, email);
            default:
                return this.extractGenericJobs(html, text, email);
        }
    }

    /**
     * Extract jobs from StepStone email
     */
    extractStepStoneJobs(html, text, email) {
        const jobs = [];
        
        // StepStone typically includes job URLs like:
        // https://www.stepstone.de/stellenangebote--...
        const urlRegex = /https:\/\/www\.stepstone\.de\/stellenangebote[^\s<>"]+/g;
        const urls = [...new Set((html + text).match(urlRegex) || [])];

        for (const url of urls) {
            jobs.push({
                url: url.split('?')[0], // Remove tracking parameters
                source: 'stepstone',
                sourceEmail: email.subject,
                receivedAt: email.date.toISOString(),
                metadata: {
                    emailSubject: email.subject,
                    emailFrom: email.from.text
                }
            });
        }

        return jobs;
    }

    /**
     * Extract jobs from LinkedIn email
     */
    extractLinkedInJobs(html, text, email) {
        const jobs = [];
        
        // LinkedIn job URLs like:
        // https://www.linkedin.com/jobs/view/...
        const urlRegex = /https:\/\/www\.linkedin\.com\/jobs\/view\/\d+/g;
        const urls = [...new Set((html + text).match(urlRegex) || [])];

        for (const url of urls) {
            jobs.push({
                url,
                source: 'linkedin',
                sourceEmail: email.subject,
                receivedAt: email.date.toISOString(),
                metadata: {
                    emailSubject: email.subject,
                    emailFrom: email.from.text
                }
            });
        }

        return jobs;
    }

    /**
     * Extract jobs from Indeed email
     */
    extractIndeedJobs(html, text, email) {
        const jobs = [];
        
        // Indeed job URLs like:
        // https://de.indeed.com/viewjob?jk=...
        const urlRegex = /https:\/\/de\.indeed\.com\/viewjob\?jk=[a-zA-Z0-9]+/g;
        const urls = [...new Set((html + text).match(urlRegex) || [])];

        for (const url of urls) {
            jobs.push({
                url,
                source: 'indeed',
                sourceEmail: email.subject,
                receivedAt: email.date.toISOString(),
                metadata: {
                    emailSubject: email.subject,
                    emailFrom: email.from.text
                }
            });
        }

        return jobs;
    }

    /**
     * Extract jobs from generic/direct company emails
     */
    extractGenericJobs(html, text, email) {
        const jobs = [];
        
        // Generic URL extraction for job postings
        const urlRegex = /https?:\/\/[^\s<>"]+(?:jobs?|karriere|career|stellenangebot)[^\s<>"]+/gi;
        const urls = [...new Set((html + text).match(urlRegex) || [])];

        for (const url of urls) {
            jobs.push({
                url: url.split('?')[0],
                source: 'direct',
                sourceEmail: email.subject,
                receivedAt: email.date.toISOString(),
                metadata: {
                    emailSubject: email.subject,
                    emailFrom: email.from.text
                }
            });
        }

        return jobs;
    }

    /**
     * Close IMAP connection
     */
    async close() {
        if (this.imap) {
            this.imap.end();
            console.log('✅ IMAP connection closed');
        }
    }
}

module.exports = EmailReaderSkill;
