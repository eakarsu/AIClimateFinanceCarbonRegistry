// Centralized resolver for OpenRouter credentials.
// Order: explicit env vars in project .env -> canonical source in beauty-wellness-ai/.env -> safe defaults.
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const CANONICAL_ENV_PATH = '/Users/erolakarsu/projects/beauty-wellness-ai/.env';

function readCanonicalEnv() {
  const out = {};
  try {
    if (!fs.existsSync(CANONICAL_ENV_PATH)) return out;
    const raw = fs.readFileSync(CANONICAL_ENV_PATH, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      // strip wrapping quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    }
  } catch (e) {
    // ignore — fall back to defaults
  }
  return out;
}

const canonical = readCanonicalEnv();

const OPENROUTER_API_KEY =
  (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim()) ||
  canonical.OPENROUTER_API_KEY ||
  '';

const OPENROUTER_MODEL =
  (process.env.OPENROUTER_MODEL && process.env.OPENROUTER_MODEL.trim()) ||
  canonical.OPENROUTER_MODEL ||
  'anthropic/claude-haiku-4.5';

module.exports = {
  OPENROUTER_API_KEY,
  OPENROUTER_MODEL,
};
