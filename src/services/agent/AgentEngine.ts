import { useAgentStore } from '../../store/agentStore';
import { MemoryManager } from '../memory/MemoryManager';
import { AgentPerception } from './AgentPerception';
import { AgentRouter } from './AgentRouter';
import { AgentPlanner } from './AgentPlanner';
import { ToolRegistry } from './tools/ToolRegistry';
import { registerCoreTools } from './tools/coreTools';
import { registerHermesTools } from './tools/hermesTools';
import { registerKanbanTools } from './tools/kanbanTools';
import { registerMoATools } from './tools/moaTools';
import { registerInsightTools } from './tools/insightTools';
import { registerCheckpointTools } from './tools/checkpointTools';
import { registerSessionSearchTools } from './tools/sessionSearchTools';
import { registerClarifyTools } from './tools/clarifyTools';
import { registerCodeExecutionTools } from './tools/codeExecutionTools';
import { registerSecurityTools } from './tools/securityTools';
import { registerSweTools } from './tools/sweTools';
import { registerJobTools } from './tools/jobTools';
import { registerImageGenTools } from './tools/imageGenTools';
import { registerTodoTools } from './tools/todoTools';
import { registerBudgetTools } from './tools/budgetTools';
import { registerWebTools } from './tools/webTools';
import { Message, ModelProvider, LocalModelConfig } from '../../types';
import { LLMService } from '../geminiService';
import { SystemContext } from './SystemContext';
import { ErrorClassifier } from './ErrorClassifier';
import { SITUATIONAL_SKILLS } from './SkillRegistry';
import { TrajectoryTracker } from './TrajectoryTracker';

// Initialize tools
registerCoreTools();
registerHermesTools();
registerKanbanTools();
registerMoATools();
registerInsightTools();
registerCheckpointTools();
registerSessionSearchTools();
registerClarifyTools();
registerCodeExecutionTools();
registerSecurityTools();
registerSweTools();
registerJobTools();
registerImageGenTools();
registerTodoTools();
registerBudgetTools();
registerWebTools();

export const globalTracker = new TrajectoryTracker();

export class AgentEngine {
  /**
   * Main entry point for processing a user request.
   * Implements the 10-Layer Architecture v2.0
   */
  static async processRequest(
    text: string,
    history: Message[],
    llmService: LLMService,
    onChunk: (text: string, reasoning?: string) => void,
    onComplete: (finalText: string, pendingAction?: any) => void,
    _requestConfirmation: (action: any) => Promise<'confirm' | 'cancel' | 'redact'>,
    isAgentEnabledInUI: boolean, // New parameter
    provider: ModelProvider = ModelProvider.GEMINI,
    openRouterKey: string = "",
    openRouterModel: string = "",
    openAiKey: string = "",
    openAiModel: string = "",
    activeLocalModel: LocalModelConfig | undefined = undefined,
    geminiApiKey?: string
  ) {
    const store = useAgentStore.getState();
    store.resetSession();
    
    // Initialize Architecture Steps
    const initialSteps = [
      { id: 'layer-1', name: 'System Context', status: 'pending', description: 'Loading system context...', logs: [] },
      { id: 'layer-2', name: 'Memory Load', status: 'pending', description: 'Retrieving relevant context...', logs: [] },
      { id: 'layer-3', name: 'Perception', status: 'pending', description: 'Analyzing intent and situation...', logs: [] },
      { id: 'layer-4', name: 'Routing', status: 'pending', description: 'Evaluating complexity and skills...', logs: [] },
      { id: 'layer-5', name: 'Planner', status: 'pending', description: 'Creating execution plan...', logs: [] },
      { id: 'layer-6', name: 'Pre-Tool Safety', status: 'pending', description: 'Checking safety constraints...', logs: [] },
      { id: 'layer-7', name: 'Tools Execution', status: 'pending', description: 'Executing planned tasks...', logs: [] },
      { id: 'layer-8', name: 'Post-Tool Safety', status: 'pending', description: 'Verifying execution results...', logs: [] },
      { id: 'layer-9', name: 'Response Generation', status: 'pending', description: 'Synthesizing final response...', logs: [] },
      { id: 'layer-10', name: 'Learning', status: 'pending', description: 'Consolidating memories...', logs: [] }
    ] as any;
    store.initArchitectureSteps(initialSteps);

    const setStep = (step: number, total: number, desc: string, layerId?: string) => {
      store.setThinkingStep(step, total, desc);
      if (layerId) {
        store.updateArchitectureStepStatus(layerId, 'in_progress', desc);
      }
      onChunk("", desc + "\n");
    };

    const completeStep = (layerId: string, desc?: string) => {
      store.updateArchitectureStepStatus(layerId, 'completed', desc);
    };

    const addStepLog = (layerId: string, type: 'thought' | 'action' | 'result' | 'error', content: string, toolName?: string) => {
      store.addArchitectureStepLog(layerId, { type, content, toolName });
    };

    // GLOBAL SYSTEMS
    // Cost Guard: Track iterations
    // let iterations = 0;
    // const MAX_ITERATIONS = 10;

    try {
      // ==========================================
      // [1] LAYER 1: SYSTEM CONTEXT
      // ==========================================
      // Static, cached, built once per session.
      setStep(1, 10, '[1] System Context: Loading...', 'layer-1');
      const systemContextStr = SystemContext.getContext();
      addStepLog('layer-1', 'thought', 'System context loaded successfully.');
      completeStep('layer-1', 'System context loaded.');
      console.log("System Context Loaded (Layer 1)");

      // ==========================================
      // [2] LAYER 2: MEMORY LOAD
      // ==========================================
      // Selective retrieval based on relevance
      setStep(2, 10, '[2] Memory Load: Retrieving relevant context...', 'layer-2');
      
      const memoryManager = MemoryManager.getInstance();
      
      const workingMemoryTemp = history.slice(-10);
      const workingMemory = workingMemoryTemp.map(msg => {
        if (msg.role === 'model' && msg.content.length > 300) {
          return { ...msg, content: msg.content.substring(0, 300) + ' [...]' };
        }
        return msg;
      });
      
      memoryManager.onTurnStart(workingMemoryTemp.length, text);
      const memoryContextStr = await memoryManager.prefetchAll(text, 'default-session');
      
      addStepLog('layer-2', 'result', `Loaded ${workingMemory.length} recent messages and prefetched memory.`);
      completeStep('layer-2', 'Memory context retrieved.');
      console.log("Memory Context Loaded.");

      // ==========================================
      // [3] LAYER 3: PERCEPTION
      // ==========================================
      setStep(3, 10, '[3] Perception: Analyzing intent and situation...', 'layer-3');
      
      const perceptionContext = await AgentPerception.analyze(
        text
      );
      
      store.setPerception(perceptionContext);
      addStepLog('layer-3', 'thought', `Intent: ${perceptionContext.realIntent}`);
      addStepLog('layer-3', 'thought', `Tone: ${perceptionContext.tone}, Urgency: ${perceptionContext.urgency}`);
      completeStep('layer-3', 'Perception analysis complete.');
      console.log("Perception Context Loaded:", perceptionContext.timestamp);
      
      // Timestamp injected HERE for subsequent layers
      const currentTimestamp = new Date(perceptionContext.timestamp).toISOString();
      const perceptionContextStr = `
PERCEPTION CONTEXT (As of ${currentTimestamp}):
- Literal Input: "${perceptionContext.literalInput}"
- Real Intent: ${perceptionContext.realIntent}
- Tone: ${perceptionContext.tone}
- Urgency: ${perceptionContext.urgency}

SITUATION MODEL:
- Project State: ${perceptionContext.situationModel.projectState}
- Changes: ${perceptionContext.situationModel.changesSinceLastMessage}
- Relevant Memory: ${perceptionContext.situationModel.relevantMemoryContext}

GOAL AWARENESS:
- Main Goal: ${perceptionContext.goalAwareness.mainGoal}
- Active Subgoals: ${perceptionContext.goalAwareness.activeSubgoals.join(', ') || 'None'}

EVENT DETECTION:
- Direction Changes: ${perceptionContext.eventDetection.directionChanges.join(', ') || 'None'}
- Opportunities: ${perceptionContext.eventDetection.opportunities.join(', ') || 'None'}
- Blocks: ${perceptionContext.eventDetection.blocks.join(', ') || 'None'}
`;

      // ==========================================
      // [4] LAYER 4: ROUTING
      // ==========================================
      setStep(4, 10, '[4] Routing: Evaluating complexity and skills...', 'layer-4');
      const routingDecision = await AgentRouter.evaluate(
        text,
        perceptionContext
      );
      
      addStepLog('layer-4', 'thought', `Complexity: ${routingDecision.complexity}`);
      addStepLog('layer-4', 'thought', `Priority: ${routingDecision.priority}`);
      if (routingDecision.injectedSkills.length > 0) {
        addStepLog('layer-4', 'thought', `Skills injected: ${routingDecision.injectedSkills.join(', ')}`);
      }
      completeStep('layer-4', `Routing complete. Complexity: ${routingDecision.complexity}`);
      onChunk("", `Routing: ${routingDecision.complexity} | Priority: ${routingDecision.priority}\n`);
      
      // Skill Injection (Context Augmentation dinamic)
      const injectedSkillsStr = routingDecision.injectedSkills
        .map(skill => `[SKILL: ${skill}]\n${SITUATIONAL_SKILLS[skill as keyof typeof SITUATIONAL_SKILLS]}`)
        .join('\n\n');

      // Tool State Machine (Prefix Masking)
      const allTools = ToolRegistry.getAllDefinitions();
      const systemContextData = JSON.parse(systemContextStr);
      const readTools = systemContextData.toolDefinitions.readTools;
      
      let activeTools = allTools;
      if (routingDecision.toolState === 'writing') {
        // Block read tools
        activeTools = allTools.filter(t => !readTools.includes(t.name));
      } else if (routingDecision.toolState === 'confirming') {
        // Block all tools
        activeTools = [];
      }
      
      const activeToolsStr = JSON.stringify(activeTools);

      // Decizie arhitecturală (Layer 4 Routing):
      // simplu -> CHAT MODE
      // mediu -> CHAT MODE + tool
      // complex -> AGENT MODE
      // ambiguu -> CLARIFY FIRST

      const minimalContextStr = SystemContext.getMinimalContext();

      if (routingDecision.complexity === 'AMBIGUU') {
        store.setMode('chat');
        setStep(4, 10, '[5] CLARIFY FIRST: Requesting user clarification...');
        store.updateArchitectureStepStatus('layer-5', 'completed', 'Skipped (Ambiguous Route)');
        store.updateArchitectureStepStatus('layer-6', 'completed', 'Skipped');
        store.updateArchitectureStepStatus('layer-7', 'completed', 'Skipped');
        store.updateArchitectureStepStatus('layer-8', 'completed', 'Skipped');
        
        const chatPrompt = `SYSTEM CONTEXT:\n${minimalContextStr}\n\nMEMORY CONTEXT:\n${memoryContextStr}\n\nPERCEPTION CONTEXT:\n${perceptionContextStr}\n\nThe user's request is somewhat ambiguous: "${text}". Please provide a helpful, direct, and comprehensive response. You may ask a question to clarify if absolutely necessary, but try to infer their intent and provide value first.`;
        
        const chatResponse = await llmService.generateSimpleText(chatPrompt, provider, openRouterKey, openRouterModel, openAiKey, openAiModel, activeLocalModel, geminiApiKey || "");
        
        setStep(9, 10, '[9] Response Generation');
        store.setConfidence('low');
        completeStep('layer-9', 'Clarification delivered.');
        onComplete(chatResponse);
        
        setStep(10, 10, '[10] Learning');
        completeStep('layer-10', 'Learning phase complete.');
        setTimeout(() => store.setMode('idle'), 2000);
        return;
      }

      const isAgentMode = isAgentEnabledInUI;

      if (!isAgentMode) {
        // ==========================================
        // [5A] THINKING: CHAT MODE (SIMPLU / MEDIU)
        // ==========================================
        store.setMode('chat');
        setStep(4, 10, '[5] Thinking (Chat Mode): Understand -> Memory -> Tool -> Respond');
        
        store.updateArchitectureStepStatus('layer-5', 'completed', 'Skipped (Chat Mode)');
        store.updateArchitectureStepStatus('layer-6', 'completed', 'Skipped (Chat Mode)');
        store.updateArchitectureStepStatus('layer-7', 'completed', 'Skipped (Chat Mode)');
        store.updateArchitectureStepStatus('layer-8', 'completed', 'Skipped (Chat Mode)');
        
        let toolContextStr = "";

        // MEDIU -> Chat Mode + Tool
        if (routingDecision.complexity === 'MEDIU') {
             setStep(5, 10, '[5B] Tool Decision (Chat Mode)');
             store.updateArchitectureStepStatus('layer-7', 'in_progress', 'Executing temporary tool for Chat Mode');
             
             // Lightweight planner call to grab exactly 1 required tool
             const singleTaskPlan = await AgentPlanner.createSingleToolPlan(text, perceptionContextStr, activeToolsStr, llmService, provider, openRouterKey, openRouterModel, openAiKey, openAiModel, activeLocalModel, geminiApiKey || "");
             
             if (singleTaskPlan.tasks && singleTaskPlan.tasks.length > 0 && singleTaskPlan.tasks[0].tool) {
                 const t = singleTaskPlan.tasks[0];
                 store.setPlan([{ id: t.id, description: t.description, status: 'in_progress', logs: [] }]);
                 
                 try {
                     const extResult = await ToolRegistry.executeTool(t.tool as string, t.toolArgs || { query: text }, { llmService });
                     if (extResult && extResult.success) {
                         toolContextStr = `\n\nTOOL RESULT CONTEXT (${t.tool}):\n${JSON.stringify(extResult.data).substring(0, 3000)}`;
                         store.updateTaskStatus(t.id, 'completed');
                     } else {
                         store.updateTaskStatus(t.id, 'failed');
                     }
                 } catch (e) {
                     store.updateTaskStatus(t.id, 'failed');
                 }
             }
             store.updateArchitectureStepStatus('layer-7', 'completed', 'Chat Tool phase complete');
        }

        let chatPrompt = `SYSTEM CONTEXT:\n${minimalContextStr}\n\nMEMORY CONTEXT:\n${memoryContextStr}\n\nPERCEPTION CONTEXT:\n${perceptionContextStr}\n\nINJECTED SKILLS:\n${injectedSkillsStr}${toolContextStr}\n\nYou are a helpful assistant. User asked: "${text}". Respond directly, comprehensively, and naturally based on the provided context. Do not be overly concise and prioritize providing a full explanation.

FORMAT SELECTION:
- Use Markdown for structured explanations.
- **CHART GENERATION PROTOCOL:** You MUST use the exact tag \`\`\`chart (not json) followed by strict JSON for Chart.js. Example: \`\`\`chart\n{"type": "bar", "data": {...}}\n\`\`\`
- **DIAGRAM PROTOCOL:** You MUST use the exact tag \`\`\`mermaid (not json) followed by Mermaid syntax. Example: \`\`\`mermaid\ngraph TD;\n...\n\`\`\`
- **WIDGET PROTOCOL:** For interactive HTML/JS widgets, use the \`\`\`html or \`\`\`react tag followed by your code. DO NOT wrap HTML inside \`\`\`widget or \`\`\`chart blocks. Your generated UI must be highly professional, responsive, and interactive. Always support both light and dark modes by utilizing Tailwind CSS \`dark:\` classes, as the root html element will automatically have the \`dark\` class applied when dark mode is active. Example: \`\`\`html\n<div class="p-4 bg-white dark:bg-gray-800 rounded shadow">...</div>\n\`\`\``;
        
        const chatResponse = await llmService.generateSimpleText(
          chatPrompt,
          provider,
          openRouterKey,
          openRouterModel,
          openAiKey,
          openAiModel,
          activeLocalModel,
          geminiApiKey || ""
        );
        
        // [9] RESPONSE
        setStep(9, 10, '[9] Response Generation: Delivering chat response...', 'layer-9');
        store.setConfidence('high');
        completeStep('layer-9', 'Chat response delivered.');
        onComplete(chatResponse); // Deliver first!
        
        // [10] LEARNING
        setStep(10, 10, '[10] Learning: SYNC & ASYNC updates...', 'layer-10');
        await memoryManager.syncAll(text, chatResponse, 'default-session');
        memoryManager.queuePrefetchAll(text, 'default-session');
        await MemoryManager.syncUpdateSemantic('profile', 'last_interaction', new Date().toISOString());
        MemoryManager.asyncSaveEpisode(perceptionContext.realIntent || 'Chat Interaction', `User asked: ${text}`, chatResponse.substring(0, 200));
        completeStep('layer-10', 'Learning phase complete.');
        
        setTimeout(() => store.setMode('idle'), 2000);
        return;
      }
      // ==========================================
      // [5B] THINKING: AGENT MODE (COMPLEX LOOP)
      // ==========================================
      store.setMode('agent');
      
      // Priority Engine Treatment
      if (routingDecision.priority === 'OPTIONAL') {
        onComplete(`Am observat solicitarea ta ("${text}"), dar am evaluat-o ca fiind opțională în contextul curent. Te pot ajuta cu altceva?`);
        store.setMode('idle');
        return;
      }

      // Step 1: CLARIFY
      setStep(5, 10, '[5] Planner: Clarifying intent and decomposing...', 'layer-5');
      
      // const executionResults: any[] = [];
      
      store.updateArchitectureStepStatus('layer-5', 'completed', 'Delegated to Hermes Native LLM Engine.');
      
      // Step 5: EXECUTE (Iterative)
      setStep(6, 10, '[6] Pre-Tool Safety: Evaluating constraints...', 'layer-6');
      store.updateArchitectureStepStatus('layer-6', 'completed', 'Enforced by Hermes Engine Rules.');

      setStep(7, 10, '[7] Tools Execution: Running Hermes Agent Loop...', 'layer-7');
      store.updateArchitectureStepStatus('layer-7', 'in_progress', 'Native AI Reasoning In Progress...');
      store.updateArchitectureStepStatus('layer-8', 'in_progress', 'Post-tool verification loop active in Native Engine...');

      // Build the full Hermes System Prompt dynamically
      const fullSystemPrompt = SystemContext.getFullSystemPrompt(memoryContextStr);

      let agentPrompt = `PERCEPTION CONTEXT:
${perceptionContextStr}

INJECTED SKILLS:
${injectedSkillsStr}

You are the autonomous Hermes Agent running a multi-step reasoning protocol. Solve the following objective accurately by calling necessary tools and observing their outputs. Only answer the final response once you have fully achieved the goal.

User asked: "${text}"`;
      
      const chatResponse = await llmService.runCoreGeneration(
          history, 
          agentPrompt, 
          [], 
          provider, 
          openRouterKey, 
          openRouterModel, 
          openAiKey, 
          openAiModel, 
          activeLocalModel, 
          true, 
          store.mode as any, 
          true, 
          { id: '', name: 'User' } as any, 
          { name: 'Hermes' } as any, 
          undefined, // spaceSystemInstruction
          undefined, // tavilyApiKey
          geminiApiKey, 
          'tavily', 
          undefined, // braveApiKey
          onChunk, 
          fullSystemPrompt, // systemInstructionOverride
          true // useAgenticResearch = true -> enables maxTurns=30 loop
      );

      store.updateArchitectureStepStatus('layer-7', 'completed', 'Tool loop finished.');
      store.updateArchitectureStepStatus('layer-8', 'completed', 'Verification accepted.');
      
      // ==========================================
      // [9] RESPONSE GENERATION
      // ==========================================
      setStep(9, 10, '[9] Response Generation: Synthesizing final response...', 'layer-9');
      store.setConfidence('high');
      completeStep('layer-9', 'Response synthesis complete.');
      onComplete(chatResponse.text, chatResponse.pendingAction);
      
      // ==========================================
      // [10] LEARNING
      // ==========================================
      setStep(10, 10, '[10] Learning: SYNC & ASYNC updates...', 'layer-10');
      addStepLog('layer-10', 'thought', 'Performing SYNC and ASYNC memory updates.');
      
      await memoryManager.syncAll(text, chatResponse.text, 'default-session');
      memoryManager.queuePrefetchAll(text, 'default-session');
      
      // SYNC: Critical memory updates (Blocking)
      await MemoryManager.syncUpdateSemantic('profile', 'last_interaction', currentTimestamp);
      addStepLog('layer-10', 'result', 'SYNC updates completed.');
      
      // ASYNC: Episode save, patterns (Non-blocking)
      MemoryManager.asyncSaveEpisode(
        perceptionContext.realIntent || 'Agent Execution', 
        `User asked: ${text}`, 
        chatResponse.text.substring(0, 200)
      );
      
      // Update procedural memory based on conditions
      if (useAgentStore.getState().simplifyResponse) {
         MemoryManager.asyncUpdateProcedural(
           "When user is frustrated",
           "Simplify response format, avoid markdown",
           2
         );
      } else if (routingDecision.injectedSkills && routingDecision.injectedSkills.length > 0) {
         MemoryManager.asyncUpdateProcedural(
           `When intent is ${perceptionContext.realIntent}`,
           `Inject skills: ${routingDecision.injectedSkills.join(', ')}`,
           1
         );
      }

      // ----------------------------------------------------
      // AUTO-SKILL CREATION (Learning new patterns from complex tasks)
      // ----------------------------------------------------
      if (routingDecision.complexity === 'COMPLEX') {
         addStepLog('layer-10', 'thought', 'Analyzing execution for potential new skill creation...');
         try {
           const evalPrompt = `Analyze the following interaction to see if a reusable skill should be learned.
User asked: "${text}"
Agent achieved: "${chatResponse.text.substring(0, 300)}... (truncated)"

If this involved a specific sequence of logic or tools that would be useful as a reusable skill (e.g. updating a portfolio, searching specific files, etc.), generate a skill definition in JSON. Otherwise, return { "createskill": false }.
Respond ONLY with raw JSON format exactly like this:
{
  "createskill": true,
  "skillName": "auto_descriptive_name_workflow",
  "category": "auto-learned",
  "description": "Brief description of when to use this skill.",
  "content": "Step-by-step instructions and logic pattern."
}`;
           
           const evalResponse = await llmService.generateSimpleText(
             evalPrompt, provider, openRouterKey, openRouterModel, openAiKey, openAiModel, activeLocalModel, geminiApiKey || ""
           );
           
           try {
             // clean up markdown json blocks if any
             const jsonMatch = evalResponse.match(/\{[\s\S]*\}/);
             if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.createskill && parsed.skillName && parsed.content) {
                   const SkillRegistry = (await import('./SkillRegistry')).SkillRegistry;
                   await SkillRegistry.createSkillFromExperience(
                     parsed.skillName,
                     parsed.description || 'Auto-learned skill',
                     parsed.content,
                     parsed.category || 'auto-learned',
                     text
                   );
                   addStepLog('layer-10', 'result', `Auto-created new skill: ${parsed.skillName}`);
                   onChunk("", `\n🧠 Am învățat o nouă abilitate: ${parsed.skillName}!\n`);
                }
             }
           } catch (e) {
             console.warn("Failed to parse auto-skill JSON", e);
           }
         } catch (err) {
           console.warn("Auto-skill evaluation failed", err);
         }
      }
      
      addStepLog('layer-10', 'result', 'ASYNC updates dispatched.');
      completeStep('layer-10', 'Learning phase complete.');
      
      setTimeout(() => {
        store.setMode('idle');
      }, 2000);

    } catch (error) {
      console.error("AgentEngine Error:", error);
      const classified = ErrorClassifier.classify(error);
      const errorMsg = ErrorClassifier.formatUserMessage(classified);
      
      let finalMsg = errorMsg;
      if (classified.severity === 'rate_limit') {
        finalMsg = "Platform API Quota exceeded. Please go to Settings and add your own Gemini API Key to continue, or try again later.";
      }
      
      onChunk("", `\n\n**O eroare a apărut:**\n\n${finalMsg}\n`);
      onComplete(`I encountered an error: ${finalMsg}`);
      store.setMode('idle');
    }
  }

}
