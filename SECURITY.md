# Security policy

## Reporting
Do not publish customer data, access tokens, payment details, or private operational records in GitHub issues. Report security concerns privately to the repository owner.

## Production security requirements
- Verified authentication for customers and staff.
- Server-side authorization and database row-level access controls.
- Least-privilege admin roles and auditable changes.
- Rate limiting and abuse protection on authentication and order endpoints.
- No customer records or secrets in browser storage, public JSON files, logs, or Git history.
- Secrets stored only in managed environment variables; rotate any credential exposed in source/history.
- Payment confirmation only from trusted payment-provider webhooks.
- Regular backups and tested restore procedures.
