export async function fetchSharedCatalog() {
  try {
    const response = await fetch("/api/catalog", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) return null;
    const catalog = await response.json();
    if (!catalog || !catalog.settings || !Array.isArray(catalog.products)) return null;
    return catalog;
  } catch {
    return null;
  }
}
