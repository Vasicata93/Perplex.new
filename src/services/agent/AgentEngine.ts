import { useAgentStore } from '../../store/agentStore';
import { MemoryManager } from '../memory/MemoryManager';
import { AgentRouter } from './AgentRouter';
import { AgentPlanner } from './AgentPlanner';
import { SafetyManager } from './SafetyManager';
import { generateId } from '../../utils/helpers';
import { Message } from '../../types';
import { LLMService } from '../geminiService';

export class AgentEngine {
  /**
   * Main entry point for processing a user request.
   * This is Layer 4 (Routing) and Layer 5 (Thinking Protocol).
   */
  static async processRequest(
    text: string,
    history: Message[],
    llmService: LLMService,
    onChunk: (text: string, reasoning?: string) => void,
    onComplete: (finalText: string) => void,
    forceAgentMode: boolean = false
  ) {
    const store = useAgentStore.getState();
    
    // Reset state for new request
    store.resetSession();
    
    const setStep = (step: number, total: number, desc: string) => {
      store.setThinkingStep(step, total, desc);
      onChunk("", desc + "\n");
    };
    
    // ==========================================
    // LAYER 4: ROUTING (Chat vs Agent)
    // ==========================================
    setStep(1, 1, 'Routing: Evaluating request complexity...');
    
    const routingDecision = await AgentRouter.evaluate(text, history, llmService);
    
    onChunk("", `Routing Decision: ${routingDecision.complexity} | Priority: ${routingDecision.priority}\n`);
    onChunk("", `Injected Skills: ${routingDecision.injectedSkills.join(', ') || 'None'}\n`);
    onChunk("", `Reasoning: ${routingDecision.reasoning}\n\n`);

    const isAgentMode = forceAgentMode || routingDecision.complexity === 'COMPLEX';
    
    if (!isAgentMode) {
      // Standard Chat Mode
      store.setMode('chat');
      setStep(1, 1, 'Generating response in Chat Mode...');
      
      // Simulate LLM delay
      await new Promise(r => setTimeout(r, 1000));
      onComplete(`I am in Chat Mode (Complexity: ${routingDecision.complexity}). You said: "${text}"`);
      store.setMode('idle');
      return;
    }

    // ==========================================
    // LAYER 5: THINKING PROTOCOL (Agent Mode)
    // ==========================================
    store.setMode('agent');
    
    // Step 1: Understand
    setStep(1, 9, 'Understand: Analyzing user intent and constraints...');
    await this.simulateDelay(800);
    
    // Step 2: Decompose
    setStep(2, 9, 'Decompose: Breaking down into subtasks...');
    const agentPlan = await AgentPlanner.createPlan(text, history, routingDecision, llmService);
    
    onChunk("", `Plan Reasoning: ${agentPlan.reasoning}\n`);
    
    const plan = agentPlan.tasks.map(t => ({
      id: t.id,
      description: t.description,
      status: 'pending' as const
    }));
    
    store.setPlan(plan);
    await this.simulateDelay(500);
    
    // Step 3-8: Execute Plan
    for (let i = 0; i < agentPlan.tasks.length; i++) {
      const task = agentPlan.tasks[i];
      const stepNum = Math.min(3 + i, 8); // Map tasks to steps 3-8
      
      setStep(stepNum, 9, `Execute: ${task.description}...`);
      store.updateTaskStatus(task.id, 'in_progress');
      
      // ==========================================
      // LAYER 6: PRE-TOOL SAFETY
      // ==========================================
      const preSafety = SafetyManager.checkPreTool(task.tool || 'general', task);
      if (!preSafety.isSafe && preSafety.violation) {
        this.handleSafetyViolation(preSafety.violation, task.id);
        if (preSafety.violation.severity === 'critical') {
          onChunk("", `\nCRITICAL SAFETY BLOCK: ${preSafety.violation.message}\n`);
          onComplete(`Execution halted due to safety violation: ${preSafety.violation.message}`);
          return;
        }
      }

      // Simulate tool execution based on the planned tool
      let toolResult = '';
      let duration = 500;
      
      if (task.tool === 'memory_retrieval') {
        const context = await MemoryManager.getRelevantContext();
        toolResult = `Found ${context.semantic.length} facts and ${context.recentEpisodes.length} episodes.`;
        duration = 150;
      } else if (task.tool === 'search_workspace') {
        toolResult = 'Found relevant files in workspace.';
        duration = 450;
      } else {
        toolResult = `Executed ${task.tool || 'default action'} successfully.`;
        duration = 600;
      }
      
      await this.simulateDelay(duration);
      
      // ==========================================
      // LAYER 8: POST-TOOL SAFETY
      // ==========================================
      store.incrementRecursion();
      const postSafety = SafetyManager.checkPostTool(toolResult, store.recursionCount + 1);
      
      if (!postSafety.isSafe && postSafety.violation) {
        this.handleSafetyViolation(postSafety.violation, task.id);
        if (postSafety.violation.severity === 'critical') {
          onChunk("", `\nCRITICAL SAFETY BLOCK: ${postSafety.violation.message}\n`);
          onComplete(`Execution halted due to safety violation: ${postSafety.violation.message}`);
          return;
        }
      }

      store.addAction({
        id: generateId(),
        timestamp: Date.now(),
        toolName: task.tool || 'general_action',
        summary: task.description,
        status: 'success',
        durationMs: duration,
        resultPreview: toolResult
      });
      
      store.updateTaskStatus(task.id, 'completed');
      onChunk("", `Task Completed: ${task.description}\n`);
    }
    
    // Step 9: Respond & Finalize (Layer 6)
    setStep(9, 9, 'Respond: Finalizing response and calculating confidence.');
    
    const confidenceScore = this.calculateConfidence(agentPlan.tasks);
    const proactiveElements = this.generateProactiveElements(text);
    const estimatedCost = this.estimateCost(agentPlan.tasks);
    
    // Generate final response using LLM
    const finalPrompt = `
You are the SYNTHESIS layer of an advanced AI agent.
The user asked: "${text}"

The agent executed the following plan:
${JSON.stringify(agentPlan.tasks, null, 2)}

Confidence Score: ${confidenceScore}
Proactive Suggestions: ${proactiveElements.join(', ')}

Based on this, provide a final, comprehensive response to the user.
If confidence is low, acknowledge the limitations or failures.
Include the proactive suggestions naturally at the end.
`;
    
    const finalResponse = await llmService.generateSimpleText(finalPrompt);
    
    const formattedResponse = this.formatFinalResponse(finalResponse, confidenceScore, estimatedCost, proactiveElements);
    
    // ASYNC Learning (Layer 10)
    MemoryManager.asyncSaveEpisode(
      'Agent Execution', 
      `User asked: ${text}`, 
      'Successfully executed protocol.'
    );
    
    onComplete(formattedResponse);
    
    // Clean up UI after a short delay
    setTimeout(() => {
      store.setMode('idle');
    }, 2000);
  }

  private static calculateConfidence(tasks: any[]): 'high' | 'medium' | 'low' {
    const totalTasks = tasks.length;
    if (totalTasks === 0) return 'medium';
    
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const failedTasks = tasks.filter(t => t.status === 'failed').length;

    if (failedTasks > 0) return 'low';
    if (completedTasks === totalTasks) return 'high';
    return 'medium';
  }

  private static generateProactiveElements(intent: string): string[] {
    const lowerIntent = intent.toLowerCase();
    if (lowerIntent.includes('portfolio') || lowerIntent.includes('stock')) {
      return ['Show analytics', 'Check market news', 'Export report'];
    }
    if (lowerIntent.includes('calendar') || lowerIntent.includes('schedule')) {
      return ['Schedule follow-up', 'Check conflicts'];
    }
    return ['Ask for details', 'Save to library'];
  }

  private static estimateCost(tasks: any[]): number {
    // Simple simulated cost estimation based on task count
    const baseCost = 0.001; // Base cost for routing and planning
    const taskCost = 0.005; // Estimated cost per task execution
    return baseCost + (tasks.length * taskCost);
  }

  private static formatFinalResponse(text: string, confidence: string, cost: number, proactive: string[]): string {
    let formatted = text;
    
    // Append metadata
    formatted += `\n\n---\n`;
    formatted += `**Confidence:** ${confidence.toUpperCase()} | **Est. Cost:** $${cost.toFixed(4)}\n`;
    
    if (proactive.length > 0) {
      formatted += `**Suggested Next Steps:**\n`;
      proactive.forEach(p => {
        formatted += `- ${p}\n`;
      });
    }
    
    return formatted;
  }

  private static handleSafetyViolation(violation: any, taskId: string) {
    const store = useAgentStore.getState();
    store.setViolation(violation);
    store.updateTaskStatus(taskId, 'failed');
    
    if (violation.severity === 'critical') {
      store.setToolState('blocked');
    } else {
      store.setToolState('error');
    }
  }

  private static simulateDelay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
