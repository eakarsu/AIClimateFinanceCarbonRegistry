# Operations

The governed registry API is the supported reference workflow. It is tenant-scoped and covers project registration, versioned measurements, conservative calculation, independent verification, issuance, retirement, and immutable evidence events. Legacy broad CRUD/AI routes and the public registry are disabled by default because they have not been tenant-isolation or integration validated.

## Deliberate setup

1. Install locked dependencies in `backend` and `frontend` as a separate reviewed step (`npm ci`). Startup never installs packages.
2. Copy `.env.example` to `.env`, set a strong `JWT_SECRET`, and configure a least-privilege PostgreSQL `DATABASE_URL`.
3. Run `npm run migrate` from the repository root. Migrations are ordered, checksummed, transactional, and serialized with an advisory lock. They are never run by startup.
4. Provision the first administrator with `ADMIN_EMAIL`, `ADMIN_PASSWORD` (14+ characters), and `ADMIN_TENANT_ID` using `npm run create-admin`. No built-in account exists.
5. Run `./start.sh`. It only starts this repository's backend/frontend and only stops the child processes it created.

Demo seed data is destructive and requires the conspicuous `npm run seed:demo` command plus `ALLOW_DEMO_SEED=true`; never point it at governed data. Back up and test migrations before deployment. External MRV/lab, GIS, registry, market/ledger, verifier-accreditation, and jurisdiction-rule feeds remain integration work: authenticated adapters must preserve source IDs, SHA-256 evidence, dataset/methodology versions, retry state, and reconciliation outcomes. This repository does not claim registry, verifier, market, or regulatory validation.
