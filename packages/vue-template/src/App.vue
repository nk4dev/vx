<template>
  <main class="layout">
    <h1>VX3 Payment Demo (Vue)</h1>
    <p class="description">
      Browser wallet mode sends ETH directly from MetaMask. For API mode, wire your backend endpoint to <code>/api/pay</code>.
    </p>
    <PaymentWidget
      to="0x1234567890abcdef1234567890abcdef12345678"
      initial-amount="0.01"
      currency="ETH"
    />
  </main>
</template>

<script setup lang="ts">
import PaymentWidget from './components/PaymentWidget.vue';
</script>

<style scoped>
.layout {
  max-width: 720px;
  margin: 2rem auto;
  padding: 0 1rem;
  color: #111827;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

h1 {
  margin: 0 0 0.75rem;
  font-size: 1.5rem;
}

.description {
  margin: 0 0 1rem;
  color: #4b5563;
  line-height: 1.4;
}

code {
  background: #f3f4f6;
  border-radius: 0.25rem;
  padding: 0.1rem 0.3rem;
}
</style>
