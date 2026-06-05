/**
 * Trajectory Tracker
 * Inspired by NousResearch/hermes-agent agent/trajectory.py
 * Records execution steps for learning, debugging, and skill creation.
 */

import { Trajectory, TrajectoryStep, ToolCallRecord, CreatedSkill } from '../../types/hermes';
import { generateId } from '../../utils/helpers';

export class TrajectoryTracker {
  private trajectory: Trajectory;
  private persistenceQueue: CreatedSkill[] = [];
  private maxStepsPerSession: number = 200;

  constructor(sessionId?: string) {
    this.trajectory = {
      sessionId: sessionId || generateId(),
      startTime: Date.now(),
      steps: [],
      totalTokens: 0,
      totalLlmCalls: 0,
      skillsCreated: [],
    };

    // Expose for debugging
    if (typeof window !== 'undefined') {
      (window as any).__hermes_trajectory = this.trajectory;
    }
  }

  // ============================================================
  // Step Recording
  // ============================================================

  /**
   * Start recording a new execution step.
   */
  startStep(input: string, intent: string, turnNumber: number): TrajectoryStep {
    const step: TrajectoryStep = {
      turnNumber,
      timestamp: Date.now(),
      input,
      intent,
      toolCalls: [],
      llmCalls: 0,
      tokensUsed: 0,
      result: '',
      outcome: 'success',
      duration: 0,
      corrections: 0,
    };

    // Enforce max steps
    if (this.trajectory.steps.length >= this.maxStepsPerSession) {
      this.trajectory.steps.shift();
    }

    this.trajectory.steps.push(step);
    return step;
  }

  /**
   * Record a tool call within the current step.
   */
  recordToolCall(
    step: TrajectoryStep,
    toolName: string,
    args: Record<string, any>,
    result: any,
    duration: number
  ): void {
    const record: ToolCallRecord = {
      toolName,
      args: { ...args },
      result,
      duration,
      success: result?.success === true,
    };
    step.toolCalls.push(record);
  }

  /**
   * Record LLM usage within the current step.
   */
  recordLlmUsage(step: TrajectoryStep, tokensUsed: number): void {
    step.llmCalls++;
    step.tokensUsed += tokensUsed;
    this.trajectory.totalTokens += tokensUsed;
    this.trajectory.totalLlmCalls++;
  }

  /**
   * Record a self-correction in the current step.
   */
  recordCorrection(step: TrajectoryStep): void {
    step.corrections = (step.corrections || 0) + 1;
  }

  /**
   * Complete the current step with outcome.
   */
  completeStep(
    step: TrajectoryStep,
    result: string,
    outcome: 'success' | 'partial' | 'failure' | 'cancelled' = 'success'
  ): void {
    step.result = result;
    step.outcome = outcome;
    step.duration = Date.now() - step.timestamp;
  }

  // ============================================================
  // Skill Creation (Learning Loop)
  // ============================================================

  /**
   * Auto-create a skill from a successful trajectory pattern.
   * Called after a complex task completes successfully.
   */
  async createSkillFromTrajectory(
    name: string,
    category: string,
    description: string,
    content: string,
    sourceSteps: TrajectoryStep[]
  ): Promise<CreatedSkill> {
    const skill: CreatedSkill = {
      name,
      category,
      description,
      createdAt: Date.now(),
      sourceTrajectoryId: this.trajectory.sessionId,
      content,
      usageCount: 0,
      effectiveness: 1.0,
    };

    this.trajectory.skillsCreated.push(skill);
    this.persistenceQueue.push(skill);

    // Try to persist to IndexedDB
    try {
      const { db } = await import('../memory/db');
      await db.semantic.add({
        category: 'rag_cache',
        key: `skill_${name}`,
        value: JSON.stringify({
          name,
          category,
          description,
          content: content.substring(0, 5000),
          sourceSteps: sourceSteps.length,
          createdAt: skill.createdAt,
          effectiveness: 1.0,
          usageCount: 0,
        }),
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('[TrajectoryTracker] Failed to persist created skill:', err);
    }

    return skill;
  }

  /**
   * Update skill effectiveness after usage.
   */
  updateSkillEffectiveness(skillName: string, success: boolean): void {
    const skill = this.trajectory.skillsCreated.find(s => s.name === skillName);
    if (!skill) return;

    skill.usageCount++;
    skill.lastUsedAt = Date.now();

    // Exponential moving average
    const alpha = 0.3;
    const newResult = success ? 1.0 : 0.0;
    skill.effectiveness = alpha * newResult + (1 - alpha) * skill.effectiveness;
  }

  // ============================================================
  // Analysis & Learning
  // ============================================================

  /**
   * Analyze trajectory to detect recurring patterns.
   * Returns patterns that could become skills.
   */
  detectPatterns(): Array<{
    pattern: string;
    frequency: number;
    steps: TrajectoryStep[];
    suggestedSkillName: string;
    successRate: number;
  }> {
    const patternMap = new Map<string, { steps: TrajectoryStep[]; successes: number; total: number }>();

    for (const step of this.trajectory.steps) {
      if (step.toolCalls.length === 0) continue;

      // Build pattern key from tool call sequence
      const toolSequence = step.toolCalls.map(tc => tc.toolName).join(' -> ');
      const existing = patternMap.get(toolSequence) || { steps: [], successes: 0, total: 0 };

      existing.steps.push(step);
      existing.total++;
      if (step.outcome === 'success') existing.successes++;

      patternMap.set(toolSequence, existing);
    }

    // Filter for recurring patterns (3+ occurrences, >70% success rate)
    const patterns: Array<{
      pattern: string;
      frequency: number;
      steps: TrajectoryStep[];
      suggestedSkillName: string;
      successRate: number;
    }> = [];

    for (const [pattern, data] of patternMap.entries()) {
      if (data.total >= 3) {
        const successRate = data.successes / data.total;
        if (successRate >= 0.7) {
          const tools = pattern.split(' -> ');
          const lastTool = tools[tools.length - 1] || 'task';
          const suggestedSkillName = `auto_${lastTool.replace(/_tool$/, '')}_workflow`;

          patterns.push({
            pattern,
            frequency: data.total,
            steps: data.steps,
            suggestedSkillName,
            successRate,
          });
        }
      }
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get a summary of the current trajectory for learning purposes.
   */
  getTrajectorySummary(): {
    sessionId: string;
    totalSteps: number;
    successfulSteps: number;
    totalToolCalls: number;
    totalTokens: number;
    totalLlmCalls: number;
    skillsCreated: number;
    patternsDetected: number;
    duration: number;
  } {
    const steps = this.trajectory.steps;
    return {
      sessionId: this.trajectory.sessionId,
      totalSteps: steps.length,
      successfulSteps: steps.filter(s => s.outcome === 'success').length,
      totalToolCalls: steps.reduce((sum, s) => sum + s.toolCalls.length, 0),
      totalTokens: this.trajectory.totalTokens,
      totalLlmCalls: this.trajectory.totalLlmCalls,
      skillsCreated: this.trajectory.skillsCreated.length,
      patternsDetected: this.detectPatterns().length,
      duration: Date.now() - this.trajectory.startTime,
    };
  }

  // ============================================================
  // Accessors
  // ============================================================

  getSessionId(): string {
    return this.trajectory.sessionId;
  }

  getCurrentStep(): TrajectoryStep | null {
    return this.trajectory.steps[this.trajectory.steps.length - 1] || null;
  }

  getFullTrajectory(): Readonly<Trajectory> {
    return this.trajectory;
  }

  /**
   * Export trajectory as JSON string for debugging.
   */
  exportJson(): string {
    return JSON.stringify(this.trajectory, null, 2);
  }

  /**
   * Reset trajectory for a new session.
   */
  reset(sessionId?: string): void {
    this.trajectory = {
      sessionId: sessionId || generateId(),
      startTime: Date.now(),
      steps: [],
      totalTokens: 0,
      totalLlmCalls: 0,
      skillsCreated: [],
    };
  }
}
