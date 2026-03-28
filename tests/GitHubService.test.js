/**
 * Unit Tests for GitHubService
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const GitHubService = require('../src/services/GitHubService');

describe('GitHubService', () => {
    let service;
    let mockConfig;

    beforeEach(() => {
        mockConfig = {
            githubUsername: 'test-user',
            githubToken: 'test-token'
        };
        service = new GitHubService(mockConfig);
    });

    describe('_calculateMatchScore', () => {
        it('should give high score for perfect language match', () => {
            const repo = {
                name: 'test-project',
                language: 'Java',
                languages: ['Java', 'JavaScript'],
                technologies: ['Spring', 'MySQL'],
                topics: ['backend', 'api'],
                description: 'A Spring Boot REST API',
                readme: 'Built with Java and Spring Boot',
                updatedAt: new Date().toISOString(),
                stars: 15
            };

            const requiredSkills = ['Java', 'Spring', 'MySQL'];
            const position = 'Backend Developer';
            const description = 'We need a Java developer';

            const score = service._calculateMatchScore(repo, requiredSkills, position, description);

            expect(score).toBeGreaterThan(40);
        });

        it('should give low score for no match', () => {
            const repo = {
                name: 'test-project',
                language: 'PHP',
                languages: ['PHP'],
                technologies: ['Laravel'],
                topics: ['web'],
                description: 'A Laravel project',
                readme: 'PHP web application',
                updatedAt: '2020-01-01T00:00:00Z',
                stars: 0
            };

            const requiredSkills = ['Java', 'Spring', 'MySQL'];
            const position = 'Backend Developer';
            const description = 'Java developer needed';

            const score = service._calculateMatchScore(repo, requiredSkills, position, description);

            expect(score).toBeLessThan(20);
        });

        it('should bonus for recent activity', () => {
            const recentRepo = {
                name: 'recent-project',
                language: 'Java',
                languages: ['Java'],
                technologies: [],
                topics: [],
                description: '',
                readme: '',
                updatedAt: new Date().toISOString(),
                stars: 0
            };

            const oldRepo = {
                ...recentRepo,
                updatedAt: '2020-01-01T00:00:00Z'
            };

            const requiredSkills = ['Java'];
            const position = 'Developer';
            const description = '';

            const recentScore = service._calculateMatchScore(recentRepo, requiredSkills, position, description);
            const oldScore = service._calculateMatchScore(oldRepo, requiredSkills, position, description);

            expect(recentScore).toBeGreaterThan(oldScore);
        });

        it('should bonus for popularity', () => {
            const popularRepo = {
                name: 'popular-project',
                language: 'Java',
                languages: ['Java'],
                technologies: [],
                topics: [],
                description: '',
                readme: '',
                updatedAt: new Date().toISOString(),
                stars: 20
            };

            const unpopularRepo = {
                ...popularRepo,
                stars: 0
            };

            const requiredSkills = ['Java'];
            const position = 'Developer';
            const description = '';

            const popularScore = service._calculateMatchScore(popularRepo, requiredSkills, position, description);
            const unpopularScore = service._calculateMatchScore(unpopularRepo, requiredSkills, position, description);

            expect(popularScore).toBeGreaterThan(unpopularScore);
        });

        it('should handle empty required skills', () => {
            const repo = {
                name: 'test-project',
                language: 'Java',
                languages: ['Java'],
                technologies: [],
                topics: [],
                description: '',
                readme: '',
                updatedAt: new Date().toISOString(),
                stars: 0
            };

            const score = service._calculateMatchScore(repo, [], '', '');

            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
        });
    });

    describe('_extractTechnologies', () => {
        it('should extract common technologies from text', () => {
            const readme = 'This project uses React, Node.js, and MongoDB';
            const description = 'A full-stack application with Docker';

            const technologies = service._extractTechnologies(readme, description);

            expect(technologies).toContain('react');
            expect(technologies).toContain('node.js');
            expect(technologies).toContain('mongodb');
            expect(technologies).toContain('docker');
        });

        it('should return empty array for text without technologies', () => {
            const readme = 'This is a simple project';
            const description = 'Nothing special';

            const technologies = service._extractTechnologies(readme, description);

            expect(technologies).toHaveLength(0);
        });

        it('should deduplicate technologies', () => {
            const readme = 'React React React';
            const description = 'React';

            const technologies = service._extractTechnologies(readme, description);

            expect(technologies.filter(t => t === 'react')).toHaveLength(1);
        });
    });

    describe('_extractPositionKeywords', () => {
        it('should extract backend keywords', () => {
            const keywords = service._extractPositionKeywords('backend developer');

            expect(keywords).toContain('api');
            expect(keywords).toContain('server');
            expect(keywords).toContain('database');
        });

        it('should extract frontend keywords', () => {
            const keywords = service._extractPositionKeywords('frontend engineer');

            expect(keywords).toContain('ui');
            expect(keywords).toContain('ux');
            expect(keywords).toContain('responsive');
        });

        it('should extract full stack keywords', () => {
            const keywords = service._extractPositionKeywords('full stack developer');

            expect(keywords).toContain('api');
            expect(keywords).toContain('ui');
        });

        it('should return empty array for unknown position', () => {
            const keywords = service._extractPositionKeywords('unknown position');

            expect(keywords).toHaveLength(0);
        });
    });

    describe('_isCacheExpired', () => {
        it('should return true if cache is null', () => {
            service.cacheTimestamp = null;

            expect(service._isCacheExpired()).toBe(true);
        });

        it('should return true if cache is older than 24 hours', () => {
            service.cacheTimestamp = Date.now() - (25 * 60 * 60 * 1000);

            expect(service._isCacheExpired()).toBe(true);
        });

        it('should return false if cache is fresh', () => {
            service.cacheTimestamp = Date.now();

            expect(service._isCacheExpired()).toBe(false);
        });
    });

    describe('error handling', () => {
        it('should handle null repository gracefully', () => {
            expect(() => service._calculateMatchScore(null, [], '', '')).not.toThrow();
        });

        it('should handle missing repository fields', () => {
            const incompleteRepo = {
                name: 'test'
            };

            expect(() => service._calculateMatchScore(incompleteRepo, ['Java'], 'Developer', '')).not.toThrow();
        });
    });
});
