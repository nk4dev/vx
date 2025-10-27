import * as fs from 'fs';
import * as path from 'path';

export function view_rpc_config() {
    const configPath = path.join(process.cwd(), 'vx.config.json');
    if (!fs.existsSync(configPath)) {
        console.error('vx.config.json does not exist. Please run "vx rpc init" to create it.');
        process.exit(1);
    }
    try {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const parsedContent = JSON.parse(configContent);
        const cfg = Array.isArray(parsedContent) ? parsedContent[0] : parsedContent;
        console.log(`RPC : ${cfg.protocol}://${cfg.host}:${cfg.port}`);
        process.exit(0);
    } catch (error) {
        console.error(`Error reading vx.config.json: ${error.message}`);
        console.error(`Attempted to read from: ${configPath}`);
        process.exit(1);
    }
}

export function load_rpc_config(rpcPath?: string) {
    const possiblePaths = [
        path.join(process.cwd(), rpcPath || 'vx.config.json'),
        path.join(process.cwd(), 'packages', 'sdk', 'vx.config.json'),
        path.join(__dirname, '..', '..', 'vx.config.json'),
    ];
    for (const configPath of possiblePaths) {
        try {
            const configContent = fs.readFileSync(configPath, 'utf-8');
            const parsedContent = JSON.parse(configContent);
            return Array.isArray(parsedContent) ? parsedContent[0] : parsedContent;
        } catch (error) {
            // Try next path
        }
    }
    console.error('Error: vx.config.json not found in any of the expected locations:');
    possiblePaths.forEach(p => console.error(`  - ${p}`));
    process.exit(1);
}