import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendDirectory = path.dirname(fileURLToPath(import.meta.url))
const backendDirectory = path.resolve(frontendDirectory, '../backend')
const localBackendPython = process.platform === 'win32'
  ? '.venv\\Scripts\\python.exe'
  : '.venv/bin/python'
const backendPython = existsSync(path.resolve(backendDirectory, localBackendPython))
  ? localBackendPython
  : process.platform === 'win32'
    ? 'python'
    : 'python3'

export default defineConfig({
  testDir: './e2e',
  outputDir: '../output/playwright/test-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4173',
    contextOptions: {
      reducedMotion: 'reduce',
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: `"${backendPython}" -m scripts.run_e2e`,
      cwd: backendDirectory,
      url: 'http://127.0.0.1:8001/health',
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4173',
      cwd: frontendDirectory,
      env: {
        VITE_API_BASE_URL: 'http://127.0.0.1:8001/api/v1',
      },
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
})
