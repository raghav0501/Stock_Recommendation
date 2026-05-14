/**
 * Backend API Service
 * Centralized service for all API calls to the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo2-664110982097.us-central1.run.app';

/**
 * Generic API call handler with error handling
 */

function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('alumnus_session');
    if (!raw) return null;
    return (JSON.parse(raw) as { accessToken?: string }).accessToken ?? null;
  } catch {
    return null;
  }
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const token = getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API Call:', url, options.method || 'GET');
    
    const response = await fetch(url, {
      headers,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
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
  return apiCall(`/api/stock-details/stock_snapshot/${exchange}/${symbol}`, {
    method: 'POST'
  });
}
/**
 * Get stock news
 */
export async function getStockNews(symbol: string): Promise<StockNewsResponse> {
  return apiCall(`/api/stock-details/news/stock/combined/${symbol}`);
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