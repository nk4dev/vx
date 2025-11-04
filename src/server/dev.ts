// local development server for vx-sdk
import { createServer } from 'http';
import { getBlockNumber } from '../core/data';
import { getRpcUrl } from '../core/contract';
import { sendPayment } from '../payment/index';

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


function localWebViewBuilder({ blognum, host, port }) {
    const rpc = getRpcUrl();
    // TailwindCSS-powered, cleaner debug UI
    return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>VX SDK — Debug</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-50 text-slate-900">
        <header class="bg-slate-900 text-white">
            <div class="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                <h1 class="text-lg font-semibold">VX SDK Debug</h1>
                <nav class="ml-auto text-sm opacity-90">
                    <a class="hover:underline" href="/api">/api</a>
                    <span class="px-2">·</span>
                    <a class="hover:underline" href="/api/block">/api/block</a>
                </nav>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 py-6">
            <section class="mb-6">
                <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-base font-medium">Server</h2>
                            <p class="text-slate-500 text-sm">http://${host}:${port}</p>
                            <p class="text-slate-500 text-sm">Current Rpc URL: <code>${rpc}</code></p>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-semibold">${blognum}</div>
                            <div class="text-slate-500 text-xs">latest block</div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 class="font-medium mb-3">Endpoints</h3>
                    <ul class="text-sm space-y-2">
                        <li><a class="text-blue-600 hover:underline" href="/api">GET /api</a></li>
                        <li><a class="text-blue-600 hover:underline" href="/api/block">GET /api/block</a></li>
                    </ul>
                </div>

                <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 class="font-medium mb-3">Usage</h3>
<pre class="text-xs bg-slate-900 text-slate-100 rounded-lg p-3 overflow-auto"><code>....</code></pre>
                </div>
            </section>
        </main>

        <footer class="max-w-4xl mx-auto px-4 py-6 text-slate-500 text-sm">
            <a class="text-blue-600 hover:underline" href="https://vx.varius.technology" target="_blank">Docs</a>
        </footer>
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

    // Resolve RPC and block-number lazily to avoid requiring vx.config.json at import time
    let rpc: string | undefined;
    try {
        rpc = getRpcUrl();
        if (rpc) console.log(`Using RPC URL: ${rpc}`);
    } catch (e) {
        // If vx.config.json is missing, log and continue — server endpoints that need RPC will handle errors
        if (options?.debug) console.warn('RPC config not found; some endpoints may fail until vx.config.json is created.');
    }
    const bn = rpc ? getBlockNumber(rpc) : Promise.resolve(0);

    const API_ENDTPOINT = ['/api', '/debug'];

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
                // Use the previously-created bn Promise (getBlockNumber(rpc) or Promise.resolve(0))
                bn.then((blockNumber) => {
                    const blognum = blockNumber;
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    const htmlContent = localWebViewBuilder({ blognum, host, port });
                    res.end(htmlContent);
                }).catch((error) => {
                    console.error('! Error fetching block number...', error);
                    const blognum = 0;
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    const htmlContent = localWebViewBuilder({ blognum, host, port });
                    res.end(htmlContent);
                });
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
            console.log(`Server on http://${host}:${portNumber} with debug mode`);
            console.log(`http://${host}:${portNumber}/debug`);
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

