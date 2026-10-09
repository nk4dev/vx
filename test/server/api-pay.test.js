'use strict';

const http = require('http');

// Mock the payment module so no real transaction is ever attempted and we can
// inspect exactly what the /api/pay route passes to sendPayment().
jest.mock('../../dist/payment/index', () => ({
  __esModule: true,
  default: {},
  sendPayment: jest.fn().mockResolvedValue({
    txHash: '0xtxhash',
    receipt: { blockNumber: 7 },
  }),
}));

const { sendPayment } = require('../../dist/payment/index');
const localServer = require('../../dist/server/dev').default;

const ATTACKER_KEY = '0x' + 'e'.repeat(64);

function request(server, { method = 'GET', path = '/', headers = {}, body } = {}) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port, method, path, headers },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let json;
          try {
            json = JSON.parse(data);
          } catch {
            json = data;
          }
          resolve({ status: res.statusCode, body: json });
        });
      }
    );
    req.on('error', reject);
    if (body !== undefined) req.end(typeof body === 'string' ? body : JSON.stringify(body));
    else req.end();
  });
}

describe('vx3 api — POST /api/pay', () => {
  let server;

  beforeEach((done) => {
    sendPayment.mockClear();
    server = localServer({ host: '127.0.0.1', port: 0, quiet: true });
    server.on('listening', done);
  });

  afterEach((done) => {
    server.close(done);
  });

  it('never signs with a private key taken from the request body', async () => {
    const res = await request(server, {
      method: 'POST',
      path: '/api/pay',
      headers: { 'Content-Type': 'application/json' },
      body: {
        to: '0x' + '1'.repeat(40),
        amountEth: '0.01',
        rpcUrl: 'http://127.0.0.1:8545',
        privateKey: ATTACKER_KEY,
      },
    });

    expect(res.status).toBe(200);
    expect(sendPayment).toHaveBeenCalledTimes(1);
    expect(sendPayment.mock.calls[0][0].privateKey).not.toBe(ATTACKER_KEY);
    // Falls back to the first deterministic dev account.
    expect(sendPayment.mock.calls[0][0].privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it('rejects a cross-origin request without calling sendPayment', async () => {
    const res = await request(server, {
      method: 'POST',
      path: '/api/pay',
      headers: { 'Content-Type': 'application/json', Origin: 'http://evil.example' },
      body: { to: '0x' + '1'.repeat(40), amountEth: '0.01', rpcUrl: 'http://127.0.0.1:8545' },
    });

    expect(res.status).toBe(403);
    expect(sendPayment).not.toHaveBeenCalled();
  });

  it('tells the caller how to allow a rejected origin', async () => {
    const res = await request(server, {
      method: 'POST',
      path: '/api/pay',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: { to: '0x' + '1'.repeat(40), amountEth: '0.01', rpcUrl: 'http://127.0.0.1:8545' },
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/--allow-origin http:\/\/localhost:5173/);
    expect(sendPayment).not.toHaveBeenCalled();
  });

  it.each(['127.0.0.1', 'localhost'])(
    'accepts its own origin via the %s loopback alias',
    async (alias) => {
      const res = await request(server, {
        method: 'POST',
        path: '/api/pay',
        headers: {
          'Content-Type': 'application/json',
          Origin: `http://${alias}:${server.address().port}`,
        },
        body: { to: '0x' + '1'.repeat(40), amountEth: '0.01', rpcUrl: 'http://127.0.0.1:8545' },
      });

      expect(res.status).toBe(200);
      expect(sendPayment).toHaveBeenCalledTimes(1);
    }
  );

  it('returns 400 when "to" / "amountEth" are missing', async () => {
    const res = await request(server, {
      method: 'POST',
      path: '/api/pay',
      headers: { 'Content-Type': 'application/json' },
      body: { rpcUrl: 'http://127.0.0.1:8545' },
    });

    expect(res.status).toBe(400);
    expect(sendPayment).not.toHaveBeenCalled();
  });

  it('forwards the tx hash on success', async () => {
    const res = await request(server, {
      method: 'POST',
      path: '/api/pay',
      headers: { 'Content-Type': 'application/json' },
      body: { to: '0x' + '1'.repeat(40), amountEth: '0.5', rpcUrl: 'http://127.0.0.1:8545' },
    });

    expect(res.status).toBe(200);
    expect(res.body.txHash).toBe('0xtxhash');
    expect(sendPayment.mock.calls[0][0]).toMatchObject({
      to: '0x' + '1'.repeat(40),
      amountEth: '0.5',
      rpcUrl: 'http://127.0.0.1:8545',
    });
  });
});

describe('vx3 api — allowOrigins', () => {
  let server;
  beforeEach((done) => {
    sendPayment.mockClear();
    server = localServer({
      host: '127.0.0.1',
      port: 0,
      quiet: true,
      allowOrigins: ['http://localhost:5173'],
    });
    server.on('listening', done);
  });
  afterEach((done) => {
    server.close(done);
  });

  const pay = (origin) =>
    request(server, {
      method: 'POST',
      path: '/api/pay',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: { to: '0x' + '1'.repeat(40), amountEth: '0.01', rpcUrl: 'http://127.0.0.1:8545' },
    });

  it('accepts an explicitly allowed origin', async () => {
    expect((await pay('http://localhost:5173')).status).toBe(200);
    expect(sendPayment).toHaveBeenCalledTimes(1);
  });

  it('still rejects every other origin', async () => {
    expect((await pay('http://localhost:5174')).status).toBe(403);
    expect((await pay('http://evil.example')).status).toBe(403);
    expect(sendPayment).not.toHaveBeenCalled();
  });
});

describe('isAllowedOrigin()', () => {
  const { isAllowedOrigin } = require('../../dist/server/dev');

  it.each([
    [undefined, true],
    ['http://127.0.0.1:8600', true],
    ['http://localhost:8600', true],
    ['http://[::1]:8600', true],
    ['http://localhost:5173', false],
    ['http://evil.example:8600', false],
    ['http://evil.example', false],
    ['not a url', false],
    ['null', false],
  ])('origin %p on 127.0.0.1:8600 → %p', (origin, expected) => {
    expect(isAllowedOrigin(origin, '127.0.0.1', 8600)).toBe(expected);
  });

  it('does not treat loopback origins as local when bound to another host', () => {
    expect(isAllowedOrigin('http://localhost:8600', '192.168.1.10', 8600)).toBe(false);
    expect(isAllowedOrigin('http://192.168.1.10:8600', '192.168.1.10', 8600)).toBe(true);
  });
});

describe('vx3 api — GET /api/accounts', () => {
  let server;
  beforeEach((done) => {
    server = localServer({ host: '127.0.0.1', port: 0, quiet: true });
    server.on('listening', done);
  });
  afterEach((done) => {
    server.close(done);
  });

  it('lists deterministic dev accounts', async () => {
    const res = await request(server, { path: '/api/accounts' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(10);
    expect(res.body[0].address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});
