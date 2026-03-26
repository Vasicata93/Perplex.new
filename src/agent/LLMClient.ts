import { GoogleGenAI } from "@google/genai";
import { ModelProvider, LocalModelConfig } from '../../types';

export interface LLMResponse {
    text: string;
    toolCalls?: { id?: string; name: string; args: any }[];
    usage?: any;
    reasoning?: string;
}

export class LLMClient {
    private geminiClient: GoogleGenAI | null = null;

    constructor(private config: {
        provider: ModelProvider;
        apiKey?: string;
        modelId: string;
        localModel?: LocalModelConfig;
        openRouterKey?: string;
        openAiKey?: string;
    }) {
        if (config.provider === ModelProvider.GEMINI && config.apiKey) {
            this.geminiClient = new GoogleGenAI({ apiKey: config.apiKey });
        }
    }

    public async generateCompletion(
        messages: any[], 
        tools: any[], 
        systemInstruction?: string
    ): Promise<LLMResponse> {
        if (this.config.provider === ModelProvider.GEMINI) {
            return this.generateGemini(messages, tools, systemInstruction);
        } else {
            return this.generateGeneric(messages, tools, systemInstruction);
        }
    }

    private async generateGemini(messages: any[], tools: any[], systemInstruction?: string): Promise<LLMResponse> {
        if (!this.geminiClient) throw new Error("Gemini Client not initialized");
        
        // Extract system message if present
        let finalSystemInstruction = systemInstruction;
        const filteredMessages = messages.filter(m => {
            if (m.role === 'system') {
                finalSystemInstruction = m.content;
                return false;
            }
            return true;
        });

        // Convert tools to Gemini format
        const geminiTools = tools.map(t => {
            const convertTypes = (schema: any): any => {
                if (!schema) return schema;
                const newSchema = { ...schema };
                if (newSchema.type && typeof newSchema.type === 'string') {
                    newSchema.type = newSchema.type.toUpperCase();
                }
                if (newSchema.properties) {
                    newSchema.properties = { ...newSchema.properties };
                    for (const key in newSchema.properties) {
                        newSchema.properties[key] = convertTypes(newSchema.properties[key]);
                    }
                }
                if (newSchema.items) {
                    newSchema.items = convertTypes(newSchema.items);
                }
                return newSchema;
            };

            return {
                name: t.name,
                description: t.description,
                parameters: convertTypes(t.parameters)
            };
        });

        const history = filteredMessages.slice(0, -1).map(m => {
            if (m.role === 'assistant' && m.tool_calls) {
                const parts: any[] = m.tool_calls.map((tc: any) => ({
                    functionCall: {
                        name: tc.name,
                        args: tc.args
                    }
                }));
                if (m.content) {
                    parts.unshift({ text: m.content });
                }
                return {
                    role: 'model',
                    parts: parts
                };
            } else if (m.role === 'tool') {
                let parsedResponse = m.content;
                if (typeof m.content === 'string') {
                    try {
                        parsedResponse = JSON.parse(m.content);
                    } catch (e) {
                        parsedResponse = { result: m.content };
                    }
                }
                return {
                    role: 'user',
                    parts: [{
                        functionResponse: {
                            name: m.name,
                            response: parsedResponse
                        }
                    }]
                };
            } else {
                return {
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content || "" }]
                };
            }
        });

        const chat = this.geminiClient.chats.create({
            model: this.config.modelId,
            history: history,
            config: {
                tools: geminiTools.length > 0 ? [{ functionDeclarations: geminiTools }] : undefined,
                systemInstruction: finalSystemInstruction,
                httpOptions: geminiTools.length > 0 ? {
                    extraBody: {
                        tool_config: {
                            include_server_side_tool_invocations: true
                        }
                    }
                } as any : undefined
            }
        });

        const lastMsg = filteredMessages[filteredMessages.length - 1];
        if (!lastMsg) {
            return { text: "" };
        }
        let messageContent: any = lastMsg.content;
        
        if (lastMsg.role === 'tool') {
            let parsedResponse = lastMsg.content;
            if (typeof lastMsg.content === 'string') {
                try {
                    parsedResponse = JSON.parse(lastMsg.content);
                } catch (e) {
                    parsedResponse = { result: lastMsg.content };
                }
            }
            messageContent = [{
                functionResponse: {
                    name: lastMsg.name,
                    response: parsedResponse
                }
            }];
        } else if (lastMsg.role === 'assistant' && lastMsg.tool_calls) {
            const parts: any[] = lastMsg.tool_calls.map((tc: any) => ({
                functionCall: {
                    name: tc.name,
                    args: tc.args
                }
            }));
            if (lastMsg.content) {
                parts.unshift({ text: lastMsg.content });
            }
            messageContent = parts;
        }

        const result = await chat.sendMessage(messageContent);
        const response = result;
        
        // Extract tool calls
        const functionCalls = response.functionCalls;
        const toolCalls = functionCalls ? functionCalls.map((fc: any) => ({
            id: `call_${Math.random().toString(36).substring(2, 9)}`,
            name: fc.name,
            args: fc.args
        })) : undefined;
        
        return {
            text: response.text || "",
            toolCalls: toolCalls
        };
    }

    private async generateGeneric(messages: any[], tools: any[], systemInstruction?: string): Promise<LLMResponse> {
        let endpoint = "";
        let apiKey = "";
        let modelName = this.config.modelId;

        if (this.config.provider === ModelProvider.OPENAI) {
            endpoint = "https://api.openai.com/v1/chat/completions";
            apiKey = this.config.openAiKey || "";
        } else if (this.config.provider === ModelProvider.OPENROUTER) {
            endpoint = "https://openrouter.ai/api/v1/chat/completions";
            apiKey = this.config.openRouterKey || "";
        } else if (this.config.provider === ModelProvider.LOCAL) {
            endpoint = "http://localhost:11434/v1/chat/completions";
            modelName = this.config.localModel?.modelId || "";
            apiKey = "not-needed";
        } else {
            throw new Error(`Unsupported provider: ${this.config.provider}`);
        }

        const headers: any = {
            'Content-Type': 'application/json'
        };

        if (apiKey && apiKey !== "not-needed") {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
        
        if (this.config.provider === ModelProvider.OPENROUTER) {
            headers['HTTP-Referer'] = window.location.origin;
            headers['X-Title'] = 'Robo AI Assistant';
        }

        const formattedMessages = messages.map(m => {
            const msg: any = { role: m.role, content: m.content || "" };
            if (m.role === 'assistant' && m.tool_calls) {
                msg.tool_calls = m.tool_calls.map((tc: any) => ({
                    id: tc.id,
                    type: "function",
                    function: {
                        name: tc.name,
                        arguments: JSON.stringify(tc.args)
                    }
                }));
            } else if (m.role === 'tool') {
                msg.tool_call_id = m.tool_call_id;
                msg.name = m.name;
            }
            return msg;
        });
        if (systemInstruction) {
            // If system instruction is provided, prepend it or update existing system message
            if (formattedMessages.length > 0 && formattedMessages[0].role === 'system') {
                formattedMessages[0].content = systemInstruction + "\n\n" + formattedMessages[0].content;
            } else {
                formattedMessages.unshift({ role: 'system', content: systemInstruction });
            }
        }

        const body: any = {
            model: modelName,
            messages: formattedMessages
        };

        if (tools && tools.length > 0) {
            body.tools = tools.map(t => ({
                type: "function",
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters
                }
            }));
            body.tool_choice = "auto";
        }

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errorData = await res.text();
                throw new Error(`API Error (${res.status}): ${errorData}`);
            }

            const data = await res.json();
            const message = data.choices[0].message;
            
            let toolCalls = undefined;
            if (message.tool_calls && message.tool_calls.length > 0) {
                toolCalls = message.tool_calls.map((tc: any) => {
                    let args = {};
                    try {
                        args = JSON.parse(tc.function.arguments);
                    } catch (e) {
                        console.error("Failed to parse tool arguments", tc.function.arguments);
                    }
                    return {
                        id: tc.id,
                        name: tc.function.name,
                        args: args
                    };
                });
            }

            return {
                text: message.content || "",
                toolCalls: toolCalls,
                usage: data.usage
            };
        } catch (error: any) {
            console.error("LLM Generation Error:", error);
            throw error;
        }
    }
}
