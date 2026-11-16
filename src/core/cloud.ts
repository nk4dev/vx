import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export const DEFAULT_CLOUD_SERVER_URL = 'http://localhost:3000';

export interface CloudCredentials {
  serverUrl: string;
  cookie: string;
  email: string;
  userId?: string;
  savedAt: string;
}

export interface CloudProjectMetadataInput {
  icon: string;
  description: string;
}

export interface SyncProjectInput {
  projectName: string;
  ownerName: string;
  ownerEmail: string;
  metadata?: CloudProjectMetadataInput[];
  serverUrl?: string;
  fetchFn?: typeof fetch;
}

export interface LoginInput {
  serverUrl?: string;
  email: string;
  password: string;
  fetchFn?: typeof fetch;
}

export class VxCloudError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VxCloudError';
  }
}

export function getVx3HomeDir(): string {
  const override = process.env.VX3_HOME?.trim();
  if (override) return path.resolve(override);
  return path.join(os.homedir(), '.vx3');
}

export function getCredentialsPath(): string {
  return path.join(getVx3HomeDir(), 'credentials.json');
}

export function normalizeServerUrl(url?: string): string {
  const raw = (url || process.env.VX3_SERVER_URL || DEFAULT_CLOUD_SERVER_URL).trim();
  return raw.replace(/\/+$/, '');
}

export function saveCloudCredentials(creds: CloudCredentials): string {
  const filePath = getCredentialsPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(creds, null, 2) + '\n', {
    encoding: 'utf-8',
    mode: 0o600,
  });
  return filePath;
}

export function loadCloudCredentials(): CloudCredentials | null {
  const filePath = getCredentialsPath();
  if (!fs.existsSync(filePath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Partial<CloudCredentials>;
    if (!parsed || typeof parsed.serverUrl !== 'string' || typeof parsed.cookie !== 'string') {
      throw new VxCloudError(`Invalid credentials file at ${filePath}`);
    }
    return parsed as CloudCredentials;
  } catch (err) {
    if (err instanceof VxCloudError) throw err;
    throw new VxCloudError(`Failed to read credentials file at ${filePath}: ${(err as Error).message}`);
  }
}

export function clearCloudCredentials(): boolean {
  const filePath = getCredentialsPath();
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

function extractCookieHeader(headers: Headers): string {
  const maybeGetSetCookie = (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
  const rawCookies: string[] =
    typeof maybeGetSetCookie === 'function'
      ? maybeGetSetCookie.call(headers)
      : headers.get('set-cookie')
        ? [headers.get('set-cookie') as string]
        : [];

  return rawCookies
    .map((entry) => entry.split(';')[0]?.trim())
    .filter((pair): pair is string => Boolean(pair))
    .join('; ');
}

export async function loginToCloud(input: LoginInput): Promise<CloudCredentials> {
  const serverUrl = normalizeServerUrl(input.serverUrl);
  const fetchImpl = input.fetchFn ?? fetch;

  const res = await fetchImpl(`${serverUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new VxCloudError(
      `Cloud login failed (${res.status} ${res.statusText})${body ? `: ${body}` : ''}`
    );
  }

  const cookie = extractCookieHeader(res.headers);
  if (!cookie) {
    throw new VxCloudError('Cloud login succeeded but server did not return a session cookie.');
  }

  let userId: string | undefined;
  try {
    const data = (await res.json()) as { user?: { id?: string } };
    userId = data?.user?.id;
  } catch {
    // Optional JSON payload
  }

  const creds: CloudCredentials = {
    serverUrl,
    cookie,
    email: input.email,
    userId,
    savedAt: new Date().toISOString(),
  };
  saveCloudCredentials(creds);
  return creds;
}

function requireCredentials(serverUrlOverride?: string): { serverUrl: string; creds: CloudCredentials } {
  const creds = loadCloudCredentials();
  if (!creds) {
    throw new VxCloudError('Not logged in to vx3 cloud. Run "vx3 login --email <email> --password <password>" first.');
  }
  const serverUrl = normalizeServerUrl(serverUrlOverride || creds.serverUrl);
  return { serverUrl, creds };
}

export async function syncProjectToCloud(input: SyncProjectInput): Promise<unknown> {
  const { serverUrl, creds } = requireCredentials(input.serverUrl);
  const fetchImpl = input.fetchFn ?? fetch;

  const res = await fetchImpl(`${serverUrl}/trpc/createProject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: creds.cookie,
    },
    body: JSON.stringify({
      projectName: input.projectName,
      ownerName: input.ownerName,
      ownerEmail: input.ownerEmail,
      metadata: input.metadata ?? [],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new VxCloudError(
      `Project sync failed (${res.status} ${res.statusText})${body ? `: ${body}` : ''}`
    );
  }

  const payload = (await res.json()) as { result?: { data?: unknown } };
  return payload?.result?.data ?? payload;
}

export async function fetchCloudProjects(options: { serverUrl?: string; fetchFn?: typeof fetch } = {}): Promise<unknown[]> {
  const { serverUrl, creds } = requireCredentials(options.serverUrl);
  const fetchImpl = options.fetchFn ?? fetch;

  const res = await fetchImpl(`${serverUrl}/trpc/getProjects`, {
    method: 'GET',
    headers: {
      Cookie: creds.cookie,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new VxCloudError(
      `Failed to fetch projects (${res.status} ${res.statusText})${body ? `: ${body}` : ''}`
    );
  }

  const payload = (await res.json()) as { result?: { data?: unknown[] } };
  return payload?.result?.data ?? [];
}
