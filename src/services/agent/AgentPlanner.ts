import { Message } from '../../types';
import { LLMService } from '../geminiService';
import { RoutingDecision } from './AgentRouter';

export interface AgentPlan {
  tasks: {
    id: string;
    description: string;
    tool?: string;
    dependencies?: string[];
  }[];
  reasoning: string;
}

export class AgentPlanner {
  static async createPlan(
    text: string,
    history: Message[],
    routingDecision: RoutingDecision,
    llmService: LLMService
  ): Promise<AgentPlan> {
    const prompt = `
You are the PLANNER layer of an advanced AI agent.
Your job is to break down the user's request into a sequence of actionable tasks.

Recent History:
${history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

User Request: "${text}"
Complexity: ${routingDecision.complexity}
Injected Skills: ${routingDecision.injectedSkills.join(', ')}

Available Tools:
- memory_retrieval: Fetch relevant context from memory.
- search_workspace: Search files and data in the workspace.
- web_search: Search the internet for information.
- code_execution: Execute code or scripts.
- file_system: Read or write files.

Output a JSON object with the following structure:
{
  "reasoning": "Explanation of why this plan is optimal",
  "tasks": [
    {
      "id": "task_1",
      "description": "Clear description of what needs to be done",
      "tool": "tool_name_if_applicable",
      "dependencies": ["list_of_task_ids_that_must_complete_first"]
    }
  ]
}

Ensure the plan is logical, efficient, and directly addresses the user's request.
Respond ONLY with valid JSON.
`;

    try {
      const responseText = await llmService.generateSimpleText(prompt);
      // Extract JSON from potential markdown blocks
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/```\n([\s\S]*?)\n```/) ||
                        [null, responseText];
      
      const jsonString = jsonMatch[1].trim();
      const plan = JSON.parse(jsonString) as AgentPlan;
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
