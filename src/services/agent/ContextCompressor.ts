/**
 * Context Compressor
 * Inspired by NousResearch/hermes-agent agent/context_compressor.py
 * Intelligent context compression for large tool outputs and long conversations.
 */

import { CompressionResult, ContextBlock } from '../../types/hermes';

export class ContextCompressor {
  // ============================================================
  // Configuration
  // ============================================================

  private static readonly COMPACTION_THRESHOLD = 90000; // chars
  private static readonly HEAD_RATIO = 0.7;
  private static readonly TAIL_RATIO = 0.2;
  private static readonly MAX_COMPRESSED_SIZE = 8000; // chars

  // ============================================================
  // Context Block Compression
  // ============================================================

  /**
   * Check if content needs compression.
   */
  static needsCompression(content: string): boolean {
    return content.length > this.COMPACTION_THRESHOLD;
  }

  /**
   * Compress content using LLM-powered summarization.
   * Falls back to head/tail truncation if LLM fails.
   */
  static async compress(
    content: string,
    taskDescription: string,
    toolName: string,
    llmService: any,
    provider: string = 'GEMINI',
    options?: {
      geminiApiKey?: string;
      openRouterKey?: string;
      openRouterModel?: string;
      openAiKey?: string;
      openAiModel?: string;
      activeLocalModel?: any;
    }
  ): Promise<CompressionResult> {
    const originalTokens = this.estimateTokens(content);

    if (content.length <= this.COMPACTION_THRESHOLD) {
      return {
        compressed: content,
        originalTokens,
        compressedTokens: originalTokens,
        method: 'truncation',
      };
    }

    // Try LLM-powered compression
    let compressed: string;
    let method: CompressionResult['method'] = 'summary';

    try {
      compressed = await this.llmCompress(content, taskDescription, toolName, llmService, provider, options);
    } catch (err) {
      console.warn('[ContextCompressor] LLM compression failed, falling back to truncation:', err);
      compressed = this.headTailTruncate(content);
      method = 'truncation';
    }

    // Final size check
    if (compressed.length > this.MAX_COMPRESSED_SIZE) {
      compressed = compressed.substring(0, this.MAX_COMPRESSED_SIZE) + '\n... [further compressed]';
    }

    return {
      compressed,
      originalTokens,
      compressedTokens: this.estimateTokens(compressed),
      method,
    };
  }

  /**
   * LLM-powered intelligent summarization of large content.
   */
  private static async llmCompress(
    content: string,
    taskDescription: string,
    toolName: string,
    llmService: any,
    provider: string,
    options?: any
  ): Promise<string> {
    const prompt = `You are an advanced data compaction system.
The following raw data was returned by the tool "${toolName}" while attempting to solve this task: "${taskDescription}".
The data is extremely large (${content.length} characters).

CRITICAL INSTRUCTIONS:
1. Create a comprehensive, highly dense summary of the data.
2. DO NOT just read the beginning. Extract and preserve EVERY important element, decision, metric, link, or factual information.
3. Remove redundant formatting, boilerplate, or repetitive structures, but KEEP ALL context crucial to the user's task.
4. If the data is code, describe its structure, main functions, and any extracted logic without pasting massive blocks.
5. Preserve all URLs, file paths, identifiers, and exact values.

RAW DATA (truncated safely to prevent hard limits):
${content.substring(0, 100000)}`;

    const result = await llmService.generateSimpleText(
      prompt,
      provider,
      options?.openRouterKey || '',
      options?.openRouterModel || '',
      options?.openAiKey || '',
      options?.openAiModel || '',
      options?.activeLocalModel || undefined,
      options?.geminiApiKey || ''
    );

    return result || 'COMPACTION FAILED. Summary unavailable.';
  }

  // ============================================================
  // Truncation Strategies
  // ============================================================

  /**
   * Head/tail truncation preserving beginning and end of content.
   */
  static headTailTruncate(content: string, headRatio: number = this.HEAD_RATIO, tailRatio: number = this.TAIL_RATIO): string {
    const headSize = Math.floor(content.length * headRatio);
    const tailSize = Math.floor(content.length * tailRatio);

    const head = content.substring(0, headSize);
    const tail = content.substring(content.length - tailSize);

    return `${head}\n\n... [${content.length - headSize - tailSize} characters removed by context compression] ...\n\n${tail}`;
  }

  /**
   * Compress a message history by summarizing older messages.
   * Keeps the most recent messages intact.
   */
  static async compressHistory(
    messages: ContextBlock[],
    llmService: any,
    provider: string = 'GEMINI',
    options?: any
  ): Promise<ContextBlock[]> {
    if (messages.length <= 10) return messages;

    const recentCount = 8;
    const toCompress = messages.slice(0, -recentCount);
    const recent = messages.slice(-recentCount);

    // Build a summary of older messages
    const conversationSummary = toCompress
      .map(m => `[${m.role}]: ${m.content.substring(0, 200)}`)
      .join('\n');

    const summaryPrompt = `Summarize this conversation history concisely, preserving key facts, decisions, and context:\n\n${conversationSummary}`;

    try {
      const summary = await llmService.generateSimpleText(
        summaryPrompt,
        provider,
        options?.openRouterKey || '',
        options?.openRouterModel || '',
        options?.openAiKey || '',
        options?.openAiModel || '',
        options?.activeLocalModel || undefined,
        options?.geminiApiKey || ''
      );

      const compressedBlock: ContextBlock = {
        role: 'system',
        content: `[Previous conversation summary]\n${summary}`,
        tokens: this.estimateTokens(summary),
      };

      return [compressedBlock, ...recent];
    } catch {
      // If compression fails, just keep recent messages
      return recent;
    }
  }

  // ============================================================
  // Token Estimation
  // ============================================================

  /**
   * Rough token estimation (1 token ~ 4 chars for English, ~2 chars for CJK).
   */
  static estimateTokens(text: string): number {
    if (!text) return 0;
    // Simple heuristic: count chars, adjust for CJK
    const cjkChars = (text.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
    const nonCjkChars = text.length - cjkChars;
    return Math.ceil(nonCjkChars / 4 + cjkChars / 2);
  }

  /**
   * Check if total context is approaching the model's limit.
   */
  static isContextOverflowRisk(
    messages: { content: string }[],
    maxTokens: number = 128000,
    safetyMargin: number = 0.8
  ): boolean {
    const totalTokens = messages.reduce((sum, m) => sum + this.estimateTokens(m.content), 0);
    return totalTokens > maxTokens * safetyMargin;
  }
}
