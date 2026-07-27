import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const E2E_POSTGRES_CONTAINER = 'cyberlab-tracker-e2e-postgres'

export default async function globalTeardown(): Promise<void> {
  try {
    await execFileAsync('docker', ['rm', '--force', E2E_POSTGRES_CONTAINER])
  } catch {
    // The backend runner normally removes the container before this fallback.
  }
}
