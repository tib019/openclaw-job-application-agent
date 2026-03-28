/**
 * JobParserSkill
 * 
 * Parses job postings from various platforms and extracts structured data:
 * - Company name
 * - Position title
 * - Required skills
 * - Job description
 * - Application method (email, form, ATS system)
 * - Salary range (if available)
 * - Location and remote options
 * 
 * Uses browser automation (Selenium) and LLM-based extraction for complex pages.
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { OpenAI } = require('openai');

class JobParserSkill {
    constructor(config) {
        this.config = config;
        this.driver = null;
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    /**
     * Initialize Selenium WebDriver
     */
    async initialize() {
        const options = new chrome.Options();
        options.addArguments('--headless');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');

        this.driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .usingServer(this.config.browserServiceUrl || 'http://browser-service:4444')
            .build();

 console.log('Selenium WebDriver initialized');
    }

    /**
     * Parse a job posting from a URL
     * 
     * @param {string} url - Job posting URL
     * @param {string} source - Source platform (stepstone, linkedin, etc.)
     * @returns {Object} Parsed job data
     */
    async parseJob(url, source) {
 console.log(`Parsing job from ${source}: ${url}`);

        try {
            await this.driver.get(url);
            await this.driver.wait(until.elementLocated(By.tagName('body')), 10000);

            // Wait for dynamic content to load
            await this.driver.sleep(2000);

            // Get page HTML
            const html = await this.driver.getPageSource();
            const title = await this.driver.getTitle();

            // Platform-specific parsing
            let jobData;
            switch (source) {
                case 'stepstone':
                    jobData = await this.parseStepStone(html, url);
                    break;
                case 'linkedin':
                    jobData = await this.parseLinkedIn(html, url);
                    break;
                case 'indeed':
                    jobData = await this.parseIndeed(html, url);
                    break;
                default:
                    jobData = await this.parseGeneric(html, url, title);
            }

            // Enrich with LLM-based analysis
            jobData = await this.enrichWithLLM(jobData, html);

 console.log(`Successfully parsed job: ${jobData.company} - ${jobData.position}`);
            return jobData;

        } catch (error) {
 console.error(`Error parsing job from ${url}:`, error.message);
            throw error;
        }
    }

    /**
     * Parse StepStone job posting
     */
    async parseStepStone(html, url) {
        // StepStone-specific selectors (simplified, would need real selectors)
        const jobData = {
            url,
            source: 'stepstone',
            company: this.extractByRegex(html, /<span[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/span>/i),
            position: this.extractByRegex(html, /<h1[^>]*>([^<]+)<\/h1>/i),
            location: this.extractByRegex(html, /<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/i),
            description: this.extractByRegex(html, /<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i),
            applicationMethod: 'form', // StepStone typically uses forms
            parsedAt: new Date().toISOString()
        };

        return jobData;
    }

    /**
     * Parse LinkedIn job posting
     */
    async parseLinkedIn(html, url) {
        const jobData = {
            url,
            source: 'linkedin',
            company: this.extractByRegex(html, /<a[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/a>/i),
            position: this.extractByRegex(html, /<h1[^>]*class="[^"]*job-title[^"]*"[^>]*>([^<]+)<\/h1>/i),
            location: this.extractByRegex(html, /<span[^>]*class="[^"]*job-location[^"]*"[^>]*>([^<]+)<\/span>/i),
            description: this.extractByRegex(html, /<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i),
            applicationMethod: 'linkedin_easy_apply',
            parsedAt: new Date().toISOString()
        };

        // Check if "Easy Apply" button exists
        if (html.includes('Easy Apply') || html.includes('Einfache Bewerbung')) {
            jobData.applicationMethod = 'linkedin_easy_apply';
        }

        return jobData;
    }

    /**
     * Parse Indeed job posting
     */
    async parseIndeed(html, url) {
        const jobData = {
            url,
            source: 'indeed',
            company: this.extractByRegex(html, /<span[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/span>/i),
            position: this.extractByRegex(html, /<h1[^>]*class="[^"]*jobsearch-JobInfoHeader-title[^"]*"[^>]*>([^<]+)<\/h1>/i),
            location: this.extractByRegex(html, /<div[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/div>/i),
            description: this.extractByRegex(html, /<div[^>]*id="jobDescriptionText"[^>]*>([\s\S]*?)<\/div>/i),
            applicationMethod: 'form',
            parsedAt: new Date().toISOString()
        };

        return jobData;
    }

    /**
     * Parse generic job posting (direct company website)
     */
    async parseGeneric(html, url, title) {
        const jobData = {
            url,
            source: 'direct',
            company: this.extractCompanyFromUrl(url) || 'Unknown Company',
            position: title || 'Unknown Position',
            location: 'Unknown',
            description: html.substring(0, 5000), // First 5000 chars
            applicationMethod: 'unknown',
            parsedAt: new Date().toISOString()
        };

        // Try to find email address for direct application
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = html.match(emailRegex);
        if (emails && emails.length > 0) {
            jobData.applicationEmail = emails.find(e => 
                e.includes('job') || 
                e.includes('career') || 
                e.includes('bewerbung') ||
                e.includes('hr')
            ) || emails[0];
            jobData.applicationMethod = 'email';
        }

        return jobData;
    }

    /**
     * Enrich job data with LLM-based analysis
     * 
     * Extracts:
     * - Required skills
     * - Nice-to-have skills
     * - Experience level
     * - Company culture signals
     * - Salary range (if mentioned)
     */
    async enrichWithLLM(jobData, html) {
        const cleanHtml = this.stripHtmlTags(html).substring(0, 8000);

        const prompt = `Analyze this job posting and extract structured information.

Job Posting:
${cleanHtml}

Extract the following in JSON format:
{
  "requiredSkills": ["skill1", "skill2", ...],
  "niceToHaveSkills": ["skill1", "skill2", ...],
  "experienceLevel": "junior|mid|senior",
  "cultureSigns": ["signal1", "signal2", ...],
  "salaryRange": "XX.XXX - XX.XXX EUR" or null,
  "remoteOption": "onsite|hybrid|remote",
  "keyResponsibilities": ["resp1", "resp2", ...],
  "matchScore": 0-100 (how well this matches: Java, HTML, CSS, JavaScript, MySQL, Python, QA Testing, Agile/Scrum)
}

Focus on technical skills and IT-related requirements. Be concise.`;

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4.1-mini',
                messages: [
                    { role: 'system', content: 'You are an expert job posting analyzer for IT positions.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 1000
            });

            const enrichedData = JSON.parse(response.choices[0].message.content);
            return { ...jobData, ...enrichedData };

        } catch (error) {
 console.error(' LLM enrichment failed:', error.message);
            return jobData;
        }
    }

    /**
     * Helper: Extract text by regex
     */
    extractByRegex(html, regex) {
        const match = html.match(regex);
        return match ? match[1].trim() : null;
    }

    /**
     * Helper: Extract company name from URL
     */
    extractCompanyFromUrl(url) {
        try {
            const hostname = new URL(url).hostname;
            const parts = hostname.split('.');
            return parts[parts.length - 2]; // e.g., "techcorp" from "jobs.techcorp.com"
        } catch {
            return null;
        }
    }

    /**
     * Helper: Strip HTML tags
     */
    stripHtmlTags(html) {
        return html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Close WebDriver
     */
    async close() {
        if (this.driver) {
            await this.driver.quit();
 console.log('Selenium WebDriver closed');
        }
    }
}

module.exports = JobParserSkill;
