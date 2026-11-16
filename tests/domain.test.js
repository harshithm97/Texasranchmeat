import test from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, formatMoney, calculateCartTotals, addCartItem } from "../js/domain.js";

test("normalizePhone accepts ten digit US numbers and formatted input", () => {
  assert.equal(normalizePhone("949-295-4650"), "+19492954650");
  assert.equal(normalizePhone("(949) 295-4650"), "+19492954650");
});
test("normalizePhone accepts country-prefixed US numbers", () => {
  assert.equal(normalizePhone("1 949 295 4650"), "+19492954650");
});
test("normalizePhone rejects missing, malformed and non-US-length values", () => {
  assert.equal(normalizePhone(null), "");
  assert.equal(normalizePhone("12345"), "");
  assert.equal(normalizePhone("29492954650"), "");
  assert.equal(normalizePhone("2349292954650"), "");
});
test("formatMoney formats valid values and safely handles invalid values", () => {
  assert.equal(formatMoney(12), "$12.00");
  assert.equal(formatMoney(12.345), "$12.35");
  assert.equal(formatMoney(undefined), "$0.00");
  assert.equal(formatMoney("not-a-number"), "$0.00");
});
test("calculateCartTotals calculates pack subtotal, delivery and total", () => {
  const cart = [{ weight_lb: 2, price_per_lb: 11.49, qty: 2 }, { weight_lb: 3, price_per_lb: 6.5, qty: 1 }];
  assert.deepEqual(calculateCartTotals(cart, 2.99), { subtotal: 65.46, deliveryFee: 2.99, total: 68.45 });
});
test("calculateCartTotals handles empty, invalid cart and invalid item values", () => {
  assert.deepEqual(calculateCartTotals([], 2.99), { subtotal: 0, deliveryFee: 2.99, total: 2.99 });
  assert.deepEqual(calculateCartTotals([{ weight_lb: 1, price_per_lb: 2, qty: 1 }]), { subtotal: 2, deliveryFee: 2.99, total: 4.99 });
  assert.deepEqual(calculateCartTotals(null, -1), { subtotal: 0, deliveryFee: 0, total: 0 });
  assert.deepEqual(calculateCartTotals([{ weight_lb: 0, price_per_lb: 0, qty: 0 }], 0), { subtotal: 0, deliveryFee: 0, total: 0 });
  assert.deepEqual(calculateCartTotals([{ weight_lb: -1, price_per_lb: "bad", qty: -2 }], "bad"), { subtotal: 0, deliveryFee: 0, total: 0 });
});
test("addCartItem rejects invalid products and out-of-stock products", () => {
  const empty = [];
  assert.deepEqual(addCartItem(empty, null), { cart: empty, added: false, reason: "invalid-product" });
  assert.equal(addCartItem(empty, {}).reason, "invalid-product");
  assert.equal(addCartItem(null, { id: "goat", stock: 1, weight_lb: 2, price_per_lb: 10 }).added, true);
  assert.equal(addCartItem(empty, { id: "x", stock: 0 }).reason, "out-of-stock");
});
test("addCartItem adds a new item with normalized numeric fields", () => {
  const result = addCartItem([], { id: "goat", name: "Goat cut", weight_lb: "2", price_per_lb: "11.49", stock: "4" });
  assert.equal(result.added, true);
  assert.deepEqual(result.cart, [{ id: "goat", name: "Goat cut", weight_lb: 2, price_per_lb: 11.49, qty: 1, stock: 4 }]);
});
test("addCartItem increments an existing item without mutating its input", () => {
  const original = [{ id: "goat", qty: 1, stock: 3 }, { id: "other", qty: 1, stock: 2 }];
  const result = addCartItem(original, { id: "goat", stock: 3 });
  assert.equal(result.added, true);
  assert.equal(result.cart[0].qty, 2);
  assert.equal(original[0].qty, 1);
});
test("addCartItem prevents quantities above available stock", () => {
  const original = [{ id: "goat", qty: 2, stock: 2 }];
  const result = addCartItem(original, { id: "goat", stock: 2 });
  assert.equal(result.added, false);
  assert.equal(result.reason, "stock-limit");
  assert.equal(result.cart, original);
});
