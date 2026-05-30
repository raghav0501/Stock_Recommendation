import type { MarketIndex } from "../models/Market";
import { sanitizeSymbol, sanitizeExchange } from "../utils/sanitize";
import { ApiError } from "../utils/apiError";
import { STORAGE_KEYS } from '../constants/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ── Token helpers ──────────────────────────────────────────────────

function getStoredSession(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

function getAccessToken(): string | null {
  return getStoredSession()?.accessToken ?? null;
}

function getRefreshToken(): string | null {
  return getStoredSession()?.refreshToken ?? null;
}

function saveTokens(accessToken: string, refreshToken: string): void {
  const session = getStoredSession() ?? {};
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ ...session, accessToken, refreshToken }));
}

function forceLogout(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  localStorage.removeItem(STORAGE_KEYS.USER);
  window.location.href = '/login/otp';
}

// ── Single-flight refresh guard ────────────────────────────────────
// Ensures only one /auth/refresh call goes out at a time; all other
// concurrent INVALID_TOKEN responses queue on the same promise.

let pendingRefresh: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      forceLogout();
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok || body?.status !== 'success') {
      forceLogout();
      throw new Error('Session expired. Please log in again.');
    }

    const { accessToken, refreshToken: newRefreshToken } = body.data as {
      accessToken: string;
      refreshToken: string;
    };
    saveTokens(accessToken, newRefreshToken);
    return accessToken;
  })().finally(() => {
    pendingRefresh = null;
  });

  return pendingRefresh;
}

// ── Core API call ──────────────────────────────────────────────────

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, { headers, ...options });
  } catch {
    throw new ApiError('network', null, 'No internet connection');
  }

  // Parse body regardless of status so we can inspect error codes
  const data: unknown = await response.json().catch(() => null);

  // Detect expired token by response body code
  const isTokenExpired =
    (data as { code?: string } | null)?.code === 'INVALID_TOKEN';

  if (isTokenExpired) {
    if (isRetry) {
      // Refresh succeeded but the retry still failed — force logout
      forceLogout();
      throw new Error('Session expired. Please log in again.');
    }
    const newToken = await refreshAccessToken();
    const retryHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${newToken}`,
    };
    return apiCall<T>(endpoint, { ...options, headers: retryHeaders }, true);
  }

  if (!response.ok) {
    const message = (data as { message?: string } | null)?.message
      ?? `${response.status} ${response.statusText}`;
    const type =
      response.status === 403 ? 'forbidden' :
      response.status >= 500 ? 'server' : 'client';
    throw new ApiError(type, response.status, message);
  }

  return data as T;
}

// ===== TYPES =====

export interface TechnicalSignal {
  name: string;
  description: string;
}

export interface Exchange {
  value: string;
  label: string;
}



export interface ScreenedStock {
  symbol: string;
  latest_price: number;
  price_change_pct: number;
}

export interface ScreenResponse {
  success: boolean;
  data: {
    exchange: string;
    count: number;
    buy: ScreenedStock[];
    neutral: ScreenedStock[];
    sell: ScreenedStock[];
  };
}

export interface OHLCVData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalData {
  time: string;
  sma_20?: number | null;
  sma_50?: number | null;
  sma_200?: number | null;
  ema_20?: number | null;
  ema_50?: number | null;
  wma_20?: number | null;
  tema_30?: number | null;
  kama_30?: number | null;
  adx_14?: number | null;
  trix?: number | null;
  rsi_14?: number | null;
  macd?: number | null;
  macd_signal?: number | null;
  macd_hist?: number | null;
  stoch_k?: number | null;
  stoch_d?: number | null;
  cci_20?: number | null;
  roc_10?: number | null;
  mom_10?: number | null;
  willr_14?: number | null;
  ultosc?: number | null;
  apo?: number | null;
  ppo?: number | null;
  atr_14?: number | null;
  natr?: number | null;
  bb_upper?: number | null;
  bb_mid?: number | null;
  bb_lower?: number | null;
  stddev_20?: number | null;
  var_20?: number | null;
  obv?: number | null;
  adosc?: number | null;
  mfi_14?: number | null;
  chaikin?: number | null;
  ados?: number | null;
  [key: string]: number | string | null | undefined;
}

export interface StockMetadata {
  company_name: string;
  sector: string;
  industry: string;
  description: string;
  website: string;
  country: string;
  employees: number;
}

// export interface ProfitabilityData {
//   date: string;
//   'Net Income': number;
//   'Total Revenue': number;
//   'Operating Income': number;
//   'Gross Profit': number;
//   EBITDA: number;
//   EBIT: number;
// }

// export interface ValuationData {
//   date: string;
//   'P/E Ratio': number;
//   'Forward P/E': number;
//   'P/B Ratio': number;
//   'Market Cap': number;
// }

// export interface FinancialHealthData {
//   date: string;
//   'Total Assets': number;
//   'Total Debt': number;
//   'Stockholders Equity': number;
//   'Current Assets': number;
//   'Current Liabilities': number;
//   'Cash & Equivalents': number;
//   'Working Capital': number;
// }

export interface StockDetailsResponse {
  success: boolean;
  metadata?: StockMetadata;
  ohlcv: OHLCVData[];
  technicals: TechnicalData[];
  summary: string;
  // fundamentals: Fundamentals;
}

export interface NewsArticle {
  news_id: string;
  title: string;
  url: string;
  source: string;
  published_date: string;
  description: string;
  thumbnail_url: string;
  score: number;
}

export interface StockNewsResponse {
  success: boolean;
  ticker: string;
  rss_news: NewsArticle[];
  rss_news_count: number;
  rss_summary: string;
  telegram_news: NewsArticle[];
  telegram_news_count: number;
  telegram_summary: string;
  full_summary: string;
  error: string | null;
}

export interface StockFundamentals {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  avg_volume: number;
  trailing_pe: number;
  forward_pe: number;
  market_cap: number;
  eps: number;
  high_52w: number;
  low_52w: number;
  price_to_book: number;
}

export interface FundamentalsResponse {
  exchange: string;
  ticker: string;
  currency: string;
  stock_data: StockFundamentals;
}

export interface EarlyAlertDayData {
  date: string;
  close: number;
  bb_lower: number | null;
  bb_lower_delta: number | null;
  bb_upper: number | null;
  bb_upper_delta: number | null;
  rsi: number | null;
  rsi_lower: number | null;
  rsi_lower_delta: number | null;
  rsi_upper: number | null;
  rsi_upper_delta: number | null;
}

export interface EarlyAlertSignalItem {
  symbol: string;
  company_name: string;
  mcap_top_100: number;
  bbands_20_EA: number;
  rsi_14_EA: number;
  last_5_days: EarlyAlertDayData[];
}

export interface EarlyAlertsResponse {
  success: boolean;
  data: {
    signals: EarlyAlertSignalItem[];
  };
  error: string | null;
}

export interface Indicators {
  // success: boolean;
  // data: {
    // indicators: {
  id: string;
  name: string;
  description: string;
  category: string;
  scale: string;
  isActive: boolean;
    // }[];
  // }
}

// ===== API FUNCTIONS =====

/**
 * Get all available technical indicators/signals
 */
export async function getSignals(): Promise<{ signals: TechnicalSignal[] }> {
  return apiCall('/api/signals');
}

/**
 * Get supported exchanges
 */
export async function getExchanges(): Promise<{ exchanges: Exchange[] }> {
  return apiCall('/api/exchanges');
}

export async function getIndicators(): Promise<Indicators[]> {
  const response = await apiCall<{ status: string; data: { indicators: Indicators[] } }>('/api/indicators/all');
  if (!response.data?.indicators) {
    throw new ApiError('server', null, 'Malformed indicators response');
  }
  return response.data.indicators;
};

export async function getMarketData(exchange?: string): Promise<MarketIndex[]> {
    const selectedExchange = sanitizeExchange(exchange || localStorage.getItem(STORAGE_KEYS.EXCHANGE) || 'india');
    const response = await apiCall<{ status: string; data: { indices: MarketIndex[] } }>(`/api/markets/indices/${encodeURIComponent(selectedExchange)}`);
    if (!response.data?.indices) {
      throw new ApiError('server', null, 'Malformed market indices response');
    }
    return response.data.indices;
}

/**
 * Screen stocks based on technical indicators
 */
export async function screenStocks(
  exchange: string,
  filtersArray: string[]
): Promise<ScreenResponse> {

  const filters = Object.fromEntries(
    filtersArray.map(filter => [filter, {}])
  );

  return apiCall('/api/screen', {
    method: 'POST',
    body: JSON.stringify({
      exchange,
      filters,
    }),
  });
}

/**
 * Get detailed stock information
 */
export async function getStockDetails(
  exchange: string,
  symbol: string,
  indicators: string[] = []
): Promise<StockDetailsResponse> {
  return apiCall('/api/stock-details', {
    method: 'POST',
    body: JSON.stringify({
      exchange,
      symbol,
      indicators,
    }),
  });
}

export async function getStockFundamentals(
  symbol: string,
  exchange: string
): Promise<FundamentalsResponse> {
  const safeExchange = sanitizeExchange(exchange);
  const safeSymbol = sanitizeSymbol(symbol);
  return apiCall(`/api/stock-details/stock_snapshot/${encodeURIComponent(safeExchange)}/${encodeURIComponent(safeSymbol)}`, {
    method: 'POST'
  });
}
/**
 * Get stock news
 */
export async function getStockNews(symbol: string): Promise<StockNewsResponse> {
  return apiCall(`/api/stock-details/news/stock/combined/${encodeURIComponent(sanitizeSymbol(symbol))}`);
}

/**
 * Get early alert signals for a given exchange
 */
export async function getEarlyAlerts(exchange: string): Promise<EarlyAlertsResponse> {
  return apiCall(`/api/watchlist/alerts/early?exchange=${encodeURIComponent(sanitizeExchange(exchange))}`);
}

// ===== PORTFOLIO TYPES =====

export interface PortfolioItem {
  symbol: string;
  companyName: string;
  exchange: string;
  addedAt: string;
}

export interface PortfolioResponse {
  status: string;
  data: {
    watchlist: PortfolioItem[];
  };
}

// ===== PORTFOLIO API =====

export async function getPortfolio(exchange: string): Promise<PortfolioResponse> {
  return apiCall(`/api/watchlist?exchange=${encodeURIComponent(exchange)}`);
}

export async function addToPortfolio(
  symbol: string,
  company_name: string,
  exchange: string
): Promise<PortfolioItem> {
  return apiCall('/api/watchlist', {
    method: 'POST',
    body: JSON.stringify({ symbol, company_name, exchange: exchange.toLowerCase() }),
  });
}

export async function removeFromPortfolio(symbol: string): Promise<void> {
  return apiCall(`/api/watchlist/${encodeURIComponent(symbol)}`, { method: 'DELETE' });
}

// ===== ACTIVE ALERTS TYPES =====

export interface ActiveAlertSignal {
  symbol: string;
  company_name: string;
  bbands_20: number;
  rsi_14: number;
  bbands_20_EA: number;
  rsi_14_EA: number;
  description: string;
}

export interface ActiveAlertsResponse {
  success: boolean;
  data: {
    signals: ActiveAlertSignal[];
  };
  error: string | null;
}

export async function getActiveAlerts(exchange: string): Promise<ActiveAlertsResponse> {
  return apiCall(`/api/watchlist/alerts/active?exchange=${encodeURIComponent(exchange)}`);
}

/**
 * Helper function to get stock price change info
 */
export function getStockPriceChange(stock: ScreenedStock): {
  change: number;
  changePercent: number;
  isPositive: boolean;
} {
  const changePercent = stock.price_change_pct;
  const change = (stock.latest_price * changePercent) / 100;
  
  return {
    change,
    changePercent,
    isPositive: changePercent >= 0,
  };
}

/**
 * Map backend sentiment to our app's sentiment
 */
export function mapBackendSentiment(category: 'buy' | 'neutral' | 'sell'): 'bullish' | 'neutral' | 'bearish' {
  const sentimentMap = {
    buy: 'bullish' as const,
    neutral: 'neutral' as const,
    sell: 'bearish' as const,
  };
  
  return sentimentMap[category];
}

/**
 * Get latest fundamentals from the array
 */
// export function getLatestFundamentals(fundamentals: Fundamentals) {
//   const latestProfitability = fundamentals.profitability[fundamentals.profitability.length - 1];
//   const latestValuation = fundamentals.valuation[fundamentals.valuation.length - 1];
//   const latestFinancialHealth = fundamentals.financial_health[fundamentals.financial_health.length - 1];

//   return {
//     marketCap: latestValuation?.['Market Cap'] || 0,
//     peRatio: latestValuation?.['P/E Ratio'] || 0,
//     pbRatio: latestValuation?.['P/B Ratio'] || 0,
//     forwardPE: latestValuation?.['Forward P/E'] || 0,
//     revenue: latestProfitability?.['Total Revenue'] || 0,
//     netIncome: latestProfitability?.['Net Income'] || 0,
//     operatingIncome: latestProfitability?.['Operating Income'] || 0,
//     grossProfit: latestProfitability?.['Gross Profit'] || 0,
//     ebitda: latestProfitability?.EBITDA || 0,
//     totalAssets: latestFinancialHealth?.['Total Assets'] || 0,
//     totalDebt: latestFinancialHealth?.['Total Debt'] || 0,
//     stockholdersEquity: latestFinancialHealth?.['Stockholders Equity'] || 0,
//     currentRatio: latestFinancialHealth ? 
//       latestFinancialHealth['Current Assets'] / latestFinancialHealth['Current Liabilities'] : 0,
//     debtToEquity: latestFinancialHealth ? 
//       latestFinancialHealth['Total Debt'] / latestFinancialHealth['Stockholders Equity'] : 0,
//   };
// }

export default {
  getSignals,
  getExchanges,
  screenStocks,
  getStockDetails,
  getStockNews,
  getStockPriceChange,
  mapBackendSentiment,
  // getLatestFundamentals,
};