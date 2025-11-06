// local development server for vx-sdk
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
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


function localWebViewBuilder({ blognum, host, port, rpcList = [], rpcUrl = '' }) {
    const rpc = rpcUrl || getRpcUrl();
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
                            <div id="vx-block-number" class="text-2xl font-semibold">${blognum}</div>
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
                    <div class="mb-3">
                        <label class="block text-xs text-slate-500">RPC / Chain</label>
                        <select id="vx-rpc-select" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"></select>
                    </div>

                    <div class="mb-3">
                        <button id="vx-refresh" class="px-3 py-2 bg-sky-600 text-white rounded">Manual refresh block</button>
                    </div>

                    <div id="vx-pay-card" class="mt-4 hidden">
                        <h4 class="text-sm font-medium mb-2">Local chain — test payment</h4>
                        <p class="text-xs text-slate-500 mb-2">This will use the server's configured PRIVATE_KEY or a key pasted below. Only enabled for local RPCs.</p>
                        <div class="mb-2">
                            <button id="vx-connect-wallet" class="px-3 py-2 bg-yellow-500 text-white rounded">Connect Wallet</button>
                            <span id="vx-wallet-address" class="ml-2 text-sm text-slate-600"></span>
                        </div>
                        <div class="mb-2 text-xs text-slate-500">Or use server-private-key (env PRIVATE_KEY) for automated tests.</div>
                        <div class="space-y-2">
                            <input id="vx-pay-to" placeholder="to address" class="w-full rounded border px-2 py-1" />
                            <input id="vx-pay-amount" placeholder="amount (ETH) e.g. 0.001" class="w-full rounded border px-2 py-1" />
                            <input id="vx-pay-key" placeholder="(optional) private key (server will use env PRIVATE_KEY if empty)" class="w-full rounded border px-2 py-1 text-xs" />
                            <label class="flex items-center gap-2 text-sm"><input id="vx-use-wallet" type="checkbox" /> <span>Send using connected wallet (MetaMask)</span></label>
                            <div class="flex gap-2">
                                <button id="vx-pay-send" class="px-3 py-2 bg-emerald-600 text-white rounded">Send test payment</button>
                                <div id="vx-pay-status" class="text-sm text-slate-600"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <footer class="max-w-4xl mx-auto px-4 py-6 text-slate-500 text-sm">
            <a class="text-blue-600 hover:underline" href="https://nknighta.me/vx/" target="_blank">Docs</a>
        </footer>
        <script>
            // Embedded RPC list from server
            const VX_RPC_LIST = ${JSON.stringify(rpcList || [])};
            const VX_DEFAULT_RPC = ${JSON.stringify(rpc || '')};

            function renderRpcList() {
                const sel = document.getElementById('vx-rpc-select');
                sel.innerHTML = '';
                // add a default option for the current RPC
                const defaultOpt = document.createElement('option');
                defaultOpt.value = VX_DEFAULT_RPC;
                defaultOpt.textContent = VX_DEFAULT_RPC || 'default';
                sel.appendChild(defaultOpt);
                VX_RPC_LIST.forEach((entry, i) => {
                    const opt = document.createElement('option');
                    // An entry may be a string or object
                    opt.value = (entry && entry.host) ? ((entry.protocol || 'http') + '://' + entry.host + (entry.port ? (':' + entry.port) : '')) : (entry.rpcUrl || String(entry));
                    opt.textContent = opt.value;
                    sel.appendChild(opt);
                });
                sel.value = VX_DEFAULT_RPC || (sel.options[0] && sel.options[0].value);
                updatePayVisibility();
            }

            async function refreshBlockOnce() {
                try {
                    const resp = await fetch('/api/block');
                    if (!resp.ok) return;
                    const json = await resp.json();
                    if (json && typeof json.blockNumber !== 'undefined') {
                        const el = document.getElementById('vx-block-number');
                        if (el) el.textContent = String(json.blockNumber);
                    }
                } catch (e) {
                    console.debug('Failed to fetch block:', e);
                }
            }

            // SSE for realtime updates (push from server)
            function initSse() {
                try {
                    const es = new EventSource('/events');
                    es.addEventListener('block', (ev) => {
                        try {
                            const data = JSON.parse(ev.data);
                            const el = document.getElementById('vx-block-number');
                            if (el && typeof data.blockNumber !== 'undefined') el.textContent = String(data.blockNumber);
                        } catch (e) { console.debug(e); }
                    });
                    es.addEventListener('error', (e) => console.debug('SSE error', e));
                } catch (e) {
                    console.debug('SSE not available', e);
                }
            }

            function isLocalRpcUrl(url) {
                if (!url) return false;
                try {
                    const u = new URL(url);
                    return ['localhost', '127.0.0.1'].includes(u.hostname) || u.port === '8545' || u.port === '8546';
                } catch (e) {
                    return String(url).includes('localhost') || String(url).includes('127.0.0.1');
                }
            }

            function updatePayVisibility() {
                const sel = document.getElementById('vx-rpc-select');
                const payCard = document.getElementById('vx-pay-card');
                if (!sel || !payCard) return;
                const url = sel.value;
                if (isLocalRpcUrl(url)) {
                    payCard.classList.remove('hidden');
                } else {
                    payCard.classList.add('hidden');
                }
            }

            async function sendTestPayment() {
                const to = document.getElementById('vx-pay-to').value;
                const amount = document.getElementById('vx-pay-amount').value;
                const key = document.getElementById('vx-pay-key').value;
                const sel = document.getElementById('vx-rpc-select');
                const rpcUrl = sel ? sel.value : VX_DEFAULT_RPC;
                const status = document.getElementById('vx-pay-status');
                const useWallet = document.getElementById('vx-use-wallet') ? document.getElementById('vx-use-wallet').checked : false;
                status.textContent = 'sending...';
                try {
                    // If user selected to use connected wallet and provider exists, send via injected provider
                    if (useWallet && window.ethereum && window.ethereum.request) {
                        // ensure wallet is connected
                        const addrEl = document.getElementById('vx-wallet-address');
                        const from = addrEl && addrEl.dataset && addrEl.dataset.addr ? addrEl.dataset.addr : null;
                        if (!from) throw new Error('Wallet not connected');
                        // small helper: convert ETH decimal string to hex wei
                        function toHexWei(amountStr) {
                            const parts = String(amountStr).split('.');
                            const intPart = parts[0] || '0';
                            const decPart = parts[1] || '';
                            const padded = (decPart + '000000000000000000').slice(0,18);
                            const wei = (BigInt(intPart) * 10n ** 18n) + BigInt(padded);
                            return '0x' + wei.toString(16);
                        }
                        const valueHex = toHexWei(amount || '0');
                        const txParams = { from, to, value: valueHex };
                        const txHash = await window.ethereum.request({ method: 'eth_sendTransaction', params: [txParams] });
                        status.textContent = 'tx sent: ' + txHash;
                        return;
                    }

                    // fallback to server-side signing path
                    const resp = await fetch('/api/pay', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ to, amountEth: amount, key: key || undefined, rpcUrl })
                    });
                    const j = await resp.json();
                    if (!resp.ok) throw new Error(j && j.error ? j.error : 'unknown');
                    status.textContent = 'tx: ' + (j.txHash || j.receipt?.transactionHash || 'ok');
                } catch (e) {
                    status.textContent = 'error: ' + (e.message || e);
                }
            }

            document.addEventListener('DOMContentLoaded', () => {
                renderRpcList();
                document.getElementById('vx-refresh').addEventListener('click', () => refreshBlockOnce());
                document.getElementById('vx-rpc-select').addEventListener('change', updatePayVisibility);
                document.getElementById('vx-pay-send').addEventListener('click', sendTestPayment);
                const connectBtn = document.getElementById('vx-connect-wallet');
                const addrEl = document.getElementById('vx-wallet-address');
                if (connectBtn) {
                    connectBtn.addEventListener('click', async () => {
                        try {
                            if (!window.ethereum || !window.ethereum.request) {
                                alert('No injected Ethereum provider found. Please install MetaMask or another wallet.');
                                return;
                            }
                            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                            if (accounts && accounts[0]) {
                                if (addrEl) {
                                    addrEl.textContent = accounts[0];
                                    addrEl.dataset.addr = accounts[0];
                                }
                            }
                        } catch (err) {
                            console.debug('wallet connect failed', err);
                            alert('Wallet connection failed: ' + (err && err.message ? err.message : err));
                        }
                    });
                }
                // populate if already connected
                if (window.ethereum && window.ethereum.selectedAddress) {
                    if (addrEl) {
                        addrEl.textContent = window.ethereum.selectedAddress;
                        addrEl.dataset.addr = window.ethereum.selectedAddress;
                    }
                }
                // update on account changes
                if (window.ethereum && window.ethereum.on) {
                    window.ethereum.on('accountsChanged', (accounts) => {
                        if (addrEl) {
                            addrEl.textContent = (accounts && accounts[0]) ? accounts[0] : '';
                            addrEl.dataset.addr = (accounts && accounts[0]) ? accounts[0] : '';
                        }
                        updatePayVisibility();
                    });
                }
                initSse();
                // initial fetch
                refreshBlockOnce();
            });
        </script>
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
    // Do not fetch block number once at startup; fetch on demand per request for realtime updates
    // bn will be retrieved dynamically from the RPC when /api/block is called
    // Ensure PORT is a valid number, default to 3000 if not
    const portNumber = isNaN(Number(port)) ? 3000 : Number(port);

    const API_ENDTPOINT = ['/api', '/debug'];

    // Setup SSE clients for realtime block pushes
    const sseClients: import('http').ServerResponse[] = [];
    let lastKnownBlock: number | undefined;
    let sseInterval: NodeJS.Timer | undefined;

    const startSseLoop = (rpcUrl: string | undefined) => {
        if (sseInterval) return; // already running
        sseInterval = setInterval(async () => {
            try {
                const url = rpcUrl || getRpcUrl();
                if (!url) return;
                const bn = await getBlockNumber(url);
                if (typeof bn === 'number' && bn !== lastKnownBlock) {
                    lastKnownBlock = bn;
                    const payload = JSON.stringify({ blockNumber: bn });
                    // send to all clients
                    sseClients.forEach((client) => {
                        try {
                            client.write(`event: block\ndata: ${payload}\n\n`);
                        } catch (e) { /* ignore per-client errors */ }
                    });
                }
            } catch (err) {
                // ignore interval errors
            }
        }, 2000);
    };

    const server = createServer((req, res) => {
        // Handle /api endpoint
        if (req.url === '/api' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Welcome to the VX SDK API', status: 'success' }));
        } else if (req.url === "/api/") {
            // Handle /api/ endpoint
            res.writeHead(301, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Redirecting to /api', status: 'redirect' }));
        } else if (req.url === "/api/block") {
            // Handle /api/block endpoint - fetch latest block number dynamically
            (async () => {
                try {
                    const rpcUrl = rpc || getRpcUrl();
                    if (!rpcUrl) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'rpcUrl not configured. Provide rpcUrl in body or create vx.config.json' }));
                        return;
                    }
                    const blockNumber = await getBlockNumber(rpcUrl);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ blockNumber }));
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: (err as Error).message }));
                }
            })();
        } else if (req.url === '/events') {
            // SSE endpoint for realtime events
            const headers = {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
                'Access-Control-Allow-Origin': '*',
            };
            res.writeHead(200, headers);
            res.write('\n');
            sseClients.push(res);
            // start loop that polls block number and emits events
            startSseLoop(rpc || undefined);
            req.on('close', () => {
                const idx = sseClients.indexOf(res);
                if (idx >= 0) sseClients.splice(idx, 1);
            });
        } else if (req.url === '/debug') {
            // Handle /debug endpoint
            if (debug) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                // read vx.config.json entries (if present) and pass to page
                let rpcList = [];
                try {
                    const cfgPath = join(process.cwd(), 'vx.config.json');
                    if (existsSync(cfgPath)) {
                        const raw = readFileSync(cfgPath, 'utf8');
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) rpcList = parsed;
                    }
                } catch (e) { /* ignore parsing errors */ }
                // Serve debug page with SSE for realtime updates and chain selector
                res.end(localWebViewBuilder({ blognum: 0, host, port: portNumber, rpcList, rpcUrl: rpc }));
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end("Debug mode is off. No debug information available.\n");
            }
        } else if (req.url === '/api/pay' && req.method === 'POST') {
            // accept JSON body: { to, amountEth, rpcUrl?, key? }
            const chunks: Uint8Array[] = [];
            req.on('data', (chunk) => chunks.push(chunk));
            req.on('end', async () => {
                try {
                    const body = Buffer.concat(chunks).toString('utf8');
                    const data = body ? JSON.parse(body) : {};
                    const to = data.to;
                    const amountEth = data.amountEth || data.amount;
                    const rpcUrl = data.rpcUrl || rpc;
                    const privateKey = data.key || process.env.PRIVATE_KEY;

                    if (!to || !amountEth) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'to and amountEth are required' }));
                        return;
                    }
                    if (!rpcUrl) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'rpcUrl not configured. Provide rpcUrl in body or create vx.config.json' }));
                        return;
                    }
                    if (!privateKey) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'private key not provided. Set PRIVATE_KEY env or pass key in request body' }));
                        return;
                    }

                    const result = await sendPayment({ rpcUrl, privateKey, to, amountEth: String(amountEth) });
                    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                    res.end(JSON.stringify({ txHash: result.txHash, receipt: result.receipt }));
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: (err as Error).message }));
                }
            });
        } else {
            // Default response for all other requests
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("not found api endpoint....\n");
        }
    });

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

