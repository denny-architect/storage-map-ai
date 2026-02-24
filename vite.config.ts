import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/storage-map-ai/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.sandbox.novita.ai',
      '5173-i70twd1tifnfku1vjnnun-dfc00ec5.sandbox.novita.ai',
      '5175-i70twd1tifnfku1vjnnun-dfc00ec5.sandbox.novita.ai',
    ],
  },
})
