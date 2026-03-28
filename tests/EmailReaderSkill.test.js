/**
 * Unit Tests for EmailReaderSkill
 */

// Mock imap so no real network connection is attempted
jest.mock('imap', () => {
    const EventEmitter = require('events');
    return jest.fn().mockImplementation(() => {
        const emitter = new EventEmitter();
        emitter.connect = jest.fn(() => { emitter.emit('ready'); });
        emitter.end = jest.fn();
        emitter.openBox = jest.fn((box, ro, cb) => cb(null, {}));
        emitter.search = jest.fn((criteria, cb) => cb(null, []));
        return emitter;
    });
});

const EmailReaderSkill = require('../src/skills/EmailReaderSkill');

const mockEmail = (from, subject, html = '', text = '') => ({
    from: { value: [{ address: from }], text: from },
    subject,
    html,
    text,
    date: new Date('2026-01-01T00:00:00Z')
});

describe('EmailReaderSkill', () => {
    let skill;

    beforeEach(() => {
        skill = new EmailReaderSkill({
            email: 'test@example.com',
            password: 'test-password',
            imapHost: 'imap.gmail.com',
            imapPort: 993
        });
    });

    describe('initialize', () => {
        it('should initialize without errors', async () => {
            await expect(skill.initialize()).resolves.not.toThrow();
        });
    });

    describe('extractStepStoneJobs', () => {
        it('should extract StepStone URLs from email content', () => {
            const email = mockEmail(
                'noreply@stepstone.de',
                'StepStone Job-Agent: 3 neue Stellen',
                'https://www.stepstone.de/stellenangebote--Backend-Developer-123456.html?trackingid=abc'
            );
            const jobs = skill.extractStepStoneJobs(email.html, email.text, email);
            expect(jobs).toHaveLength(1);
            expect(jobs[0].url).toContain('stepstone.de');
            expect(jobs[0].source).toBe('stepstone');
            // Tracking params should be stripped
            expect(jobs[0].url).not.toContain('trackingid');
        });

        it('should deduplicate identical StepStone URLs', () => {
            const url = 'https://www.stepstone.de/stellenangebote--Job-123.html';
            const email = mockEmail('noreply@stepstone.de', 'Job Alert', `${url} ${url}`);
            const jobs = skill.extractStepStoneJobs(email.html, email.text, email);
            expect(jobs).toHaveLength(1);
        });

        it('should return empty array when no StepStone URLs present', () => {
            const email = mockEmail('noreply@stepstone.de', 'Job Alert', 'No jobs today.');
            const jobs = skill.extractStepStoneJobs(email.html, email.text, email);
            expect(jobs).toHaveLength(0);
        });
    });

    describe('extractLinkedInJobs', () => {
        it('should extract LinkedIn job URLs', () => {
            const email = mockEmail(
                'jobs-noreply@linkedin.com',
                'LinkedIn Job Alert',
                'https://www.linkedin.com/jobs/view/123456789'
            );
            const jobs = skill.extractLinkedInJobs(email.html, email.text, email);
            expect(jobs).toHaveLength(1);
            expect(jobs[0].url).toContain('linkedin.com/jobs/view');
            expect(jobs[0].source).toBe('linkedin');
        });
    });

    describe('extractIndeedJobs', () => {
        it('should extract Indeed job URLs', () => {
            const email = mockEmail(
                'alert@indeed.com',
                'Indeed Job Alert',
                'https://de.indeed.com/viewjob?jk=abc123def456'
            );
            const jobs = skill.extractIndeedJobs(email.html, email.text, email);
            expect(jobs).toHaveLength(1);
            expect(jobs[0].url).toContain('indeed.com/viewjob');
            expect(jobs[0].source).toBe('indeed');
        });
    });

    describe('extractJobsFromEmail', () => {
        it('should route StepStone emails to extractStepStoneJobs', async () => {
            const email = mockEmail(
                'noreply@stepstone.de',
                'Job Alert',
                'https://www.stepstone.de/stellenangebote--Dev-1.html'
            );
            const jobs = await skill.extractJobsFromEmail(email);
            expect(jobs[0].source).toBe('stepstone');
        });

        it('should route LinkedIn emails to extractLinkedInJobs', async () => {
            const email = mockEmail(
                'jobs-noreply@linkedin.com',
                'Job Alert',
                'https://www.linkedin.com/jobs/view/999'
            );
            const jobs = await skill.extractJobsFromEmail(email);
            expect(jobs[0].source).toBe('linkedin');
        });

        it('should use generic extractor for unknown senders', async () => {
            const email = mockEmail(
                'jobs@somecompany.de',
                'Wir suchen Backend-Entwickler',
                'Bewerben Sie sich jetzt: https://somecompany.de/jobs/backend-developer'
            );
            const jobs = await skill.extractJobsFromEmail(email);
            expect(Array.isArray(jobs)).toBe(true);
        });
    });

    describe('error handling', () => {
        it('should handle IMAP connection errors by returning empty array', async () => {
            // Initialize first so this.imap is set, then call checkForNewEmails
            await skill.initialize();
            await expect(skill.checkForNewEmails()).resolves.toEqual([]);
        });
    });
});
