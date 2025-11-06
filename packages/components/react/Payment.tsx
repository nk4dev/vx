import React, { useEffect, useState } from 'react';

export type PaymentProps = {
  to: string;
  amount: string; // in ETH
  currency?: string; // currently only ETH supported
  rpcUrl?: string; // optional RPC to send to server
  onSuccess?: (result: any) => void;
  onError?: (err: Error | any) => void;
  children?: React.ReactNode;
};

export const Payment: React.FC<PaymentProps> = ({
  to,
  amount,
  currency = 'ETH',
  rpcUrl,
  onSuccess,
  onError,
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // detect injected provider
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const eth = (window as any).ethereum;
      if (eth.selectedAddress) {
        setAddress(eth.selectedAddress);
        setIsConnected(true);
      }
      // listen for account changes
      if (eth.on) {
        eth.on('accountsChanged', (accounts: string[]) => {
          if (accounts && accounts[0]) {
            setAddress(accounts[0]);
            setIsConnected(true);
          } else {
            setAddress(null);
            setIsConnected(false);
          }
        });
      }
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('No injected wallet found (MetaMask)');
      }
      const eth = (window as any).ethereum;
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts[0]) {
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    } catch (err) {
      setMessage(String(err));
      onError?.(err);
    }
  };

  // helper to call server-side /api/pay
  const serverPay = async (toAddr: string, amountEth: string) => {
    const body: any = { to: toAddr, amountEth };
    if (rpcUrl) body.rpcUrl = rpcUrl;
    const resp = await fetch('/api/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await resp.json();
    if (!resp.ok) throw j || new Error('server pay failed');
    return j;
  };

  // helper to send via injected wallet
  const walletPay = async (from: string, toAddr: string, amountEth: string) => {
    if (typeof window === 'undefined' || !(window as any).ethereum) throw new Error('No injected wallet');
    const eth = (window as any).ethereum;
    // convert ETH decimal to hex wei
    function toHexWei(amountStr: string) {
      const [intPart, dec] = String(amountStr).split('.');
      const decimals = (dec || '').padEnd(18, '0').slice(0, 18);
      const wei = BigInt(intPart || '0') * 10n ** 18n + BigInt(decimals || '0');
      return '0x' + wei.toString(16);
    }
    const value = toHexWei(amountEth);
    const params = [{ from, to: toAddr, value }];
    const txHash = await eth.request({ method: 'eth_sendTransaction', params });
    return { txHash };
  };

  const handlePay = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // prefer injected wallet if available
      if (isConnected && address && (window as any).ethereum) {
        const r = await walletPay(address, to, amount);
        setMessage('Tx sent: ' + (r.txHash || ''));
        onSuccess?.(r);
      } else {
        // fallback to server-side signing via /api/pay
        const r = await serverPay(to, amount);
        setMessage('Server tx: ' + (r.txHash || r.receipt?.transactionHash || 'ok'));
        onSuccess?.(r);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setMessage('Error: ' + errorMessage);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 8, maxWidth: 420 }}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>Payment</div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
        To: {to} • Amount: {amount} {currency}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {!isConnected ? (
          <button onClick={connectWallet}>Connect Wallet</button>
        ) : (
          <div style={{ fontSize: 12 }}>Connected: {address}</div>
        )}
        <button onClick={handlePay} disabled={loading}>
          {loading ? 'Sending…' : children || 'Pay'}
        </button>
      </div>
      {message && <div style={{ fontSize: 12, color: '#333' }}>{message}</div>}
    </div>
  );
};

export default Payment;
