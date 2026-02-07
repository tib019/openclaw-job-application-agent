/**
 * Unit Tests for EmailReaderSkill
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const EmailReaderSkill = require('../src/skills/EmailReaderSkill');

describe('EmailReaderSkill', () => {
    let skill;
    let mockConfig;

    beforeEach(() => {
        mockConfig = {
            email: {
                host: 'imap.gmail.com',
                port: 993,
                user: 'test@example.com',
                password: 'test-password'
            }
        };
        skill = new EmailReaderSkill(mockConfig);
    });

    describe('initialize', () => {
        it('should initialize without errors', async () => {
            await expect(skill.initialize()).resolves.not.toThrow();
        });
    });

    describe('extractJobURLs', () => {
        it('should extract StepStone URLs from email body', () => {
            const emailBody = `
                Neue Stellenanzeige: Backend Developer
                https://www.stepstone.de/stellenangebote--Backend-Developer-123456.html
                Jetzt bewerben!
            `;
            
            const urls = skill.extractJobURLs(emailBody);
            
            expect(urls).toHaveLength(1);
            expect(urls[0]).toContain('stepstone.de');
        });

        it('should extract LinkedIn URLs from email body', () => {
            const emailBody = `
                Job Alert: Software Engineer
                https://www.linkedin.com/jobs/view/123456789
            `;
            
            const urls = skill.extractJobURLs(emailBody);
            
            expect(urls).toHaveLength(1);
            expect(urls[0]).toContain('linkedin.com');
        });

        it('should extract Indeed URLs from email body', () => {
            const emailBody = `
                New job match: Java Developer
                https://de.indeed.com/viewjob?jk=abc123def456
            `;
            
            const urls = skill.extractJobURLs(emailBody);
            
            expect(urls).toHaveLength(1);
            expect(urls[0]).toContain('indeed.com');
        });

        it('should extract multiple URLs from one email', () => {
            const emailBody = `
                Multiple jobs:
                https://www.stepstone.de/stellenangebote--Job1-123.html
                https://www.linkedin.com/jobs/view/456
                https://de.indeed.com/viewjob?jk=789
            `;
            
            const urls = skill.extractJobURLs(emailBody);
            
            expect(urls).toHaveLength(3);
        });

        it('should return empty array if no URLs found', () => {
            const emailBody = 'This email has no job URLs';
            
            const urls = skill.extractJobURLs(emailBody);
            
            expect(urls).toHaveLength(0);
        });

        it('should deduplicate identical URLs', () => {
            const emailBody = `
                https://www.stepstone.de/stellenangebote--Job-123.html
                https://www.stepstone.de/stellenangebote--Job-123.html
            `;
            
            const urls = skill.extractJobURLs(emailBody);
            
            expect(urls).toHaveLength(1);
        });
    });

    describe('isJobAlert', () => {
        it('should identify StepStone job alerts', () => {
            const subject = 'StepStone Job-Agent: 5 neue Stellen';
            expect(skill.isJobAlert(subject)).toBe(true);
        });

        it('should identify LinkedIn job alerts', () => {
            const subject = 'LinkedIn Job Alert: Backend Developer';
            expect(skill.isJobAlert(subject)).toBe(true);
        });

        it('should identify Indeed job alerts', () => {
            const subject = 'Indeed Job Alert: Software Engineer';
            expect(skill.isJobAlert(subject)).toBe(true);
        });

        it('should reject non-job-alert emails', () => {
            const subject = 'Newsletter: Tech News';
            expect(skill.isJobAlert(subject)).toBe(false);
        });

        it('should be case-insensitive', () => {
            const subject = 'stepstone job alert';
            expect(skill.isJobAlert(subject)).toBe(true);
        });
    });

    describe('error handling', () => {
        it('should handle IMAP connection errors gracefully', async () => {
            const badConfig = {
                email: {
                    host: 'invalid-host',
                    port: 993,
                    user: 'test@example.com',
                    password: 'wrong-password'
                }
            };
            const badSkill = new EmailReaderSkill(badConfig);

            // Should not throw, but return empty array
            await expect(badSkill.checkForNewJobs()).resolves.toEqual([]);
        });

        it('should handle malformed email bodies', () => {
            const malformedBody = null;
            
            const urls = skill.extractJobURLs(malformedBody);
            
            expect(urls).toEqual([]);
        });
    });
});
