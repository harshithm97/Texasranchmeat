# Texas Ranch Meat: Docker + shared catalog API

This setup serves the existing static storefront with NGINX and adds a Node.js API backed by PostgreSQL. The catalog (prices, stock, and storefront settings) is shared by devices that open the same deployed site.

## Start locally

1. Install Docker Desktop (or Docker Engine with Compose).
2. Copy `.env.example` to `.env`; replace both example passwords/tokens with long, unique random values. Do not commit `.env`.
3. Run `docker compose up --build -d`.
4. Open `http://localhost:8080` (or the configured `WEB_PORT`). On another device on the same Wi-Fi, open `http://<host-computer-LAN-IP>:8080`.
5. Check the API at `http://localhost:8080/api/health`.

The database is persisted in the `ranch_db` Docker volume. `docker compose down` preserves data; `docker compose down -v` deletes it.

## Update the shared catalog

The API exposes public `GET /api/catalog`. To update inventory/prices, make a server-side admin request (keep the token out of browser JavaScript):

```bash
curl -X PUT http://localhost:8080/api/admin/catalog \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data @catalog.json
```

`catalog.json` must contain `settings` (`deliveryFee`, `windowMode`, `chickenEnabled`) and `products` (the product objects). The token is an operations credential, not customer login.

## Important current limitation

`js/store.js` now reads the catalog API first, but the existing storefront still saves customer profiles, sessions, carts, and orders in each browser's localStorage. Those records do **not** sync between devices, and this API does not expose customer or order endpoints. It is intentionally not using a phone number as proof of identity. Before taking real customer orders, add a trusted authentication flow (for example, verified OTP or a hosted identity provider), then implement authenticated customer/order endpoints and database-backed admin authorization. Never expose database credentials or the admin token in frontend code.

The old `data/ranch-state.json` file should not contain customer data or secrets: GitHub repository contents and raw-file URLs can be publicly readable. Rotate any credentials that have ever been committed and remove/secure any personal records.

## Production deployment

For access beyond a trusted local network, deploy behind HTTPS with a domain, restrict database network access, set strong secrets through the hosting provider's secret manager, and configure automated PostgreSQL backups. Do not expose port 5432 publicly. This starter is not yet a production order-processing or customer-authentication system.
