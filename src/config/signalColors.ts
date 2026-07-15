// ── Direction-based badge classes ──────────────────────────────────
// Applied to signal badges; color conveys direction (no text needed)
export const BADGE = {
  up:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  down: 'bg-rose-500/15    text-rose-400    border-rose-500/30',
} as const;

// ── Type-based filter chip active classes ──────────────────────────
// Applied to filter pill toggles when active
export const CHIP = {
  bollingerBand: 'bg-blue-500/15   text-blue-400   border-blue-500/30',
  rsi:           'bg-purple-500/15 text-purple-400 border-purple-500/30',
  earlyAlertBB:  'bg-amber-500/15  text-amber-400  border-amber-500/30',
  earlyAlertRSI: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  mcapTop100:    'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
} as const;

// ── Chart series colors ────────────────────────────────────────────
export const CHART = {
  // Bollinger Band
  bb:       '#f97316',               // bands — orange-500
  bbDelta:  '#fb923c',               // delta zone boundaries — orange-400

  // RSI
  rsi:      '#8b5cf6',               // RSI line — purple-500
  rsiDelta: '#06b6d4',               // RSI delta zone — cyan-500

  // RSI reference levels
  rsiOver:  '#ef4444',               // overbought 70 — red-500
  rsiUnder: '#10b981',               // oversold 30 — emerald-500
} as const;
