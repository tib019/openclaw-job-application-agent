/**
 * Unit Tests for JobParserSkill
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const JobParserSkill = require('../src/skills/JobParserSkill');

describe('JobParserSkill', () => {
    let skill;
    let mockConfig;
    let mockUserProfile;

    beforeEach(() => {
        mockConfig = {};
        mockUserProfile = {
            skills: {
                languages: ['Java', 'Python', 'JavaScript'],
                frameworks: ['Spring', 'React'],
                databases: ['MySQL', 'PostgreSQL']
            },
            preferences: {
                locations: ['Hamburg', 'Remote'],
                salary: { min: 45000, max: 65000 }
            }
        };
        skill = new JobParserSkill(mockConfig);
        skill.userProfile = mockUserProfile;
    });

    describe('calculateMatchScore', () => {
        it('should give high score for perfect skill match', () => {
            const jobData = {
                requiredSkills: ['Java', 'Spring', 'MySQL'],
                position: 'Backend Developer',
                location: 'Hamburg',
                salary: { min: 50000, max: 60000 }
            };

            const score = skill.calculateMatchScore(jobData);

            expect(score).toBeGreaterThan(70);
        });

        it('should give low score for poor skill match', () => {
            const jobData = {
                requiredSkills: ['PHP', 'Laravel', 'Oracle'],
                position: 'PHP Developer',
                location: 'München',
                salary: { min: 70000, max: 80000 }
            };

            const score = skill.calculateMatchScore(jobData);

            expect(score).toBeLessThan(30);
        });

        it('should bonus for remote positions', () => {
            const remoteJob = {
                requiredSkills: ['Java'],
                position: 'Backend Developer',
                location: 'Remote',
                salary: { min: 50000, max: 60000 }
            };

            const onSiteJob = {
                ...remoteJob,
                location: 'Berlin'
            };

            const remoteScore = skill.calculateMatchScore(remoteJob);
            const onSiteScore = skill.calculateMatchScore(onSiteJob);

            expect(remoteScore).toBeGreaterThan(onSiteScore);
        });

        it('should bonus for preferred location', () => {
            const hamburgJob = {
                requiredSkills: ['Java'],
                position: 'Backend Developer',
                location: 'Hamburg',
                salary: { min: 50000, max: 60000 }
            };

            const berlinJob = {
                ...hamburgJob,
                location: 'Berlin'
            };

            const hamburgScore = skill.calculateMatchScore(hamburgJob);
            const berlinScore = skill.calculateMatchScore(berlinJob);

            expect(hamburgScore).toBeGreaterThan(berlinScore);
        });

        it('should bonus for salary in range', () => {
            const goodSalaryJob = {
                requiredSkills: ['Java'],
                position: 'Backend Developer',
                location: 'Hamburg',
                salary: { min: 50000, max: 60000 }
            };

            const lowSalaryJob = {
                ...goodSalaryJob,
                salary: { min: 30000, max: 40000 }
            };

            const goodScore = skill.calculateMatchScore(goodSalaryJob);
            const lowScore = skill.calculateMatchScore(lowSalaryJob);

            expect(goodScore).toBeGreaterThan(lowScore);
        });

        it('should handle missing data gracefully', () => {
            const incompleteJob = {
                position: 'Developer'
            };

            const score = skill.calculateMatchScore(incompleteJob);

            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
        });
    });

    describe('extractApplicationMethod', () => {
        it('should detect email application', () => {
            const jobData = {
                description: 'Bitte senden Sie Ihre Bewerbung an jobs@company.com'
            };

            const method = skill.extractApplicationMethod(jobData);

            expect(method.type).toBe('email');
            expect(method.email).toBe('jobs@company.com');
        });

        it('should detect LinkedIn Easy Apply', () => {
            const jobData = {
                url: 'https://www.linkedin.com/jobs/view/123456',
                description: 'Apply with LinkedIn'
            };

            const method = skill.extractApplicationMethod(jobData);

            expect(method.type).toBe('linkedin');
        });

        it('should detect online form', () => {
            const jobData = {
                description: 'Bewerben Sie sich online unter www.company.com/jobs'
            };

            const method = skill.extractApplicationMethod(jobData);

            expect(method.type).toBe('online_form');
        });

        it('should default to unknown if no method found', () => {
            const jobData = {
                description: 'Great job opportunity'
            };

            const method = skill.extractApplicationMethod(jobData);

            expect(method.type).toBe('unknown');
        });
    });

    describe('error handling', () => {
        it('should handle null job data', () => {
            expect(() => skill.calculateMatchScore(null)).not.toThrow();
        });

        it('should handle undefined user profile', () => {
            skill.userProfile = null;
            const jobData = {
                requiredSkills: ['Java'],
                position: 'Developer'
            };

            expect(() => skill.calculateMatchScore(jobData)).not.toThrow();
        });

        it('should handle malformed salary data', () => {
            const jobData = {
                requiredSkills: ['Java'],
                salary: 'competitive'
            };

            const score = skill.calculateMatchScore(jobData);

            expect(score).toBeGreaterThanOrEqual(0);
        });
    });
});
