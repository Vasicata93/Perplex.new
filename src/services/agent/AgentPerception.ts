import { Message, ModelProvider, LocalModelConfig } from '../../types';
import { LLMService } from '../geminiService';
import { Perception } from '../../types/agent';

export class AgentPerception {
  /**
   * Evaluates the incoming message and context to determine the perception.
   * This implements Layer 3 of the Perplex Agent Architecture.
   */
  static async analyze(
    currentMessage: string,
    recentHistory: Message[],
    systemContextStr: string,
    memoryContextStr: string,
    llmService: LLMService,
    provider: ModelProvider = ModelProvider.GEMINI,
    openRouterKey: string = "",
    openRouterModel: string = "",
    openAiKey: string = "",
    openAiModel: string = "",
    activeLocalModel: LocalModelConfig | undefined = undefined,
    geminiApiKey?: string
  ): Promise<Perception> {
    const prompt = `
SYSTEM CONTEXT:
${systemContextStr}

MEMORY CONTEXT:
${memoryContextStr}

You are the PERCEPTION layer of an advanced AI agent.
Your job is to analyze the user's latest message, understand the real intent, and model the current situation.

Recent History:
${recentHistory.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}

User Message: "${currentMessage}"

Analyze the request and output a JSON object with the following structure:
{
  "realIntent": "The actual underlying goal or need of the user",
  "tone": "The emotional tone of the user (e.g., frustrated, excited, neutral, urgent)",
  "urgency": "low" | "medium" | "high" | "critical",
  "situationModel": {
    "projectState": "Where we are in the current project or task",
    "changesSinceLastMessage": "What changed in the user's request or context",
    "relevantMemoryContext": "Which parts of the memory are most relevant right now"
  },
  "goalAwareness": {
    "mainGoal": "The overarching goal of the current session",
    "activeSubgoals": ["subgoal 1", "subgoal 2"],
    "remainingTasks": ["task 1", "task 2"]
  },
  "eventDetection": {
    "directionChanges": ["Any pivot or change in direction requested"],
    "opportunities": ["Any proactive suggestions we could make"],
    "blocks": ["Any frustrations or blockers the user is facing"]
  }
}

Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.
`;

    try {
      const response = await llmService.generateSimpleText(
        prompt,
        provider,
        openRouterKey,
        openRouterModel,
        openAiKey,
        openAiModel,
        activeLocalModel,
        geminiApiKey
      );

      // Clean up markdown if present
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);

      return {
        timestamp: Date.now(),
        literalInput: currentMessage,
        realIntent: parsed.realIntent || "Analyze user request",
        tone: parsed.tone || "neutral",
        urgency: parsed.urgency || "medium",
        situationModel: parsed.situationModel || {
          projectState: "Unknown",
          changesSinceLastMessage: "None",
          relevantMemoryContext: "None"
        },
        goalAwareness: parsed.goalAwareness || {
          mainGoal: "Assist user",
          activeSubgoals: [],
          remainingTasks: []
        },
        eventDetection: parsed.eventDetection || {
          directionChanges: [],
          opportunities: [],
          blocks: []
        }
      };
    } catch (error) {
      console.error("[Perception] Failed to parse perception response:", error);
      // Fallback
      return {
        timestamp: Date.now(),
        literalInput: currentMessage,
        realIntent: "Analyze user request",
        tone: "neutral",
        urgency: "medium",
        situationModel: {
          projectState: "Unknown",
          changesSinceLastMessage: "None",
          relevantMemoryContext: "None"
        },
        goalAwareness: {
          mainGoal: "Assist user",
          activeSubgoals: [],
          remainingTasks: []
        },
        eventDetection: {
          directionChanges: [],
          opportunities: [],
          blocks: []
        }
      };
    }
  }
}
