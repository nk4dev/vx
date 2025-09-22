import * as fs from 'fs';
import * as path from 'path';

export function view_rpc_config() {
    let configPath = null;
    if (process.argv[2] === '-p' || process.argv[2] === '--path') {
        const rpcPath = process.argv[3];
        if (!rpcPath) {
            console.error('Error: Please provide a path after -p or --path');
            process.exit(1);
        }
        configPath = path.isAbsolute(rpcPath) ? rpcPath : path.join(process.cwd(), rpcPath);
    } else {
        configPath = path.join(process.cwd(), 'vx.config.json');
    }

    try {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        //return JSON.parse(configContent);
        const parsedContent = JSON.parse(configContent);
        console.log(`RPC : ${parsedContent.protocol}://${parsedContent.host}:${parsedContent.port}`);
        process.exit(0);
    } catch (error) {
        console.error(`Error reading vx.config.json: ${error.message}`);
        console.error(`Attempted to read from: ${configPath}`);
        process.exit(1);
    }
}

export function load_rpc_config(rpcPath?: string) {
    // If rpcPath is not provided, search in multiple locations
    if (!rpcPath) {
        const possiblePaths = [
            path.join(process.cwd(), 'vx.config.json'),
            path.join(process.cwd(), 'packages', 'sdk', 'vx.config.json'),
            path.join(__dirname, '..', '..', 'vx.config.json'), // relative to this file
        ];
        
        for (const possiblePath of possiblePaths) {
            try {
                const configContent = fs.readFileSync(possiblePath, 'utf-8');
                const parsedContent = JSON.parse(configContent);
                return parsedContent;
            } catch (error) {
                // Continue to next path
            }
        }
        
        console.error('Error: vx.config.json not found in any of the expected locations:');
        possiblePaths.forEach(p => console.error(`  - ${p}`));
        process.exit(1);
    }
    
    // If rpcPath is provided, use it directly
    const configPath = path.isAbsolute(rpcPath) 
        ? rpcPath 
        : path.join(process.cwd(), rpcPath);

    try {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        //return JSON.parse(configContent);
        const parsedContent = JSON.parse(configContent);
        return parsedContent; // Return the first configuration object
    } catch (error) {
        console.error(`Error reading vx.config.json: ${error.message}`);
        console.error(`Attempted to read from: ${configPath}`);
        process.exit(1);
    }
}