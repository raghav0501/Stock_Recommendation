/**
 * Tiered symbol + name search.
 *
 * Priority order (highest first):
 *   1. Symbol starts with query
 *   2. Name starts with query
 *   3. Symbol contains query (non-prefix)
 *   4. Name contains query (non-prefix)
 *
 * Items within the same priority tier preserve their original order.
 */
export function searchBySymbolAndName<T>(
  items: T[],
  query: string,
  getSymbol: (item: T) => string,
  getName: (item: T) => string,
  limit?: number,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return limit ? items.slice(0, limit) : items;

  const tier1: T[] = [];
  const tier2: T[] = [];
  const tier3: T[] = [];
  const tier4: T[] = [];

  for (const item of items) {
    const sym  = getSymbol(item).toLowerCase();
    const name = getName(item).toLowerCase();

    if (sym.startsWith(q))        { tier1.push(item); continue; }
    if (name.startsWith(q))       { tier2.push(item); continue; }
    if (sym.includes(q))          { tier3.push(item); continue; }
    if (name.includes(q))         { tier4.push(item); }
  }

  const ranked = [...tier1, ...tier2, ...tier3, ...tier4];
  return limit ? ranked.slice(0, limit) : ranked;
}
