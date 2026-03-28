/**
 * Unit Tests for PromptService
 */

// Mock openai — processPrompt relies on LLM; we test the surrounding logic
jest.mock('openai', () => {
    const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
            message: {
                tool_calls: [{
                    function: {
                        name: 'listApplicationsFiltered',
                        arguments: JSON.stringify({ minScore: 70 })
                    }
                }]
            }
        }]
    });
    return jest.fn().mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
    }));
});

// Mock axios so _executeFunction doesn't make real HTTP calls
jest.mock('axios', () => ({
    get: jest.fn().mockResolvedValue({ data: { applications: [], count: 0 } }),
    post: jest.fn().mockResolvedValue({ data: { success: true } })
}));

const PromptService = require('../src/services/PromptService');

describe('PromptService', () => {
    let service;

    beforeEach(() => {
        service = new PromptService({ openaiApiKey: 'test-key', apiBaseUrl: 'http://localhost:3000' });
    });

    describe('constructor', () => {
        it('should instantiate without config', () => {
            expect(() => new PromptService()).not.toThrow();
        });

        it('should instantiate with partial config', () => {
            expect(() => new PromptService({ apiBaseUrl: 'http://localhost:3000' })).not.toThrow();
        });
    });

    describe('_getSystemPrompt', () => {
        it('should return a non-empty string', () => {
            const prompt = service._getSystemPrompt();
            expect(typeof prompt).toBe('string');
            expect(prompt.length).toBeGreaterThan(0);
        });

        it('should mention available actions', () => {
            const prompt = service._getSystemPrompt();
            expect(prompt).toMatch(/list|approve|reject|send/i);
        });
    });

    describe('_getFunctionDefinitions', () => {
        it('should return an array of function definitions', () => {
            const defs = service._getFunctionDefinitions();
            expect(Array.isArray(defs)).toBe(true);
            expect(defs.length).toBeGreaterThan(0);
        });

        it('each definition should have name, description and parameters', () => {
            const defs = service._getFunctionDefinitions();
            for (const def of defs) {
                expect(def).toHaveProperty('name');
                expect(def).toHaveProperty('description');
                expect(def).toHaveProperty('parameters');
            }
        });

        it('should include listApplicationsFiltered', () => {
            const defs = service._getFunctionDefinitions();
            const names = defs.map(d => d.name);
            expect(names).toContain('listApplicationsFiltered');
        });

        it('should include approveBatch and rejectBatch', () => {
            const defs = service._getFunctionDefinitions();
            const names = defs.map(d => d.name);
            expect(names).toContain('approveBatch');
            expect(names).toContain('rejectBatch');
        });
    });

    describe('processPrompt', () => {
        it('should return a result object', async () => {
            const result = await service.processPrompt('zeige alle bewerbungen');
            expect(result).toBeDefined();
        });

        it('should handle empty prompt gracefully', async () => {
            await expect(service.processPrompt('')).resolves.toBeDefined();
        });

        it('should handle null prompt gracefully', async () => {
            await expect(service.processPrompt(null)).resolves.toBeDefined();
        });
    });
});
