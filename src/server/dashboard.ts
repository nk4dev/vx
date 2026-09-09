import { createServer, type Server } from 'http';
import { getBlockNumber, getGasFees } from '../core/data';
import { getRpcUrl } from '../core/contract';
import { loadVxConfig } from '../core/config';
import { SseHub, startRpcPolling } from './sse';
import dashViewBuilder from './dashview';

interface DashboardOptions {
  host: string;
  port: number;
  open?: boolean;
}

function addCors(res: import('http').ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
}

function readRpcList(): Array<Record<string, unknown>> {
  try {
    return loadVxConfig({ optional: true }) as Array<Record<string, unknown>>;
  } catch {
    // malformed config — behave as if there is none
    return [];
  }
}

export function startDashboard({
  host,
  port,
  open,
}: DashboardOptions): Server {
  let rpcUrl: string | undefined;
  try { rpcUrl = getRpcUrl(); } catch { /* no config */ }

  const sseHub = new SseHub();
  let stopPolling: (() => void) | undefined;
  const resolveRpc = () => {
    if (rpcUrl) return rpcUrl;
    try {
      return getRpcUrl();
    } catch {
      return undefined;
    }
  };

  const server = createServer(async (req, res) => {
    const url = req.url?.split('?')[0] ?? '/';

    // Dashboard HTML
    if (url === '/' && req.method === 'GET') {
      addCors(res);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      const rpcList = readRpcList();
      res.end(dashViewBuilder({ host, port, rpcList, rpcUrl }));
      return;
    }

    // SSE
    if (url === '/events' && req.method === 'GET') {
      sseHub.add(res);
      if (!stopPolling) {
        stopPolling = startRpcPolling(sseHub, resolveRpc, {
          intervalMs: 4000,
          gas: true,
        });
      }
      return;
    }

    // API: status
    if (url === '/api/status' && req.method === 'GET') {
      addCors(res);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        server: `http://${host}:${port}`,
        rpc: rpcUrl || null,
        rpcCount: readRpcList().length,
      }));
      return;
    }

    // API: block
    if (url === '/api/block' && req.method === 'GET') {
      addCors(res);
      try {
        const u = rpcUrl || getRpcUrl();
        if (!u) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'no rpc configured' })); return; }
        const blockNumber = await getBlockNumber(u);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ blockNumber }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: (err as Error).message }));
      }
      return;
    }

    // API: gas
    if (url === '/api/gas' && req.method === 'GET') {
      addCors(res);
      try {
        const u = rpcUrl || getRpcUrl();
        if (!u) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'no rpc configured' })); return; }
        const gas = await getGasFees(u);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(gas));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: (err as Error).message }));
      }
      return;
    }

    // API: rpc list
    if (url === '/api/rpc' && req.method === 'GET') {
      addCors(res);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ rpc: rpcUrl || null, list: readRpcList() }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  });

  server.on('error', (err) => {
    console.error(`Dashboard error: ${err.message}`);
    process.exitCode = 1;
  });
  server.on('close', () => stopPolling?.());

  server.listen(port, host, () => {
    const dashUrl = `http://${host}:${port}`;
    console.log(`\n  VX3 Dashboard\n`);
    console.log(`  Local:   ${dashUrl}`);
    if (rpcUrl) console.log(`  RPC:     ${rpcUrl}`);
    console.log(`\n  Press Ctrl+C to stop\n`);

    if (open) {
      // Use spawn with an argv array (no shell) so dashUrl can never be
      // interpreted as shell syntax, even if --host/--port were crafted.
      import('child_process')
        .then(({ spawn }) => {
          const child =
            process.platform === 'win32'
              ? spawn('cmd', ['/c', 'start', '', dashUrl], { stdio: 'ignore', detached: true })
              : spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [dashUrl], {
                  stdio: 'ignore',
                  detached: true,
                });
          child.unref();
        })
        .catch(() => {});
    }
  });

  return server;
}
