const BACKTEST_API_BASE = import.meta.env.VITE_MIDDLEWARE_URL || 'http://localhost:3000';
// const BACKTEST_API_BASE = 'http://localhost:3000';

export interface BacktestRequest {
  exchange: string;
  symbol: string;
  indicator: string;
  date_from: string;
  date_to: string;
}

export interface PlotSignalPoint {
  date: string;
  signal: number; // 1=buy, -1=sell, 0=none
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number;
  [key: string]: unknown; // indicator value(s) keyed by indicator id (e.g. rsi_14, bb_upper, etc.)
}

export interface BacktestResult {
  exchange: string;
  symbol: string;
  date_from: string;
  date_to: string;
  indicator: string;
  bull_count: number;
  bear_count: number;
  plot_chart_signal: PlotSignalPoint[];
}

function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('alumnus_session');
    if (!raw) return null;
    return (JSON.parse(raw) as { accessToken?: string }).accessToken ?? null;
  } catch {
    return null;
  }
}

export async function runBacktest(params: BacktestRequest): Promise<BacktestResult> {
  const token = getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BACKTEST_API_BASE}/api/backtest/signalcount`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) throw new Error(`Backtest API error: ${res.status}`);

  const json = await res.json();
  if (json.status !== 'success') throw new Error('Backtest API returned failure status');

  return json.data as BacktestResult;
}
