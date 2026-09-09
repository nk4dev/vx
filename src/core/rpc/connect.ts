// Thin back-compat wrappers over src/core/config.ts.
// Library-safe: these throw VxConfigError rather than calling process.exit().

import { getFirstRpcUrl, loadVxConfig, type RpcConfig } from '../config';

/**
 * Load the first entry of vx.config.json.
 * @deprecated prefer `loadVxConfig()` / `getFirstRpcUrl()` from `core/config`.
 * @throws {VxConfigError}
 */
export function load_rpc_config(rpcPath?: string): RpcConfig {
  const configs = loadVxConfig(rpcPath ? { path: rpcPath } : undefined);
  return configs[0];
}

/**
 * Resolve the configured RPC URL as a printable string.
 * @throws {VxConfigError}
 */
export function view_rpc_config(rpcPath?: string): string {
  return getFirstRpcUrl(rpcPath ? { path: rpcPath } : undefined);
}
