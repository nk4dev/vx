import { defineComponent, h, type CSSProperties, type PropType } from 'vue';
import { useWallet } from '../composables/use-wallet';

const styles = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  btnConnect: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: '0.375rem',
    backgroundColor: '#059669', // emerald-600
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  btnConnected: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.75rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: '0.375rem',
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  statusDot: {
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '9999px',
    backgroundColor: '#10b981',
  },
  btnDisconnect: {
    padding: '0.375rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    borderRadius: '0.25rem',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
  },
};

export const ConnectWallet = defineComponent({
  name: 'ConnectWallet',
  props: {
    customClass: { type: String, default: '' },
    customStyle: { type: Object as PropType<CSSProperties>, default: () => ({}) },
  },
  emits: ['connect', 'disconnect'],
  setup(props, { emit }) {
    const { address, isConnecting, copied, connect, disconnect, copyAddress } = useWallet();

    const handleConnect = async () => {
      try {
        const res = await connect();
        if (res?.address) {
          emit('connect', res.address, res.chainId);
        }
      } catch {
        return;
      }
    };

    const handleDisconnect = () => {
      disconnect();
      emit('disconnect');
    };

    const formatAddress = (addr: string) => {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return () => {
      if (address.value) {
        return h(
          'div',
          { style: { ...styles.container, ...props.customStyle }, class: props.customClass },
          [
            h(
              'button',
              {
                type: 'button',
                style: styles.btnConnected,
                onClick: copyAddress,
                title: 'Click to copy address',
              },
              [
                h('span', { style: styles.statusDot }),
                h('span', null, formatAddress(address.value)),
                h(
                  'span',
                  { style: { fontSize: '0.75rem', color: copied.value ? '#059669' : '#64748b' } },
                  copied.value ? ' (Copied!)' : ' [Copy]'
                ),
              ]
            ),
            h(
              'button',
              {
                type: 'button',
                style: styles.btnDisconnect,
                onClick: handleDisconnect,
                title: 'Disconnect wallet',
              },
              'Disconnect'
            ),
          ]
        );
      }

      return h(
        'button',
        {
          type: 'button',
          style: {
            ...styles.btnConnect,
            opacity: isConnecting.value ? 0.7 : 1,
            cursor: isConnecting.value ? 'not-allowed' : 'pointer',
            ...props.customStyle,
          },
          class: props.customClass,
          disabled: isConnecting.value,
          onClick: handleConnect,
        },
        isConnecting.value ? 'Connecting...' : 'Connect Wallet'
      );
    };
  },
});

export default ConnectWallet;
