export function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return "";
}

export function formatMoney(value) {
  const amount = Number(value ?? 0);
  return "$" + (Number.isFinite(amount) ? amount : 0).toFixed(2);
}

export function calculateCartTotals(cart, deliveryFee = 2.99) {
  const items = Array.isArray(cart) ? cart : [];
  const subtotal = items.reduce((sum, item) => {
    const weight = Math.max(0, Number(item.weight_lb) || 0);
    const price = Math.max(0, Number(item.price_per_lb) || 0);
    const quantity = Math.max(0, Math.floor(Number(item.qty) || 0));
    return sum + weight * price * quantity;
  }, 0);
  const roundedSubtotal = Math.round((subtotal + Number.EPSILON) * 100) / 100;
  const fee = Number(deliveryFee);
  const safeFee = Number.isFinite(fee) && fee >= 0 ? fee : 0;
  return { subtotal: roundedSubtotal, deliveryFee: safeFee, total: Math.round((roundedSubtotal + safeFee + Number.EPSILON) * 100) / 100 };
}

export function addCartItem(cart, product) {
  const current = Array.isArray(cart) ? cart : [];
  if (!product || !product.id) return { cart: current, added: false, reason: "invalid-product" };
  const stock = Math.max(0, Math.floor(Number(product.stock) || 0));
  if (stock < 1) return { cart: current, added: false, reason: "out-of-stock" };
  const existing = current.find(item => item.id === product.id);
  if (existing && existing.qty >= stock) {
    return { cart: current, added: false, reason: "stock-limit" };
  }
  if (existing) {
    return {
      cart: current.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item),
      added: true,
      reason: null
    };
  }
  return {
    cart: [...current, {
      id: product.id,
      name: product.name,
      weight_lb: Number(product.weight_lb),
      price_per_lb: Number(product.price_per_lb),
      qty: 1,
      stock
    }],
    added: true,
    reason: null
  };
}
