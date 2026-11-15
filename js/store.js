import { fetchSharedCatalog } from "./api.js";

const STORAGE_KEY = "trm_multipage_v1";
const SESSION_KEY = "trm_active_phone";
const PRIMARY_ADMIN = ["949", "295", "4650"].join("");
const memoryStore = {};

export const safeStorage = {
  get(key) {
    try { return window.localStorage.getItem(key); } catch { return memoryStore[key] || null; }
  },
  set(key, val) {
    try { window.localStorage.setItem(key, val); } catch { memoryStore[key] = val; }
  },
  remove(key) {
    try { window.localStorage.removeItem(key); } catch { delete memoryStore[key]; }
  }
};

export const ORDER_STAGES = ["Received", "Packaged", "On the Way!", "Delivered"];

const DEFAULT_STATE = {
  settings: { deliveryFee: 2.99, windowMode: "auto", chickenEnabled: false },
  admins: [PRIMARY_ADMIN],
  products: [
    { id: "goat-curry", category: "goat", name: "Bone-In Goat Curry Cut", weightLb: 2, pricePerLb: 11.49, stock: 20 },
    { id: "goat-shoulder", category: "goat", name: "Texas Pasture Goat Shoulder", weightLb: 3, pricePerLb: 12.29, stock: 14 },
    { id: "goat-leg", category: "goat", name: "Whole Ranch Goat Leg", weightLb: 4, pricePerLb: 13.49, stock: 10 },
    { id: "goat-biryani", category: "goat", name: "Ranch Biryani Cut (Bone-In)", weightLb: 2, pricePerLb: 11.99, stock: 16 },
    { id: "chicken-country", category: "chicken", name: "Pasture Country Chicken (Whole)", weightLb: 3.5, pricePerLb: 6.49, stock: 0 }
  ],
  customers: {},
  orders: []
};

export function normalizePhone(raw) {
  return String(raw || "").replace(/\D/g, "").slice(-10);
}

export function formatPhone(digits) {
  const d = normalizePhone(digits);
  if (d.length !== 10) return d;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function isDallas30MileZip(zip) {
  const clean = String(zip || "").replace(/\D/g, "");
  if (clean.length !== 5) return false;
  const num = parseInt(clean, 10);
  return num >= 75001 && num <= 76299;
}

export function loadState() {
  const raw = safeStorage.get(STORAGE_KEY);
  if (!raw) {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState(fresh);
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw);
    const merged = { ...JSON.parse(JSON.stringify(DEFAULT_STATE)), ...parsed };
    if (!Array.isArray(merged.admins)) merged.admins = [PRIMARY_ADMIN];
    if (!merged.admins.includes(PRIMARY_ADMIN)) merged.admins.unshift(PRIMARY_ADMIN);
    if (!merged.settings || typeof merged.settings !== "object") merged.settings = { ...DEFAULT_STATE.settings };
    if (!Array.isArray(merged.products)) merged.products = DEFAULT_STATE.products;
    if (!merged.customers || typeof merged.customers !== "object") merged.customers = {};
    if (!Array.isArray(merged.orders)) merged.orders = [];
    return merged;
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

// Customer profiles, orders, and the browser session are still local-only.
// Products and public settings are always refreshed from the shared API.
export function saveState(state) {
  safeStorage.set(STORAGE_KEY, JSON.stringify(state));
}

export function getSessionPhone() {
  return normalizePhone(safeStorage.get(SESSION_KEY));
}

export function setSessionPhone(phone) {
  const norm = normalizePhone(phone);
  if (norm) safeStorage.set(SESSION_KEY, norm);
  else safeStorage.remove(SESSION_KEY);
}

export function isAdminUser(state, phone = getSessionPhone()) {
  const norm = normalizePhone(phone);
  return norm.length === 10 && Array.isArray(state.admins) && state.admins.includes(norm);
}

export function isOrderWindowOpen(state) {
  if (state.settings.windowMode === "open") return true;
  if (state.settings.windowMode === "closed") return false;
  const cstString = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
  const day = new Date(cstString).getDay();
  return day === 5 || day === 6;
}

export function showToast(msg) {
  let el = document.getElementById("ranchToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "ranchToast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}

export function renderHeader(activePage) {
  const state = loadState();
  const phone = getSessionPhone();
  const admin = isAdminUser(state, phone);
  const header = document.getElementById("siteHeader");
  if (!header) return;

  const brand = `
    <a href="index.html" class="brand-link">
      <img src="assets/logo.jpg" alt="Texas Ranch Meat" class="brand-logo" />
      <span>Texas Ranch Meat</span>
    </a>
  `;

  if (!phone || !state.customers[phone]) {
    header.innerHTML = brand;
    return;
  }

  header.innerHTML = `${brand}
    <nav class="ranch-nav" aria-label="Main navigation">
      <a href="index.html" class="${activePage === "store" ? "active" : ""}">Storefront</a>
      <a href="orders.html" class="${activePage === "orders" ? "active" : ""}">My Sunday Orders</a>
      <a href="profile.html" class="${activePage === "profile" ? "active" : ""}">Ranch Profile</a>
      ${admin ? `<a href="admin.html" class="admin-link ${activePage === "admin" ? "active" : ""}">Ranch Admin</a>` : ""}
    </nav>
  `;
}

export async function pullRemoteState() {
  const local = loadState();
  const catalog = await fetchSharedCatalog();
  return {
    ...local,
    settings: catalog.settings,
    products: catalog.products
  };
}
