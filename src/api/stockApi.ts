import type { Stock } from '../models/Stock';
import { screenStocks, mapBackendSentiment, getStockPriceChange, getStockDetails, getStockNews, getStockFundamentals, type TechnicalData } from './backendService';
import { ApiError } from '../utils/apiError';

export interface StockDetail {
  metadata: {
    symbol: string;
    name: string;
    sector: string;
    industry: string;
    description: string;
    website: string;
    country: string;
    employees: number;
  };
  technicalIndicators: TechnicalData[];
  chartData: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  summary: string;
}

export interface StockNewsArticle {
  news: Array<{
    newsId: string;
    title: string;
    url: string;
    source: string;
    publishedDate: string;
    description: string;
    thumbnailUrl: string;
  }>;
  newsSummary: string;
}

export interface StockFundamentals {
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  avgVolume: string;
  marketCap: string;
  weekHigh52: string;
  weekLow52: string;
  peratio: string;
  pbratio: string;
  eps: string;
}

/**
 * Get filtered stocks from backend based on selected parameters
 */
export async function getFilteredStocks(selectedParameters: string[] = []): Promise<Stock[]> {
  const exchange = localStorage.getItem('selectedExchange') || 'india';

  if (selectedParameters.length === 0) return [];

  const response = await screenStocks(exchange, selectedParameters);

  if (!response.success || !response.data) {
    throw new Error('Failed to fetch stocks from backend');
  }

  const { buy, neutral, sell } = response.data;
  const allStocks: Stock[] = [];

  const mapStock = (backendStock: typeof buy[0], sentiment: 'buy' | 'neutral' | 'sell') => {
    const { change, changePercent } = getStockPriceChange(backendStock);
    allStocks.push({
      symbol: backendStock.symbol.replace('.NS', ''),
      name: backendStock.symbol.replace('.NS', ''),
      price: backendStock.latest_price,
      change,
      changePercent,
      volume: 0,
      marketCap: 0,
      peRatio: 0,
      sentiment: mapBackendSentiment(sentiment),
      technicalIndicators: { currentPrice: backendStock.latest_price },
      priceHistory: [],
    });
  };

  buy.forEach(s => mapStock(s, 'buy'));
  neutral.forEach(s => mapStock(s, 'neutral'));
  sell.forEach(s => mapStock(s, 'sell'));

  return allStocks;
}

/**
 * Function to fetch stock details only
 */
export async function getStockDetail(symbol: string, indicators: string[], exchangeOverride?: string): Promise<StockDetail> {
  const exchange = exchangeOverride || localStorage.getItem('selectedExchange') || 'india';
  const fullSymbol = exchange === 'india' && !symbol.endsWith('.NS') ? `${symbol}.NS` : symbol;
  const detailsResponse = await getStockDetails(exchange, fullSymbol, indicators);

  if (!detailsResponse.success) {
    throw new Error('Failed to fetch stock details');
  }

  return {
    metadata: {
      symbol: symbol.replace('.NS', ''),
      name: detailsResponse?.metadata?.company_name ?? '',
      sector: detailsResponse.metadata?.sector ?? '',
      industry: detailsResponse.metadata?.industry ?? '',
      description: detailsResponse.metadata?.description ?? '',
      website: detailsResponse.metadata?.website ?? '',
      country: detailsResponse.metadata?.country ?? '',
      employees: detailsResponse.metadata?.employees ?? 0,
    },
    technicalIndicators: detailsResponse.technicals ?? [],
    chartData: detailsResponse.ohlcv ?? [],
    summary: detailsResponse.summary ?? '',
  };
}

/**
 * Function to get the latest news for a stock
 */
export async function getStockNewsArticle(symbol: string): Promise<StockNewsArticle> {
  const exchange = localStorage.getItem('selectedExchange') || 'india';
  const fullSymbol = exchange === 'india' && !symbol.endsWith('.NS') ? `${symbol}.NS` : symbol;
  const newsResponse = await getStockNews(fullSymbol);

  if (!newsResponse.success) {
    throw new Error('Failed to fetch stock news');
  }

  const rssNews = (newsResponse.rss_news ?? []).map(article => ({
    newsId: article.news_id,
    title: article.title,
    url: article.url,
    source: article.source,
    publishedDate: article.published_date,
    description: article.description,
    thumbnailUrl: article.thumbnail_url,
  }));

  const telegramNews = (newsResponse.telegram_news ?? []).map(article => ({
    newsId: article.news_id,
    title: article.title,
    url: article.url,
    source: 'Telegram Geopolitics Prime',
    publishedDate: article.published_date,
    description: article.description,
    thumbnailUrl: '/telegram_logo.png',
  }));

  const news = [...rssNews, ...telegramNews].sort(
    (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
  );

  return { news, newsSummary: newsResponse.full_summary ?? '' };
}

/**
 * Function to get the latest fundamentals for a stock
 */
function getCurrencySymbol(currency: string): string {
  const map: Record<string, string> = { INR: '₹', USD: '$', GBP: '£', EUR: '€', JPY: '¥' };
  return map[currency?.toUpperCase()] ?? currency ?? '';
}

function fmtPrice(value: number | null | undefined, sym: string): string {
  if (value == null || isNaN(value)) return '—';
  return `${sym}${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtCompact(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9)  return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e7)  return `${(value / 1e7).toFixed(2)}Cr`;
  if (value >= 1e6)  return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3)  return `${(value / 1e3).toFixed(0)}K`;
  return value.toLocaleString();
}

function fmtRatio(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  return value.toFixed(2);
}

export async function getStockFundamentalsData(symbol: string, exchangeOverride?: string): Promise<StockFundamentals> {
  const exchange = exchangeOverride || localStorage.getItem('selectedExchange') || 'india';
  const fullSymbol = exchange === 'india' && !symbol.endsWith('.NS') ? `${symbol}.NS` : symbol;
  const fundamentalsResponse = await getStockFundamentals(fullSymbol, exchange);
  if (!fundamentalsResponse.stock_data) {
    throw new ApiError('server', null, 'Malformed fundamentals response');
  }
  const d = fundamentalsResponse.stock_data;
  const sym = getCurrencySymbol(fundamentalsResponse.currency ?? '');
  return {
    open:       fmtPrice(d.open, sym),
    high:       fmtPrice(d.high, sym),
    low:        fmtPrice(d.low, sym),
    close:      fmtPrice(d.close, sym),
    volume:     fmtCompact(d.volume),
    avgVolume:  fmtCompact(d.avg_volume),
    marketCap:  `${sym}${fmtCompact(d.market_cap)}`,
    weekHigh52: fmtPrice(d.high_52w, sym),
    weekLow52:  fmtPrice(d.low_52w, sym),
    peratio:    fmtRatio(d.trailing_pe),
    pbratio:    fmtRatio(d.price_to_book),
    eps:        fmtPrice(d.eps, sym),
  };
}
