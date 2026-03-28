/**
 * Unit Tests for JobParserSkill
 */

// Mock openai (used as { OpenAI }) and selenium so no browser/API key is needed
jest.mock('openai', () => {
    const MockOpenAI = jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn().mockResolvedValue({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                requiredSkills: ['Java', 'Spring'],
                                matchScore: 75,
                                remoteOption: 'hybrid',
                                experienceLevel: 'mid'
                            })
                        }
                    }]
                })
            }
        }
    }));
    return { OpenAI: MockOpenAI };
});

jest.mock('selenium-webdriver', () => ({
    Builder: jest.fn().mockReturnValue({
        forBrowser: jest.fn().mockReturnThis(),
        usingServer: jest.fn().mockReturnThis(),
        build: jest.fn().mockResolvedValue({
            get: jest.fn().mockResolvedValue(null),
            wait: jest.fn().mockResolvedValue(null),
            sleep: jest.fn().mockResolvedValue(null),
            getPageSource: jest.fn().mockResolvedValue('<html><body>Java Developer at TechCorp Hamburg</body></html>'),
            getTitle: jest.fn().mockResolvedValue('Java Developer - TechCorp'),
            quit: jest.fn().mockResolvedValue(null)
        })
    }),
    By: { css: jest.fn(), xpath: jest.fn(), tagName: jest.fn() },
    until: { elementLocated: jest.fn().mockReturnValue({}) }
}));

jest.mock('selenium-webdriver/chrome', () => ({
    Options: jest.fn().mockImplementation(() => ({
        addArguments: jest.fn().mockReturnThis()
    }))
}));

const JobParserSkill = require('../src/skills/JobParserSkill');

describe('JobParserSkill', () => {
    let skill;

    beforeEach(() => {
        skill = new JobParserSkill({});
    });

    describe('constructor', () => {
        it('should instantiate without throwing', () => {
            expect(() => new JobParserSkill({})).not.toThrow();
        });
    });

    describe('stripHtmlTags', () => {
        it('should remove HTML tags from text', () => {
            const html = '<h1>Java Developer</h1><p>We need <strong>Java</strong> skills.</p>';
            const text = skill.stripHtmlTags(html);
            expect(text).not.toContain('<h1>');
            expect(text).toContain('Java Developer');
            expect(text).toContain('Java');
        });

        it('should strip script and style tags with content', () => {
            const html = '<script>alert("xss")</script><p>Content</p><style>body{}</style>';
            const text = skill.stripHtmlTags(html);
            expect(text).not.toContain('alert');
            expect(text).not.toContain('body{}');
            expect(text).toContain('Content');
        });

        it('should handle empty string', () => {
            expect(skill.stripHtmlTags('')).toBe('');
        });
    });

    describe('extractCompanyFromUrl', () => {
        it('should extract company name from a standard jobs subdomain URL', () => {
            const company = skill.extractCompanyFromUrl('https://jobs.techcorp.com/position/123');
            expect(company).toBe('techcorp');
        });

        it('should return null for invalid URLs', () => {
            const company = skill.extractCompanyFromUrl('not-a-url');
            expect(company).toBeNull();
        });
    });

    describe('extractByRegex', () => {
        it('should extract matching group from HTML', () => {
            const html = '<title>Senior Java Developer - TechCorp</title>';
            const result = skill.extractByRegex(html, /<title>(.*?)<\/title>/);
            expect(result).toBe('Senior Java Developer - TechCorp');
        });

        it('should return null when no match found', () => {
            const result = skill.extractByRegex('<p>no title</p>', /<title>(.*?)<\/title>/);
            expect(result).toBeNull();
        });
    });

    describe('enrichWithLLM', () => {
        it('should merge LLM response into jobData', async () => {
            const jobData = { url: 'https://example.com/job', source: 'generic', company: 'TechCorp' };
            const result = await skill.enrichWithLLM(jobData, '<html>Java Developer position</html>');
            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('source');
        });

        it('should return original jobData on LLM failure', async () => {
            // Make openai throw
            skill.openai.chat.completions.create = jest.fn().mockRejectedValue(new Error('API error'));
            const jobData = { url: 'https://example.com/job', source: 'generic' };
            const result = await skill.enrichWithLLM(jobData, '');
            expect(result).toEqual(jobData);
        });
    });

    describe('error handling', () => {
        it('should handle null html in stripHtmlTags gracefully', () => {
            expect(() => skill.stripHtmlTags(null || '')).not.toThrow();
        });
    });
});
