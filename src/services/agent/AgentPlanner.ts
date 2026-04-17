import { Message, ModelProvider, LocalModelConfig } from '../../types';
import { LLMService } from '../geminiService';
import { RoutingDecision } from './AgentRouter';

export interface AgentPlan {
  tasks: {
    id: string;
    description: string;
    tool?: string;
    toolArgs?: any;
    dependencies?: string[];
    retried?: boolean;
  }[];
  reasoning: string;
}

export class AgentPlanner {
  static async createPlan(
    text: string,
    history: Message[],
    routingDecision: RoutingDecision,
    systemContextStr: string,
    memoryContextStr: string,
    perceptionContextStr: string,
    injectedSkillsStr: string,
    activeToolsStr: string,
    llmService: LLMService,
    provider: ModelProvider = ModelProvider.GEMINI,
    openRouterKey: string = "",
    openRouterModel: string = "",
    openAiKey: string = "",
    openAiModel: string = "",
    activeLocalModel: LocalModelConfig | undefined = undefined,
    geminiApiKey?: string
  ): Promise<AgentPlan> {
    const prompt = `
SYSTEM CONTEXT:
${systemContextStr}

MEMORY CONTEXT:
${memoryContextStr}

PERCEPTION CONTEXT:
${perceptionContextStr}

INJECTED SKILLS:
${injectedSkillsStr}

ACTIVE TOOLS (Prefix Masked):
${activeToolsStr}

You are the PLANNER layer of an advanced AI agent.
Your job is to break down the user's request into a sequence of actionable tasks.

Recent History:
${history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

User Request: "${text}"
Complexity: ${routingDecision.complexity}
Priority: ${routingDecision.priority}
Tool State: ${routingDecision.toolState}

CRITICAL INSTRUCTION:
Create an INTERNAL plan. Order subtasks by dependencies.
LANGUAGE: Always respond in the language of the user's last message.

Output ONLY a JSON object with the following structure:
{
  "reasoning": "Explanation of why this plan is optimal",
  "tasks": [
    {
      "id": "task_1",
      "description": "Clear description of what needs to be done",
      "tool": "tool_name_if_applicable",
      "toolArgs": { "arg1": "value1" },
      "dependencies": ["list_of_task_ids_that_must_complete_first"]
    }
  ]
}

Ensure the plan is logical, efficient, and directly addresses the user's request.
Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.
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
        geminiApiKey,
        true // requireJson
      );
      // Extract JSON from potential markdown blocks
      let jsonString = responseText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      
      // Extract JSON object if there's surrounding text
      const jsonStart = jsonString.indexOf('{');
      const jsonEnd = jsonString.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
      }

      // Basic JSON repair for common LLM mistakes
      jsonString = jsonString
        // Fix unquoted keys (basic heuristic)
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        // Remove trailing commas
        .replace(/,\s*([}\]])/g, '$1');

      const plan = JSON.parse(jsonString) as AgentPlan;
      if (!plan) throw new Error("Parsed plan is null");
      return plan;
    } catch (error) {
      console.error("Planner evaluation failed:", error);
      // Fallback plan
      return {
        reasoning: "Fallback plan due to evaluation error.",
        tasks: [
          { id: "task_1", description: "Analyze request", tool: "memory_retrieval" },
          { id: "task_2", description: "Execute default action", dependencies: ["task_1"] },
          { id: "task_3", description: "Synthesize response", dependencies: ["task_2"] }
        ]
      };
    }
  }
}
