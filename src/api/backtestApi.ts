// TODO: Replace API_BASE_URL usage with real endpoint when backend is ready
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo2-664110982097.us-central1.run.app';

export interface BacktestRequest {
  symbol: string;
  indicator: string;
  from: string; // ISO date "YYYY-MM-DD"
  to: string;
}

export interface SignalEntry {
  date: string;
  signal: 'BUY' | 'SELL';
  price: number;
}

export interface BacktestResult {
  buy_signals: number;
  sell_signals: number;
  signal_dates: SignalEntry[];
}

// TODO: Replace entire function body with real POST /api/backtest call when backend is ready
// Real call will look like:
// const response = await fetch(`${API_BASE_URL}/api/backtest`, {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify(params),
// });
// if (!response.ok) throw new Error(`Backtest API error: ${response.status}`);
// return response.json();
export async function runBacktest(params: BacktestRequest): Promise<BacktestResult> {
  void API_BASE_URL; // TODO: Remove this line when real API call is wired up

  // TODO: Remove mock data below when backend endpoint is available
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const start = new Date(params.from);
  const end = new Date(params.to);
  const dayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / dayMs));
  const signalCount = Math.max(3, Math.floor(totalDays / 12));

  const signals: SignalEntry[] = Array.from({ length: signalCount }, () => {
    const randomDay = Math.floor(Math.random() * totalDays);
    return {
      date: new Date(start.getTime() + randomDay * dayMs).toISOString().split('T')[0],
      signal: (Math.random() > 0.48 ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
      price: Math.round((100 + Math.random() * 2900) * 100) / 100,
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  return {
    buy_signals: signals.filter((s) => s.signal === 'BUY').length,
    sell_signals: signals.filter((s) => s.signal === 'SELL').length,
    signal_dates: signals,
  };
}
