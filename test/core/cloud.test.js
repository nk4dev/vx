'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  VxCloudError,
  getCredentialsPath,
  saveCloudCredentials,
  loadCloudCredentials,
  clearCloudCredentials,
  loginToCloud,
  syncProjectToCloud,
  fetchCloudProjects,
} = require('../../dist/core/cloud');

describe('core/cloud', () => {
  let tmpHome;
  const origVx3Home = process.env.VX3_HOME;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'vx3-cloud-'));
    process.env.VX3_HOME = tmpHome;
  });

  afterEach(() => {
    if (origVx3Home === undefined) delete process.env.VX3_HOME;
    else process.env.VX3_HOME = origVx3Home;
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it('saves, loads, and clears credentials in VX3_HOME', () => {
    expect(loadCloudCredentials()).toBeNull();
    const savedPath = saveCloudCredentials({
      serverUrl: 'http://localhost:3000',
      cookie: 'better-auth.session_token=abc123',
      email: 'dev@example.com',
      userId: 'user_1',
      savedAt: '2026-11-16T00:00:00.000Z',
    });
    expect(savedPath).toBe(getCredentialsPath());

    const loaded = loadCloudCredentials();
    expect(loaded.email).toBe('dev@example.com');
    expect(loaded.cookie).toBe('better-auth.session_token=abc123');

    expect(clearCloudCredentials()).toBe(true);
    expect(loadCloudCredentials()).toBeNull();
    expect(clearCloudCredentials()).toBe(false);
  });

  it('loginToCloud stores session cookie on 200 OK', async () => {
    const mockFetch = jest.fn(async (url, init) => {
      expect(url).toBe('https://api.vx3.example/api/auth/sign-in/email');
      expect(init.method).toBe('POST');
      return new Response(JSON.stringify({ user: { id: 'u-42' } }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'set-cookie': 'better-auth.session_token=tok999; Path=/; HttpOnly',
        },
      });
    });

    const creds = await loginToCloud({
      serverUrl: 'https://api.vx3.example/',
      email: 'alice@example.com',
      password: 'secret',
      fetchFn: mockFetch,
    });

    expect(creds.serverUrl).toBe('https://api.vx3.example');
    expect(creds.cookie).toBe('better-auth.session_token=tok999');
    expect(creds.userId).toBe('u-42');
    expect(loadCloudCredentials().cookie).toBe('better-auth.session_token=tok999');
  });

  it('loginToCloud throws VxCloudError on HTTP failure', async () => {
    const mockFetch = jest.fn(async () => new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }));

    await expect(
      loginToCloud({
        email: 'alice@example.com',
        password: 'wrong',
        fetchFn: mockFetch,
      })
    ).rejects.toThrow(VxCloudError);
  });

  it('syncProjectToCloud throws when not logged in', async () => {
    await expect(
      syncProjectToCloud({
        projectName: 'my-dapp',
        ownerName: 'alice',
        ownerEmail: 'alice@example.com',
      })
    ).rejects.toThrow(VxCloudError);
  });

  it('syncProjectToCloud and fetchCloudProjects send stored cookie to tRPC endpoints', async () => {
    saveCloudCredentials({
      serverUrl: 'http://localhost:3000',
      cookie: 'better-auth.session_token=tok999',
      email: 'alice@example.com',
      savedAt: '2026-11-16T00:00:00.000Z',
    });

    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: { data: { success: true, project: { id: 'proj_1' } } } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: { data: [{ id: 'proj_1', name: 'my-dapp' }] } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

    const synced = await syncProjectToCloud({
      projectName: 'my-dapp',
      ownerName: 'alice',
      ownerEmail: 'alice@example.com',
      fetchFn: mockFetch,
    });
    expect(synced).toEqual({ success: true, project: { id: 'proj_1' } });
    expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:3000/trpc/createProject');
    expect(mockFetch.mock.calls[0][1].headers.Cookie).toBe('better-auth.session_token=tok999');

    const projects = await fetchCloudProjects({ fetchFn: mockFetch });
    expect(projects).toEqual([{ id: 'proj_1', name: 'my-dapp' }]);
    expect(mockFetch.mock.calls[1][0]).toBe('http://localhost:3000/trpc/getProjects');
  });
});
