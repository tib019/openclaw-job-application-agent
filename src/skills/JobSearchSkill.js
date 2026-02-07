/**
 * JobSearchSkill
 * 
 * Actively searches job portals for matching positions:
 * - StepStone.de
 * - Indeed.de
 * - get-in-it.de
 * - it-jobs.de
 * 
 * Uses Selenium WebDriver to:
 * 1. Navigate to job portal
 * 2. Enter search criteria (keywords, location)
 * 3. Apply filters (experience level, remote, etc.)
 * 4. Extract job URLs from search results
 * 5. Return list of job postings for further processing
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class JobSearchSkill {
    constructor(config) {
        this.config = config;
        this.driver = null;
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
        options.addArguments('--window-size=1920,1080');

        this.driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .usingServer(this.config.browserServiceUrl || 'http://browser-service:4444')
            .build();

        console.log('✅ JobSearchSkill WebDriver initialized');
    }

    /**
     * Search all configured portals
     * 
     * @param {Object} criteria - Search criteria
     * @returns {Array} Array of job postings
     */
    async searchAll(criteria) {
        console.log('🔍 Starting job search across all portals...');
        
        const allJobs = [];

        // Search each portal
        const portals = [
            { name: 'stepstone', method: this.searchStepStone.bind(this) },
            { name: 'indeed', method: this.searchIndeed.bind(this) },
            { name: 'get-in-it', method: this.searchGetInIT.bind(this) },
            { name: 'it-jobs', method: this.searchITJobs.bind(this) }
        ];

        for (const portal of portals) {
            try {
                console.log(`🔍 Searching ${portal.name}...`);
                const jobs = await portal.method(criteria);
                allJobs.push(...jobs);
                console.log(`✅ Found ${jobs.length} jobs on ${portal.name}`);
            } catch (error) {
                console.error(`❌ Error searching ${portal.name}:`, error.message);
            }
        }

        console.log(`✅ Total jobs found: ${allJobs.length}`);
        return allJobs;
    }

    /**
     * Search StepStone.de
     */
    async searchStepStone(criteria) {
        const jobs = [];

        try {
            // Build search URL
            const keywords = encodeURIComponent(criteria.keywords.join(' '));
            const location = encodeURIComponent(criteria.location);
            const url = `https://www.stepstone.de/jobs/${keywords}/in-${location}`;

            await this.driver.get(url);
            await this.driver.sleep(3000); // Wait for page load

            // Find job listings
            const jobElements = await this.driver.findElements(
                By.css('article[data-at="job-item"]')
            );

            console.log(`📋 Found ${jobElements.length} job elements on StepStone`);

            // Extract job URLs (limit to first 20)
            for (let i = 0; i < Math.min(jobElements.length, 20); i++) {
                try {
                    const linkElement = await jobElements[i].findElement(By.css('a[data-at="job-item-title"]'));
                    const jobUrl = await linkElement.getAttribute('href');
                    
                    if (jobUrl) {
                        jobs.push({
                            url: jobUrl.split('?')[0], // Remove tracking params
                            source: 'stepstone',
                            foundAt: new Date().toISOString(),
                            searchCriteria: criteria
                        });
                    }
                } catch (error) {
                    console.error(`⚠️  Error extracting job ${i}:`, error.message);
                }
            }

        } catch (error) {
            console.error('❌ StepStone search failed:', error.message);
        }

        return jobs;
    }

    /**
     * Search Indeed.de
     */
    async searchIndeed(criteria) {
        const jobs = [];

        try {
            // Build search URL
            const keywords = encodeURIComponent(criteria.keywords.join(' '));
            const location = encodeURIComponent(criteria.location);
            const url = `https://de.indeed.com/jobs?q=${keywords}&l=${location}`;

            await this.driver.get(url);
            await this.driver.sleep(3000);

            // Find job listings
            const jobElements = await this.driver.findElements(
                By.css('div.job_seen_beacon')
            );

            console.log(`📋 Found ${jobElements.length} job elements on Indeed`);

            // Extract job URLs (limit to first 20)
            for (let i = 0; i < Math.min(jobElements.length, 20); i++) {
                try {
                    const linkElement = await jobElements[i].findElement(By.css('h2.jobTitle a'));
                    const jobUrl = await linkElement.getAttribute('href');
                    
                    if (jobUrl) {
                        const fullUrl = jobUrl.startsWith('http') 
                            ? jobUrl 
                            : `https://de.indeed.com${jobUrl}`;
                        
                        jobs.push({
                            url: fullUrl.split('?')[0],
                            source: 'indeed',
                            foundAt: new Date().toISOString(),
                            searchCriteria: criteria
                        });
                    }
                } catch (error) {
                    console.error(`⚠️  Error extracting job ${i}:`, error.message);
                }
            }

        } catch (error) {
            console.error('❌ Indeed search failed:', error.message);
        }

        return jobs;
    }

    /**
     * Search get-in-it.de
     */
    async searchGetInIT(criteria) {
        const jobs = [];

        try {
            // Build search URL
            const keywords = encodeURIComponent(criteria.keywords.join(' '));
            const location = encodeURIComponent(criteria.location);
            const url = `https://www.get-in-it.de/jobsuche?keywords=${keywords}&location=${location}`;

            await this.driver.get(url);
            await this.driver.sleep(3000);

            // Find job listings (CSS selectors may need adjustment based on actual site structure)
            const jobElements = await this.driver.findElements(
                By.css('div.job-item, article.job-listing, div[class*="job"]')
            );

            console.log(`📋 Found ${jobElements.length} job elements on get-in-it.de`);

            // Extract job URLs (limit to first 20)
            for (let i = 0; i < Math.min(jobElements.length, 20); i++) {
                try {
                    const linkElement = await jobElements[i].findElement(By.css('a[href*="/job/"], a[href*="/stelle/"]'));
                    const jobUrl = await linkElement.getAttribute('href');
                    
                    if (jobUrl) {
                        const fullUrl = jobUrl.startsWith('http') 
                            ? jobUrl 
                            : `https://www.get-in-it.de${jobUrl}`;
                        
                        jobs.push({
                            url: fullUrl.split('?')[0],
                            source: 'get-in-it',
                            foundAt: new Date().toISOString(),
                            searchCriteria: criteria
                        });
                    }
                } catch (error) {
                    console.error(`⚠️  Error extracting job ${i}:`, error.message);
                }
            }

        } catch (error) {
            console.error('❌ get-in-it.de search failed:', error.message);
        }

        return jobs;
    }

    /**
     * Search it-jobs.de
     */
    async searchITJobs(criteria) {
        const jobs = [];

        try {
            // Build search URL
            const keywords = encodeURIComponent(criteria.keywords.join(' '));
            const location = encodeURIComponent(criteria.location);
            const url = `https://www.it-jobs.de/jobs/${keywords}/${location}`;

            await this.driver.get(url);
            await this.driver.sleep(3000);

            // Find job listings
            const jobElements = await this.driver.findElements(
                By.css('div.job-listing, article[class*="job"], div[data-job-id]')
            );

            console.log(`📋 Found ${jobElements.length} job elements on it-jobs.de`);

            // Extract job URLs (limit to first 20)
            for (let i = 0; i < Math.min(jobElements.length, 20); i++) {
                try {
                    const linkElement = await jobElements[i].findElement(By.css('a[href*="/job/"]'));
                    const jobUrl = await linkElement.getAttribute('href');
                    
                    if (jobUrl) {
                        const fullUrl = jobUrl.startsWith('http') 
                            ? jobUrl 
                            : `https://www.it-jobs.de${jobUrl}`;
                        
                        jobs.push({
                            url: fullUrl.split('?')[0],
                            source: 'it-jobs',
                            foundAt: new Date().toISOString(),
                            searchCriteria: criteria
                        });
                    }
                } catch (error) {
                    console.error(`⚠️  Error extracting job ${i}:`, error.message);
                }
            }

        } catch (error) {
            console.error('❌ it-jobs.de search failed:', error.message);
        }

        return jobs;
    }

    /**
     * Remove duplicate job URLs
     */
    removeDuplicates(jobs) {
        const seen = new Set();
        return jobs.filter(job => {
            if (seen.has(job.url)) {
                return false;
            }
            seen.add(job.url);
            return true;
        });
    }

    /**
     * Close WebDriver
     */
    async close() {
        if (this.driver) {
            await this.driver.quit();
            console.log('✅ JobSearchSkill WebDriver closed');
        }
    }
}

module.exports = JobSearchSkill;
