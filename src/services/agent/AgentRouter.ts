import { LLMService } from '../geminiService';
import { Message } from '../../types';

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
    llmService: LLMService
  ): Promise<RoutingDecision> {
    const prompt = `
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
- Tool State: Usually 'idle' for new requests. If the user is asking to write/modify data, it might need 'confirming'.
- Skills: Only inject skills that are highly relevant to the request.

Output ONLY valid JSON.
`;

    try {
      const responseText = await llmService.generateSimpleText(prompt);
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const decision = JSON.parse(jsonMatch[0]) as RoutingDecision;
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
