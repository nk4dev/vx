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
    },
  ];
  env?: string;
  debug?: boolean;
  displaylogs?: boolean;
}

function localWebViewBuilder({
  blognum,
  host,
  port,
  rpcList = [],
  rpcUrl = '',
}) {
  const rpc = rpcUrl || getRpcUrl();
  // Simple CSS-powered debug UI
  return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>VX SDK — Debug</title>
        <style>
            * { box-sizing: border-box; }
            body { margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif; }
            a { color: #2563eb; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .topbar { background: #0f172a; color: #fff; }
            .container { max-width: 960px; margin: 0 auto; padding: 0 16px; }
            .topbar-inner { display: flex; align-items: center; gap: 12px; padding-top: 16px; padding-bottom: 16px; }
            .title { margin: 0; font-size: 18px; font-weight: 600; }
            .nav { margin-left: auto; display: flex; align-items: center; gap: 8px; font-size: 14px; opacity: 0.9; }
            .main-content { padding-top: 24px; padding-bottom: 24px; }
            .section-block { margin-bottom: 24px; }
            .card { border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; padding: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }
            .row-between { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
            .section-heading { margin: 0; font-size: 16px; font-weight: 600; }
            .muted-sm { margin: 4px 0 0; color: #64748b; font-size: 14px; }
            .block-num { font-size: 30px; font-weight: 600; text-align: right; }
            .muted-xs { margin: 4px 0 0; color: #64748b; font-size: 12px; }
            .grid-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
            .card-title { margin: 0 0 12px; font-size: 16px; font-weight: 600; }
            .list { margin: 0; padding-left: 18px; }
            .list li + li { margin-top: 8px; }
            .field { margin-bottom: 12px; }
            .label { display: block; margin-bottom: 4px; color: #64748b; font-size: 12px; }
            .select,
            .input { display: block; width: 100%; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; }
            .input-small { font-size: 12px; }
            .stack > * + * { margin-top: 8px; }
            .inline-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
            .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; }
            .button { border: 0; border-radius: 6px; color: #fff; padding: 8px 12px; cursor: pointer; }
            .button-refresh { background: #0284c7; }
            .button-wallet { background: #eab308; }
            .button-send { background: #059669; }
            .status { color: #475569; font-size: 14px; }
            .wallet-address { color: #475569; font-size: 14px; }
            .hidden { display: none; }
            .footer { padding-top: 24px; padding-bottom: 24px; color: #64748b; font-size: 14px; }
            @media (max-width: 768px) {
                .grid-two { grid-template-columns: 1fr; }
                .block-num { text-align: left; }
            }
        </style>
    </head>
    <body>
        <header class="topbar">
            <div class="container topbar-inner">
                <h1 class="title">VX SDK Debug</h1>
                <nav class="nav">
                    <a href="/api">/api</a>
                    <span>·</span>
                    <a href="/api/block">/api/block</a>
                </nav>
            </div>
        </header>

        <main class="container main-content">
            <section class="section-block">
                <div class="card">
                    <div class="row-between">
                        <div>
                            <h2 class="section-heading">Server</h2>
                            <p class="muted-sm">http://${host}:${port}</p>
                            <p class="muted-sm">Current Rpc URL: <code>${rpc}</code></p>
                        </div>
                        <div>
                            <div id="vx-block-number" class="block-num">${blognum}</div>
                            <div class="muted-xs">latest block</div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="grid-two">
                <div class="card">
                    <h3 class="card-title">Endpoints</h3>
                    <ul class="list">
                        <li><a href="/api">GET /api</a></li>
                        <li><a href="/api/block">GET /api/block</a></li>
                    </ul>
                </div>

                <div class="card">
                    <h3 class="card-title">Usage</h3>
                    <div class="field">
                        <label class="label">RPC / Chain</label>
                        <select id="vx-rpc-select" class="select"></select>
                    </div>

                    <div class="field">
                        <button id="vx-refresh" class="button button-refresh">Manual refresh block</button>
                    </div>

                    <div id="vx-pay-card" class="hidden">
                        <h4 class="card-title">Local chain — test payment</h4>
                        <p class="muted-xs">This will use the server's configured PRIVATE_KEY or a key pasted below. Only enabled for local RPCs.</p>
                        <div class="field inline-row">
                            <button id="vx-connect-wallet" class="button button-wallet">Connect Wallet</button>
                            <span id="vx-wallet-address" class="wallet-address"></span>
                        </div>
                        <div class="muted-xs">Or use server-private-key (env PRIVATE_KEY) for automated tests.</div>
                        <div class="stack">
                            <input id="vx-pay-to" placeholder="to address" class="input" />
                            <input id="vx-pay-amount" placeholder="amount (ETH) e.g. 0.001" class="input" />
                            <input id="vx-pay-key" placeholder="(optional) private key (server will use env PRIVATE_KEY if empty)" class="input input-small" />
                            <label class="checkbox-label"><input id="vx-use-wallet" type="checkbox" /> <span>Send using connected wallet (MetaMask)</span></label>
                            <div class="inline-row">
                                <button id="vx-pay-send" class="button button-send">Send test payment</button>
                                <div id="vx-pay-status" class="status"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <footer class="container footer">
            <a href="https://nknighta.me/vx/" target="_blank">Docs</a>
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
    if (options?.debug)
      console.warn(
        'RPC config not found; some endpoints may fail until vx.config.json is created.'
      );
  }
  // Do not fetch block number once at startup; fetch on demand per request for realtime updates
  // bn will be retrieved dynamically from the RPC when /api/block is called
  // Ensure PORT is a valid number, default to 3000 if not
  const portNumber = isNaN(Number(port)) ? 3000 : Number(port);


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
            } catch (e) {
              /* ignore per-client errors */
            }
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
      res.end(
        JSON.stringify({
          message: 'Welcome to the VX SDK API',
          status: 'success',
        })
      );
    } else if (req.url === '/api/') {
      // Handle /api/ endpoint
      res.writeHead(301, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({ message: 'Redirecting to /api', status: 'redirect' })
      );
    } else if (req.url === '/api/block') {
      // Handle /api/block endpoint - fetch latest block number dynamically
      (async () => {
        try {
          const rpcUrl = rpc || getRpcUrl();
          if (!rpcUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                error:
                  'rpcUrl not configured. Provide rpcUrl in body or create vx.config.json',
              })
            );
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
        } catch (e) {
          /* ignore parsing errors */
        }
        // Serve debug page with SSE for realtime updates and chain selector
        res.end(
          localWebViewBuilder({
            blognum: 0,
            host,
            port: portNumber,
            rpcList,
            rpcUrl: rpc,
          })
        );
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Debug mode is off. No debug information available.\n');
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
            res.end(
              JSON.stringify({
                error:
                  'rpcUrl not configured. Provide rpcUrl in body or create vx.config.json',
              })
            );
            return;
          }
          if (!privateKey) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                error:
                  'private key not provided. Set PRIVATE_KEY env or pass key in request body',
              })
            );
            return;
          }

          const result = await sendPayment({
            rpcUrl,
            privateKey,
            to,
            amountEth: String(amountEth),
          });
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(
            JSON.stringify({ txHash: result.txHash, receipt: result.receipt })
          );
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });
    } else {
      // Default response for all other requests
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('not found api endpoint....\n');
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
