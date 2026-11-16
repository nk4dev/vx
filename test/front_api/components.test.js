const reactApi = require('../../dist/front_api/react');
const vueApi = require('../../dist/front_api/vue');
const rootApi = require('../../dist/index');

describe('vx3/react exports', () => {
  test('exports components', () => {
    expect(typeof reactApi.ConnectWallet).toBe('function');
    expect(typeof reactApi.GasTracker).toBe('function');
    expect(typeof reactApi.NFTMinter).toBe('function');
    expect(typeof reactApi.SendPayment).toBe('function');
    expect(typeof reactApi.Payment).toBe('function');
  });

  test('exports hooks', () => {
    expect(typeof reactApi.useWallet).toBe('function');
    expect(typeof reactApi.useGasTracker).toBe('function');
    expect(typeof reactApi.usePayment).toBe('function');
    expect(typeof reactApi.usePaymentStatus).toBe('function');
    expect(typeof reactApi.usePaymentDialog).toBe('function');
  });
});

describe('vx3/vue exports', () => {
  test('exports components', () => {
    expect(typeof vueApi.ConnectWallet).toBe('object'); // defineComponent returns object with setup or render
    expect(typeof vueApi.GasTracker).toBe('object');
    expect(typeof vueApi.NFTMinter).toBe('object');
    expect(typeof vueApi.SendPayment).toBe('object');
  });

  test('exports composables', () => {
    expect(typeof vueApi.useWallet).toBe('function');
    expect(typeof vueApi.useGasTracker).toBe('function');
  });
});

describe('vx3 root exports', () => {
  test('lazy exports for React components work', () => {
    expect(typeof rootApi.ConnectWallet).toBe('function');
    expect(typeof rootApi.GasTracker).toBe('function');
    expect(typeof rootApi.NFTMinter).toBe('function');
    expect(typeof rootApi.SendPayment).toBe('function');
    expect(typeof rootApi.useWallet).toBe('function');
    expect(typeof rootApi.useGasTracker).toBe('function');
  });
});
