# Audit Note — AIClimateFinanceCarbonRegistry

DOMAIN: climate finance + carbon credit registry — project validation, MRV (measurement, reporting, verification), retirement tracking, issuance auditing, double-counting prevention.

## Inventory (existing)

### Backend routes (27 files under `backend/routes/`)
- Core registry CRUD: `projects`, `methodologies`, `verifiers`, `holders`, `beneficiaries`, `issuances`, `credits`, `retirements`, `transactions`, `claims`, `audits`.
- Ledger / reporting: `finance-ledger`, `scopes-emissions`, `jurisdictional-baselines`, `biodiversity-cobenefits`, `smr-reports`, `dashboard`, `scoreboard`.
- Ops / integration: `auth`, `attachments`, `bulk-import`, `customViews`, `notifications`, `webhooks`, `satellite-imagery`, `_crud`.
- `ai.js` — 16 AI POST endpoints + samples/results/history GETs.

### AI endpoints (16, all in `backend/routes/ai.js`)
`verify-project`, `synthesize-mrv`, `detect-fraud`, `analyze-pricing`, `map-methodology`, `draft-disclosure`, `leakage-modeler`, `satellite-mrv`, `double-counting-detect`, `additionality-scorer`, `registry-arbitrage`, `price-discovery`, `biodiversity-co-benefit`, `climate-claim-validator`, `supply-cap-forecast`, `scope-3-attributor`.

### Frontend (42 pages, 13 components)
Dedicated AI pages cover all 16 AI endpoints; CRUD pages cover all major registry entities; certificates (Carbon, Retirement, Verification), maps/heatmaps, trend charts present.

## Gap Analysis vs Domain Requirements

### Missing AI Counterparts
- **MRV-document validator** — structured validation of MRV report PDFs vs methodology rules (separate from `synthesize-mrv` which generates). PARTIAL: `climate-claim-validator` covers claims, not full MRV docs.
- **Narrative-vs-evidence reconciliation** — cross-check project narrative against attachments/satellite/ledger evidence.
- **Satellite-imagery cross-check** — PARTIAL: `satellite-mrv` exists but no anomaly/forest-loss diff endpoint.
- **Leakage risk predictor** — PARTIAL: `leakage-modeler` exists; no time-series risk forecast variant.
- **Additionality scorer** — COVERED (`additionality-scorer`).

### Missing Non-AI Features
- **Registry interop adapters** — Verra / Gold Standard / ACR / CAR external sync (no `registry-interop` route).
- **Retirement certificate issuance API** — component exists in frontend; no dedicated cert-mint route observed beyond `retirements` CRUD.
- **Issuance ledger immutability / hash-chain** — `issuances` + `finance-ledger` exist; no append-only hash chain endpoint.
- **Public retirement search / beneficiary lookup** — no public unauthenticated lookup route.

### Missing Custom Features
- **AML / sanctions screening on credit transactions** — `detect-fraud` exists; no OFAC/sanctions list cross-check.
- **Cross-registry double-counting alerts** — `double-counting-detect` is single-credit scoped; no batch cross-registry sweep job.
- **Ratings dashboard** — `scoreboard` present; no per-project rating aggregator (BeZero/Sylvera-style composite).
- **Vintage / corresponding-adjustment tracker** (Article 6.2/6.4 compliance).

## Implemented (this round)
None — audit-only.

## Backlog (prioritized)
1. **MECHANICAL** `POST /api/ai/mrv-document-validate` — validate MRV PDF/JSON vs methodology rules.
2. **MECHANICAL** `POST /api/ai/narrative-evidence-reconcile` — narrative vs attachments/satellite/ledger.
3. **MECHANICAL** `POST /api/ai/aml-screen-transaction` — sanctions/PEP/typology screening on credit transfers.
4. **MECHANICAL** `POST /api/ai/project-rating` — composite rating (additionality + permanence + leakage + co-benefits).
5. **MECHANICAL** `GET /api/retirements/public/:serial` — public retirement certificate lookup.
6. **NEEDS-CREDS** Verra / Gold Standard / ACR / CAR registry-interop adapters.
7. **NEEDS-PRODUCT-DECISION** Hash-chain immutability for issuance ledger; Article 6 corresponding-adjustment tracker.

## Status
Audit-only. No code changes. Syntax of existing `ai.js` not modified.

## Apply pass 7 (full backlog implementation)

### Backend (new files)
- `backend/routes/public.js` — public (no-auth) routes mounted at `/api/public/*` BEFORE the JWT gate.
  - `GET /api/public/retirements/:serial` — public retirement certificate lookup.
  - `GET /api/public/retirements?beneficiary=&limit=` — public beneficiary search.
  - `GET /api/public/issuance-chain` — read-only hash-chain head.
- `backend/routes/issuance-chain.js` — append-only SHA-256 hash-chain over `issuances` (NEEDS-PRODUCT-DECISION shipped).
  - `GET /` list, `GET /head`, `POST /seal`, `GET /verify`.
- `backend/routes/corresponding-adjustments.js` — Article 6.2/6.4 ITMO tracker (NEEDS-PRODUCT-DECISION shipped).
  - Full CRUD + `GET /summary/by-country`.
- `backend/routes/project-ratings.js` — composite project ratings CRUD (storage side of MECHANICAL #4).
- `backend/migrations/003_pass7.sql` — adds `issuance_hash_chain`, `corresponding_adjustments`, `project_ratings`.

### Backend (modified)
- `backend/services/ai.js` — added 4 AI functions: `mrvDocumentValidate`, `narrativeEvidenceReconcile`, `amlScreenTransaction`, `projectRating`.
- `backend/routes/ai.js` — added 4 new POST verbs + samples for each + NEEDS-CREDS registry-interop stubs (Verra/GS/ACR/CAR) returning 503 with required-credential hints.
- `backend/server.js` — mounted `/api/public` BEFORE JWT gate; mounted `/api/issuance-chain`, `/api/corresponding-adjustments`, `/api/project-ratings` BEFORE the 404 handler.

### Endpoints added
- `POST /api/ai/mrv-document-validate`
- `POST /api/ai/narrative-evidence-reconcile`
- `POST /api/ai/aml-screen-transaction`
- `POST /api/ai/project-rating`
- `POST /api/ai/registry-interop/{verra|gold-standard|acr|car}/sync` → 503 stub (NEEDS-CREDS)
- `GET  /api/ai/registry-interop/status`
- `GET  /api/issuance-chain` (+ `/head`, `POST /seal`, `GET /verify`)
- `GET|POST|PUT|DELETE /api/corresponding-adjustments` + `GET /summary/by-country`
- `GET|POST|PUT|DELETE /api/project-ratings`
- `GET  /api/public/retirements/:serial`
- `GET  /api/public/retirements?beneficiary=&limit=`
- `GET  /api/public/issuance-chain`

### Frontend (new pages)
- `frontend/src/pages/AIMRVDocumentValidatePage.js`
- `frontend/src/pages/AINarrativeEvidenceReconcilePage.js`
- `frontend/src/pages/AIAMLScreenTransactionPage.js`
- `frontend/src/pages/AIProjectRatingPage.js`
- `frontend/src/pages/CorrespondingAdjustmentsPage.js`
- `frontend/src/pages/ProjectRatingsPage.js`
- `frontend/src/pages/PublicRetirementLookupPage.js` (route `/public/retirements` — unauthenticated)
- `frontend/src/pages/RegistryInteropPage.js`
- `frontend/src/pages/IssuanceChainPage.js`

### Frontend (modified)
- `frontend/src/App.js` — imports + routes for all 9 new pages; `/public/retirements` bypass.
- `frontend/src/components/Sidebar.js` — links under Registry / AI Studio / Ops sections.
- `frontend/src/services/api.js` — `aiMrvDocumentValidate`, `aiNarrativeEvidenceReconcile`, `aiAmlScreenTransaction`, `aiProjectRating`, `correspondingAdjustmentsApi`, `projectRatingsApi`, `issuanceChain*`, `publicRetirementLookup`, `publicRetirementSearch`, `registryInteropStatus`, `registryInteropSync`.

### Constraints honored
- No new dependencies added (uses built-in `crypto`, existing pg pool, existing Router pattern).
- No breaking changes (all 16 prior AI endpoints + 18 CRUD entities + sample fills unchanged).
- All new mounts BEFORE the `/api` 404 handler.
- All modified/new backend `.js` files pass `node --check`.

### NEEDS-CREDS skips
Verra / Gold Standard / ACR / CAR registry-interop sync endpoints return HTTP 503 with explicit `required_credentials: ['<REGISTRY>_API_KEY', '<REGISTRY>_API_SECRET']` payload. Status endpoint enumerates all four adapters as `needs-credentials`. Stubs are wired end-to-end so adding credentials + a sync function would activate them without route changes.

### Status
Pass 7 implementation applied. Backlog items 1-5 (MECHANICAL), 6 (NEEDS-CREDS → 503 stubs), 7 (NEEDS-PRODUCT-DECISION → hash-chain + Article 6 tracker) all shipped.
