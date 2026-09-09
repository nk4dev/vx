import * as fs from 'fs';
import * as path from 'path';
import {
  validateRpcConfigArray,
  type RpcConfig,
  type RpcConfigArray,
} from '../config';

// Re-exported for backward compatibility — the canonical definitions now live
// in src/core/config.ts.
export type { RpcConfig, RpcConfigArray };

/**
 * Save RPC configuration to rpcs directory in vx.config.json format
 * @param config - RPC configuration object or array of configurations
 * @param filename - Name of the configuration file (without extension)
 * @param rpcsDir - Directory path to save the configuration (default: 'rpcs')
 */
export function saveRpcConfig(
  config: RpcConfig | RpcConfigArray,
  filename: string,
  rpcsDir: string = 'rpcs'
): void {
  try {
    // Ensure rpcs directory exists
    if (!fs.existsSync(rpcsDir)) {
      fs.mkdirSync(rpcsDir, { recursive: true });
      console.log(`Created directory: ${rpcsDir}`);
    }

    // Normalize config to array format (same as vx.config.json)
    const configArray: RpcConfigArray = Array.isArray(config)
      ? config
      : [config];

    // Create the file path
    const filePath = path.join(rpcsDir, `${filename}.json`);

    // Write the configuration file
    fs.writeFileSync(filePath, JSON.stringify(configArray, null, 2), 'utf-8');

    console.log(`RPC configuration saved to: ${filePath}`);
    console.log(`Configuration contains ${configArray.length} RPC endpoint(s)`);
  } catch (error) {
    console.error(`Error saving RPC configuration: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Load RPC configuration from rpcs directory
 * @param filename - Name of the configuration file (without extension)
 * @param rpcsDir - Directory path to load from (default: 'rpcs')
 * @returns RPC configuration array
 */
export function loadRpcConfig(
  filename: string,
  rpcsDir: string = 'rpcs'
): RpcConfigArray {
  try {
    const filePath = path.join(rpcsDir, `${filename}.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Configuration file not found: ${filePath}`);
    }

    const configContent = fs.readFileSync(filePath, 'utf-8');
    const parsedConfig = JSON.parse(configContent);

    // Shared schema validation (throws on the first problem).
    validateRpcConfigArray(parsedConfig, filePath);

    return parsedConfig;
  } catch (error) {
    console.error(`Error loading RPC configuration: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * List all RPC configuration files in the rpcs directory
 * @param rpcsDir - Directory path to search (default: 'rpcs')
 * @returns Array of configuration file names (without extension)
 */
export function listRpcConfigs(rpcsDir: string = 'rpcs'): string[] {
  try {
    if (!fs.existsSync(rpcsDir)) {
      return [];
    }

    const files = fs.readdirSync(rpcsDir);
    return files
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.basename(file, '.json'));
  } catch (error) {
    console.error(`Error listing RPC configurations: ${(error as Error).message}`);
    return [];
  }
}

/**
 * Create a default RPC configuration and save it
 * @param filename - Name for the configuration file
 * @param rpcsDir - Directory to save to (default: 'rpcs')
 */
export function createDefaultRpcConfig(
  filename: string = 'localhost',
  rpcsDir: string = 'rpcs'
): void {
  const defaultConfig: RpcConfigArray = [
    {
      host: 'localhost',
      port: 8545,
      protocol: 'http',
    },
  ];

  saveRpcConfig(defaultConfig, filename, rpcsDir);
}

/**
 * Add a new RPC endpoint to an existing configuration
 * @param filename - Configuration file to update
 * @param newConfig - New RPC configuration to add
 * @param rpcsDir - Directory path (default: 'rpcs')
 */
export function addRpcEndpoint(
  filename: string,
  newConfig: RpcConfig,
  rpcsDir: string = 'rpcs'
): void {
  try {
    let existingConfig: RpcConfigArray = [];

    // Try to load existing configuration
    try {
      existingConfig = loadRpcConfig(filename, rpcsDir);
    } catch {
      // If file doesn't exist, start with empty array
      console.log(`Creating new configuration file: ${filename}.json`);
    }

    // Add the new configuration
    existingConfig.push(newConfig);

    // Save the updated configuration
    saveRpcConfig(existingConfig, filename, rpcsDir);
  } catch (error) {
    console.error(`Error adding RPC endpoint: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Display RPC configuration in a readable format
 * @param config - RPC configuration array
 */
export function displayRpcConfig(config: RpcConfigArray): void {
  console.log('RPC Configuration:');
  config.forEach((rpc, index) => {
    if (rpc.type === 'ipfs') {
      if (rpc.gateway) {
        console.log(`  [${index}] ipfs gateway: ${rpc.gateway}`);
      } else if (rpc.api) {
        console.log(
          `  [${index}] ipfs api: ${rpc.api.protocol}://${rpc.api.host}:${rpc.api.port}`
        );
      } else {
        console.log(`  [${index}] ipfs (invalid entry)`);
      }
    } else {
      console.log(`  [${index}] ${rpc.protocol}://${rpc.host}:${rpc.port}`);
    }
  });
}
