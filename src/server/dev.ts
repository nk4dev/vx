// local development server for vx-sdk
import { createServer } from 'http';
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider();

// Helper functions to parse command-line arguments
function getArgValue(args: string[], flag: string): string | undefined {
    const index = args.indexOf(flag);
    if (index !== -1 && index + 1 < args.length) {
        return args[index + 1];
    }
    return undefined;
}

function hasFlag(args: string[], flag: string): boolean {
    return args.includes(flag);
}

interface ServerOptions {
    host: string;
    port: number | string;
    chains?: [
        {
            name: string;
            chaiId: number;
            rpcUrl: string;
        }
    ];
    env?: string;
    debug?: boolean;
    displaylogs?: boolean;
}

function localWebViewBuilder({ blocknum }: { blocknum?: number }) {
    // This function can be used to build a local web view with the provided block number
    return `<html>
        <head>
            <title>VX Local Web View</title>
        </head>
        <style>
            * { 
                padding: 0; 
                margin: 0; 
                font-family: Noto Sans, sans-serif;
                box-sizing: border-box;    
            }

            code {
                background-color: #f4f4f4;
                border-radius: 5px;
                display: block;
            }

            pre {
                background-color: #f4f4f4;
                left: 0;
                }
        </style>
        <body>
            <h1 style="text-align: center; color: #333;">VX SDK Local Web View</h1>
            <h2>Block Number: ${blocknum}</h2>
            <p>This is a local web view for VX SDK.</p>
            <a href="https://vx.varius.technology" target="_">Docs</a>
            <h2>API sample</h2>
            <code>
                <pre>
            {
                "blockNumber": ${blocknum},
                "status": "success"
            }
                </pre>
            </code>
        </body>
    </html>`;
}

export default function localServer(options?: Partial<ServerOptions>) {
    // Parse command line arguments
    const args = process.argv.slice(2);

    // Extract options from command line arguments or use provided options
    const host = getArgValue(args, '--host') || options?.host || '127.0.0.1';
    const port = getArgValue(args, '--port') || options?.port || '3000';

    // Parse chains if provided
    const chainsArg = getArgValue(args, '--chains');
    const chains = chainsArg ? JSON.parse(chainsArg) : options?.chains;

    // Parse other flags
    const env = getArgValue(args, '--env') || options?.env || 'development';
    const debug = hasFlag(args, '--debug') || options?.debug || false;
    const displaylogs = hasFlag(args, '--logs') || options?.displaylogs || false;

    const server = createServer((req, res) => {
        // Handle /api endpoint
        try {
            if (req.url === '/api' && req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Welcome to the VX SDK API', status: 'success' }));
            } else if (req.url === "/api/") {
                // Handle /api/ endpoint
                res.writeHead(301, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Redirecting to /api', status: 'redirect' }));
            } else if (req.url === '/debug') {
                // Handle /debug endpoint
                let blognum = 0;
                provider.getBlockNumber().then((blockNumber) => {
                    blognum = blockNumber;
                }).catch(() => {
                    console.error('! Error fetching block number...');
                });
                res.writeHead(200, { 'Content-Type': 'text/html' });
                const htmlContent = localWebViewBuilder({ blocknum: blognum });
                res.end(htmlContent);
                res.end()
            } else {
                // Default response for all other requests
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end("not found api endpoint....\n");
            }
        } catch (error) {
            console.error('Error handling request:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Internal Server Error', status: 'error' }));
        }
    });

    // Ensure PORT is a valid number, default to 3000 if not
    const portNumber = isNaN(Number(port)) ? 3000 : Number(port);

    server.listen(portNumber, host, () => {
        if (debug) {
            console.log(`Server on http://${host}:${portNumber}/ with debug mode \n debug view -> http://${host}:${portNumber}/debug`);
            if (chains) {
                console.log('Available chains:', chains);
            }
            console.log('Environment:', env);
        } else if (displaylogs) {
            console.log(`Server on http://${host}:${portNumber}`);
        } else {
            return;
        }
    });
    server.on('error', (err) => {
        console.error('Server error:', err);
        process.exit(1);
    });


    if (server.listening) {
        console.log('already server is running');
    }

}

