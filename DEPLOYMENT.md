# Vercel deployment and production-readiness

## Current status
This branch adds the initial Vercel static-hosting configuration only. It is **not approved for production traffic** until the blockers below are closed.

## Import into Vercel
1. Connect the Vercel account to GitHub and import `harshithm97/Texasranchmeat`.
2. Select branch `production/vercel-migration` for the initial preview deployment.
3. Framework preset: Other. Root directory: `./`. Build command: leave empty. Output directory: `.`.
4. Do not promote this preview to production yet.
5. Configure the production branch only after the secure backend and migration are complete.

## Production blockers
- Replace phone-number-only login with verified authentication.
- Move customer, order, inventory, and admin data into a shared database and server-side APIs.
- Enforce role checks in server/database policies; browser-side checks are not security controls.
- Audit `data/ranch-state.json` and public Git history for sensitive records before any public release. Preserve an authorized private backup before cleanup.
- Replace public raw-GitHub state synchronization.
- Add checkout/payment provider integration and verify payment status from trusted webhooks; current payment choices are labels only.
- Restore or replace the referenced `assets/logo.jpg` asset.
- Add tests, monitoring, backups, and operational recovery procedures.
- Disable GitHub Pages workflows only after Vercel production is verified.

## Environment variables
No production secrets are required for this static preview. Never commit secrets or customer data. When backend services are connected, store credentials in Vercel Environment Variables and use separate Preview and Production scopes. Never expose service-role keys in browser code.

## Rollout
Use preview deployments for QA. Promote only after security review, migration verification, backup/restore test, order lifecycle tests, and owner sign-off.
