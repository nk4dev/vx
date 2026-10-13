import * as fs from 'node:fs';
import * as path from 'node:path';

export const KEY_FLAG_WARNING =
  'Warning: --key exposes your private key in shell history and process listings. Prefer the PRIVATE_KEY environment variable.';

/**
 * Read one variable from the environment, falling back to a `.env` file in
 * `cwd`. Node does not load `.env` on its own, and the SDK documents
 * PRIVATE_KEY as living there (see .env.example).
 */
export function readEnvVar(name: string, cwd = process.cwd()): string | undefined {
  if (process.env[name]) return process.env[name];

  let raw: string;
  try {
    raw = fs.readFileSync(path.join(cwd, '.env'), 'utf-8');
  } catch {
    return undefined;
  }
  for (const line of raw.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match || match[1] !== name) continue;
    let value = match[2].trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote) && value.length >= 2) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '');
    }
    return value || undefined;
  }
  return undefined;
}
