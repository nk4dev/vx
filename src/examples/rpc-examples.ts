import {
    saveRpcConfig,
    loadRpcConfig,
    createDefaultRpcConfig,
    addRpcEndpoint,
    listRpcConfigs,
    displayRpcConfig,
    RpcConfig
} from '../core/rpc/manager';

/**
 * Example usage of the RPC configuration manager
 */
export function runExamples() {
    console.log('🔗 RPC Configuration Manager Examples\n');

    try {
        // Example 1: Create a default configuration
        console.log('1. Creating default localhost configuration...');
        createDefaultRpcConfig('localhost');

        // Example 2: Save a custom configuration
        console.log('\n2. Saving custom mainnet configuration...');
        const mainnetConfig: RpcConfig = {
            host: 'mainnet.infura.io',
            port: 443,
            protocol: 'https'
        };
        saveRpcConfig(mainnetConfig, 'mainnet');

        // Example 3: Save multiple RPC endpoints in one configuration
        console.log('\n3. Saving testnet configuration with multiple endpoints...');
        const testnetConfigs: RpcConfig[] = [
            {
                host: 'sepolia.infura.io',
                port: 443,
                protocol: 'https'
            },
            {
                host: 'eth-sepolia.g.alchemy.com',
                port: 443,
                protocol: 'https'
            }
        ];
        saveRpcConfig(testnetConfigs, 'testnet');

        // Example 4: Add endpoint to existing configuration
        console.log('\n4. Adding endpoint to localhost configuration...');
        const newLocalEndpoint: RpcConfig = {
            host: 'localhost',
            port: 8546,
            protocol: 'ws'
        };
        addRpcEndpoint('localhost', newLocalEndpoint);

        // Example 5: List all configurations
        console.log('\n5. Listing all saved configurations:');
        const configs = listRpcConfigs();
        configs.forEach(config => console.log(`   - ${config}.json`));

        // Example 6: Load and display configurations
        console.log('\n6. Loading and displaying localhost configuration:');
        const localhostConfig = loadRpcConfig('localhost');
        displayRpcConfig(localhostConfig);

        console.log('\n✅ All examples completed successfully!');

    } catch (error) {
        console.error(`❌ Example failed: ${error.message}`);
    }
}

// Run examples if this file is executed directly
if (require.main === module) {
    runExamples();
}