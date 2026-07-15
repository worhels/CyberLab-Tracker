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

## Release artifact contract

Tagged prereleases publish a frontend archive containing `dist/` and the MIT
license, plus a versioned API image at
`ghcr.io/worhels/cyberlab-tracker-api:<tag>`. The packaged frontend uses the
same-origin `/api/v1` base path, so a network deployment must route `/api/v1`
to the FastAPI service through its TLS reverse proxy.

GitHub Container Registry packages owned by a personal account are private on
first publication. Verify the package visibility before advertising anonymous
pulls; a public GHCR package cannot later be made private again.

## Repository release gate

- [ ] CI, CodeQL, dependency review, and PostgreSQL migration jobs pass
- [ ] `npm audit` reports zero known vulnerabilities
- [ ] backend and frontend regression suites pass
- [ ] README screenshots match the release
- [ ] roadmap and changelog match shipped behavior
- [ ] release tag follows SemVer, for example `v0.1.0-beta.1`
- [ ] generated frontend artifact and backend image are reproducible
- [ ] no `.env`, tokens, private keys, database dumps, or personal exports are tracked

## Controlled self-hosted beta gate

- [ ] unique production secrets
- [ ] HTTPS through a trusted reverse proxy
- [ ] explicit production CORS origins
- [ ] production CSP and security headers
- [ ] database backup and tested restore
- [ ] persistent auth rate limiting
- [ ] monitoring and alerting
- [ ] documented incident/rollback procedure
- [ ] private vulnerability reporting enabled

## Public internet gate

In addition to every item above:

- [ ] email/account verification or an invite-only account policy
- [ ] password recovery and session revocation strategy
- [ ] privacy, retention, deletion, and acceptable-use policies
- [ ] abuse controls and resource quotas for Mentor/SSE
- [ ] legal review for jurisdiction-specific privacy obligations

Until the public internet gate is complete, describe deployments as controlled
beta environments rather than production SaaS.
