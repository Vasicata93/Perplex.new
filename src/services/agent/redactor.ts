// Simple adaptation of redact.py from Hermes Brain to mask secrets from outputs
export function redactSecrets(text: string): string {
  if (!text) return text;
  
  // Basic patterns to catch keys, tokens, and generic credentials
  const patterns = [
    // API Keys (sk-*)
    /sk-[a-zA-Z0-9]{32,}/g,
    // Bearer tokens
    /Bearer\s+[a-zA-Z0-9\-\._~+\/]+=*/g,
    // generic AWS strings
    /AKIA[0-9A-Z]{16}/g,
    // JWT Tokens
    /eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g
  ];

  let redacted = text;
  for (const pattern of patterns) {
    redacted = redacted.replace(pattern, '[REDACTED_SECRET]');
  }

  return redacted;
}
