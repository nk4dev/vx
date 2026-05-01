// Minimal Solidity frontend lexer used by VXC for import/pragma discovery.
// This is intentionally lightweight: full Solidity parsing is delegated to
// the configured backend (solc). The lexer's job is dependency graph
// construction and pragma extraction so VXC can resolve sources before
// invoking the backend.

export type Token =
  | { kind: 'pragma'; value: string; line: number }
  | { kind: 'import'; path: string; line: number }
  | { kind: 'contract'; name: string; line: number };

export function lex(source: string): Token[] {
  const tokens: Token[] = [];
  const stripped = stripCommentsAndStrings(source);
  const lines = stripped.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const pragma = /^pragma\s+([^;]+);/.exec(line);
    if (pragma) {
      tokens.push({ kind: 'pragma', value: pragma[1].trim(), line: i + 1 });
      continue;
    }

    const imp = /^import\s+(?:[^"']*\s+from\s+)?["']([^"']+)["']\s*;/.exec(line);
    if (imp) {
      tokens.push({ kind: 'import', path: imp[1], line: i + 1 });
      continue;
    }

    const c = /\b(contract|library|interface)\s+([A-Za-z_]\w*)/.exec(line);
    if (c) {
      tokens.push({ kind: 'contract', name: c[2], line: i + 1 });
    }
  }
  return tokens;
}

function stripCommentsAndStrings(src: string): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === '/' && n === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && n === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      out += ' ';
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

export function extractPragmaVersion(tokens: Token[]): string | null {
  const p = tokens.find((t) => t.kind === 'pragma' && /solidity/i.test(t.value));
  if (!p || p.kind !== 'pragma') return null;
  return p.value.replace(/solidity/i, '').trim();
}
