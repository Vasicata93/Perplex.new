import { LLMService } from '../geminiService';
import { Message, ModelProvider, LocalModelConfig } from '../../types';

export type ComplexityLevel = 'SIMPLU' | 'MEDIU' | 'COMPLEX' | 'AMBIGUU';
export type PriorityLevel = 'URGENT_IMPORTANT' | 'IMPORTANT' | 'RUTINA' | 'OPTIONAL';
export type ToolState = 'idle' | 'writing' | 'confirming' | 'error';
export type SituationalSkill = 'coding_skill' | 'research_skill' | 'finance_skill' | 'writing_skill' | 'data_analysis_skill';

export interface RoutingDecision {
  complexity: ComplexityLevel;
  priority: PriorityLevel;
  toolState: ToolState;
  injectedSkills: SituationalSkill[];
  reasoning: string;
}

export class AgentRouter {
  /**
   * Evaluates the incoming message and context to determine the routing strategy.
   * This implements Layer 4 of the Perplex Agent Architecture.
   */
  static async evaluate(
    currentMessage: string,
    recentHistory: Message[],
    systemContextStr: string,
    memoryContextStr: string,
    perceptionContextStr: string,
    llmService: LLMService,
    provider: ModelProvider = ModelProvider.GEMINI,
    openRouterKey: string = "",
    openRouterModel: string = "",
    openAiKey: string = "",
    openAiModel: string = "",
    activeLocalModel: LocalModelConfig | undefined = undefined,
    geminiApiKey?: string
  ): Promise<RoutingDecision> {
    const prompt = `
SYSTEM CONTEXT:
${systemContextStr}

MEMORY CONTEXT:
${memoryContextStr}

PERCEPTION CONTEXT:
${perceptionContextStr}

You are the ROUTER layer of an advanced AI agent.
Your job is to evaluate the user's latest message and determine the optimal execution path.

Recent History:
${recentHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

User Message: "${currentMessage}"

Analyze the request and output a JSON object with the following structure:
{
  "complexity": "SIMPLU" | "MEDIU" | "COMPLEX" | "AMBIGUU",
  "priority": "URGENT_IMPORTANT" | "IMPORTANT" | "RUTINA" | "OPTIONAL",
  "toolState": "idle" | "writing" | "confirming" | "error",
  "injectedSkills": ["coding_skill", "research_skill", "finance_skill", "writing_skill", "data_analysis_skill"],
  "reasoning": "Brief explanation of your routing decision"
}

Rules:
- SIMPLU: Greetings, factual questions, simple clarifications (Chat Mode).
- MEDIU: Requires 1-2 tool calls (Chat Mode + Tools).
- COMPLEX: Multi-step tasks, coding, extensive research (Agent Mode).
- AMBIGUU: Missing critical information, needs clarification first.
- Priority:
  - URGENT_IMPORTANT: Immediate execution needed.
  - IMPORTANT: Needs planning and confirmation.
  - RUTINA: Direct execution.
  - OPTIONAL: Mention, don't execute.
- Tool State:
  - idle: Default state, all tools available.
  - writing: Use this if the user is currently in the middle of a multi-step writing process and we should focus on finishing it. Read tools are blocked in this state.
  - confirming: Use this if the next step MUST be a user confirmation before any tool can be used. All tools are blocked.
  - error: Use this if the previous action failed and we need to decide on a fallback.
- Skills: Only inject skills that are highly relevant to the request.
  - coding_skill: Programming, debugging, architecture.
  - research_skill: Deep dives, fact checking, synthesis.
  - finance_skill: Calculations, market analysis, budgeting.
  - writing_skill: Creative writing, editing, formal docs.
  - data_analysis_skill: Statistics, visualization, pattern detection.

Output ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
CRITICAL: Ensure all property names are enclosed in double quotes. Do not use single quotes for strings. Escape any internal double quotes using \\". Do not include trailing commas.
`;

    try {
      const responseText = await llmService.generateSimpleText(
        prompt,
        provider,
        openRouterKey,
        openRouterModel,
        openAiKey,
        openAiModel,
        activeLocalModel,
        geminiApiKey
      );
      
      // Extract JSON from response
      let jsonString = responseText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      
      const jsonStart = jsonString.indexOf('{');
      const jsonEnd = jsonString.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
        
        // Basic JSON repair
        jsonString = jsonString
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/,\s*([}\]])/g, '$1');

        const decision = JSON.parse(jsonString) as RoutingDecision;
        if (!decision) throw new Error("Parsed decision is null");
        return decision;
      }
      
      throw new Error("Failed to parse routing decision");
    } catch (error) {
      console.error("Routing evaluation failed:", error);
      // Fallback to safe defaults
      return {
        complexity: 'MEDIU',
        priority: 'RUTINA',
        toolState: 'idle',
        injectedSkills: [],
        reasoning: "Fallback routing due to error."
      };
    }
  }
}
