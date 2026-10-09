import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `vx3 api` serves /api/* (default http://127.0.0.1:8545). Start it with
//   vx3 api --allow-origin http://localhost:5173
// so /api/pay accepts requests coming from this dev server. Set VX3_API_URL
// when it listens on another host / port.
const apiTarget = process.env.VX3_API_URL ?? 'http://127.0.0.1:8545';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': apiTarget,
    },
  },
});
