import React from 'react';
import { Payment } from './components/Payment';

export default function App() {
  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>VX3 Payment Demo</h1>
      <Payment
        to="0x1234567890abcdef1234567890abcdef12345678"
        amount="0.01"
        currency="ETH"
        mode="wallet"
        onSuccess={(result) => {
          console.log('Payment successful:', result.txHash);
          alert('Payment successful!');
        }}
        onError={(err) => {
          console.error('Payment failed:', err);
          alert('Payment failed: ' + err.message);
        }}
      />
    </div>
  );
}
