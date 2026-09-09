// vx3 api — local helper API server.
//
// This does NOT run an EVM. It exposes a small HTTP API (/api/block, /api/gas,
// /api/pay, SSE /events) that proxies to the RPC configured in vx.config.json,
// plus a set of deterministic dev accounts for convenience.
import { createServer } from 'http';
import { ethers } from 'ethers';
import { getBlockNumber } from '../core/data';
import { getRpcUrl } from '../core/contract';
import { loadVxConfig } from '../core/config';
import { sendPayment } from '../payment/index';
import localWebViewBuilder from './webview';

// Hardhat-compatible dev mnemonic (public, never use for real funds)
const DEV_MNEMONIC =
  'test test test test test test test test test test test junk';
const DEV_ACCOUNT_COUNT = 10;
const DEV_BALANCE_ETH = '10000.0';

function generateDevAccounts(): { address: string; privateKey: string }[] {
  const accounts: { address: string; privateKey: string }[] = [];
  for (let i = 0; i < DEV_ACCOUNT_COUNT; i++) {
    const wallet = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(DEV_MNEMONIC),
      `m/44'/60'/0'/0/${i}`
    );
    accounts.push({ address: wallet.address, privateKey: wallet.privateKey });
  }
  return accounts;
}

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
  /** Suppress the startup banner (useful for tests / embedding). */
  quiet?: boolean;
}

export default function localServer(options?: Partial<ServerOptions>) {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // Extract options from command line arguments or use provided options.
  // Note: `port` may legitimately be 0 (ask the OS for a free port), so fall
  // through on undefined rather than on falsiness.
  const argHost = getArgValue(args, '--host');
  const argPort = getArgValue(args, '--port');
  const host = argHost ?? options?.host ?? '127.0.0.1';
  const port = argPort ?? options?.port ?? '8545';

  // Parse chains if provided
  const chainsArg = getArgValue(args, '--chains');
  let chains = options?.chains;
  if (chainsArg) {
    try {
      chains = JSON.parse(chainsArg);
    } catch (e) {
      console.error(`--chains: invalid JSON (${(e as Error).message}); ignored`);
    }
  }

  // Parse other flags
  const env = getArgValue(args, '--env') || options?.env || 'development';
  const debug = hasFlag(args, '--debug') || options?.debug || false;
  const displaylogs = hasFlag(args, '--logs') || options?.displaylogs || false;
  const quiet = options?.quiet ?? false;

  // Resolve RPC and block-number lazily to avoid requiring vx.config.json at import time
  let rpc: string | undefined;
  try {
    rpc = getRpcUrl();
  } catch (e) {
    // vx.config.json missing — endpoints that need RPC will handle the error per-request
  }

  // Ensure PORT is a valid number, default to 8545 if not
  const portNumber = isNaN(Number(port)) ? 8545 : Number(port);

  // Generate dev accounts once at startup
  const devAccounts = generateDevAccounts();

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
        console.log('!error!' + (err as Error).message);
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
        let rpcList: unknown[] = [];
        try {
          rpcList = loadVxConfig({ optional: true });
        } catch (err) {
          /* malformed config — serve the page without an RPC list */
          console.error(`vx.config.json: ${(err as Error).message}`);
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
    } else if (req.url === '/api/accounts' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(
        JSON.stringify(
          devAccounts.map((a) => ({
            address: a.address,
            balance: DEV_BALANCE_ETH,
          }))
        )
      );
    } else if (req.url === '/api/pay' && req.method === 'POST') {
      // Reject cross-origin requests to this state-changing endpoint: a page on
      // another origin (or a DNS-rebound attacker host) could otherwise POST
      // here and move funds without ever needing to read the response.
      const origin = req.headers.origin;
      const sameOrigin =
        !origin ||
        origin === `http://${host}:${portNumber}` ||
        origin === `https://${host}:${portNumber}`;
      if (!sameOrigin) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'cross-origin requests are not allowed' }));
        return;
      }

      // accept JSON body: { to, amountEth, rpcUrl? }
      // NOTE: a private key is never accepted from the request body — only the
      // server-side PRIVATE_KEY env var or a generated dev account may sign.
      const chunks: Uint8Array[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          const data = body ? JSON.parse(body) : {};
          const to = data.to;
          const amountEth = data.amountEth || data.amount;
          const rpcUrl = data.rpcUrl || rpc;
          const privateKey = process.env.PRIVATE_KEY || devAccounts[0].privateKey;

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

          const result = await sendPayment({
            rpcUrl,
            privateKey,
            to,
            amountEth: String(amountEth),
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
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
    if (quiet) return;
    console.log('\nvx3 api  —  local helper API server');
    console.log('==================================');
    console.log('\nThis server does not run an EVM. It proxies /api/block,');
    console.log('/api/gas and /api/pay to the RPC configured in vx.config.json.');
    console.log('\nDeterministic dev accounts (Hardhat "test junk" mnemonic)');
    console.log('========================================================');
    console.log('These are only funded when your configured RPC is itself a');
    console.log('fresh Hardhat/Anvil node — this process does not fund them.');
    devAccounts.forEach((a, i) => {
      console.log(`(${i}) ${a.address}`);
    });
    console.log('\nPrivate Keys');
    console.log('============');
    devAccounts.forEach((a, i) => {
      console.log(`(${i}) ${a.privateKey}`);
    });
    console.log('\nMnemonic');
    console.log('========');
    console.log(DEV_MNEMONIC);
    console.log('\nListening on');
    console.log('============');
    console.log(`http://${host}:${portNumber}`);
    if (rpc) console.log(`RPC (proxy target): ${rpc}`);
    else console.log('RPC: not configured — run "vx3 rpc init"');
    if (debug) {
      console.log(`Debug: http://${host}:${portNumber}/debug`);
      if (chains) console.log('Chains:', JSON.stringify(chains));
      console.log('Env:', env);
    }
    console.log('\nAccounts endpoint: GET /api/accounts');
    console.log('WARNING: Do not use these dev keys on a public network!\n');
  });
  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  return server;
}
