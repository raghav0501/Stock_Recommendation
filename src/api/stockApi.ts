import type { Stock } from '../models/Stock';
import { screenStocks, mapBackendSentiment, getStockPriceChange, getStockDetails, getStockNews, getStockFundamentals, type TechnicalData } from './backendService';

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
  try {
    const exchange = localStorage.getItem('selectedExchange') || 'india';
    
    // If no parameters selected, return empty array
    if (selectedParameters.length === 0) {
      return [];
    }

    // Call backend API
    const response = await screenStocks(exchange, selectedParameters);

    if (!response.success || !response.data) {
      console.error('Failed to fetch stocks from backend');
      return [];
    }

    const { buy, neutral, sell } = response.data;
    // DEBUG LOGGING: No issues in the rendering part, we checked by overwriting the data.
    // let { buy, neutral, sell } = response.data;
    // console.log("Buy calls: ",buy);
    // sell = [{
    //   symbol: "TITAN",
    //   latest_price: 123,
    //   price_change_pct: 0.5
    // }];
    // console.log("Sell calls: ",sell);

    // Combine all stocks and map to our Stock interface
    const allStocks: Stock[] = [];

    // Map buy stocks
    buy.forEach(backendStock => {
      const { change, changePercent } = getStockPriceChange(backendStock);

      allStocks.push({
        symbol: backendStock.symbol.replace('.NS', ''),
        name: backendStock.symbol.replace('.NS', ''),
        price: backendStock.latest_price,
        change,
        changePercent,
        volume: 0, // Not provided by backend
        marketCap: 0, // Not provided by backend
        peRatio: 0, // Not provided by backend
        sentiment: mapBackendSentiment('buy'),
        technicalIndicators: {
          currentPrice: backendStock.latest_price,
        },
        priceHistory: [],
      });
    });

    // Map neutral stocks
    neutral.forEach(backendStock => {
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
        sentiment: mapBackendSentiment('neutral'),
        technicalIndicators: {
          currentPrice: backendStock.latest_price,
        },
        priceHistory: [],
      });
    });

    // Map sell stocks
    sell.forEach(backendStock => {
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
        sentiment: mapBackendSentiment('sell'),
        technicalIndicators: {
          currentPrice: backendStock.latest_price,
        },
        priceHistory: [],
      });
    });

    return allStocks;
  } catch (error) {
    console.error('Error fetching filtered stocks:', error);
    return [];
  }
}

/**
 * Function to fetch stock details only
 */
export async function getStockDetail(symbol: string, indicators: string[], exchangeOverride?: string): Promise<StockDetail | null> {
  const exchange = exchangeOverride || localStorage.getItem('selectedExchange') || 'india';
  
  try {
    const fullSymbol = exchange === 'india' && !symbol.endsWith('.NS') 
      ? `${symbol}.NS` 
      : symbol;
    const detailsResponse = await getStockDetails(exchange, fullSymbol, indicators);

    if (!detailsResponse.success) {
      console.error('Failed to fetch stock details');
      return null;
    }

    return {
      metadata: {
        symbol: symbol.replace('.NS', ''),
        name: detailsResponse?.metadata?.company_name || "",
        sector: detailsResponse.metadata?.sector || "",
        industry: detailsResponse.metadata?.industry || "",
        description: detailsResponse.metadata?.description || "",
        website: detailsResponse.metadata?.website || "",
        country: detailsResponse.metadata?.country || "",
        employees: detailsResponse.metadata?.employees || 0,
      },
      technicalIndicators: detailsResponse.technicals,
      chartData: detailsResponse.ohlcv,
      summary: detailsResponse.summary,
    };
  } catch (error) {
    console.error('Failed to load stock detail:', error);
    return null;
  }
}

/**
 * Function to get the latest news for a stock
 */
export async function getStockNewsArticle(symbol: string): Promise<StockNewsArticle | null> {
  const exchange = localStorage.getItem('selectedExchange') || 'india';

  try {
    const fullSymbol = exchange === 'india' && !symbol.endsWith('.NS') 
      ? `${symbol}.NS` 
      : symbol;

    const newsResponse = await getStockNews(fullSymbol);

    if (!newsResponse.success) {
      console.error('Failed to fetch stock news');
      return null;
    }

    const rss_news = newsResponse.rss_news.map(article => ({
      newsId: article.news_id,
      title: article.title,
      url: article.url,
      source: article.source,
      publishedDate: article.published_date,
      description: article.description,
      thumbnailUrl: article.thumbnail_url,
    }));

    const telegram_news = newsResponse.telegram_news.map(article => ({
      newsId: article.news_id,
      title: article.title,
      url: article.url,
      source: "Telegram Geopolitics Prime",
      publishedDate: article.published_date,
      description: article.description,
      thumbnailUrl: "/telegram_logo.png",
    }));

    const news = [...rss_news, ...telegram_news];

    news.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
    return {
      news,
      newsSummary: newsResponse.full_summary,
    };
  } catch (error) {
    console.error('Failed to load stock news:', error);
    return null;
  }
};

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

export async function getStockFundamentalsData(symbol: string, exchangeOverride?: string): Promise<StockFundamentals | null> {
  const exchange = exchangeOverride || localStorage.getItem('selectedExchange') || 'india';
  try {
    const fullSymbol = exchange === 'india' && !symbol.endsWith('.NS')
      ? `${symbol}.NS`
      : symbol;
    const fundamentalsResponse = await getStockFundamentals(fullSymbol, exchange);
    if (!fundamentalsResponse) {
      console.error('Failed to fetch stock fundamentals');
      return null;
    }
    const d = fundamentalsResponse.stock_data;
    const sym = getCurrencySymbol(fundamentalsResponse.currency);
    return {
      open:      fmtPrice(d.open, sym),
      high:      fmtPrice(d.high, sym),
      low:       fmtPrice(d.low, sym),
      close:     fmtPrice(d.close, sym),
      volume:    fmtCompact(d.volume),
      avgVolume: fmtCompact(d.avg_volume),
      marketCap: `${sym}${fmtCompact(d.market_cap)}`,
      weekHigh52: fmtPrice(d.high_52w, sym),
      weekLow52:  fmtPrice(d.low_52w, sym),
      peratio:    fmtRatio(d.trailing_pe),
      pbratio:    fmtRatio(d.price_to_book),
      eps:        fmtPrice(d.eps, sym),
    };
  } catch (error) {
    console.error('Failed to load stock fundamentals:', error);
    return null;
  }
};
