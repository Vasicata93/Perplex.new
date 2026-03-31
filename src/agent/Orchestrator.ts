import { AgentContext, AgentEvent, AgentResult, Plan } from './types';
import { ToolingSystem } from './ToolingSystem';
import { MemorySystem } from './MemorySystem';
import { LLMClient } from './LLMClient';

export class Orchestrator {
    private tooling: ToolingSystem;
    private memory: MemorySystem;
    private llm: LLMClient;
    private context: AgentContext;
    private eventEmitter: (event: AgentEvent) => void;

    constructor(
        context: AgentContext,
        tooling: ToolingSystem,
        memory: MemorySystem,
        llm: LLMClient,
        eventEmitter: (event: AgentEvent) => void
    ) {
        this.context = context;
        this.tooling = tooling;
        this.memory = memory;
        this.llm = llm;
        this.eventEmitter = eventEmitter;
    }

    public async run(prompt: string, onChunk?: (text: string, reasoning?: string) => void): Promise<AgentResult> {
        console.error('[Orchestrator] Starting run with prompt:', prompt);
        let finalResult: AgentResult = { text: '', citations: [], relatedQuestions: [], searchImages: [] };
        let accumulatedReasoning = "";

        const emitStep = (id: string, name: string, status: 'running' | 'done' | 'error', summary?: string) => {
            const step = { id, name, status, summary };
            console.error('[Orchestrator] Emitting step:', id, name, status, summary);
            this.eventEmitter({ type: 'step_progress', step });
        };

        try {
            // Step 1: Analyze Request (Intent)
            emitStep('intent', 'Analyzing intent', 'running');
            const intent = await this.analyzeIntent(prompt);
            this.memory.updateWorkingMemory('activeSubtask', intent);
            accumulatedReasoning += `Intent: ${intent}\n`;
            emitStep('intent', 'Analyzing intent', 'done', intent);

            // Step 2: Plan Actions (Planner Engine)
            emitStep('plan', 'Creating execution plan', 'running');
            const plan = await this.createPlan(intent, prompt);
            const planSummary = plan.tasks.map(t => t.description).join(' -> ');
            accumulatedReasoning += `Plan: ${planSummary}\n`;
            emitStep('plan', 'Creating execution plan', 'done', planSummary);

            // Step 3: ReAct (Reasoning Loop)
            let turns = 0;
            const maxTurns = 7;
            let currentContext = this.buildContext(prompt, plan);
            let rawResponseText = "";

            while (turns < maxTurns) {
                const stepId = `react_${turns}`;
                emitStep(stepId, `Executing step ${turns + 1}/${maxTurns}`, 'running');
                
                let currentThinkingStepId: string | null = null;
                let currentThinkingStepContent = "";
                let chunkBuffer = "";

                const response = await this.llm.generateCompletion(currentContext, this.tooling.getAllTools(), undefined, (chunk) => {
                    chunkBuffer += chunk;
                    
                    // Check for start tag
                    if (!currentThinkingStepId && chunkBuffer.includes('<thinking_step')) {
                        const startTagMatch = chunkBuffer.match(/<thinking_step(?:\s+name="([^"]+)")?>/);
                        if (startTagMatch) {
                            const stepName = startTagMatch[1] || "Thinking";
                            currentThinkingStepId = `react_${turns}_${stepName.toLowerCase().replace(/\s+/g, '_')}`;
                            currentThinkingStepContent = "";
                            emitStep(currentThinkingStepId, stepName, 'running', "");
                            
                            // Remove the tag from buffer
                            chunkBuffer = chunkBuffer.substring(startTagMatch.index! + startTagMatch[0].length);
                        }
                    } 
                    
                    // Check for end tag
                    if (currentThinkingStepId && chunkBuffer.includes('</thinking_step>')) {
                        const endTagIdx = chunkBuffer.indexOf('</thinking_step>');
                        const content = chunkBuffer.substring(0, endTagIdx);
                        currentThinkingStepContent += content;
                        
                        emitStep(currentThinkingStepId, "Thinking", 'done', currentThinkingStepContent);
                        
                        currentThinkingStepId = null;
                        currentThinkingStepContent = "";
                        // Keep the rest of the buffer
                        chunkBuffer = chunkBuffer.substring(endTagIdx + '</thinking_step>'.length);
                    } else if (currentThinkingStepId) {
                        // If we are inside a thinking step, everything in the buffer is content
                        currentThinkingStepContent += chunkBuffer;
                        emitStep(currentThinkingStepId, "Thinking", 'running', currentThinkingStepContent);
                        chunkBuffer = "";
                    } else if (!chunkBuffer.includes('<')) {
                        // If we are not inside a thinking step and no start tag is pending, send to UI
                        if (onChunk) onChunk(chunkBuffer);
                        chunkBuffer = "";
                    }
                });
                
                let stepSummary = "";
                
                // Extract thinking steps from <thinking_step> tags
                const thinkingRegex = /<thinking_step(?:\s+name="([^"]+)")?>([\s\S]*?)<\/thinking_step>/g;
                let match;
                while ((match = thinkingRegex.exec(response.text)) !== null) {
                    const stepName = match[1] || "Thinking";
                    const stepContent = match[2].trim();
                    accumulatedReasoning += `\nThought (${stepName}): ${stepContent}\n`;
                    stepSummary += `Thought (${stepName}): ${stepContent}\n`;
                }

                // Remove thinking steps from the final text response to avoid cluttering the chat
                const cleanText = response.text.replace(/<thinking_step(?:\s+name="[^"]+")?>[\s\S]*?<\/thinking_step>/g, '').trim();
                response.text = cleanText;

                // Tool Decision Router
                if (response.toolCalls && response.toolCalls.length > 0) {
                    currentContext.push({ role: 'assistant', content: response.text || '', tool_calls: response.toolCalls });
                    
                    for (const call of response.toolCalls) {
                        this.eventEmitter({ type: 'tool_start', tool: call.name, args: call.args });
                        
                        // Execute Tool
                        const result = await this.tooling.executeTool(call.name, call.args, this.context);
                        
                        // Parse Observation
                        const observation = JSON.stringify(result.output);
                        this.memory.addToBuffer('tool', observation);
                        this.eventEmitter({ type: 'tool_end', tool: call.name, result: result.output });

                        stepSummary += `Used tool: ${call.name}\n`;

                        // Handle Pending Actions (e.g., Save to Library requires user confirmation)
                        if (result.output && result.output.pendingAction) {
                            finalResult.pendingAction = result.output.pendingAction;
                            finalResult.text = "I have prepared the action. Please confirm to proceed.";
                            emitStep(stepId, `Executing step ${turns + 1}/${maxTurns}`, 'done', stepSummary + "Action pending confirmation.");
                            return finalResult;
                        }

                        currentContext.push({ role: 'tool', tool_call_id: call.id, name: call.name, content: observation });
                    }
                    if (stepSummary) {
                        emitStep(stepId, `Executing step ${turns + 1}/${maxTurns}`, 'done', stepSummary);
                    } else {
                        emitStep(stepId, `Executing step ${turns + 1}/${maxTurns}`, 'done');
                    }
                } else {
                    // No more tools needed, we have a final text
                    rawResponseText = response.text;
                    emitStep(stepId, `Executing step ${turns + 1}/${maxTurns}`, 'done', "Generated final response.");
                    break;
                }

                turns++;
            }

            if (turns >= maxTurns) {
                console.warn('[Orchestrator] Reached maximum reasoning turns.');
            }

            // Step 4: Self-check (Evaluate Completion)
            emitStep('self_check', 'Self-checking response', 'running');
            const isSufficient = await this.selfCheck(prompt, rawResponseText);
            if (!isSufficient) {
                accumulatedReasoning += `\nSelf-check failed. Refining response...\n`;
                const refinementContext = [
                    ...currentContext, 
                    { role: 'user', content: "The previous response was insufficient or incomplete. Please refine and provide a comprehensive final answer." }
                ];
                const refinedResponse = await this.llm.generateCompletion(refinementContext, []);
                rawResponseText = refinedResponse.text;
                emitStep('self_check', 'Self-checking response', 'done', 'Refined response after self-check.');
            } else {
                emitStep('self_check', 'Self-checking response', 'done', 'Response is sufficient.');
            }

            // Step 5: Format (Result Aggregator)
            emitStep('format', 'Formatting final output', 'running');
            finalResult = await this.formatResult(rawResponseText);
            emitStep('format', 'Formatting final output', 'done', 'Formatting complete.');

        } catch (error: any) {
            this.eventEmitter({ type: 'error', message: error.message });
            finalResult.text = `An error occurred during execution: ${error.message}`;
        }

        this.eventEmitter({ type: 'complete', result: finalResult });
        return finalResult;
    }

    private async analyzeIntent(prompt: string): Promise<string> {
        const messages = [
            { role: 'system', content: 'You are an intent analyzer. Summarize the user\'s core intent in one concise sentence.' },
            { role: 'user', content: prompt }
        ];
        const response = await this.llm.generateCompletion(messages, []);
        return response.text.trim();
    }

    private async createPlan(intent: string, prompt: string): Promise<Plan> {
        const messages = [
            { role: 'system', content: 'You are a planner. Break down the user intent into 1-3 logical steps. Return ONLY a JSON array of strings representing the steps.' },
            { role: 'user', content: `Intent: ${intent}\nOriginal prompt: ${prompt}` }
        ];
        
        try {
            const response = await this.llm.generateCompletion(messages, []);
            const stepsText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const steps: string[] = JSON.parse(stepsText);
            
            return {
                id: `plan-${Date.now()}`,
                goal: intent,
                tasks: steps.map((step, i) => ({
                    id: `task-${i}`,
                    description: step,
                    status: 'pending',
                    dependencies: i > 0 ? [`task-${i-1}`] : []
                }))
            };
        } catch (e) {
            // Fallback plan
            return {
                id: `plan-${Date.now()}`,
                goal: intent,
                tasks: [{ id: 'task-0', description: 'Execute user request', status: 'pending', dependencies: [] }]
            };
        }
    }

    private async selfCheck(_prompt: string, responseText: string): Promise<boolean> {
        // Simple heuristic for now, could be an LLM call
        if (!responseText || responseText.length < 10) return false;
        return true;
    }

    private async formatResult(rawText: string): Promise<AgentResult> {
        // Extract citations and related questions if present
        // For now, just return the raw text
        return {
            text: rawText,
            citations: [],
            relatedQuestions: [],
            searchImages: []
        };
    }

    private buildContext(prompt: string, plan: Plan): any[] {
        const systemPrompt = `You are Robo, an advanced personal AI assistant.
Goal: ${plan.goal}
Plan:
${plan.tasks.map((t, i) => `${i + 1}. ${t.description}`).join('\n')}

IMPORTANT: You have access to tools. You MUST use the appropriate tools to execute the steps in the plan. Do not try to answer from your own knowledge if a tool can provide accurate, up-to-date information (e.g., use the search tool for current events or facts).

CRITICAL: You MUST output your reasoning process explicitly using <thinking_step> tags before providing your final answer or calling a tool.
Format your reasoning like this:
<thinking_step name="Step Name">Your detailed reasoning here...</thinking_step>

You can have multiple thinking steps. The "name" attribute should be a short, descriptive title for the step (e.g., "Analyzing Request", "Searching Web", "Formulating Answer").

You have the ability to render interactive charts directly in the chat using Chart.js.
When the user asks for a chart, graph, or visualization, DO NOT try to draw it with text/ascii.
Instead, use a standard markdown code block with the language set to \`chart\` to generate a chart:

\`\`\`chart
{
  "type": "bar",
  "data": {
    "labels": ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
    "datasets": [{
      "label": "# of Votes",
      "data": [12, 19, 3, 5, 2, 3],
      "borderWidth": 1
    }]
  },
  "options": {
    "scales": {
      "y": {
        "beginAtZero": true
      }
    }
  }
}
\`\`\`

The content inside the block MUST be a valid JSON object representing a Chart.js configuration.
You can use any valid Chart.js type (line, bar, pie, doughnut, radar, polarArea, bubble, scatter).`;

        return [
            { role: 'system', content: systemPrompt },
            ...this.context.history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
            { role: 'user', content: prompt }
        ];
    }
}
