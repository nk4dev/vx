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

/** npm package name of the SDK, as generated projects should depend on it. */
export const SDK_PACKAGE_NAME = 'vx3';
/**
 * Dependency spec written into generated projects' package.json. Defaults to
 * the latest published release — the local SDK_VERSION may not be on npm yet —
 * unless a version is given explicitly (`--sdk-version`).
 */
export const SDK_DEPENDENCY_RANGE = 'latest';

// The vx3 platform (contracts / hosted API) version — tracked independently
// of the SDK package version.
export const API_VERSION = '@latest';
export const NAME = 'VX3';
