// Single source of truth for reading & validating vx.config.json.
//
// Everything in this module is library-safe: on a missing or malformed config
// it throws a `VxConfigError` — it never calls process.exit() and never logs.
// The CLI layer (src/command/*, src/core/rpc/command.ts) is responsible for
// turning those errors into a message + exit code.

import * as fs from 'node:fs';
import * as path from 'node:path';

export type RpcProtocol = 'http' | 'https' | 'ws' | 'wss';

export interface RpcConfig {
  // Standard RPC endpoint (http/https/ws/wss)
  host?: string;
  port?: number;
  protocol?: RpcProtocol;

  // Discriminator — defaults to 'rpc' when omitted
  type?: 'rpc' | 'ipfs';

  // IPFS entry: either a gateway URL or an api object
  gateway?: string;
  api?: {
    host: string;
    port: number;
    protocol: 'http' | 'https';
  };
}

export type RpcConfigArray = RpcConfig[];

/** Thrown for any missing / malformed / invalid vx.config.json. */
export class VxConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VxConfigError';
  }
}

const CONFIG_FILENAME = 'vx.config.json';

export interface LoadOptions {
  /** Explicit path to a config file; overrides the default search order. */
  path?: string;
  /** Return `[]` instead of throwing when no config file is found. */
  optional?: boolean;
}

function candidatePaths(explicitPath?: string): string[] {
  if (explicitPath) return [path.resolve(explicitPath)];
  return [
    path.join(process.cwd(), CONFIG_FILENAME),
    path.join(process.cwd(), 'packages', 'sdk', CONFIG_FILENAME),
    path.join(__dirname, '..', '..', CONFIG_FILENAME),
  ];
}

/**
 * Load and validate `vx.config.json`, always returning a normalized array.
 *
 * @throws {VxConfigError} when the file is missing (unless `optional`),
 *   is not valid JSON, or fails schema validation.
 */
export function loadVxConfig(options: LoadOptions = {}): RpcConfigArray {
  let raw: string | undefined;
  let source: string | undefined;
  for (const candidate of candidatePaths(options.path)) {
    try {
      raw = fs.readFileSync(candidate, 'utf-8');
      source = candidate;
      break;
    } catch {
      /* try next candidate */
    }
  }

  if (raw === undefined) {
    if (options.optional) return [];
    throw new VxConfigError(
      `${CONFIG_FILENAME} not found. Run "vx3 rpc init" to create one.`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new VxConfigError(
      `${source}: invalid JSON — ${(err as Error).message}`
    );
  }

  const arr: RpcConfigArray = Array.isArray(parsed)
    ? (parsed as RpcConfigArray)
    : [parsed as RpcConfig];
  validateRpcConfigArray(arr, source ?? CONFIG_FILENAME);
  return arr;
}

/**
 * Validate a parsed config array.
 * @throws {VxConfigError} on the first problem found.
 */
export function validateRpcConfigArray(
  configs: unknown,
  source = CONFIG_FILENAME
): asserts configs is RpcConfigArray {
  if (!Array.isArray(configs)) {
    throw new VxConfigError(`${source}: expected an array of endpoints`);
  }
  configs.forEach((cfg, i) => {
    if (!cfg || typeof cfg !== 'object') {
      throw new VxConfigError(`${source}: entry ${i} is not an object`);
    }
    if (cfg.type === 'ipfs') {
      if (!cfg.gateway && !cfg.api) {
        throw new VxConfigError(
          `${source}: IPFS entry ${i} needs "gateway" (URL) or an "api" object`
        );
      }
      if (cfg.api && (!cfg.api.host || !cfg.api.port || !cfg.api.protocol)) {
        throw new VxConfigError(
          `${source}: IPFS entry ${i} "api" is missing host/port/protocol`
        );
      }
    } else if (!cfg.host || !cfg.port || !cfg.protocol) {
      throw new VxConfigError(
        `${source}: RPC entry ${i} is missing required fields (host, port, protocol)`
      );
    }
  });
}

/** Build an RPC URL string from a config entry. */
export function toRpcUrl(cfg: RpcConfig): string {
  return `${cfg.protocol}://${cfg.host}:${cfg.port}`;
}

/** Return only the standard RPC endpoints (skips IPFS entries). */
export function getRpcEndpoints(configs?: RpcConfigArray): RpcConfig[] {
  const arr = configs ?? loadVxConfig();
  return arr.filter(
    (c) => c.type !== 'ipfs' && !!c.host && !!c.port && !!c.protocol
  );
}

/**
 * Resolve the first usable RPC URL from config.
 * @throws {VxConfigError} when no RPC endpoint is configured.
 */
export function getFirstRpcUrl(options?: LoadOptions): string {
  const endpoints = getRpcEndpoints(loadVxConfig(options));
  if (endpoints.length === 0) {
    throw new VxConfigError(
      `No RPC endpoint configured in ${CONFIG_FILENAME}. Run "vx3 rpc init".`
    );
  }
  return toRpcUrl(endpoints[0]);
}

/** Return the IPFS entries from config (empty when none / no config). */
export function getIpfsEntries(configs?: RpcConfigArray): RpcConfig[] {
  const arr = configs ?? loadVxConfig({ optional: true });
  return arr.filter(
    (e) =>
      !!e &&
      (e.type === 'ipfs' || !!e.gateway || (!!e.api && (!!e.api.host || !!e.api.port)))
  );
}

/** Default config written by `vx3 rpc init`. */
export const DEFAULT_VX_CONFIG: RpcConfigArray = [
  { host: 'localhost', port: 8545, protocol: 'http', type: 'rpc' },
  { host: 'rpc.example.com', port: 443, protocol: 'https', type: 'rpc' },
  { type: 'ipfs', gateway: 'https://ipfs.io' },
];

/**
 * Write a config file (defaults to `./vx.config.json`).
 * @throws {VxConfigError} on invalid input; propagates IO errors. Never exits.
 */
export function writeVxConfig(
  configs: RpcConfigArray = DEFAULT_VX_CONFIG,
  filePath: string = path.join(process.cwd(), CONFIG_FILENAME)
): string {
  validateRpcConfigArray(configs, filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(configs, null, 2)}\n`, 'utf-8');
  return filePath;
}
