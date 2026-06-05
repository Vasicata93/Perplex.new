/**
 * Skill Registry (Enhanced)
 * Inspired by NousResearch/hermes-agent agent/skill_utils.py + tools/skills_tool.py
 * Full skill system with: situational skills, SKILL.md resolution,
 * frontmatter parsing, plugin dispatch, category organization, and setup requirements.
 */

import { SkillEntry, SkillCategory, SkillFrontmatter } from '../../types/hermes';
import { parseFrontmatter, skillMatchesPlatform, extractSkillDescription, getCategoryFromPath, parseQualifiedName } from './SkillUtils';

// ============================================================
// Situational Skills (Original, kept for backward compatibility)
// ============================================================

export const SITUATIONAL_SKILLS: Record<string, string> = {
  coding_skill: `CODING SKILL:
- Prioritize clean, readable, and well-organized code.
- Use TypeScript for all examples.
- Follow standard design patterns.
- Ensure type safety.
- Test edge cases and handle errors gracefully.`,
  research_skill: `RESEARCH SKILL:
- Use multiple sources for verification.
- Provide citations where possible.
- Synthesize information into a coherent summary.
- Identify potential biases in sources.
- Present findings with confidence levels.`,
  finance_skill: `FINANCE SKILL:
- Use precise terminology.
- Double-check all calculations.
- Consider market trends and historical data.
- Maintain objectivity.
- Always disclose assumptions and limitations.`,
  writing_skill: `WRITING SKILL:
- Adapt tone to the audience.
- Ensure logical flow and transitions.
- Use active voice where appropriate.
- Proofread for grammar and style.
- Match the user's language and formality level.`,
  data_analysis_skill: `DATA ANALYSIS SKILL:
- Use statistical methods for insights.
- Visualize data for clarity.
- Identify patterns and anomalies.
- Provide actionable recommendations.
- Clearly separate findings from interpretations.`,
};

// ============================================================
// Skill Registry Class (Hermes-style)
// ============================================================

export class SkillRegistry {
  private static skills: Map<string, SkillEntry> = new Map();
  private static plugins: Map<string, Map<string, SkillEntry>> = new Map(); // namespace -> skills
  private static categories: Map<string, SkillCategory> = new Map();
  private static disabledSkillNames: Set<string> = new Set();
  private static platform: string = 'web';

  // ============================================================
  // Configuration
  // ============================================================

  /**
   * Set disabled skill names from configuration.
   */
  static setDisabledSkills(names: string[]): void {
    this.disabledSkillNames = new Set(names);
  }

  /**
   * Set the current platform for platform-specific skill filtering.
   */
  static setPlatform(platform: string): void {
    this.platform = platform;
  }

  // ============================================================
  // Skill Registration (Hermes: skills_tool pattern)
  // ============================================================

  /**
   * Register a skill from parsed SKILL.md content.
   */
  static registerFromSkillMd(content: string, path: string, isPlugin: boolean = false, namespace?: string): SkillEntry | null {
    // Parse frontmatter
    const [frontmatter, body] = parseFrontmatter(content);
    const name = frontmatter.name || path.split('/').pop()?.replace('/SKILL.md', '') || 'unnamed';
    const category = frontmatter.category || getCategoryFromPath(path) || 'general';
    const description = extractSkillDescription(frontmatter, body);

    // Check platform compatibility
    if (!skillMatchesPlatform(frontmatter, this.platform)) {
      console.log(`[SkillRegistry] Skill "${name}" skipped: platform mismatch.`);
      return null;
    }

    // Check disabled
    if (this.disabledSkillNames.has(name)) {
      console.log(`[SkillRegistry] Skill "${name}" skipped: disabled.`);
      return null;
    }

    const entry: SkillEntry = {
      name,
      description,
      category,
      platforms: frontmatter.platforms,
      path,
      isPlugin,
      namespace,
      frontmatter,
      readinessStatus: 'available',
    };

    // Check setup requirements
    const envVars = this.getRequiredEnvVars(frontmatter);
    if (envVars.missing.length > 0) {
      entry.readinessStatus = 'setup_needed';
      entry.missingEnvVars = envVars.missing;
      entry.setupHelp = frontmatter.setup?.help || `Requires environment variables: ${envVars.missing.join(', ')}`;
    }

    if (isPlugin && namespace) {
      if (!this.plugins.has(namespace)) {
        this.plugins.set(namespace, new Map());
      }
      this.plugins.get(namespace)!.set(name, entry);
    } else {
      this.skills.set(name, entry);
    }

    // Update category index
    if (!this.categories.has(category)) {
      this.categories.set(category, { name: category, skills: [] });
    }
    this.categories.get(category)!.skills.push(entry);

    return entry;
  }

  /**
   * Register a plugin skill directly.
   */
  static registerPluginSkill(namespace: string, entry: SkillEntry): void {
    if (!this.plugins.has(namespace)) {
      this.plugins.set(namespace, new Map());
    }
    this.plugins.get(namespace)!.set(entry.name, entry);

    // Also add to main registry for lookups
    this.skills.set(entry.name, entry);
  }

  /**
   * Register a situational skill (from SITUATIONAL_SKILLS map).
   */
  static registerSituationalSkill(name: string, content: string): void {
    this.skills.set(name, {
      name,
      description: content.substring(0, 100).replace(/\n/g, ' '),
      category: 'situational',
      path: `internal://situational/${name}`,
      readinessStatus: 'available',
    });
  }

  // ============================================================
  // Skill Resolution (Hermes: skill_view 5-phase resolution)
  // ============================================================

  /**
   * Resolve a skill by name using multi-phase resolution.
   * Phase 1: Plugin dispatch (name:namespace format)
   * Phase 2: Direct path match
   * Phase 3: Name scan
   * Phase 4: Fuzzy match
   */
  static resolveSkill(name: string): SkillEntry | null {
    // Phase 1: Plugin dispatch
    const qualified = parseQualifiedName(name);
    if (qualified) {
      const pluginSkills = this.plugins.get(qualified.namespace);
      if (pluginSkills) {
        const skill = pluginSkills.get(qualified.name);
        if (skill) return skill;
      }
    }

    // Phase 2: Direct name lookup
    const direct = this.skills.get(name);
    if (direct && !this.disabledSkillNames.has(name)) {
      return direct;
    }

    // Phase 3: Case-insensitive scan
    for (const [, entry] of this.skills) {
      if (entry.name.toLowerCase() === name.toLowerCase() && !this.disabledSkillNames.has(entry.name)) {
        return entry;
      }
    }

    // Phase 4: Partial match
    for (const [, entry] of this.skills) {
      if (entry.name.toLowerCase().includes(name.toLowerCase()) && !this.disabledSkillNames.has(entry.name)) {
        return entry;
      }
    }

    return null;
  }

  /**
   * Load skill content (the full SKILL.md body).
   * This would read from filesystem in a real implementation.
   * In browser context, reads from IndexedDB or pre-loaded cache.
   */
  static async loadSkillContent(skill: SkillEntry): Promise<string> {
    // In browser context, skills may be stored in IndexedDB
    try {
      const { db } = await import('../memory/db');
      const entry = await db.semantic.where({ category: 'skill', key: skill.name }).first();
      if (entry && entry.value) {
        return entry.value;
      }
    } catch {
      // Fall through to return stored content
    }

    return ''; // Content would be loaded from filesystem in Node.js context
  }

  // ============================================================
  // Skill Listing (Hermes: skills_list pattern)
  // ============================================================

  /**
   * List all available skills, optionally filtered by category.
   * Returns structured result matching Hermes' skills_list tool output.
   */
  static listSkills(category?: string): {
    success: boolean;
    skills: Array<{ name: string; description: string; category: string; readiness: string }>;
    categories: Array<{ name: string; count: number }>;
    count: number;
    hint: string;
  } {
    let allSkills = Array.from(this.skills.values());

    // Filter disabled
    allSkills = allSkills.filter(s => !this.disabledSkillNames.has(s.name));

    // Filter by category if specified
    if (category) {
      allSkills = allSkills.filter(s => s.category === category);
    }

    // Sort by category then name
    allSkills.sort((a, b) => {
      const catCmp = a.category.localeCompare(b.category);
      if (catCmp !== 0) return catCmp;
      return a.name.localeCompare(b.name);
    });

    const skillsList = allSkills.map(s => ({
      name: s.name,
      description: s.description,
      category: s.category,
      readiness: s.readinessStatus || 'available',
    }));

    const categories = Array.from(this.categories.entries())
      .filter(([_, cat]) => cat.skills.length > 0)
      .map(([name, cat]) => ({ name, count: cat.skills.length }));

    return {
      success: true,
      skills: skillsList,
      categories,
      count: skillsList.length,
      hint: `Use skill_view with a skill name to see full details. ${allSkills.filter(s => s.readinessStatus === 'setup_needed').length} skill(s) need setup.`,
    };
  }

  /**
   * Get all skill categories.
   */
  static getCategories(): SkillCategory[] {
    return Array.from(this.categories.values())
      .filter(cat => cat.skills.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get skills requiring setup.
   */
  static getSkillsNeedingSetup(): SkillEntry[] {
    return Array.from(this.skills.values())
      .filter(s => s.readinessStatus === 'setup_needed');
  }

  // ============================================================
  // Skill Creation (Learning Loop - Hermes pattern)
  // ============================================================

  /**
   * Auto-create a skill from a successful task execution.
   * This is the core of Hermes' learning loop.
   */
  static async createSkillFromExperience(
    name: string,
    description: string,
    content: string,
    category: string = 'auto-learned',
    sourceTask: string = ''
  ): Promise<SkillEntry> {
    // Build SKILL.md content with frontmatter
    const frontmatter = `---
name: ${name}
description: ${description}
category: ${category}
tags: [auto-learned, generated]
---
${content}

# Auto-Generated Skill

This skill was automatically created from a successful task execution.
Source task: ${sourceTask}
Generated at: ${new Date().toISOString()}

## When to use this skill
${description}

## Steps
${content}`;

    const entry: SkillEntry = {
      name,
      description,
      category,
      path: `auto-learned://${name}`,
      readinessStatus: 'available',
      frontmatter: {
        name,
        description,
        category,
        tags: ['auto-learned', 'generated'],
      },
    };

    // Register the skill
    this.skills.set(name, entry);

    if (!this.categories.has(category)) {
      this.categories.set(category, { name: category, skills: [] });
    }
    this.categories.get(category)!.skills.push(entry);

    // Persist to IndexedDB
    try {
      const { db } = await import('../memory/db');
      await db.semantic.add({
        category: 'rag_cache',
        key: `skill_${name}`,
        value: frontmatter,
        updatedAt: Date.now(),
      });

      // Also save as procedural memory for retrieval
      await db.procedural.add({
        pattern: `task similar to: ${sourceTask || name}`,
        action: `use skill: ${name}`,
        weight: 1,
      });

      console.log(`[SkillRegistry] Auto-created skill: ${name} (${category})`);
    } catch (err) {
      console.warn(`[SkillRegistry] Failed to persist auto-created skill:`, err);
    }

    return entry;
  }

  // ============================================================
  // Environment Variable Requirements
  // ============================================================

  private static getRequiredEnvVars(frontmatter: SkillFrontmatter): {
    required: string[];
    present: string[];
    missing: string[];
  } {
    const required: string[] = [];
    const present: string[] = [];
    const missing: string[] = [];

    // Collect from multiple sources (Hermes pattern)
    if (frontmatter.prerequisites?.envVars) {
      required.push(...ensureArray(frontmatter.prerequisites.envVars));
    }
    if (frontmatter.setup?.collectSecrets) {
      frontmatter.setup.collectSecrets.forEach(s => {
        if (!required.includes(s.name) && !s.optional) {
          required.push(s.name);
        }
      });
    }

    for (const envVar of required) {
      if (typeof process !== 'undefined' && process.env[envVar]) {
        present.push(envVar);
      } else if (typeof localStorage !== 'undefined' && localStorage.getItem(`env_${envVar}`)) {
        present.push(envVar);
      } else {
        missing.push(envVar);
      }
    }

    return { required, present, missing };
  }

  // ============================================================
  // Management
  // ============================================================

  static unregisterSkill(name: string): boolean {
    return this.skills.delete(name);
  }

  static clearAll(): void {
    this.skills.clear();
    this.plugins.clear();
    this.categories.clear();
  }

  static getStats(): {
    totalSkills: number;
    availableSkills: number;
    needsSetup: number;
    categories: number;
    plugins: number;
  } {
    const all = Array.from(this.skills.values());
    return {
      totalSkills: all.length,
      availableSkills: all.filter(s => s.readinessStatus === 'available').length,
      needsSetup: all.filter(s => s.readinessStatus === 'setup_needed').length,
      categories: this.categories.size,
      plugins: this.plugins.size,
    };
  }
}

// Register all situational skills on load
for (const [name, content] of Object.entries(SITUATIONAL_SKILLS)) {
  SkillRegistry.registerSituationalSkill(name, content);
}

function ensureArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}
