import {
  getIpfsEntries,
  loadVxConfig as loadConfig,
  type RpcConfigArray,
} from './config';

export interface IpfsApi {
  host: string;
  port: number;
  protocol: 'http' | 'https';
}

export interface IpfsEntry {
  type: 'ipfs';
  gateway?: string;
  api?: IpfsApi;
}

/**
 * Read vx.config.json (lenient: returns `[]` when missing or malformed).
 * @deprecated prefer `loadVxConfig()` from `core/config`.
 */
export function loadVxConfig(): RpcConfigArray {
  try {
    return loadConfig({ optional: true });
  } catch {
    return [];
  }
}

/** IPFS-looking entries from vx.config.json (never throws). */
export function findIpfsEntries(): IpfsEntry[] {
  try {
    return getIpfsEntries() as IpfsEntry[];
  } catch {
    return [];
  }
}

export async function fetchFromGateway(
  cid: string,
  gatewayUrl: string
): Promise<Uint8Array | string> {
  const url = gatewayUrl.replace(/\/$/, '') + '/ipfs/' + cid;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const contentType = res.headers.get('content-type') || '';
    if (
      contentType.includes('application/json') ||
      contentType.includes('text')
    ) {
      return await res.text();
    }
    // else binary
    const buf = new Uint8Array(await res.arrayBuffer());
    return buf;
  } catch (err) {
    throw new Error(
      `Failed to fetch from gateway ${gatewayUrl}: ${(err as Error).message}`
    );
  }
}

export async function fetchCid(
  cid: string,
  gateway?: string
): Promise<{ source: string; data: string | Uint8Array }> {
  const entries = findIpfsEntries();
  if (gateway) {
    return { source: gateway, data: await fetchFromGateway(cid, gateway) };
  }

  if (entries.length === 0)
    throw new Error('No IPFS gateway configured in vx.config.json');

  // prefer gateway field if present
  const gw = entries.find((e) => e.gateway && e.gateway.length > 0);
  if (gw && gw.gateway)
    return {
      source: gw.gateway,
      data: await fetchFromGateway(cid, gw.gateway),
    };

  // fallback to api entry (construct URL)
  const apiEntry = entries.find((e) => e.api);
  if (apiEntry && apiEntry.api) {
    const api = apiEntry.api;
    const gatewayUrl = `${api.protocol}://${api.host}:${api.port}`;
    return {
      source: gatewayUrl,
      data: await fetchFromGateway(cid, gatewayUrl),
    };
  }

  // If none matched, try first entry's gateway-like field
  const first = entries[0];
  if (first.gateway)
    return {
      source: first.gateway,
      data: await fetchFromGateway(cid, first.gateway),
    };

  throw new Error('No usable IPFS gateway found in vx.config.json');
}
