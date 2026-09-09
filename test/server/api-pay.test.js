'use strict';

const http = require('http');

// Mock the payment module so no real transaction is ever attempted and we can
// inspect exactly what the /api/pay route passes to sendPayment().
jest.mock('../../dist/src/payment/index', () => ({
  __esModule: true,
  default: {},
  sendPayment: jest.fn().mockResolvedValue({
    txHash: '0xtxhash',
    receipt: { blockNumber: 7 },
  }),
}));

const { sendPayment } = require('../../dist/src/payment/index');
const localServer = require('../../dist/src/server/dev').default;

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
