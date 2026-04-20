import { Perception } from '../../types/agent';
import { extractKeywords } from './localHeuristics';
import { semanticRouter } from './SemanticRouter';

export class AgentPerception {
  /**
   * Evaluates the incoming message and context to determine the perception LOCALLY.
   * This implements Layer 3 of the Perplex Agent Architecture using embeddings (semantic) + heuristics.
   */
  static async analyze(
    currentMessage: string
  ): Promise<Perception> {
    const text = currentMessage.toLowerCase();
    
    // HEURISTIC 1: URGENCY
    let urgency: "low" | "medium" | "high" | "critical" = "low";
    const criticalWords = ['urgent', 'asap', 'now', 'critical', 'emergency', 'quick', 'fast', 'immediately'];
    const highWords = ['important', 'soon', 'priority'];
    if (criticalWords.some(w => text.includes(w))) urgency = "critical";
    else if (highWords.some(w => text.includes(w))) urgency = "high";
    else if (text.endsWith('!')) urgency = "medium";

    // HEURISTIC 2: TONE
    let tone = "neutral";
    const frustratedWords = ['fuck', 'shit', 'ugh', 'stupid', 'annoying', 'hate', 'bad', 'wrong', 'fail'];
    const excitedWords = ['awesome', 'great', 'love', 'amazing', 'perfect', 'thanks', 'wow'];
    if (frustratedWords.some(w => text.includes(w))) tone = "frustrated";
    else if (excitedWords.some(w => text.includes(w))) tone = "excited";
    else if (text.includes('please') || text.includes('could you')) tone = "polite";

    // HEURISTIC 3: SEMANTIC INTENT
    let intent = "general conversation";
    let intentSource = "Heuristics";
    
    if (semanticRouter.isReady) {
      try {
        const result = await semanticRouter.classify(currentMessage);
        if (result.category) {
          intent = result.category; // Uses the category key (e.g. "CONVERSATION", "CODING")
          intentSource = "Xenova ONNX Semantic";
        }
      } catch (err) {
        console.warn("Semantic classification failed:", err);
      }
    }

    // Fallback to strict heuristics if semantic router wasn't ready or returned something unexpected
    if (intent === "general conversation" && !semanticRouter.isReady) {
      if (text.includes('?', text.length - 2)) intent = "information request";
      if (['create', 'make', 'build', 'write', 'generate', 'adauga'].some(w => text.startsWith(w) || text.includes(` ${w} `))) intent = "action execution";
      if (['fix', 'bug', 'error', 'debug', 'code', 'eroare'].some(w => text.includes(w))) intent = "coding assistance";
      if (['save', 'remember', 'memorize', 'salveaza'].some(w => text.includes(w))) intent = "data memorization";
      if (['search', 'find', 'look up', 'cauta'].some(w => text.includes(w))) intent = "web search";
    }

    // HEURISTIC 4: ENTITIES / GOALS
    const keywords = extractKeywords(currentMessage);

    return {
       timestamp: Date.now(),
       literalInput: currentMessage,
       realIntent: intent,
       tone: tone,
       urgency: urgency,
       situationModel: {
         projectState: "ongoing",
         changesSinceLastMessage: keywords.join(', ') || "None detected",
         relevantMemoryContext: `Classified via ${intentSource}`
       },
       goalAwareness: {
         mainGoal: intent,
         activeSubgoals: keywords.slice(0, 2),
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

