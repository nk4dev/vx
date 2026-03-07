<template>
  <section class="root">
    <label class="field">
      <span>Recipient</span>
      <input :value="to" readonly />
    </label>

    <label class="field">
      <span>Amount ({{ currency }})</span>
      <input v-model="amount" type="text" />
    </label>

    <button :disabled="loading" @click="payViaWallet">
      {{ loading ? 'Sending...' : `Pay ${amount} ${currency}` }}
    </button>

    <p v-if="txHash" class="success">Success: {{ txHash }}</p>
    <p v-if="errorMessage" class="error">Error: {{ errorMessage }}</p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const props = defineProps<{
  to: string;
  initialAmount: string;
  currency?: string;
}>();

const amount = ref(props.initialAmount);
const loading = ref(false);
const txHash = ref('');
const errorMessage = ref('');
const currency = props.currency ?? 'ETH';

async function payViaWallet(): Promise<void> {
  loading.value = true;
  txHash.value = '';
  errorMessage.value = '';

  try {
    const provider = (globalThis as { ethereum?: EthereumProvider }).ethereum;
    if (!provider) {
      throw new Error('No wallet provider found. Install MetaMask or a compatible wallet.');
    }

    const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
    if (!accounts.length) {
      throw new Error('No wallet account is available.');
    }

    const valueHex = '0x' + BigInt(Math.floor(parseFloat(amount.value) * 1e18)).toString(16);

    const hash = (await provider.request({
      method: 'eth_sendTransaction',
      params: [{ from: accounts[0], to: props.to, value: valueHex }],
    })) as string;

    txHash.value = hash;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.root {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  display: grid;
  gap: 0.75rem;
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field span {
  font-size: 0.9rem;
  color: #374151;
}

input {
  border: 1px solid #d1d5db;
  border-radius: 0.35rem;
  padding: 0.45rem 0.55rem;
}

button {
  cursor: pointer;
  border: none;
  border-radius: 0.35rem;
  background: #2563eb;
  color: #fff;
  padding: 0.6rem 0.8rem;
  font-weight: 600;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.success {
  color: #166534;
  word-break: break-all;
}

.error {
  color: #b91c1c;
}
</style>
