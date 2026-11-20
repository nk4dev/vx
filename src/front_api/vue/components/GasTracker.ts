import { defineComponent, h, watch, type CSSProperties, type PropType } from 'vue';
import { useGasTracker } from '../composables/use-gas-tracker';

const styles = {
  card: {
    padding: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '24rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#0f172a',
    margin: 0,
  },
  badge: (congestion: string) => ({
    padding: '0.125rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    borderRadius: '9999px',
    backgroundColor: congestion === 'high' ? '#fee2e2' : congestion === 'medium' ? '#fef3c7' : '#dcfce7',
    color: congestion === 'high' ? '#b91c1c' : congestion === 'medium' ? '#b45309' : '#15803d',
    textTransform: 'uppercase' as const,
  }),
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  metricBox: {
    padding: '0.5rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.375rem',
    border: '1px solid #f1f5f9',
  },
  label: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginBottom: '0.25rem',
  },
  value: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#0f172a',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: '#94a3b8',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '0.5rem',
  },
  refreshBtn: {
    background: 'none',
    border: 'none',
    color: '#0284c7',
    cursor: 'pointer',
    padding: 0,
    fontSize: '0.75rem',
    fontWeight: 500,
  },
};

export const GasTracker = defineComponent({
  name: 'GasTracker',
  props: {
    rpcUrl: { type: String, default: '' },
    pollIntervalMs: { type: Number, default: 8000 },
    customClass: { type: String, default: '' },
    customStyle: { type: Object as PropType<CSSProperties>, default: () => ({}) },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const { data, loading, error, refresh } = useGasTracker({
      rpcUrl: props.rpcUrl,
      pollIntervalMs: props.pollIntervalMs,
    });

    watch(data, (val) => {
      if (val) emit('update', val);
    });

    return () => {
      return h(
        'div',
        { style: { ...styles.card, ...props.customStyle }, class: props.customClass },
        [
          h('div', { style: styles.header }, [
            h('h3', { style: styles.title }, '⚡ Gas Fee Monitor'),
            data.value ? h('span', { style: styles.badge(data.value.congestion) }, data.value.congestion) : null,
          ]),
          h('div', { style: styles.grid }, [
            h('div', { style: styles.metricBox }, [
              h('div', { style: styles.label }, 'Base Fee'),
              h('div', { style: styles.value }, data.value ? `${data.value.baseFeeGwei} Gwei` : '...'),
            ]),
            h('div', { style: styles.metricBox }, [
              h('div', { style: styles.label }, 'Priority Fee'),
              h('div', { style: styles.value }, data.value ? `${data.value.priorityFeeGwei} Gwei` : '...'),
            ]),
          ]),
          h('div', { style: styles.footer }, [
            h('span', null, data.value?.blockNumber ? `Block #${data.value.blockNumber}` : loading.value ? 'Fetching...' : 'Ready'),
            h('button', { type: 'button', style: styles.refreshBtn, onClick: () => refresh() }, 'Refresh'),
          ]),
          error.value ? h('div', { style: { color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' } }, error.value) : null,
        ]
      );
    };
  },
});

export default GasTracker;
