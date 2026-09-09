// Shared Server-Sent-Events plumbing for `vx3 api` and `vx3 dash`.
import type { ServerResponse } from 'http';
import { getBlockNumber, getGasFees } from '../core/data';

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'Access-Control-Allow-Origin': '*',
} as const;

/** Fan-out hub for SSE clients. */
export class SseHub {
  private clients = new Set<ServerResponse>();

  /** Register a response as an SSE client; auto-removes it when the socket closes. */
  add(res: ServerResponse): void {
    try {
      res.writeHead(200, SSE_HEADERS);
      res.write('\n');
    } catch {
      return; // client already gone
    }
    this.clients.add(res);
    res.on('close', () => this.clients.delete(res));
  }

  get size(): number {
    return this.clients.size;
  }

  /** Write one named event to every connected client. */
  broadcast(event: string, data: unknown): void {
    const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of this.clients) {
      try {
        res.write(frame);
      } catch {
        this.clients.delete(res);
      }
    }
  }
}

export interface RpcPollOptions {
  /** Poll interval in ms (default 4000). */
  intervalMs?: number;
  /** Also poll and broadcast `gas` events (default false). */
  gas?: boolean;
}

/**
 * Poll an RPC for the latest block (and optionally gas fees) and broadcast
 * changes over the hub. Returns a stop function.
 */
export function startRpcPolling(
  hub: SseHub,
  resolveRpcUrl: () => string | undefined,
  options: RpcPollOptions = {}
): () => void {
  const intervalMs = options.intervalMs ?? 4000;
  let lastBlock: number | undefined;

  const timer = setInterval(async () => {
    if (hub.size === 0) return;
    const url = resolveRpcUrl();
    if (!url) return;
    try {
      const bn = await getBlockNumber(url);
      if (typeof bn === 'number' && bn !== lastBlock) {
        lastBlock = bn;
        hub.broadcast('block', { blockNumber: bn });
      }
      if (options.gas) {
        hub.broadcast('gas', await getGasFees(url));
      }
    } catch (err) {
      console.error(`SSE poll error: ${(err as Error).message}`);
    }
  }, intervalMs);

  timer.unref?.();
  return () => clearInterval(timer);
}
