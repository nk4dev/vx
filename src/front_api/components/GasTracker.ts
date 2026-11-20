import React from 'react';
import { useGasTracker } from '../hooks/use-gas-tracker';
import type { GasTrackerProps } from '../../types/front_components';

const badgeStyle = (congestion: string): React.CSSProperties => ({
  padding: '0.125rem 0.5rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: '9999px',
  backgroundColor: congestion === 'high' ? '#fee2e2' : congestion === 'medium' ? '#fef3c7' : '#dcfce7',
  color: congestion === 'high' ? '#b91c1c' : congestion === 'medium' ? '#b45309' : '#15803d',
  textTransform: 'uppercase',
});

const styles: Record<string, React.CSSProperties> = {
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

export function GasTracker(props: GasTrackerProps): React.ReactElement {
  const { rpcUrl, pollIntervalMs, className, style, onUpdate } = props;
  const { data, loading, error, refresh } = useGasTracker({ rpcUrl, pollIntervalMs });

  React.useEffect(() => {
    if (data && onUpdate) {
      onUpdate(data);
    }
  }, [data, onUpdate]);

  const h = React.createElement;

  return h(
    'div',
    { style: { ...styles.card, ...style }, className },
    h(
      'div',
      { style: styles.header },
      h('h3', { style: styles.title }, '⚡ Gas Fee Monitor'),
      data && h('span', { style: badgeStyle(data.congestion) }, data.congestion)
    ),
    h(
      'div',
      { style: styles.grid },
      h(
        'div',
        { style: styles.metricBox },
        h('div', { style: styles.label }, 'Base Fee'),
        h('div', { style: styles.value }, data ? `${data.baseFeeGwei} Gwei` : '...')
      ),
      h(
        'div',
        { style: styles.metricBox },
        h('div', { style: styles.label }, 'Priority Fee'),
        h('div', { style: styles.value }, data ? `${data.priorityFeeGwei} Gwei` : '...')
      )
    ),
    h(
      'div',
      { style: styles.footer },
      h('span', null, data?.blockNumber ? `Block #${data.blockNumber}` : loading ? 'Fetching...' : 'Ready'),
      h('button', { type: 'button', style: styles.refreshBtn, onClick: () => refresh() }, 'Refresh')
    ),
    error && h('div', { style: { color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' } }, error)
  );
}

export default GasTracker;
