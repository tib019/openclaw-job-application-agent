/**
 * Unit Tests for PromptService
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const PromptService = require('../src/services/PromptService');

describe('PromptService', () => {
    let service;

    beforeEach(() => {
        service = new PromptService();
    });

    describe('parsePrompt', () => {
        it('should identify list_applications intent', () => {
            const prompts = [
                'zeige alle bewerbungen',
                'liste alle jobs',
                'welche bewerbungen habe ich'
            ];

            prompts.forEach(prompt => {
                const result = service.parsePrompt(prompt);
                expect(result.intent).toBe('list_applications');
            });
        });

        it('should identify approve_applications intent', () => {
            const prompts = [
                'genehmige alle bewerbungen',
                'approve alle',
                'alle freigeben'
            ];

            prompts.forEach(prompt => {
                const result = service.parsePrompt(prompt);
                expect(result.intent).toBe('approve_applications');
            });
        });

        it('should identify reject_applications intent', () => {
            const prompts = [
                'lehne alle ab',
                'reject alle',
                'alle ablehnen'
            ];

            prompts.forEach(prompt => {
                const result = service.parsePrompt(prompt);
                expect(result.intent).toBe('reject_applications');
            });
        });

        it('should identify send_applications intent', () => {
            const prompts = [
                'sende alle bewerbungen',
                'send all',
                'versende alles'
            ];

            prompts.forEach(prompt => {
                const result = service.parsePrompt(prompt);
                expect(result.intent).toBe('send_applications');
            });
        });

        it('should extract score filter', () => {
            const prompt = 'zeige alle bewerbungen mit score über 70';
            
            const result = service.parsePrompt(prompt);
            
            expect(result.filters.minScore).toBe(70);
        });

        it('should extract remote filter', () => {
            const prompt = 'genehmige alle remote jobs';
            
            const result = service.parsePrompt(prompt);
            
            expect(result.filters.remote).toBe(true);
        });

        it('should extract company filter', () => {
            const prompt = 'zeige bewerbungen bei Google';
            
            const result = service.parsePrompt(prompt);
            
            expect(result.filters.company).toContain('google');
        });

        it('should handle complex prompts with multiple filters', () => {
            const prompt = 'genehmige alle remote jobs mit score über 75';
            
            const result = service.parsePrompt(prompt);
            
            expect(result.intent).toBe('approve_applications');
            expect(result.filters.remote).toBe(true);
            expect(result.filters.minScore).toBe(75);
        });

        it('should return unknown intent for unclear prompts', () => {
            const prompt = 'was ist das wetter heute';
            
            const result = service.parsePrompt(prompt);
            
            expect(result.intent).toBe('unknown');
        });
    });

    describe('buildFunctionCall', () => {
        it('should build list function call', () => {
            const parsed = {
                intent: 'list_applications',
                filters: { minScore: 70 }
            };

            const functionCall = service.buildFunctionCall(parsed);

            expect(functionCall.name).toBe('list_applications');
            expect(functionCall.arguments.filters.minScore).toBe(70);
        });

        it('should build approve function call', () => {
            const parsed = {
                intent: 'approve_applications',
                filters: { remote: true }
            };

            const functionCall = service.buildFunctionCall(parsed);

            expect(functionCall.name).toBe('approve_applications');
            expect(functionCall.arguments.filters.remote).toBe(true);
        });

        it('should build reject function call', () => {
            const parsed = {
                intent: 'reject_applications',
                filters: { maxScore: 50 }
            };

            const functionCall = service.buildFunctionCall(parsed);

            expect(functionCall.name).toBe('reject_applications');
            expect(functionCall.arguments.filters.maxScore).toBe(50);
        });

        it('should build send function call', () => {
            const parsed = {
                intent: 'send_applications',
                filters: {}
            };

            const functionCall = service.buildFunctionCall(parsed);

            expect(functionCall.name).toBe('send_applications');
        });

        it('should return null for unknown intent', () => {
            const parsed = {
                intent: 'unknown',
                filters: {}
            };

            const functionCall = service.buildFunctionCall(parsed);

            expect(functionCall).toBeNull();
        });
    });

    describe('error handling', () => {
        it('should handle empty prompt', () => {
            expect(() => service.parsePrompt('')).not.toThrow();
        });

        it('should handle null prompt', () => {
            expect(() => service.parsePrompt(null)).not.toThrow();
        });

        it('should handle very long prompts', () => {
            const longPrompt = 'a'.repeat(10000);
            expect(() => service.parsePrompt(longPrompt)).not.toThrow();
        });

        it('should handle special characters', () => {
            const prompt = 'zeige alle bewerbungen mit score > 70 & remote = true';
            expect(() => service.parsePrompt(prompt)).not.toThrow();
        });
    });
});
