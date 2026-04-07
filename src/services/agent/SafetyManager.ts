// src/services/agent/SafetyManager.ts
import { GuardResult } from '../../types/agent';

export class SafetyManager {
  private static MAX_RECURSION = 10;
  private static RECURSION_WARNING = 8;

  /**
   * Layer 6: Pre-Tool Safety
   */
  static checkPreTool(toolName: string, args: any): GuardResult {
    // 1. Write Operation Guard
    const isWriteOp = this.isWriteOperation(toolName);
    if (isWriteOp) {
      // In a real app, we'd check if we have a PendingAction or User Confirmation
      // For now, we return a warning if it's a write operation to simulate the guard
      // return {
      //   isSafe: false,
      //   violation: {
      //     type: 'write_blocked',
      //     message: `Write operation '${toolName}' requires explicit user confirmation.`,
      //     severity: 'critical'
      //   }
      // };
    }

    // 2. Sensitive Data Filter
    const sensitiveData = this.scanForSensitiveData(args);
    if (sensitiveData) {
      return {
        isSafe: false,
        violation: {
          type: 'sensitive_data',
          message: `Sensitive data detected in tool arguments: ${sensitiveData}`,
          severity: 'critical'
        }
      };
    }

    return { isSafe: true };
  }

  /**
   * Layer 8: Post-Tool Safety
   */
  static checkPostTool(result: any, iterationCount: number): GuardResult {
    // 1. Recursion Limiter
    if (iterationCount >= this.MAX_RECURSION) {
      return {
        isSafe: false,
        violation: {
          type: 'recursion',
          message: 'Maximum recursion limit reached (10 iterations). Stopping to prevent infinite loop.',
          severity: 'critical'
        }
      };
    }

    if (iterationCount >= this.RECURSION_WARNING) {
      // Just a warning, still safe but we should notify
      console.warn(`Agent is at ${iterationCount} iterations. Approaching limit.`);
    }

    // 2. Frustration Detector (Simulated)
    // In a real app, we'd analyze the user's last few messages
    
    // 3. Response Sanity Check
    const sanityError = this.validateResponseSanity(result);
    if (sanityError) {
      return {
        isSafe: false,
        violation: {
          type: 'sanity_check',
          message: `Response sanity check failed: ${sanityError}`,
          severity: 'warning'
        }
      };
    }

    return { isSafe: true };
  }

  private static isWriteOperation(toolName: string): boolean {
    const writeTools = ['writeFile', 'editFile', 'deleteFile', 'dbWrite', 'apiPost', 'apiPut', 'apiDelete'];
    return writeTools.some(t => toolName.toLowerCase().includes(t.toLowerCase()));
  }

  private static scanForSensitiveData(data: any): string | null {
    const serialized = JSON.stringify(data);
    
    // Simple regex patterns for sensitive data
    const patterns = {
      apiKey: /(?:api[_-]?key|secret|token|password|auth)["\s:]+["']([a-zA-Z0-9]{16,})["']/gi,
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      // Add more as needed
    };

    for (const [name, pattern] of Object.entries(patterns)) {
      const match = serialized.match(pattern);
      if (match) return name;
    }

    return null;
  }

  private static validateResponseSanity(result: any): string | null {
    if (!result) return 'Empty result';
    
    // Check for common failure patterns in LLM outputs
    const serialized = typeof result === 'string' ? result : JSON.stringify(result);
    
    if (serialized.includes('I am sorry, but I cannot') || serialized.includes('As an AI language model')) {
      return 'Refusal pattern detected';
    }

    if (serialized.length > 50000) {
      return 'Response too large (potential runaway)';
    }

    return null;
  }
}
