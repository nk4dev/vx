'use strict';

const {
  fetchGasFeeData,
  DEFAULT_BROWSER_RPC_URL,
} = require('../../dist/front_api/gas');

describe('fetchGasFeeData (browser-safe gas helper)', () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalWindow === undefined) {
      delete global.window;
    } else {
      global.window = originalWindow;
    }
  });

  it('posts eth_getBlockByNumber to an explicit rpcUrl and classifies congestion', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          baseFeePerGas: '0x3b9aca00', // 1 Gwei
          number: '0x2a', // 42
        },
      }),
    });
    global.fetch = mockFetch;

    const data = await fetchGasFeeData('https://rpc.example.com');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://rpc.example.com');
    expect(JSON.parse(init.body)).toMatchObject({
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: ['latest', false],
    });
    expect(data).toEqual({
      baseFeeGwei: '1.00',
      priorityFeeGwei: '1.50',
      totalGwei: '2.50',
      congestion: 'low',
      blockNumber: 42,
    });
  });

  it('classifies medium and high congestion thresholds accurately', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: { baseFeePerGas: '0x4a817c800', number: '0x1' }, // 20 Gwei -> total 21.50
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: { baseFeePerGas: '0x9502f9000', number: '0x2' }, // 40 Gwei -> total 41.50
        }),
      });

    const medium = await fetchGasFeeData('http://localhost:8545');
    expect(medium.congestion).toBe('medium');

    const high = await fetchGasFeeData('http://localhost:8545');
    expect(high.congestion).toBe('high');
  });

  it('uses window.ethereum when rpcUrl is omitted in browser environments', async () => {
    const mockFetch = jest.fn();
    global.fetch = mockFetch;
    const mockRequest = jest.fn().mockResolvedValue({
      baseFeePerGas: '0x77359400', // 2 Gwei
      number: '0x10',
    });
    global.window = { ethereum: { request: mockRequest } };

    const data = await fetchGasFeeData();
    expect(mockRequest).toHaveBeenCalledWith({
      method: 'eth_getBlockByNumber',
      params: ['latest', false],
    });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(data).toEqual({
      baseFeeGwei: '2.00',
      priorityFeeGwei: '1.50',
      totalGwei: '3.50',
      congestion: 'low',
      blockNumber: 16,
    });
  });

  it('falls back to DEFAULT_BROWSER_RPC_URL when rpcUrl and window.ethereum are absent', async () => {
    delete global.window;
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: { number: '0x5' },
      }),
    });
    global.fetch = mockFetch;

    const data = await fetchGasFeeData();
    expect(mockFetch.mock.calls[0][0]).toBe(DEFAULT_BROWSER_RPC_URL);
    expect(data).toEqual({
      baseFeeGwei: '15.00',
      priorityFeeGwei: '1.50',
      totalGwei: '16.50',
      congestion: 'low',
      blockNumber: 5,
    });
  });

  it('propagates HTTP and JSON-RPC errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    await expect(fetchGasFeeData('http://localhost:8545')).rejects.toThrow(
      'RPC HTTP error: 503'
    );

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: { message: 'Method not found' } }),
    });
    await expect(fetchGasFeeData('http://localhost:8545')).rejects.toThrow(
      'Method not found'
    );
  });
});
