import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    clearMocks: true,
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**'],
    },
  },
  build: {
    chunkSizeWarningLimit: 850,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@react-three')) return 'react-three-vendor'
          if (id.includes('three/addons') || id.includes('three/examples')) return 'three-addons'
          if (id.includes('three')) return 'three-core'
          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor'
          return 'vendor'
        },
      },
    },
  },
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "worker-src blob:",
        "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 http://localhost:8001 http://127.0.0.1:8001 ws://localhost:* ws://127.0.0.1:*",
        "img-src 'self' data: blob:",
      ].join('; '),
    },
  },
})
