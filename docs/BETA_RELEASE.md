# Beta release checklist

## License assessment

The repository uses the OSI-approved MIT License. For project code the license
allows private and commercial use, modification, distribution, publishing,
sublicensing, and sale, provided the copyright and permission notice stay with
substantial copies.

MIT is suitable for publishing an open-source beta. It does not:

- make a deployment secure or compliant;
- grant rights to third-party assets, dependencies, trademarks, or model
  weights that the copyright holder does not own;
- provide an explicit patent grant comparable to Apache-2.0;
- create a privacy policy, terms of service, or data-processing agreement;
- provide warranty or support.

Before a public beta, confirm the copyright notice identifies the intended
holder, remove or document the provenance of bundled media, retain dependency
notices, and review the license of the selected Ollama model. This is an
engineering assessment, not legal advice.

The recommended local Mentor model is `qwen3-coder:30b`. Its weights are a
separate dependency and are not relicensed by CyberLab's MIT License. Operators
must review and retain the upstream model terms for their distribution or
hosting scenario.

## Mentor artifact boundary

The current beta does not expose a general AI coding agent. The reviewed artifact API supports
only `bcrypt-timing-web-v1`: Ollama supplies a strict non-executable
specification and the backend renders reviewed files into an isolated per-user
volume. Downloads are attachment-only and CyberLab never previews or executes
the artifact. Real passwords must not be used.

Before adding more templates or any execution endpoint, require a separate
rootless worker with no network, secrets, database, Docker socket, host source
tree, or writable host mounts; pin its image digest and enforce CPU, memory,
process, output, and time limits.

## Release artifact contract

Tagged prereleases publish a frontend archive containing `dist/` and the MIT
license, plus a versioned API image at
`ghcr.io/worhels/cyberlab-tracker-api:<tag>`. The packaged frontend uses the
same-origin `/api/v1` base path, so a network deployment must route `/api/v1`
to the FastAPI service through its TLS reverse proxy.

GitHub Container Registry packages owned by a personal account are private on
first publication. Verify the package visibility before advertising anonymous
pulls; a public GHCR package cannot later be made private again.

`v0.1.0-beta.1` verification:

- GitHub prerelease: `https://github.com/worhels/CyberLab-Tracker/releases/tag/v0.1.0-beta.1`
- frontend archive SHA-256: `031378b8098ee52753905207342a4fd92ab3223e5214dd7d1947bb2d63c86c2b`
- public API image index: `sha256:ee9027e1bd48fd1cda31b60e9c44f4fa373fd02b2c4f2d8971bb70b1dd6018af`
- published archive contents and checksum verified after download

## Repository release gate

- [x] CI, CodeQL, dependency review, and PostgreSQL migration jobs pass
- [x] `npm audit` reports zero known vulnerabilities
- [x] backend and frontend regression suites pass
- [x] README screenshots match the release
- [x] roadmap and changelog match shipped behavior
- [x] release tag follows SemVer, for example `v0.1.0-beta.1`
- [ ] generated frontend artifact and backend image are reproducible
- [x] no `.env`, tokens, private keys, database dumps, or personal exports are tracked

The published assets are checksummed and digest-addressable, but exact
reproducibility remains open until Python dependencies and the base image are
pinned to immutable versions/digests.

## Controlled self-hosted beta gate

- [ ] unique production secrets
- [ ] HTTPS through a trusted reverse proxy
- [ ] explicit production CORS origins
- [ ] production CSP and security headers
- [ ] database backup and tested restore
- [ ] persistent auth rate limiting
- [ ] monitoring and alerting
- [ ] documented incident/rollback procedure
- [x] private vulnerability reporting enabled

## Public internet gate

In addition to every item above:

- [ ] email/account verification or an invite-only account policy
- [ ] password recovery and session revocation strategy
- [ ] privacy, retention, deletion, and acceptable-use policies
- [ ] abuse controls and resource quotas for Mentor/SSE
- [ ] persistent artifact retention/deletion policy and distributed generation quota
- [ ] legal review for jurisdiction-specific privacy obligations

Until the public internet gate is complete, describe deployments as controlled
beta environments rather than production SaaS.
