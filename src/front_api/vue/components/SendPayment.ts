import { defineComponent, h, ref, type PropType } from 'vue';
import { getRpcUrl } from '../../../core/contract';
import type { PaymentMode, PaymentResult } from '../../../types/payment';

const styles = {
  root: {
    padding: '1.5rem',
    maxWidth: '28rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    background: '#ffffff',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
  },
  title: { fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' },
  row: { marginBottom: '0.75rem' },
  label: { display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: '#374151' },
  input: {
    width: '100%',
    padding: '0.375rem 0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    boxSizing: 'border-box' as const,
  },
  btn: {
    padding: '0.5rem 1rem',
    color: '#fff',
    backgroundColor: '#059669', // emerald-600
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  success: { marginTop: '1rem', fontSize: '0.875rem', color: '#16a34a' },
  error: { marginTop: '1rem', fontSize: '0.875rem', color: '#dc2626' },
  txHash: {
    wordBreak: 'break-all' as const,
    background: '#f1f5f9',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
  },
};

export const SendPayment = defineComponent({
  name: 'SendPayment',
  props: {
    to: { type: String, default: '' },
    amount: { type: String, default: '0.01' },
    currency: { type: String, default: 'ETH' },
    mode: { type: String as PropType<PaymentMode>, default: 'wallet' },
    apiEndpoint: { type: String, default: '/api/pay' },
    rpcUrl: { type: String, default: '' },
    customClass: { type: String, default: '' },
    customStyle: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  },
  emits: ['success', 'error'],
  setup(props, { emit }) {
    const toAddress = ref(props.to);
    const amountVal = ref(props.amount);
    const currentMode = ref<PaymentMode>(props.mode);
    const loading = ref(false);
    const result = ref<PaymentResult | null>(null);
    const errorMsg = ref<string | null>(null);

    const handleSubmit = async (e: Event) => {
      e.preventDefault();
      loading.value = true;
      errorMsg.value = null;
      result.value = null;

      try {
        if (currentMode.value === 'wallet') {
          const eth = typeof window !== 'undefined' ? (window as any).ethereum : null;
          if (!eth) throw new Error('No Ethereum wallet found');

          const accounts = await eth.request({ method: 'eth_requestAccounts' });
          const from = accounts[0];
          const weiValue = BigInt(Math.floor(parseFloat(amountVal.value) * 1e18)).toString(16);

          const txHash = await eth.request({
            method: 'eth_sendTransaction',
            params: [{ from, to: toAddress.value, value: `0x${weiValue}` }],
          });

          const res: PaymentResult = { txHash };
          result.value = res;
          emit('success', res);
        } else {
          const endpoint = props.apiEndpoint;
          const rpc = props.rpcUrl || getRpcUrl();
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: toAddress.value,
              amountEth: amountVal.value,
              currency: props.currency,
              rpcUrl: rpc,
            }),
          });

          if (!response.ok) throw new Error(`API error: ${response.status}`);
          const data = await response.json();
          const res: PaymentResult = { txHash: data.txHash || data.receipt?.transactionHash, receipt: data.receipt };
          result.value = res;
          emit('success', res);
        }
      } catch (err: any) {
        errorMsg.value = err?.message || 'Payment failed';
        emit('error', err);
      } finally {
        loading.value = false;
      }
    };

    return () => {
      return h(
        'div',
        { style: { ...styles.root, ...props.customStyle }, class: props.customClass },
        [
          h('h3', { style: styles.title }, '💸 Send Payment'),
          h('form', { onSubmit: handleSubmit }, [
            h('div', { style: styles.row }, [
              h('label', { style: styles.label }, 'Recipient Address'),
              h('input', {
                style: styles.input,
                type: 'text',
                value: toAddress.value,
                onInput: (ev: any) => { toAddress.value = ev.target.value; },
                required: true,
              }),
            ]),
            h('div', { style: styles.row }, [
              h('label', { style: styles.label }, `Amount (${props.currency})`),
              h('input', {
                style: styles.input,
                type: 'text',
                value: amountVal.value,
                onInput: (ev: any) => { amountVal.value = ev.target.value; },
                required: true,
              }),
            ]),
            h('div', { style: styles.row }, [
              h('label', { style: styles.label }, 'Payment Mode'),
              h('select', {
                style: styles.input,
                value: currentMode.value,
                onChange: (ev: any) => { currentMode.value = ev.target.value; },
              }, [
                h('option', { value: 'wallet' }, 'Browser Wallet (MetaMask)'),
                h('option', { value: 'api' }, 'Backend API'),
              ]),
            ]),
            h('div', { style: styles.row }, [
              h(
                'button',
                {
                  type: 'submit',
                  disabled: loading.value,
                  style: {
                    ...styles.btn,
                    opacity: loading.value ? 0.7 : 1,
                    cursor: loading.value ? 'not-allowed' : 'pointer',
                  },
                },
                loading.value ? 'Sending...' : `Pay ${amountVal.value} ${props.currency}`
              ),
            ]),
          ]),
          result.value ? h('div', { style: styles.success }, [
            h('div', null, '✓ Payment sent'),
            h('div', { style: styles.txHash }, result.value.txHash),
          ]) : null,
          errorMsg.value ? h('div', { style: styles.error }, `Error: ${errorMsg.value}`) : null,
        ]
      );
    };
  },
});

export default SendPayment;
