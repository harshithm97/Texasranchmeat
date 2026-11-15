# Texas Ranch Meat: Docker + shared catalog API

The static storefront is served by NGINX. The Node API and PostgreSQL database run as separate Docker Compose services. Storefront/order pages now load product pricing, stock counts, and store settings from `GET /api/catalog` on every page load; they no longer read the public GitHub raw JSON file. The API is the catalog source of truth for all devices using this deployment.

## Start locally

1. Install Docker Desktop (or Docker Engine with Compose).
2. Copy `.env.example` to `.env`; replace both example passwords/tokens with long, unique random values. Do not commit `.env`.
3. Run `docker compose up --build -d`.
4. Open `http://localhost:8080` (or the configured `WEB_PORT`). On another device on the same Wi-Fi, open `http://<host-computer-LAN-IP>:8080`.
5. Check the API at `http://localhost:8080/api/health` and catalog at `http://localhost:8080/api/catalog`.

The database is persisted in the `ranch_db` Docker volume. `docker compose down` preserves data; `docker compose down -v` deletes it.

## Update the shared catalog

Catalog writes require the server-side admin token. Keep it out of browser JavaScript and never commit `.env`. For example, from a trusted machine with the token set in its environment:

```bash
curl -X PUT http://localhost:8080/api/admin/catalog \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data @catalog.json
```

`catalog.json` must contain `settings` (`deliveryFee`, `windowMode`, `chickenEnabled`) and `products` (the product objects). The existing browser admin page has not yet been converted to authenticated API writes; its local edits are not shared. Do not paste the admin token into that page or frontend code.

## Important current limitations

- Customer profiles, browser sessions, carts, and orders remain in each browser's localStorage. They do not sync across devices.
- Checkout has not yet been moved to an authenticated, transactional backend endpoint, so placing an order does not reserve shared stock in PostgreSQL. Catalog stock changes made through the protected API are shared, but order checkout is still demo-only.
- The existing phone-number login and browser admin check are not real authentication. Before taking real customer orders, add verified authentication (such as OTP or a hosted identity provider), then implement authenticated customer/order endpoints and database-backed admin authorization.
- The old `data/ranch-state.json` file is no longer used by the storefront. If it contains private records or credentials, assume the repository/raw URL may expose them; remove them and rotate any committed credentials.

## Production deployment

For access beyond a trusted local network, deploy behind HTTPS with a domain, restrict database network access, set strong secrets through the hosting provider's secret manager, and configure automated PostgreSQL backups. Do not expose port 5432 publicly. This starter is not yet a production order-processing or customer-authentication system.
