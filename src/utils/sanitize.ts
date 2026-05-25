const SYMBOL_RE = /^[A-Z0-9&._-]{1,30}$/i;
const KNOWN_EXCHANGES = ['india', 'us'] as const;

export function sanitizeSymbol(symbol: string): string {
  const s = symbol.trim();
  if (!SYMBOL_RE.test(s)) throw new Error(`Invalid symbol format: "${s}"`);
  return s;
}

export function sanitizeExchange(exchange: string): string {
  const e = exchange.trim().toLowerCase();
  if (!(KNOWN_EXCHANGES as readonly string[]).includes(e)) {
    throw new Error(`Unknown exchange: "${e}"`);
  }
  return e;
}
