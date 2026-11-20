import React, { useState } from 'react';
import { useWallet } from '../hooks/use-wallet';
import { ethToWeiHex } from '../amount';
import type { NFTMinterProps } from '../../types/front_components';

const styles: Record<string, React.CSSProperties> = {
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
    backgroundColor: '#7c3aed', // violet-600
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

export function NFTMinter(props: NFTMinterProps): React.ReactElement {
  const { contractAddress, priceEth, maxPerWallet = 5, className, style, onMintSuccess, onMintError } = props;
  const { address, connect } = useWallet();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const priceNum = parseFloat(priceEth) || 0;
  const totalEth = (priceNum * quantity).toFixed(4);

  const handleMint = async () => {
    setError(null);
    setTxHash(null);
    let targetAddress = address;

    if (!targetAddress) {
      try {
        const res = await connect();
        targetAddress = res.address;
      } catch {
        return;
      }
    }

    if (!targetAddress) return;

    setLoading(true);
    try {
      const eth = typeof window !== 'undefined' ? window.ethereum : null;
      if (!eth) throw new Error('No Ethereum wallet found');

      // ERC721 safeMint(address) selector: 0xa0712d68 (mint(uint256)) or 0x40c10f19 (mint(address,uint256)) or 0x1249c58b (mint())
      // Standard simple mint transaction with value
      const valueHex = ethToWeiHex(totalEth);
      const mintedTx = (await eth.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: targetAddress,
            to: contractAddress,
            value: valueHex,
            data: '0x1249c58b', // mint() default selector
          },
        ],
      })) as string;

      setTxHash(mintedTx);
      onMintSuccess?.({ txHash: mintedTx, quantity });
    } catch (err: unknown) {
      const errorObj =
        err instanceof Error
          ? err
          : new Error(typeof err === 'string' && err ? err : 'Failed to mint NFT');
      setError(errorObj.message);
      onMintError?.(errorObj);
    } finally {
      setLoading(false);
    }
  };

  const h = React.createElement;

  return h(
    'div',
    { style: { ...styles.card, ...style }, className },
    h('h3', { style: styles.title }, '🎨 Mint NFT'),
    h('p', { style: styles.desc }, `Contract: ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`),
    h(
      'div',
      { style: styles.row },
      h('span', null, 'Quantity:'),
      h(
        'div',
        { style: styles.stepper },
        h(
          'button',
          {
            type: 'button',
            style: styles.stepBtn,
            disabled: quantity <= 1 || loading,
            onClick: () => setQuantity((q) => Math.max(1, q - 1)),
          },
          '-'
        ),
        h('span', { style: styles.qty }, quantity),
        h(
          'button',
          {
            type: 'button',
            style: styles.stepBtn,
            disabled: quantity >= maxPerWallet || loading,
            onClick: () => setQuantity((q) => Math.min(maxPerWallet, q + 1)),
          },
          '+'
        )
      )
    ),
    h(
      'div',
      { style: styles.priceRow },
      h('span', null, 'Total Price:'),
      h('span', { style: styles.total }, `${totalEth} ETH`)
    ),
    h(
      'button',
      {
        type: 'button',
        style: {
          ...styles.btnMint,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        },
        disabled: loading,
        onClick: handleMint,
      },
      loading ? 'Minting...' : address ? `Mint ${quantity} NFT` : 'Connect & Mint'
    ),
    txHash && h('div', { style: styles.success }, `✓ Minted! Tx: ${txHash.slice(0, 10)}...`),
    error && h('div', { style: styles.error }, `Error: ${error}`)
  );
}

export default NFTMinter;
