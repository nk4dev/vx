import * as fs from 'fs';
import * as path from 'path';

// Type definition for RPC configuration
export interface RpcConfig {
    // For standard RPC endpoints (http/https/ws/wss): use host/port/protocol
    host?: string;
    port?: number;
    protocol?: 'http' | 'https' | 'ws' | 'wss';

    // Optional type to allow non-RPC endpoints (for example IPFS gateways)
    type?: 'rpc' | 'ipfs';

    // IPFS-specific properties (optional). Either provide `gateway` (a URL string)
    // or an `api` object describing an IPFS API endpoint.
    gateway?: string;
    api?: {
        host: string;
        port: number;
        protocol: 'http' | 'https';
    };
}

// Type for multiple RPC configurations
export type RpcConfigArray = RpcConfig[];

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
        const configArray: RpcConfigArray = Array.isArray(config) ? config : [config];

        // Create the file path
        const filePath = path.join(rpcsDir, `${filename}.json`);

        // Write the configuration file
        fs.writeFileSync(filePath, JSON.stringify(configArray, null, 2), 'utf-8');

        console.log(`RPC configuration saved to: ${filePath}`);
        console.log(`Configuration contains ${configArray.length} RPC endpoint(s)`);
    } catch (error) {
        console.error(`Error saving RPC configuration: ${error.message}`);
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

        // Validate the configuration format
        if (!Array.isArray(parsedConfig)) {
            throw new Error('Configuration must be an array of RPC endpoints');
        }

        // Validate each configuration object. Support both standard RPC entries
        // and IPFS entries which may use `type: 'ipfs'` and either `gateway` or `api`.
        parsedConfig.forEach((config, index) => {
            if (config.type === 'ipfs') {
                if (!config.gateway && !config.api) {
                    throw new Error(`Invalid IPFS configuration at index ${index}: expected 'gateway' (URL) or 'api' object`);
                }
                // if api is present, ensure fields exist
                if (config.api) {
                    if (!config.api.host || !config.api.port || !config.api.protocol) {
                        throw new Error(`Invalid IPFS API configuration at index ${index}: missing api.host/api.port/api.protocol`);
                    }
                }
            } else {
                // default to RPC validation
                if (!config.host || !config.port || !config.protocol) {
                    throw new Error(`Invalid RPC configuration at index ${index}: missing required fields (host, port, protocol)`);
                }
            }
        });

        return parsedConfig;
    } catch (error) {
        console.error(`Error loading RPC configuration: ${error.message}`);
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
            .filter(file => file.endsWith('.json'))
            .map(file => path.basename(file, '.json'));
    } catch (error) {
        console.error(`Error listing RPC configurations: ${error.message}`);
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
            host: "localhost",
            port: 8545,
            protocol: "http"
        }
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
        } catch (error) {
            // If file doesn't exist, start with empty array
            console.log(`Creating new configuration file: ${filename}.json`);
        }

        // Add the new configuration
        existingConfig.push(newConfig);

        // Save the updated configuration
        saveRpcConfig(existingConfig, filename, rpcsDir);
    } catch (error) {
        console.error(`Error adding RPC endpoint: ${error.message}`);
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
                console.log(`  [${index}] ipfs api: ${rpc.api.protocol}://${rpc.api.host}:${rpc.api.port}`);
            } else {
                console.log(`  [${index}] ipfs (invalid entry)`);
            }
        } else {
            console.log(`  [${index}] ${rpc.protocol}://${rpc.host}:${rpc.port}`);
        }
    });
}