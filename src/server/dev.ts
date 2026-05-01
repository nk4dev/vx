// local development server for vx-sdk
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getBlockNumber } from '../core/data';
import { getRpcUrl } from '../core/contract';
import { sendPayment } from '../payment/index';
import localWebViewBuilder from './webview';

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
        console.log('!error!' + err.message);
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
        } catch (err) {
          /* ignore parsing errors */
          console.log('!error!' + err.message);
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
