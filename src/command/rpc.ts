import {
    saveRpcConfig,
    loadRpcConfig,
    listRpcConfigs,
    createDefaultRpcConfig,
    addRpcEndpoint,
    displayRpcConfig,
    RpcConfig
} from '../core/rpc/manager';

/**
 * Handle RPC configuration commands
 */
export function handleRpcCommand(args: string[]): void {
    if (args.length === 0) {
        showRpcHelp();
        return;
    }

    const subCommand = args[0];

    try {
        switch (subCommand) {
            case 'save':
                handleSaveCommand(args.slice(1));
                break;
            case 'save-ipfs':
                handleSaveIpfsCommand(args.slice(1));
                break;
            case 'load':
                handleLoadCommand(args.slice(1));
                break;
            case 'list':
                handleListCommand();
                break;
            case 'create':
                handleCreateCommand(args.slice(1));
                break;
            case 'add':
                handleAddCommand(args.slice(1));
                break;
            case 'add-ipfs':
                handleAddIpfsCommand(args.slice(1));
                break;
            case 'help':
                showRpcHelp();
                break;
            default:
                console.error(`Unknown RPC command: ${subCommand}`);
                showRpcHelp();
                process.exit(1);
        }
    } catch (error) {
        console.error(`RPC command error: ${error.message}`);
        process.exit(1);
    }
}

function handleSaveCommand(args: string[]): void {
    if (args.length < 4) {
        console.error('Usage: vx3 rpc save <filename> <host> <port> <protocol> [rpcsDir]');
        console.error('Example: vx3 rpc save localhost localhost 8545 http');
        process.exit(1);
    }

    const [filename, host, port, protocol] = args;
    const rpcsDir = args[4] || 'rpcs';

    const config: RpcConfig = {
        host,
        port: parseInt(port),
        protocol: protocol as 'http' | 'https' | 'ws' | 'wss'
    };

    if (isNaN(config.port)) {
        console.error('Error: Port must be a valid number');
        process.exit(1);
    }

    if (!['http', 'https', 'ws', 'wss'].includes(protocol)) {
        console.error('Error: Protocol must be one of: http, https, ws, wss');
        process.exit(1);
    }

    saveRpcConfig(config, filename, rpcsDir);
}

function handleLoadCommand(args: string[]): void {
    if (args.length === 0) {
        console.error('Usage: vx3 rpc load <filename> [rpcsDir]');
        console.error('Example: vx3 rpc load localhost');
        process.exit(1);
    }

    const filename = args[0];
    const rpcsDir = args[1] || 'rpcs';

    const config = loadRpcConfig(filename, rpcsDir);
    displayRpcConfig(config);
}

function handleListCommand(): void {
    const configs = listRpcConfigs();
    
    if (configs.length === 0) {
        console.log('No RPC configurations found in rpcs directory');
        return;
    }

    console.log('Available RPC configurations:');
    configs.forEach((configName, index) => {
        console.log(`  [${index}] ${configName}`);
    });
}

function handleCreateCommand(args: string[]): void {
    const filename = args[0] || 'localhost';
    const rpcsDir = args[1] || 'rpcs';

    createDefaultRpcConfig(filename, rpcsDir);
    console.log(`Created default RPC configuration: ${filename}.json`);
}

function handleAddCommand(args: string[]): void {
    if (args.length < 4) {
        console.error('Usage: vx3 rpc add <filename> <host> <port> <protocol> [rpcsDir]');
        console.error('Example: vx3 rpc add localhost mainnet.infura.io 443 https');
        process.exit(1);
    }

    const [filename, host, port, protocol] = args;
    const rpcsDir = args[4] || 'rpcs';

    const config: RpcConfig = {
        host,
        port: parseInt(port),
        protocol: protocol as 'http' | 'https' | 'ws' | 'wss'
    };

    if (isNaN(config.port)) {
        console.error('Error: Port must be a valid number');
        process.exit(1);
    }

    if (!['http', 'https', 'ws', 'wss'].includes(protocol)) {
        console.error('Error: Protocol must be one of: http, https, ws, wss');
        process.exit(1);
    }

    addRpcEndpoint(filename, config, rpcsDir);
    console.log(`Added RPC endpoint to configuration: ${filename}.json`);
}

function showRpcHelp(): void {
    console.log('\n🔗 VX RPC Configuration Manager');
    console.log('Manage RPC configurations in vx.config.json format\n');
    
    console.log('Usage: vx3 rpc <command> [options]\n');
    
    console.log('Commands:');
    console.log('  save <filename> <host> <port> <protocol> [dir]  - Save new RPC configuration');
    console.log('  save-ipfs <filename> <gateway|apiHost> [apiPort apiProtocol] [dir] - Save IPFS gateway or API entry');
    console.log('  load <filename> [dir]                           - Load and display RPC configuration');
    console.log('  list                                            - List all saved configurations');
    console.log('  create [filename] [dir]                         - Create default configuration');
    console.log('  add <filename> <host> <port> <protocol> [dir]   - Add endpoint to existing config');
    console.log('  add-ipfs <filename> <gateway|apiHost> [apiPort apiProtocol] [dir] - Add IPFS endpoint to existing config');
    console.log('  help                                            - Show this help message\n');
    
    console.log('Parameters:');
    console.log('  filename   - Configuration file name (without .json extension)');
    console.log('  host       - RPC server hostname or IP address');
    console.log('  port       - RPC server port number');
    console.log('  protocol   - Connection protocol (http, https, ws, wss)');
    console.log('  dir        - Directory to save/load from (default: "rpcs")\n');
    
    console.log('Examples:');
    console.log('  vx3 rpc save localhost localhost 8545 http');
    console.log('  vx3 rpc save mainnet mainnet.infura.io 443 https rpcs');
    console.log('  vx3 rpc load localhost');
    console.log('  vx3 rpc add localhost testnet.example.com 8545 http');
    console.log('  vx3 rpc list');
    console.log('  vx3 rpc create development\n');
}

function handleSaveIpfsCommand(args: string[]): void {
    // Usage: vx3 rpc save-ipfs <filename> <gateway|apiHost> [apiPort apiProtocol] [rpcsDir]
    if (args.length < 2) {
        console.error('Usage: vx3 rpc save-ipfs <filename> <gateway|apiHost> [apiPort apiProtocol] [rpcsDir]');
        console.error('Example (gateway): vx3 rpc save-ipfs localhost https://ipfs.io');
        console.error('Example (api): vx3 rpc save-ipfs localhost ipfs.example.com 5001 https');
        process.exit(1);
    }

    const filename = args[0];
    const second = args[1];
    const rpcsDir = args[4] || args[3] || 'rpcs';

    let config: RpcConfig;

    // If second arg looks like a URL (starts with http), treat as gateway
    if (second.startsWith('http')) {
        config = {
            type: 'ipfs',
            gateway: second
        } as RpcConfig;
    } else {
        // treat as api host, require port and protocol
        if (args.length < 4) {
            console.error('Error: API mode requires apiHost apiPort apiProtocol');
            process.exit(1);
        }
        const apiHost = second;
        const apiPort = parseInt(args[2]);
        const apiProtocol = args[3] as 'http' | 'https';

        if (isNaN(apiPort)) {
            console.error('Error: apiPort must be a valid number');
            process.exit(1);
        }

        if (!['http', 'https'].includes(apiProtocol)) {
            console.error('Error: apiProtocol must be http or https');
            process.exit(1);
        }

        config = {
            type: 'ipfs',
            api: {
                host: apiHost,
                port: apiPort,
                protocol: apiProtocol
            }
        } as RpcConfig;
    }

    saveRpcConfig(config, filename, rpcsDir);
    console.log(`Saved IPFS configuration to: ${filename}.json`);
}

function handleAddIpfsCommand(args: string[]): void {
    // Usage: vx3 rpc add-ipfs <filename> <gateway|apiHost> [apiPort apiProtocol] [rpcsDir]
    if (args.length < 2) {
        console.error('Usage: vx3 rpc add-ipfs <filename> <gateway|apiHost> [apiPort apiProtocol] [rpcsDir]');
        process.exit(1);
    }

    const filename = args[0];
    const second = args[1];
    const rpcsDir = args[4] || args[3] || 'rpcs';

    let config: RpcConfig;

    if (second.startsWith('http')) {
        config = { type: 'ipfs', gateway: second } as RpcConfig;
    } else {
        if (args.length < 4) {
            console.error('Error: API mode requires apiHost apiPort apiProtocol');
            process.exit(1);
        }
        const apiHost = second;
        const apiPort = parseInt(args[2]);
        const apiProtocol = args[3] as 'http' | 'https';

        if (isNaN(apiPort)) {
            console.error('Error: apiPort must be a valid number');
            process.exit(1);
        }

        if (!['http', 'https'].includes(apiProtocol)) {
            console.error('Error: apiProtocol must be http or https');
            process.exit(1);
        }

        config = {
            type: 'ipfs',
            api: { host: apiHost, port: apiPort, protocol: apiProtocol }
        } as RpcConfig;
    }

    addRpcEndpoint(filename, config, rpcsDir);
    console.log(`Added IPFS endpoint to configuration: ${filename}.json`);
}