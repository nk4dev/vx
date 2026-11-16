import { defineComponent, h, ref, computed, type PropType } from 'vue';
import { useWallet } from '../composables/use-wallet';

const styles = {
  card: {
    padding: '1.5rem',
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '24rem',
  },
  title: { fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' },
  desc: { fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  stepper: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  stepBtn: {
    width: '2rem',
    height: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.25rem',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 600,
  },
  qty: { fontSize: '1rem', fontWeight: 600, minWidth: '1.5rem', textAlign: 'center' as const },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    borderTop: '1px solid #f1f5f9',
    borderBottom: '1px solid #f1f5f9',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  total: { fontWeight: 700, color: '#0f172a' },
  btnMint: {
    width: '100%',
    padding: '0.625rem',
    backgroundColor: '#059669', // emerald-600
    color: '#ffffff',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  success: { marginTop: '1rem', fontSize: '0.875rem', color: '#16a34a' },
  error: { marginTop: '1rem', fontSize: '0.875rem', color: '#dc2626' },
};

export const NFTMinter = defineComponent({
  name: 'NFTMinter',
  props: {
    contractAddress: { type: String, required: true },
    priceEth: { type: String, required: true },
    maxPerWallet: { type: Number, default: 5 },
    customClass: { type: String, default: '' },
    customStyle: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  },
  emits: ['mintSuccess', 'mintError'],
  setup(props, { emit }) {
    const { address, connect } = useWallet();
    const quantity = ref(1);
    const loading = ref(false);
    const txHash = ref<string | null>(null);
    const error = ref<string | null>(null);

    const totalEth = computed(() => {
      const priceNum = parseFloat(props.priceEth) || 0;
      return (priceNum * quantity.value).toFixed(4);
    });

    const handleMint = async () => {
      error.value = null;
      txHash.value = null;
      let targetAddress = address.value;

      if (!targetAddress) {
        try {
          const res = await connect();
          targetAddress = res.address;
        } catch {
          return;
        }
      }

      if (!targetAddress) return;

      loading.value = true;
      try {
        const eth = typeof window !== 'undefined' ? (window as any).ethereum : null;
        if (!eth) throw new Error('No Ethereum wallet found');

        const totalWei = BigInt(Math.floor(parseFloat(totalEth.value) * 1e18)).toString(16);
        const mintedTx = await eth.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: targetAddress,
              to: props.contractAddress,
              value: `0x${totalWei}`,
              data: '0x1249c58b', // mint() default selector
            },
          ],
        });

        txHash.value = mintedTx;
        emit('mintSuccess', { txHash: mintedTx, quantity: quantity.value });
      } catch (err: any) {
        const msg = err?.message || 'Failed to mint NFT';
        error.value = msg;
        emit('mintError', err);
      } finally {
        loading.value = false;
      }
    };

    return () => {
      return h(
        'div',
        { style: { ...styles.card, ...props.customStyle }, class: props.customClass },
        [
          h('h3', { style: styles.title }, '🎨 Mint NFT'),
          h('p', { style: styles.desc }, `Contract: ${props.contractAddress.slice(0, 6)}...${props.contractAddress.slice(-4)}`),
          h('div', { style: styles.row }, [
            h('span', null, 'Quantity:'),
            h('div', { style: styles.stepper }, [
              h(
                'button',
                {
                  type: 'button',
                  style: styles.stepBtn,
                  disabled: quantity.value <= 1 || loading.value,
                  onClick: () => { quantity.value = Math.max(1, quantity.value - 1); },
                },
                '-'
              ),
              h('span', { style: styles.qty }, quantity.value),
              h(
                'button',
                {
                  type: 'button',
                  style: styles.stepBtn,
                  disabled: quantity.value >= props.maxPerWallet || loading.value,
                  onClick: () => { quantity.value = Math.min(props.maxPerWallet, quantity.value + 1); },
                },
                '+'
              ),
            ]),
          ]),
          h('div', { style: styles.priceRow }, [
            h('span', null, 'Total Price:'),
            h('span', { style: styles.total }, `${totalEth.value} ETH`),
          ]),
          h(
            'button',
            {
              type: 'button',
              style: {
                ...styles.btnMint,
                opacity: loading.value ? 0.7 : 1,
                cursor: loading.value ? 'not-allowed' : 'pointer',
              },
              disabled: loading.value,
              onClick: handleMint,
            },
            loading.value ? 'Minting...' : address.value ? `Mint ${quantity.value} NFT` : 'Connect & Mint'
          ),
          txHash.value ? h('div', { style: styles.success }, `✓ Minted! Tx: ${txHash.value.slice(0, 10)}...`) : null,
          error.value ? h('div', { style: styles.error }, `Error: ${error.value}`) : null,
        ]
      );
    };
  },
});

export default NFTMinter;
