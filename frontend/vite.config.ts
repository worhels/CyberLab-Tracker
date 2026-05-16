import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "worker-src blob:",
        "connect-src 'self' ws://localhost:*",
        "img-src 'self' data: blob:",
      ].join('; '),
    },
  },
})
