# React Payment Components

Generate ready-to-use cryptocurrency payment components for React applications with a single CLI command.

> [!NOTE]
> This feature was added in VX3 v0.0.19.

---

## Quick Start

```bash
# Scaffold a React + Vite project with Payment components
vx3 setup react

# Install dependencies
npm install

# Start dev server
npm run dev
```

This generates a complete Vite + React + TypeScript project with:

| File | Description |
| :--- | :--- |
| `src/components/Payment.tsx` | Payment UI component |
| `src/components/hooks/use-payment.ts` | `usePayment` hook |
| `src/components/hooks/use-payment-status.ts` | `usePaymentStatus` hook |
| `src/components/hooks/use-payment-dialog.ts` | `usePaymentDialog` hook |
| `src/App.tsx` | Demo application |
| `vite.config.ts` | Vite configuration (with API proxy) |
| `tsconfig.json` | TypeScript config for React JSX |

---

## Payment Component

The `<Payment>` component provides a declarative, self-contained payment form.

### Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `to` | `string` | *required* | Recipient wallet address |
| `amount` | `string` | *required* | Payment amount in ETH |
| `currency` | `string` | `"ETH"` | Currency label |
| `mode` | `"api" \| "wallet"` | `"api"` | Payment communication mode |
| `apiEndpoint` | `string` | `"/api/pay"` | Backend API URL (used when `mode="api"`) |
| `rpcUrl` | `string` | — | RPC URL passed to the backend |
| `onSuccess` | `(result: PaymentResult) => void` | — | Called after a successful payment |
| `onError` | `(error: Error) => void` | — | Called when a payment fails |
| `className` | `string` | — | Optional CSS class for the root container |

### Payment Modes

#### `mode="api"` (default)

Sends a `POST` request to the backend API endpoint (`/api/pay`). The private key is managed on the server side — never exposed to the browser.

```
Browser  ──POST /api/pay──▶  Backend (vx3 serve)  ──eth_sendTransaction──▶  Blockchain
```

#### `mode="wallet"`

Connects directly to a browser wallet (MetaMask, etc.) via the EIP-1193 `window.ethereum` provider. No server or private key required — the user signs the transaction in their wallet.

```
Browser  ──eth_requestAccounts──▶  MetaMask  ──eth_sendTransaction──▶  Blockchain
```

### Basic Usage

```tsx
import { Payment } from './components/Payment';

export default function App() {
  return (
    <Payment
      to="0x1234567890abcdef1234567890abcdef12345678"
      amount="0.01"
      currency="ETH"
      mode="wallet"
      onSuccess={(result) => {
        console.log('Tx hash:', result.txHash);
        alert('Payment successful!');
      }}
      onError={(err) => alert('Payment failed: ' + err.message)}
    />
  );
}
```

### Backend API Mode

```tsx
<Payment
  to="0x1234..."
  amount="0.05"
  mode="api"
  apiEndpoint="/api/pay"
  rpcUrl="http://127.0.0.1:8545"
  onSuccess={(r) => console.log(r.txHash)}
/>
```

The backend can be the built-in VX3 dev server (`vx3 serve`), which exposes `/api/pay`.

### Next.js Example

```tsx
'use client';

import { Payment } from '@nk4dev/vx';

export default function PayPage() {
  return (
    <Payment
      to="0x1234567890abcdef1234567890abcdef12345678"
      amount="0.01"
      currency="ETH"
      mode="wallet"
      onSuccess={() => alert('Payment successful!')}
      onError={(err) => alert('Payment failed: ' + err.message)}
    />
  );
}
```

---

## React Hooks

Three hooks are provided for more fine-grained control.

### `usePayment()`

Returns an async function to execute a payment and a reactive state object.

```tsx
import { usePayment } from './components/hooks/use-payment';

function DonateButton() {
  const { pay, state } = usePayment();

  const handleClick = async () => {
    try {
      const result = await pay({
        to: '0x1234...',
        amount: '0.01',
        mode: 'wallet',
      });
      console.log('Tx:', result.txHash);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={state.status === 'pending'}>
        {state.status === 'pending' ? 'Sending…' : 'Donate 0.01 ETH'}
      </button>
      {state.status === 'error' && <p>Error: {state.error.message}</p>}
      {state.status === 'success' && <p>Sent! Tx: {state.txHash}</p>}
    </div>
  );
}
```

**`state` shape (discriminated union):**

```ts
type PaymentState =
  | { status: 'idle' }
  | { status: 'pending'; txHash?: string }
  | { status: 'success'; txHash: string; receipt?: Record<string, unknown> }
  | { status: 'error'; error: Error };
```

### `usePaymentStatus()`

Tracks the status of the most recent payment transaction. Useful when you want to manage payment state separately from the payment trigger.

```tsx
import { usePaymentStatus } from './components/hooks/use-payment-status';

function StatusBanner() {
  const { status, txHash, error, setPending, setSuccess, setError, reset } = usePaymentStatus();

  return (
    <div>
      {status === 'idle' && <p>Ready</p>}
      {status === 'pending' && <p>Processing…</p>}
      {status === 'success' && <p>Done! Tx: {txHash}</p>}
      {status === 'error' && <p>Failed: {error.message}</p>}
    </div>
  );
}
```

### `usePaymentDialog()`

Manages open/close state of a payment dialog or modal.

```tsx
import { usePaymentDialog } from './components/hooks/use-payment-dialog';
import { Payment } from './components/Payment';

function App() {
  const dialog = usePaymentDialog();

  return (
    <div>
      <button onClick={dialog.open}>Pay Now</button>

      {dialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ margin: '10vh auto', maxWidth: '32rem' }}>
            <Payment
              to="0x1234..."
              amount="0.01"
              mode="wallet"
              onSuccess={() => dialog.close()}
            />
            <button onClick={dialog.close}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Return type:**

```ts
interface PaymentDialogControl {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}
```

---

## SDK Import

When using VX3 as an npm package (`@nk4dev/vx`), you can import the component and hooks directly:

```tsx
import { Payment, usePayment, usePaymentStatus, usePaymentDialog } from '@nk4dev/vx';
```

### Type Exports

```ts
import type {
  PaymentMode,
  PaymentStatus,
  PaymentResult,
  PaymentOptions,
  PaymentProps,
  PaymentState,
  PaymentDialogControl,
} from '@nk4dev/vx';
```

---

## CLI Reference

### `vx3 setup react`

Scaffolds a React + Vite + TypeScript project with Payment components into the current directory.

**What it does:**

1. Updates `package.json` with dependencies and scripts:
   - **dependencies**: `react`, `react-dom`, `ethers`, `@nk4dev/vx`
   - **devDependencies**: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`
   - **scripts**: `dev`, `build`, `preview`
2. Copies template files from the bundled `packages/react-template/` directory

**Usage:**

```bash
# In an existing project directory
vx3 setup react

# Or create a new project first, then add React
vx3 create my-dapp
cd my-dapp
vx3 setup react
npm install
npm run dev
```

---

## Styling

The generated Payment component uses **inline CSS styles** — no external CSS framework (Tailwind, etc.) is required. The component works out of the box in any React project.

To customise the appearance, you can:

1. Pass a `className` prop and apply your own CSS
2. Edit the inline style objects in `Payment.tsx` directly
3. Replace the component with your own styled version while keeping the hooks

---

## Architecture

```
src/components/
├── Payment.tsx              ← Self-contained payment form
└── hooks/
    ├── index.ts             ← Barrel export
    ├── use-payment.ts       ← Payment execution logic
    ├── use-payment-status.ts ← Transaction state tracking
    └── use-payment-dialog.ts ← Dialog open/close control
```

The hooks are decoupled from the UI and can be used with any component library or design system. The `Payment.tsx` component is a reference implementation that you can customise or replace entirely.

---

## Security Considerations

| Mode | Private Key Handling |
| :--- | :--- |
| `api` | Private key stays on the server (`PRIVATE_KEY` env var). Never sent to the browser. |
| `wallet` | No private key needed. User signs via MetaMask or compatible wallet. |

> [!CAUTION]
> Never hardcode private keys in frontend code. Use `mode="wallet"` for production dApps, or `mode="api"` with the key securely stored on the server.
