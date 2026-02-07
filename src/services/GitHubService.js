/**
 * GitHub Integration Service
 * 
 * Analyzes user's GitHub repositories and selects the most relevant projects
 * for each job application based on required skills and technologies.
 * 
 * Features:
 * - Fetches all public repositories
 * - Analyzes README, languages, topics
 * - Matches projects to job requirements
 * - Ranks projects by relevance
 * - Caches results for performance
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;
const path = require('path');

class GitHubService {
    constructor(config) {
        this.config = config;
        this.octokit = new Octokit({
            auth: config.githubToken || process.env.GITHUB_TOKEN
        });
        this.username = config.githubUsername;
        this.cache = null;
        this.cacheTimestamp = null;
        this.cacheDuration = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Initialize the service and load cache
     */
    async initialize() {
        console.log(`🔧 Initializing GitHub Service for user: ${this.username}`);
        
        // Try to load cache
        await this._loadCache();
        
        // Refresh cache if expired or missing
        if (!this.cache || this._isCacheExpired()) {
            await this.refreshCache();
        }
        
        console.log(`✅ GitHub Service initialized with ${this.cache.repositories.length} repositories`);
    }

    /**
     * Refresh the repository cache
     */
    async refreshCache() {
        console.log('🔄 Refreshing GitHub repository cache...');
        
        try {
            // Fetch all repositories
            const repos = await this._fetchAllRepositories();
            
            // Analyze each repository
            const analyzedRepos = [];
            for (const repo of repos) {
                const analysis = await this._analyzeRepository(repo);
                analyzedRepos.push(analysis);
            }
            
            // Update cache
            this.cache = {
                repositories: analyzedRepos,
                fetchedAt: new Date().toISOString()
            };
            this.cacheTimestamp = Date.now();
            
            // Save cache to file
            await this._saveCache();
            
            console.log(`✅ Cache refreshed: ${analyzedRepos.length} repositories analyzed`);
        } catch (error) {
            console.error('❌ Error refreshing cache:', error.message);
            throw error;
        }
    }

    /**
     * Find the best matching projects for a job
     * 
     * @param {Object} jobRequirements - Job requirements
     * @param {Array} jobRequirements.skills - Required skills/technologies
     * @param {string} jobRequirements.position - Job position
     * @param {string} jobRequirements.description - Job description
     * @param {number} limit - Maximum number of projects to return
     * @returns {Array} Top matching projects
     */
    async findMatchingProjects(jobRequirements, limit = 3) {
        if (!this.cache) {
            await this.initialize();
        }
        
        console.log(`🔍 Finding matching projects for: ${jobRequirements.position}`);
        
        const { skills = [], position = '', description = '' } = jobRequirements;
        
        // Score each repository
        const scoredRepos = this.cache.repositories.map(repo => {
            const score = this._calculateMatchScore(repo, skills, position, description);
            return { ...repo, matchScore: score };
        });
        
        // Sort by score and return top N
        const topProjects = scoredRepos
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, limit);
        
        console.log(`✅ Found ${topProjects.length} matching projects (scores: ${topProjects.map(p => p.matchScore).join(', ')})`);
        
        return topProjects;
    }

    /**
     * Get all repositories (from cache)
     */
    getAllRepositories() {
        if (!this.cache) {
            throw new Error('Cache not initialized. Call initialize() first.');
        }
        return this.cache.repositories;
    }

    /**
     * Fetch all repositories from GitHub API
     */
    async _fetchAllRepositories() {
        const repos = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
            const response = await this.octokit.repos.listForUser({
                username: this.username,
                per_page: 100,
                page,
                sort: 'updated',
                direction: 'desc'
            });
            
            repos.push(...response.data);
            hasMore = response.data.length === 100;
            page++;
        }
        
        // Filter out forks (optional)
        return repos.filter(repo => !repo.fork);
    }

    /**
     * Analyze a single repository
     */
    async _analyzeRepository(repo) {
        console.log(`  📦 Analyzing: ${repo.name}`);
        
        // Fetch README
        let readme = '';
        try {
            const readmeResponse = await this.octokit.repos.getReadme({
                owner: this.username,
                repo: repo.name
            });
            readme = Buffer.from(readmeResponse.data.content, 'base64').toString('utf-8');
        } catch (error) {
            // No README or error fetching
            readme = '';
        }
        
        // Fetch languages
        let languages = {};
        try {
            const languagesResponse = await this.octokit.repos.listLanguages({
                owner: this.username,
                repo: repo.name
            });
            languages = languagesResponse.data;
        } catch (error) {
            languages = {};
        }
        
        // Extract technologies from README and description
        const technologies = this._extractTechnologies(readme, repo.description || '');
        
        return {
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description || '',
            url: repo.html_url,
            homepage: repo.homepage || '',
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language || 'Unknown',
            languages: Object.keys(languages),
            topics: repo.topics || [],
            technologies,
            readme: readme.substring(0, 1000), // First 1000 chars
            createdAt: repo.created_at,
            updatedAt: repo.updated_at,
            size: repo.size
        };
    }

    /**
     * Calculate match score between repository and job requirements
     */
    _calculateMatchScore(repo, requiredSkills, position, description) {
        let score = 0;
        
        // Normalize inputs
        const requiredSkillsLower = requiredSkills.map(s => s.toLowerCase());
        const positionLower = position.toLowerCase();
        const descriptionLower = description.toLowerCase();
        
        // 1. Language match (30 points max)
        const repoLanguages = [repo.language, ...repo.languages].map(l => l.toLowerCase());
        const languageMatches = requiredSkillsLower.filter(skill => 
            repoLanguages.some(lang => lang.includes(skill) || skill.includes(lang))
        );
        score += Math.min(languageMatches.length * 10, 30);
        
        // 2. Technology match (30 points max)
        const techMatches = requiredSkillsLower.filter(skill =>
            repo.technologies.some(tech => 
                tech.toLowerCase().includes(skill) || skill.includes(tech.toLowerCase())
            )
        );
        score += Math.min(techMatches.length * 10, 30);
        
        // 3. Topics match (20 points max)
        const topicMatches = requiredSkillsLower.filter(skill =>
            repo.topics.some(topic => 
                topic.toLowerCase().includes(skill) || skill.includes(topic.toLowerCase())
            )
        );
        score += Math.min(topicMatches.length * 10, 20);
        
        // 4. Description/README relevance (10 points max)
        const repoText = `${repo.description} ${repo.readme}`.toLowerCase();
        const keywordMatches = requiredSkillsLower.filter(skill => repoText.includes(skill));
        score += Math.min(keywordMatches.length * 2, 10);
        
        // 5. Position-specific keywords (10 points max)
        const positionKeywords = this._extractPositionKeywords(positionLower);
        const positionMatches = positionKeywords.filter(keyword => repoText.includes(keyword));
        score += Math.min(positionMatches.length * 2, 10);
        
        // Bonus: Recent activity (5 points max)
        const daysSinceUpdate = (Date.now() - new Date(repo.updatedAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 30) score += 5;
        else if (daysSinceUpdate < 90) score += 3;
        else if (daysSinceUpdate < 180) score += 1;
        
        // Bonus: Stars/popularity (5 points max)
        if (repo.stars > 10) score += 5;
        else if (repo.stars > 5) score += 3;
        else if (repo.stars > 0) score += 1;
        
        return Math.round(score);
    }

    /**
     * Extract technologies from text
     */
    _extractTechnologies(readme, description) {
        const text = `${readme} ${description}`.toLowerCase();
        const technologies = new Set();
        
        // Common technologies to look for
        const techKeywords = [
            // Languages
            'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'go', 'rust', 'php', 'ruby',
            // Frontend
            'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'tailwind', 'bootstrap',
            // Backend
            'node.js', 'express', 'fastapi', 'django', 'flask', 'spring', 'asp.net',
            // Databases
            'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'mariadb',
            // DevOps
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ansible',
            // Tools
            'git', 'github', 'gitlab', 'jenkins', 'ci/cd', 'webpack', 'vite',
            // Testing
            'jest', 'mocha', 'pytest', 'junit', 'selenium', 'cypress',
            // Mobile
            'react native', 'flutter', 'swift', 'kotlin', 'android', 'ios'
        ];
        
        for (const tech of techKeywords) {
            if (text.includes(tech)) {
                technologies.add(tech);
            }
        }
        
        return Array.from(technologies);
    }

    /**
     * Extract position-specific keywords
     */
    _extractPositionKeywords(position) {
        const keywords = [];
        
        if (position.includes('backend')) keywords.push('api', 'server', 'database', 'rest');
        if (position.includes('frontend')) keywords.push('ui', 'ux', 'responsive', 'component');
        if (position.includes('full stack')) keywords.push('api', 'ui', 'database', 'rest');
        if (position.includes('devops')) keywords.push('docker', 'ci/cd', 'deployment', 'cloud');
        if (position.includes('mobile')) keywords.push('app', 'ios', 'android', 'mobile');
        if (position.includes('qa') || position.includes('test')) keywords.push('test', 'automation', 'quality');
        
        return keywords;
    }

    /**
     * Load cache from file
     */
    async _loadCache() {
        try {
            const cachePath = path.join('/app/data', 'github_cache.json');
            const data = await fs.readFile(cachePath, 'utf8');
            this.cache = JSON.parse(data);
            this.cacheTimestamp = new Date(this.cache.fetchedAt).getTime();
            console.log(`📦 Loaded cache from ${this.cache.fetchedAt}`);
        } catch (error) {
            console.log('📦 No cache found, will fetch fresh data');
            this.cache = null;
        }
    }

    /**
     * Save cache to file
     */
    async _saveCache() {
        try {
            const cachePath = path.join('/app/data', 'github_cache.json');
            await fs.writeFile(cachePath, JSON.stringify(this.cache, null, 2), 'utf8');
            console.log('💾 Cache saved to file');
        } catch (error) {
            console.error('❌ Error saving cache:', error.message);
        }
    }

    /**
     * Check if cache is expired
     */
    _isCacheExpired() {
        if (!this.cacheTimestamp) return true;
        return (Date.now() - this.cacheTimestamp) > this.cacheDuration;
    }
}

module.exports = GitHubService;
