import { spawnSync } from 'node:child_process'

const allowedAdvisory = 'GHSA-qwww-vcr4-c8h2'
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const auditResult = spawnSync(npmCommand, ['audit', '--json'], {
  encoding: 'utf8',
})

if (auditResult.error) {
  throw auditResult.error
}

const audit = JSON.parse(auditResult.stdout)
const approvedPackages = new Set()
let didApprovePackage = true

while (didApprovePackage) {
  didApprovePackage = false

  for (const [packageName, vulnerability] of Object.entries(audit.vulnerabilities ?? {})) {
    if (approvedPackages.has(packageName)) {
      continue
    }

    const isAllowed = vulnerability.via.every((source) => {
      if (typeof source === 'string') {
        return approvedPackages.has(source)
      }

      return source.url?.includes(allowedAdvisory) ?? false
    })

    if (isAllowed) {
      approvedPackages.add(packageName)
      didApprovePackage = true
    }
  }
}

const unresolved = Object.entries(audit.vulnerabilities ?? {}).filter(
  ([packageName]) => !approvedPackages.has(packageName),
)

if (unresolved.length > 0) {
  console.error('Unexpected npm audit findings:')
  for (const [packageName, vulnerability] of unresolved) {
    console.error(`- ${packageName}: ${vulnerability.severity}`)
  }
  process.exitCode = 1
} else if (approvedPackages.size > 0) {
  console.warn(`Ignored ${allowedAdvisory}: the application does not use React Router RSC APIs.`)
}
