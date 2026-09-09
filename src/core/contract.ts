import {
  getRpcEndpoints,
  loadVxConfig,
  toRpcUrl,
  VxConfigError,
  type LoadOptions,
  type RpcConfigArray,
} from './config';

/**
 * Resolve the configured RPC URL.
 *
 * Library-safe: throws {@link VxConfigError} when no config exists instead of
 * calling process.exit(), so it is safe to import and call from an application.
 */
export function getRpcUrl(): string {
  const endpoints = getRpcEndpoints(loadVxConfig());
  if (endpoints.length === 0) {
    throw new VxConfigError(
      'No RPC endpoint configured in vx.config.json. Run "vx3 rpc init".'
    );
  }
  return toRpcUrl(endpoints[0]);
}

export interface Instance {
  /** First RPC endpoint (kept for backward compatibility). */
  config: RpcConfigArray[number];
  /** All parsed config entries. */
  configs: RpcConfigArray;
  /** Resolved URL of the first RPC endpoint. */
  rpcUrl: string;
}

/**
 * Load the RPC config and resolve the first RPC URL.
 * @throws {VxConfigError} when the config is missing / malformed / has no RPC.
 */
export function instance(configPath?: string): Instance {
  const opts: LoadOptions | undefined = configPath
    ? { path: configPath }
    : undefined;
  const configs = loadVxConfig(opts);
  const endpoints = getRpcEndpoints(configs);
  if (endpoints.length === 0) {
    throw new VxConfigError(
      'No RPC endpoint configured in vx.config.json. Run "vx3 rpc init".'
    );
  }
  return { config: endpoints[0], configs, rpcUrl: toRpcUrl(endpoints[0]) };
}

export default instance;
