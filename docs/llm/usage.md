# Application Usage Guide

This guide explains how to integrate the VX SDK into your applications.

## Library Usage (SDK API)

### TypeScript / ESM Import

```ts
import vx from "@vx3/vx";

// Get RPC URL from vx.config.json
const rpc = vx.getRpcUrl();

// Query blockchain data
const block = await vx.getBlockNumber(rpc);
const gas = await vx.getGasFees(rpc);
```

### CommonJS Import

```js
const vx = require("@vx3/vx").default;
vx.getGasFees("http://127.0.0.1:8545").then(console.log);
```

## Payment Module

You can send transactions programmatically using the payment module.

```ts
import vx from '@vx3/vx';

await vx.payment.sendPayment({
  rpcUrl: 'http://127.0.0.1:8545',
  privateKey: process.env.PRIVATE_KEY!,
  to: '0xRecipientAddress',
  amountEth: '0.01'
});
```

## Component Generation

The SDK supports generating payment components for React.

### Setup Command

```bash
vx3 setup react
```

This scaffolds a complete React + Vite + TypeScript project with:
- `<Payment>` component supporting `mode="api"` (backend proxy) and `mode="wallet"` (MetaMask direct)
- `usePayment()` hook for programmatic payment execution
- `usePaymentStatus()` hook for transaction state tracking
- `usePaymentDialog()` hook for dialog/modal control

See [React Payment Components](../react-payment.md) for full documentation.

## React Component Examples

### Basic Payment Component

```tsx
import { Payment } from '@vx3/vx';

export default function App() {
  return (
    <div>
      <Payment
        to="0x1234567890abcdef1234567890abcdef12345678"
        amount="0.01"
        currency="ETH"
        onSuccess={() => alert('Payment successful!')}
        onError={(err) => alert('Payment failed: ' + err.message)}
      />
    </div>
  );
}
```

### Next.js Dynamic Routing Example

```tsx
import { useRouter } from 'next/router';
import { Payment } from '@vx3/vx';

export default function App() {
    const router = useRouter();
    const { id } = router.query;
  return (
    <div>
      <Payment
        to="0x1234567890abcdef1234567890abcdef12345678"
        amount="0.01"
        currency="ETH"
        onSuccess={() => alert('Payment successful!')}
        onError={(err) => alert('Payment failed: ' + err.message)}
      />
    </div>
  );
}
```

### Donation Example (Hooks)

```tsx
import { usePayment, usePaymentStatus, usePaymentDialog } from '@vx3/vx';

export default function App() {
  const initiatePayment = usePayment();
  const paymentStatus = usePaymentStatus();
  const openPaymentDialog = usePaymentDialog();

  const handlePayment = async () => {
    try {
      await initiatePayment({
        to: '0x1234567890abcdef1234567890abcdef12345678',
        amount: (document.getElementById('amountInput') as HTMLInputElement).value,
        currency: 'ETH',
      });
      alert('Payment successful!');
    } catch (err: any) {
      alert('Payment failed: ' + err.message);
    }
  };

  return (
    <div>
      <div>Donation Example</div>
      <input type="text" placeholder="Amount in ETH" id="amountInput" />
      <button onClick={handlePayment}>Pay Now</button>
      <button onClick={openPaymentDialog}>Open Payment Dialog</button>
      {paymentStatus && <div>Payment Status: {paymentStatus}</div>}
    </div>
  );
} 
```
