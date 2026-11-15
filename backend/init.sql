CREATE TABLE IF NOT EXISTS catalog (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO catalog (id, payload)
VALUES (
  1,
  '{"settings":{"deliveryFee":2.99,"windowMode":"auto","chickenEnabled":false},"products":[{"id":"goat-curry","category":"goat","name":"Bone-In Goat Curry Cut","weightLb":2,"pricePerLb":11.49,"stock":20},{"id":"goat-shoulder","category":"goat","name":"Texas Pasture Goat Shoulder","weightLb":3,"pricePerLb":12.29,"stock":14},{"id":"goat-leg","category":"goat","name":"Whole Ranch Goat Leg","weightLb":4,"pricePerLb":13.49,"stock":10},{"id":"goat-biryani","category":"goat","name":"Ranch Biryani Cut (Bone-In)","weightLb":2,"pricePerLb":11.99,"stock":16},{"id":"chicken-country","category":"chicken","name":"Pasture Country Chicken (Whole)","weightLb":3.5,"pricePerLb":6.49,"stock":0}]}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
