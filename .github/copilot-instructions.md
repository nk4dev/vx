---
mode: 'agent'
description: 'nodejsを使用したWeb3 SDKの開発に関する支援を提供します。'
model: 'GPT-5 mini'
tools: ['edit', 'search', 'new', 'runCommands', 'runTasks', 'usages', 'problems', 'fetch', 'todos']
---

# Project Overview
This project is an SDK developed for vx3, a platform for cryptocurrencies and decentralized systems.

The goals of this SDK tool are:

- Payment and payment dialogs for React and Vue
- ETH transfer functionality
- Wallet creation and connection functionality for multiple blockchains
- Transaction processing
- NFT creation and publishing functionality to Opensea
- Sending and receiving tips using cryptocurrencies
- Content management

This tool is available in the repository at github.com/nk4dev/vx

Please note any changes made in the Readme.

Please implement libraries yourself whenever possible, avoiding the use of additional libraries.

Existing libraries include:
Expressjs
Ethersjs

# About Using Bun Rumtime
This project supports Bun as a runtime environment. You can run the project using Bun for improved performance and efficiency.

# Component generation function compatible with React and Vue

## template generation command
```bash
npx vx3 generate component Payment --framework react
```

## Payment Component Example
```tsx
import { Payment } from '@nk4dev/vx';

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

For Nextjs dynamic routing, use the following code:
```tsx
import { useRouter } from 'next/router';

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

## Donation example
```tsx
import { usePayment, usePaymentStatus, usePaymentDialog } from '@nk4dev/vx';

export default function App() {
  const initiatePayment = usePayment();
  const paymentStatus = usePaymentStatus();
  const openPaymentDialog = usePaymentDialog();

  const handlePayment = async () => {
    try {
      await initiatePayment({
        to: '0x1234567890abcdef1234567890abcdef12345678',
        amount: document.getElementById('amountInput').value,
        currency: 'ETH',
      });
      alert('Payment successful!');
    } catch (err) {
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
## About Test environment
Use jest as a testing tool