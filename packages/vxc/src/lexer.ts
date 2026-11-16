// Minimal Solidity frontend lexer used by VXC for import/pragma/contract discovery.
// Full Solidity parsing and AST generation is delegated to the configured solc backend.
// The lexer's job is dependency graph construction and pragma extraction so VXC
// can resolve sources before invoking the backend.

export type Token =
  | { kind: 'pragma'; value: string; line: number }
  | { kind: 'import'; path: string; line: number }
  | { kind: 'contract'; name: string; line: number };

export function lex(source: string): Token[] {
  const tokens: Token[] = [];
  const len = source.length;
  let i = 0;
  let line = 1;

  while (i < len) {
    const c = source[i];
    const next = i + 1 < len ? source[i + 1] : '';

    // Handle newlines
    if (c === '\n') {
      line++;
      i++;
      continue;
    }
    if (c === '\r') {
      if (next === '\n') {
        i++;
      }
      line++;
      i++;
      continue;
    }

    // Skip whitespace
    if (c === ' ' || c === '\t' || c === '\v' || c === '\f') {
      i++;
      continue;
    }

    // Line comment: // ...
    if (c === '/' && next === '/') {
      i += 2;
      while (i < len && source[i] !== '\n' && source[i] !== '\r') {
        i++;
      }
      continue;
    }

    // Block comment: /* ... */
    if (c === '/' && next === '*') {
      i += 2;
      while (i < len) {
        if (source[i] === '\n') {
          line++;
          i++;
        } else if (source[i] === '\r') {
          if (i + 1 < len && source[i + 1] === '\n') {
            i++;
          }
          line++;
          i++;
        } else if (source[i] === '*' && i + 1 < len && source[i + 1] === '/') {
          i += 2;
          break;
        } else {
          i++;
        }
      }
      continue;
    }

    // String literals outside of import (e.g. variable assignments)
    if (c === '"' || c === "'") {
      const quote = c;
      i++;
      while (i < len) {
        if (source[i] === '\\') {
          i += 2; // skip escaped character
          continue;
        }
        if (source[i] === quote) {
          i++;
          break;
        }
        if (source[i] === '\n') {
          line++;
        } else if (source[i] === '\r') {
          if (i + 1 < len && source[i + 1] === '\n') {
            i++;
          }
          line++;
        }
        i++;
      }
      continue;
    }

    // Identifier or keyword candidate
    if (isIdentStart(c)) {
      const startLine = line;
      let ident = '';
      while (i < len && isIdentPart(source[i])) {
        ident += source[i];
        i++;
      }

      if (ident === 'pragma') {
        // Collect up to semicolon
        let pragmaContent = '';
        while (i < len && source[i] !== ';') {
          if (source[i] === '\n') {
            line++;
          } else if (source[i] === '\r') {
            if (i + 1 < len && source[i + 1] === '\n') {
              i++;
            }
            line++;
          }
          pragmaContent += source[i];
          i++;
        }
        if (i < len && source[i] === ';') {
          i++; // consume ';'
        }
        tokens.push({
          kind: 'pragma',
          value: pragmaContent.trim(),
          line: startLine,
        });
        continue;
      }

      if (ident === 'import') {
        // Collect statement up to semicolon
        let foundPath: string | null = null;
        while (i < len && source[i] !== ';') {
          const ch = source[i];
          const nxt = i + 1 < len ? source[i + 1] : '';

          // Track newlines
          if (ch === '\n') {
            line++;
            i++;
            continue;
          }
          if (ch === '\r') {
            if (nxt === '\n') i++;
            line++;
            i++;
            continue;
          }

          // Skip line comments inside import statement
          if (ch === '/' && nxt === '/') {
            i += 2;
            while (i < len && source[i] !== '\n' && source[i] !== '\r') i++;
            continue;
          }

          // Skip block comments inside import statement
          if (ch === '/' && nxt === '*') {
            i += 2;
            while (i < len) {
              if (source[i] === '\n') {
                line++;
                i++;
              } else if (source[i] === '\r') {
                if (i + 1 < len && source[i + 1] === '\n') i++;
                line++;
                i++;
              } else if (source[i] === '*' && i + 1 < len && source[i + 1] === '/') {
                i += 2;
                break;
              } else {
                i++;
              }
            }
            continue;
          }

          // String literal inside import statement (the import path!)
          if (ch === '"' || ch === "'") {
            const quote = ch;
            i++;
            let importPath = '';
            while (i < len) {
              if (source[i] === '\\') {
                importPath += source[i + 1] ?? '';
                i += 2;
                continue;
              }
              if (source[i] === quote) {
                i++;
                break;
              }
              importPath += source[i];
              i++;
            }
            foundPath = importPath;
            continue;
          }

          i++;
        }

        if (i < len && source[i] === ';') {
          i++; // consume ';'
        }

        if (foundPath !== null) {
          tokens.push({
            kind: 'import',
            path: foundPath,
            line: startLine,
          });
        }
        continue;
      }

      if (ident === 'contract' || ident === 'interface' || ident === 'library') {
        // Skip whitespace and comments to find the contract/interface/library name
        while (i < len) {
          const ch = source[i];
          const nxt = i + 1 < len ? source[i + 1] : '';
          if (ch === ' ' || ch === '\t' || ch === '\v' || ch === '\f') {
            i++;
            continue;
          }
          if (ch === '\n') {
            line++;
            i++;
            continue;
          }
          if (ch === '\r') {
            if (nxt === '\n') i++;
            line++;
            i++;
            continue;
          }
          if (ch === '/' && nxt === '/') {
            i += 2;
            while (i < len && source[i] !== '\n' && source[i] !== '\r') i++;
            continue;
          }
          if (ch === '/' && nxt === '*') {
            i += 2;
            while (i < len) {
              if (source[i] === '\n') {
                line++;
                i++;
              } else if (source[i] === '\r') {
                if (i + 1 < len && source[i + 1] === '\n') i++;
                line++;
                i++;
              } else if (source[i] === '*' && i + 1 < len && source[i + 1] === '/') {
                i += 2;
                break;
              } else {
                i++;
              }
            }
            continue;
          }
          break;
        }

        if (i < len && isIdentStart(source[i])) {
          let name = '';
          while (i < len && isIdentPart(source[i])) {
            name += source[i];
            i++;
          }
          tokens.push({
            kind: 'contract',
            name,
            line: startLine,
          });
        }
        continue;
      }

      // Any other identifier (e.g. 'abstract', 'function', etc.)
      continue;
    }

    // Any other character
    i++;
  }

  return tokens;
}

function isIdentStart(c: string): boolean {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$';
}

function isIdentPart(c: string): boolean {
  return isIdentStart(c) || (c >= '0' && c <= '9');
}

export function extractPragmaVersion(tokens: Token[]): string | null {
  const p = tokens.find((t) => t.kind === 'pragma' && /solidity/i.test(t.value));
  if (!p || p.kind !== 'pragma') return null;
  return p.value.replace(/solidity/i, '').trim();
}
