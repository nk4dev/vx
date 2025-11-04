import React, { useState } from 'react';

type PayResponse = {
    txHash?: string;
    receipt?: any;
    error?: string;
};

export default function PaymentDialog(): React.ReactElement {
    const [to, setTo] = useState('');
    const [amount, setAmount] = useState('0.01');
    const [rpcUrl, setRpcUrl] = useState('http://127.0.0.1:8545');
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PayResponse | null>(null);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        try {
            const payload: any = { to, amountEth: amount, rpcUrl };
            if (key) payload.key = key; // optional - prefer env var on server

            const resp = await fetch('/api/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data: PayResponse = await resp.json();
            if (!resp.ok) {
                setResult({ error: data?.error || 'unknown error' });
            } else {
                setResult(data);
            }
        } catch (err) {
            setResult({ error: (err as Error).message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-4 max-w-md bg-white rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Send Payment</h3>
            <form onSubmit={submit} className="space-y-3">
                <div>
                    <label className="block text-sm">Recipient (to)</label>
                    <input className="w-full border rounded px-2 py-1" value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x..." />
                </div>
                <div>
                    <label className="block text-sm">Amount (ETH)</label>
                    <input className="w-full border rounded px-2 py-1" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm">RPC URL</label>
                    <input className="w-full border rounded px-2 py-1" value={rpcUrl} onChange={(e) => setRpcUrl(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm">Private Key (optional — not recommended)</label>
                    <input className="w-full border rounded px-2 py-1" value={key} onChange={(e) => setKey(e.target.value)} placeholder="0x... (leave empty to use server env)" />
                </div>
                <div>
                    <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Payment'}
                    </button>
                </div>
            </form>

            {result && (
                <div className="mt-4 text-sm">
                    {result.error ? (
                        <div className="text-red-600">Error: {result.error}</div>
                    ) : (
                        <div>
                            <div>Tx Hash: <code>{result.txHash}</code></div>
                            <pre className="mt-2 overflow-auto text-xs bg-slate-100 p-2 rounded">{JSON.stringify(result.receipt, null, 2)}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}