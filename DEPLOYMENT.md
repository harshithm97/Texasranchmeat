# Texas Ranch Meat — hosting and production rollout

## Hosting architecture

- **Domain:** GoDaddy manages `texasranchmeat.com` only. No GoDaddy hosting plan is needed.
- **Frontend hosting:** GitHub Pages.
- **Database and authentication:** Supabase (Postgres, Auth, and Row Level Security).
- **Source control and deployment:** this GitHub repository.

## Current rollout status

This repository is in **local test mode**. Unverified test profiles and orders are permitted for development only. Test data stays in the visitor’s browser and is not shared across devices or sent for fulfillment. Do not treat this flow as a live ordering system or accept real customer information/payments.

1. Audit the 1.3 MB `data/ranch-state.json` file and public Git history. Determine whether it contains customer, order, phone, address, inventory, or other private business records. Preserve an authorized private backup before removing any sensitive data. Removing the current file alone does not remove it from Git history.
2. Replace browser-only phone login with Supabase Auth before production. WhatsApp verification is deferred until the application is otherwise complete and ready for launch.
3. Move customer, order, inventory, and admin data into Supabase. Enforce access with Row Level Security and server-side/Edge Function checks. Never put a Supabase service-role key in browser code.
4. Remove browser-side admin authorization and public raw-GitHub state synchronization.
5. Verify order creation, status changes, inventory updates, and admin permissions using separate customer/admin accounts.
6. Add payment processing only through a provider integration with trusted server-side webhook verification. Existing payment labels are not payment processing.
7. Restore or replace the referenced `assets/logo.jpg` asset; the current repository tree does not contain an `assets` directory.
8. Add automated tests, monitoring, backups, and a tested recovery procedure.

## GitHub Pages

The static Pages workflow is intentionally **manual-only** while the privacy and backend blockers remain open. The current test-mode interface is for development review only and is not an approved public ordering release. It publishes only the HTML, CSS, JavaScript, and optional assets—not the repository's `data/` directory or deployment documents.

After the blockers are resolved:
1. In GitHub, open **Settings → Pages** for this repository.
2. Select **GitHub Actions** as the build and deployment source.
3. Set the custom domain to `texasranchmeat.com` and complete GitHub's domain verification.
4. Confirm the Pages custom domain is configured before changing DNS.
5. Run the Pages workflow manually and verify the site and HTTPS before directing customers to it.

## GoDaddy DNS

Only after GitHub Pages accepts the custom domain and verification is complete, manage DNS in GoDaddy (provided the domain uses GoDaddy nameservers):

- Apex `@` A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
- `www` CNAME: `harshithm97.github.io`.

Do not delete or alter MX, TXT, or other existing records; they may support email or domain verification. DNS propagation can take time. Enable HTTPS in GitHub Pages after DNS is verified.

## Supabase setup still required

Create a Supabase project, then configure the schema, Auth providers, Row Level Security policies, and any Edge Functions. Store only the public anon/publishable key in the frontend; keep service-role credentials server-side. A Supabase project URL and publishable key have been supplied in the project conversation but are not yet wired into the application. Configure the client, schema, Auth, RLS, and Edge Functions before production. Do not commit any service-role key or WhatsApp provider token.
