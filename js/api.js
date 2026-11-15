export async function fetchSharedCatalog() {
  const response = await fetch("/api/catalog", {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Catalog API unavailable (${response.status}). Please try again later.`);
  }
  const catalog = await response.json();
  if (!catalog || !catalog.settings || !Array.isArray(catalog.products)) {
    throw new Error("Catalog API returned invalid data.");
  }
  return catalog;
}
