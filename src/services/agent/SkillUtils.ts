/**
 * Skill Utilities
 * Inspired by NousResearch/hermes-agent agent/skill_utils.py
 * Frontmatter parsing, skill resolution, category handling, plugin dispatch
 */

import { SkillFrontmatter } from '../../types/hermes';
import * as path from 'path-browserify';

// ============================================================
// Frontmatter Parsing
// ============================================================

const FRONTMATTER_DELIMITER = '---';

/**
 * Parse YAML-like frontmatter from markdown content.
 * Returns [frontmatter_dict, body_content].
 */
export function parseFrontmatter(content: string): [Record<string, any>, string] {
  const trimmed = content.trim();
  if (!trimmed.startsWith(FRONTMATTER_DELIMITER)) {
    return [{}, trimmed];
  }

  const firstDelimiterEnd = trimmed.indexOf('\n', FRONTMATTER_DELIMITER.length);
  if (firstDelimiterEnd === -1) {
    return [{}, trimmed.substring(FRONTMATTER_DELIMITER.length).trim()];
  }

  const bodyStart = trimmed.indexOf(FRONTMATTER_DELIMITER, firstDelimiterEnd + 1);
  if (bodyStart === -1) {
    return [{}, trimmed];
  }

  const rawFrontmatter = trimmed.substring(firstDelimiterEnd + 1, bodyStart).trim();
  const body = trimmed.substring(bodyStart + FRONTMATTER_DELIMITER.length).trim();

  try {
    const frontmatter = parseYamlSimple(rawFrontmatter);
    return [frontmatter, body];
  } catch {
    return [{}, body];
  }
}

/**
 * Simple YAML parser for skill frontmatter.
 * Handles: strings, booleans, numbers, arrays (bracket and comma-separated), nested objects.
 */
function parseYamlSimple(raw: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = raw.split('\n');
  let currentKey = '';
  let currentObj: Record<string, any> | null = null;
  let currentArray: any[] | null = null;
  let arrayItemObj: Record<string, any> | null = null;
  let depth = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    // Array item (list)
    if (trimmedLine.startsWith('- ')) {
      const itemContent = trimmedLine.substring(2).trim();

      if (depth > 0 && currentArray !== null) {
        if (itemContent.includes(':')) {
          const [key, ...valueParts] = itemContent.split(':');
          const value = valueParts.join(':').trim();
          if (arrayItemObj === null) arrayItemObj = {};
          arrayItemObj[key.trim()] = parseYamlValue(value);
        } else if (arrayItemObj) {
          currentArray.push({ ...arrayItemObj, name: parseYamlValue(itemContent) });
          arrayItemObj = null;
        } else {
          currentArray.push(parseYamlValue(itemContent));
        }
      } else if (currentKey) {
        if (currentArray === null) {
          currentArray = [];
          result[currentKey] = currentArray;
        }
        currentArray.push(parseYamlValue(itemContent));
      }
      continue;
    }

    // Nested object property
    if (trimmedLine.startsWith('  ') && currentObj !== null) {
      const colonIdx = trimmedLine.indexOf(':');
      if (colonIdx !== -1) {
        const key = trimmedLine.substring(0, colonIdx).trim();
        const value = trimmedLine.substring(colonIdx + 1).trim();
        currentObj[key] = parseYamlValue(value);
      }
      continue;
    }

    // Top-level key-value
    const colonIdx = trimmedLine.indexOf(':');
    if (colonIdx !== -1) {
      const key = trimmedLine.substring(0, colonIdx).trim();
      const value = trimmedLine.substring(colonIdx + 1).trim();

      if (value === '' || value === '|' || value === '>') {
        // Could be an object or array - check next lines
        // For simplicity, treat empty value as start of nested content
        currentKey = key;
        currentObj = {};
        currentArray = null;
        arrayItemObj = null;
        depth = 1;
        result[key] = currentObj;
      } else {
        result[key] = parseYamlValue(value);
        currentKey = key;
        currentObj = null;
        currentArray = null;
        depth = 0;
      }
    }
  }

  return result;
}

function parseYamlValue(value: string): any {
  if (value === '') return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;

  // Number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  // Bracket array
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map(s => parseYamlValue(s.trim()));
  }

  // Quoted string
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Comma-separated list (common in skills)
  if (value.includes(',')) {
    return value.split(',').map(s => parseYamlValue(s.trim()));
  }

  return value;
}

/**
 * Strip YAML frontmatter from content, return body only.
 */
export function stripYamlFrontmatter(content: string): string {
  const trimmed = content.trim();
  if (!trimmed.startsWith(FRONTMATTER_DELIMITER)) return trimmed;

  const bodyStart = trimmed.indexOf(FRONTMATTER_DELIMITER, FRONTMATTER_DELIMITER.length);
  if (bodyStart === -1) return trimmed;

  return trimmed.substring(bodyStart + FRONTMATTER_DELIMITER.length).trim();
}

// ============================================================
// Skill Matching & Filtering
// ============================================================

const PLATFORM_MAP: Record<string, string> = {
  macos: 'darwin',
  darwin: 'darwin',
  linux: 'linux',
  win32: 'windows',
  windows: 'windows',
};

/**
 * Check if a skill's platform requirements match the current platform.
 */
export function skillMatchesPlatform(frontmatter: SkillFrontmatter, currentPlatform?: string): boolean {
  if (!frontmatter.platforms || frontmatter.platforms.length === 0) return true;

  const platform = currentPlatform || detectPlatform();
  const normalized = frontmatter.platforms.map(p => PLATFORM_MAP[p.toLowerCase()] || p.toLowerCase());
  return normalized.includes(platform);
}

/**
 * Detect the current platform/OS.
 */
function detectPlatform(): string {
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) return 'win32';
    if (ua.includes('mac')) return 'darwin';
    if (ua.includes('linux')) return 'linux';
    if (ua.includes('android')) return 'android';
    if (ua.includes('ios') || ua.includes('iphone')) return 'ios';
  }
  return 'unknown';
}

/**
 * Extract skill conditions from frontmatter (requires, fallback_for).
 */
export function extractSkillConditions(frontmatter: SkillFrontmatter): {
  requires: string[];
  fallbackFor: string[];
} {
  const requires: string[] = [];
  const fallbackFor: string[] = [];

  if (frontmatter.conditions) {
    if (frontmatter.conditions.requires) {
      requires.push(...ensureArray(frontmatter.conditions.requires));
    }
    if (frontmatter.conditions.fallbackFor) {
      fallbackFor.push(...ensureArray(frontmatter.conditions.fallbackFor));
    }
  }

  // Legacy top-level
  if (frontmatter.requires) requires.push(...ensureArray(frontmatter.requires));
  if (frontmatter.fallbackFor) fallbackFor.push(...ensureArray(frontmatter.fallbackFor));

  return { requires, fallbackFor };
}

/**
 * Check if a skill should be visible given available tools and toolsets.
 */
export function skillShouldShow(
  conditions: { requires?: string[]; fallbackFor?: string[] },
  availableTools?: Set<string>,
  availableToolsets?: Set<string>
): boolean {
  // If skill requires specific tools, check availability
  if (conditions.requires && conditions.requires.length > 0) {
    const allAvailable = new Set([...(availableTools || []), ...(availableToolsets || [])]);
    const hasAll = conditions.requires.every(req => allAvailable.has(req));
    if (!hasAll) return false;
  }

  // If skill is a fallback, only show when none of the listed tools/toolsets are available
  if (conditions.fallbackFor && conditions.fallbackFor.length > 0) {
    const allAvailable = new Set([...(availableTools || []), ...(availableToolsets || [])]);
    const hasAny = conditions.fallbackFor.some(fb => allAvailable.has(fb));
    if (hasAny) return false;
  }

  return true;
}

/**
 * Extract description from frontmatter, falling back to first line of body.
 */
export function extractSkillDescription(frontmatter: SkillFrontmatter, body: string): string {
  if (frontmatter.description && frontmatter.description.trim()) {
    return frontmatter.description.trim();
  }
  const firstLine = body.split('\n').find(l => l.trim() && !l.trim().startsWith('#'));
  return firstLine?.trim().substring(0, 1024) || 'No description available.';
}

// ============================================================
// Tag Parsing
// ============================================================

/**
 * Normalize tag values to an array of strings.
 */
export function parseTags(tagsValue: string | string[] | undefined): string[] {
  if (!tagsValue) return [];
  if (Array.isArray(tagsValue)) {
    return tagsValue.flat().map(t => String(t).trim()).filter(Boolean);
  }
  // Bracket-separated: "[a, b, c]"
  if (tagsValue.startsWith('[') && tagsValue.endsWith(']')) {
    return tagsValue
      .slice(1, -1)
      .split(',')
      .map(t => t.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  // Comma-separated
  return tagsValue
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
}

// ============================================================
// Skill Category
// ============================================================

/**
 * Extract category name from skill file path.
 * Expected: ~/.hermes/skills/<category>/<skill>/SKILL.md
 */
export function getCategoryFromPath(skillPath: string): string | null {
  const parts = skillPath.replace(/\\/g, '/').split('/');
  // Look for 'skills' in path, then next segment is category
  const skillsIdx = parts.lastIndexOf('skills');
  if (skillsIdx !== -1 && skillsIdx + 1 < parts.length) {
    return parts[skillsIdx + 1];
  }
  return null;
}

/**
 * Get disabled skill names from configuration.
 */
export function getDisabledSkillNames(config?: { disabledSkills?: string[]; platformDisabledSkills?: Record<string, string[]> }, platform?: string): Set<string> {
  const disabled = new Set<string>();

  if (config?.disabledSkills) {
    config.disabledSkills.forEach(s => disabled.add(s));
  }

  if (config?.platformDisabledSkills && platform) {
    const platformSpecific = config.platformDisabledSkills[platform];
    if (platformSpecific) {
      platformSpecific.forEach(s => disabled.add(s));
    }
  }

  return disabled;
}

// ============================================================
// Helpers
// ============================================================

function ensureArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

/**
 * Validate a file path is within a trusted directory (path traversal prevention).
 */
export function validateWithinDir(filePath: string, allowedDir: string): boolean {
  const normalizedPath = path.normalize(filePath).replace(/\\/g, '/');
  const normalizedDir = path.normalize(allowedDir).replace(/\\/g, '/');
  return normalizedPath.startsWith(normalizedDir + '/') || normalizedPath === normalizedDir;
}

/**
 * Parse qualified skill name (plugin:skill_name format).
 */
export function parseQualifiedName(qualifiedName: string): { namespace: string; name: string } | null {
  const colonIdx = qualifiedName.indexOf(':');
  if (colonIdx === -1) return null;
  return {
    namespace: qualifiedName.substring(0, colonIdx),
    name: qualifiedName.substring(colonIdx + 1),
  };
}

// Injection detection patterns (from skills_tool.py _INJECTION_PATTERNS)
const INJECTION_PATTERNS = [
  'ignore previous instructions',
  'ignore all instructions',
  'system prompt',
  'you are now',
  'pretend you are',
  'roleplay as',
  'act as',
  'new persona',
  'forget everything',
  'developer mode',
];

/**
 * Check content for potential prompt injection patterns.
 */
export function detectInjection(content: string): boolean {
  const lower = content.toLowerCase();
  return INJECTION_PATTERNS.some(pattern => lower.includes(pattern));
}
