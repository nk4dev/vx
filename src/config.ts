import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Single source of truth for the SDK version: read straight from package.json
 * so `vx3 --version`, the help banner and the published `version` can never
 * drift apart.
 */
function readPackageVersion(): string {
  const candidates = [
    join(__dirname, '..', 'package.json'), // published: <pkg>/dist/src -> <pkg>
    join(__dirname, '..', '..', 'package.json'), // published: <pkg>/dist/src -> ...
    join(__dirname, '..', '..', '..', 'package.json'), // built locally: <root>/dist/src -> <root>
  ];
  for (const path of candidates) {
    try {
      const pkg = JSON.parse(readFileSync(path, 'utf-8')) as {
        name?: string;
        version?: string;
      };
      if (pkg.name === 'vx3' && pkg.version) return pkg.version;
    } catch {
      /* try next candidate */
    }
  }
  return '0.0.0';
}

export const SDK_VERSION = readPackageVersion();

// The vx3 platform (contracts / hosted API) version — tracked independently
// of the SDK package version.
export const API_VERSION = '0.1.2';
export const NAME = 'VX3';
