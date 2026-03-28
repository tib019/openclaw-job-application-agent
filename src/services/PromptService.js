/**
 * Prompt Service
 * 
 * Processes natural language prompts and translates them into API calls
 * using LLM Function Calling (OpenAI GPT-4.1-mini).
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const OpenAI = require('openai');
const axios = require('axios');

class PromptService {
    constructor(config) {
        this.config = config;
        this.openai = new OpenAI({
            apiKey: config.openaiApiKey
        });
        this.apiBaseUrl = config.apiBaseUrl || 'http://localhost:3000';
    }

    /**
     * Process a natural language prompt
     * 
     * @param {string} prompt - User's natural language instruction
     * @returns {Object} Result of the action
     */
    async processPrompt(prompt) {
 console.log(`Processing prompt: "${prompt}"`);

        try {
            // Call OpenAI with function calling
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4.1-mini',
                messages: [
                    {
                        role: 'system',
                        content: this._getSystemPrompt()
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                functions: this._getFunctionDefinitions(),
                function_call: 'auto'
            });

            const message = response.choices[0].message;

            // Check if the model wants to call a function
            if (message.function_call) {
                const functionName = message.function_call.name;
                const functionArgs = JSON.parse(message.function_call.arguments);

 console.log(`Function call: ${functionName}`, functionArgs);

                // Execute the function
                const result = await this._executeFunction(functionName, functionArgs);

                return {
                    success: true,
                    action: functionName,
                    arguments: functionArgs,
                    result
                };
            } else {
                // No function call, just return the text response
                return {
                    success: true,
                    message: message.content
                };
            }
        } catch (error) {
 console.error('Error processing prompt:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get system prompt for the LLM
     */
    _getSystemPrompt() {
        return `You are an intelligent assistant for a job application agent. 
You help the user manage their job applications through natural language commands.

Available actions:
- List applications (with filters: status, score range, keywords)
- Approve applications (single or batch with filters)
- Reject applications (single or batch with filters)
- Send approved applications
- Get statistics

When the user gives you a command, determine which function to call and with what parameters.

Examples:
- "Show me all applications with score over 70" → listApplicationsFiltered(minScore: 70)
- "Reject all applications with score under 60" → rejectBatch(filter: {maxScore: 59})
- "Approve all remote jobs" → approveBatch(filter: {remoteOnly: true})
- "Send all approved applications" → sendAllApplications()

Be helpful and confirm actions clearly.`;
    }

    /**
     * Get function definitions for OpenAI Function Calling
     */
    _getFunctionDefinitions() {
        return [
            {
                name: 'listApplicationsFiltered',
                description: 'List applications with optional filters',
                parameters: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['PENDING_REVIEW', 'APPROVED', 'SENT', 'REJECTED', 'FAILED'],
                            description: 'Filter by status'
                        },
                        minScore: {
                            type: 'number',
                            description: 'Minimum match score (0-100)'
                        },
                        maxScore: {
                            type: 'number',
                            description: 'Maximum match score (0-100)'
                        },
                        keywords: {
                            type: 'string',
                            description: 'Comma-separated keywords to search in position'
                        }
                    }
                }
            },
            {
                name: 'approveApplication',
                description: 'Approve a single application by ID',
                parameters: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'number',
                            description: 'Application ID'
                        }
                    },
                    required: ['id']
                }
            },
            {
                name: 'rejectApplication',
                description: 'Reject a single application by ID',
                parameters: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'number',
                            description: 'Application ID'
                        }
                    },
                    required: ['id']
                }
            },
            {
                name: 'approveBatch',
                description: 'Approve multiple applications based on filter criteria',
                parameters: {
                    type: 'object',
                    properties: {
                        filter: {
                            type: 'object',
                            properties: {
                                minScore: {
                                    type: 'number',
                                    description: 'Minimum match score'
                                },
                                includeKeywords: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Keywords to include in position'
                                },
                                remoteOnly: {
                                    type: 'boolean',
                                    description: 'Only remote positions'
                                }
                            }
                        }
                    },
                    required: ['filter']
                }
            },
            {
                name: 'rejectBatch',
                description: 'Reject multiple applications based on filter criteria',
                parameters: {
                    type: 'object',
                    properties: {
                        filter: {
                            type: 'object',
                            properties: {
                                maxScore: {
                                    type: 'number',
                                    description: 'Maximum match score'
                                },
                                excludeKeywords: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Keywords to exclude from position'
                                },
                                maxCompanySize: {
                                    type: 'number',
                                    description: 'Maximum company size'
                                }
                            }
                        }
                    },
                    required: ['filter']
                }
            },
            {
                name: 'sendAllApplications',
                description: 'Send all approved applications',
                parameters: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'getStatistics',
                description: 'Get queue statistics',
                parameters: {
                    type: 'object',
                    properties: {}
                }
            }
        ];
    }

    /**
     * Execute a function by calling the Agent API
     */
    async _executeFunction(functionName, args) {
        try {
            let response;

            switch (functionName) {
                case 'listApplicationsFiltered':
                    response = await axios.get(`${this.apiBaseUrl}/api/queue/list-filtered`, {
                        params: args
                    });
                    break;

                case 'approveApplication':
                    response = await axios.post(`${this.apiBaseUrl}/api/queue/approve/${args.id}`);
                    break;

                case 'rejectApplication':
                    response = await axios.post(`${this.apiBaseUrl}/api/queue/reject/${args.id}`);
                    break;

                case 'approveBatch':
                    response = await axios.post(`${this.apiBaseUrl}/api/queue/approve-batch`, args);
                    break;

                case 'rejectBatch':
                    response = await axios.post(`${this.apiBaseUrl}/api/queue/reject-batch`, args);
                    break;

                case 'sendAllApplications':
                    response = await axios.post(`${this.apiBaseUrl}/api/queue/send-all`);
                    break;

                case 'getStatistics':
                    response = await axios.get(`${this.apiBaseUrl}/api/queue/stats`);
                    break;

                default:
                    throw new Error(`Unknown function: ${functionName}`);
            }

            return response.data;
        } catch (error) {
 console.error(`Error executing function ${functionName}:`, error.message);
            throw error;
        }
    }
}

module.exports = PromptService;
