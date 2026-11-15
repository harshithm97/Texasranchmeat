import crypto from "node:crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pg from "pg";

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 3000);
const adminToken = process.env.ADMIN_API_TOKEN;

if (!process.env.DATABASE_URL || !adminToken || adminToken.length < 32) {
  throw new Error("DATABASE_URL and an ADMIN_API_TOKEN of at least 32 characters are required.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "32kb" }));
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ error: "database_unavailable" });
  }
});

app.get("/api/catalog", async (_req, res) => {
  try {
    const result = await pool.query("SELECT payload, updated_at FROM catalog WHERE id = 1");
    if (!result.rowCount) return res.status(503).json({ error: "catalog_not_initialized" });
    res.set("Cache-Control", "no-store").json({ ...result.rows[0].payload, updatedAt: result.rows[0].updated_at });
  } catch {
    res.status(503).json({ error: "database_unavailable" });
  }
});

function hasValidAdminToken(req) {
  const supplied = req.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const actual = Buffer.from(supplied);
  const expected = Buffer.from(adminToken);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function validCatalog(value) {
  if (!value || typeof value !== "object" || !value.settings || !Array.isArray(value.products)) return false;
  const { deliveryFee, windowMode, chickenEnabled } = value.settings;
  if (!Number.isFinite(deliveryFee) || deliveryFee < 0 || !["auto", "open", "closed"].includes(windowMode) || typeof chickenEnabled !== "boolean") return false;
  return value.products.every((product) =>
    product && typeof product.id === "string" && typeof product.name === "string" &&
    Number.isFinite(product.weightLb) && product.weightLb > 0 &&
    Number.isFinite(product.pricePerLb) && product.pricePerLb >= 0 &&
    Number.isInteger(product.stock) && product.stock >= 0 &&
    ["goat", "chicken"].includes(product.category)
  );
}

app.put("/api/admin/catalog", async (req, res) => {
  if (!hasValidAdminToken(req)) return res.status(401).json({ error: "unauthorized" });
  if (!validCatalog(req.body)) return res.status(400).json({ error: "invalid_catalog" });

  try {
    const result = await pool.query(
      "UPDATE catalog SET payload = $1::jsonb, updated_at = NOW() WHERE id = 1 RETURNING updated_at",
      [JSON.stringify({ settings: req.body.settings, products: req.body.products })]
    );
    if (!result.rowCount) return res.status(503).json({ error: "catalog_not_initialized" });
    res.json({ ok: true, updatedAt: result.rows[0].updated_at });
  } catch {
    res.status(503).json({ error: "database_unavailable" });
  }
});

app.listen(port, "0.0.0.0", () => console.log(`Texas Ranch API listening on ${port}`));
