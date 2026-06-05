/**
 * Credential Pool
 * Inspired by NousResearch/hermes-agent agent/credential_pool.py + agent/credential_sources.py
 * Manages API credentials with rate-limit tracking and automatic rotation.
 */

import { CredentialEntry, CredentialSource } from '../../types/hermes';
import { generateId } from '../../utils/helpers';

export class CredentialPool {
  private credentials: Map<string, CredentialEntry[]> = new Map(); // provider -> entries
  private sources: Map<string, CredentialSource> = new Map();
  private rateLimitCooldowns: Map<string, number> = new Map(); // credentialId -> resetAt

  // ============================================================
  // Source Registration
  // ============================================================

  /**
   * Register a credential source.
   */
  registerSource(source: CredentialSource): void {
    this.sources.set(source.name, source);
  }

  /**
   * Load credentials from all registered sources.
   */
  async loadAllCredentials(): Promise<void> {
    for (const [, source] of this.sources) {
      try {
        const entries = await source.getCredentials();
        for (const entry of entries) {
          this.addCredential(entry);
        }
      } catch (err) {
        console.warn(`[CredentialPool] Failed to load credentials from source "${source.name}":`, err);
      }
    }
  }

  // ============================================================
  // Credential Management
  // ============================================================

  /**
   * Add a credential to the pool.
   */
  addCredential(entry: Omit<CredentialEntry, 'id' | 'isRateLimited' | 'usageCount'>): CredentialEntry {
    const fullEntry: CredentialEntry = {
      ...entry,
      id: generateId(),
      isRateLimited: false,
      usageCount: 0,
    };

    const existing = this.credentials.get(entry.provider) || [];
    existing.push(fullEntry);
    this.credentials.set(entry.provider, existing);

    return fullEntry;
  }

  /**
   * Get the next available credential for a provider.
   * Implements round-robin with rate-limit avoidance.
   */
  getCredential(provider: string): CredentialEntry | null {
    const entries = this.credentials.get(provider);
    if (!entries || entries.length === 0) return null;

    const now = Date.now();

    // Clean up expired rate limits
    for (const [credId, resetAt] of this.rateLimitCooldowns) {
      if (now >= resetAt) {
        this.rateLimitCooldowns.delete(credId);
        const entry = entries.find(e => e.id === credId);
        if (entry) entry.isRateLimited = false;
      }
    }

    // Find first non-rate-limited credential (round-robin)
    for (const entry of entries) {
      if (!entry.isRateLimited) {
        entry.usageCount++;
        entry.lastUsedAt = now;
        return entry;
      }
    }

    // All rate-limited - return least recently used one
    const sorted = [...entries].sort((a, b) => (a.lastUsedAt || 0) - (b.lastUsedAt || 0));
    return sorted[0] || null;
  }

  /**
   * Mark a credential as rate-limited.
   */
  markRateLimited(credentialId: string, resetDelayMs: number = 60000): void {
    this.rateLimitCooldowns.set(credentialId, Date.now() + resetDelayMs);

    for (const [, entries] of this.credentials) {
      const entry = entries.find(e => e.id === credentialId);
      if (entry) {
        entry.isRateLimited = true;
        entry.rateLimitResetAt = Date.now() + resetDelayMs;
      }
    }
  }

  /**
   * Get all credentials for a provider.
   */
  getCredentials(provider: string): CredentialEntry[] {
    return this.credentials.get(provider) || [];
  }

  /**
   * Check if any credentials exist for a provider.
   */
  hasCredentials(provider: string): boolean {
    const entries = this.credentials.get(provider);
    return entries !== undefined && entries.length > 0;
  }

  /**
   * Get the total number of credentials across all providers.
   */
  getTotalCredentialCount(): number {
    let total = 0;
    for (const [, entries] of this.credentials) {
      total += entries.length;
    }
    return total;
  }

  /**
   * Remove all credentials for a provider.
   */
  removeCredentials(provider: string): void {
    this.credentials.delete(provider);
  }

  /**
   * Get statistics about the credential pool.
   */
  getStats(): {
    providers: number;
    totalCredentials: number;
    rateLimited: number;
    sources: string[];
  } {
    let totalCreds = 0;
    let rateLimited = 0;
    for (const [, entries] of this.credentials) {
      totalCreds += entries.length;
      rateLimited += entries.filter(e => e.isRateLimited).length;
    }

    return {
      providers: this.credentials.size,
      totalCredentials: totalCreds,
      rateLimited,
      sources: Array.from(this.sources.keys()),
    };
  }
}
