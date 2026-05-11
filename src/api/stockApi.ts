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
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  weekHigh52: number;
  weekLow52: number;
  peratio: number;
  pbratio: number;
  eps: number;
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
export async function getStockDetail(symbol: string, indicators: string[]): Promise<StockDetail | null> {
  const exchange = localStorage.getItem('selectedExchange') || 'india';
  
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
export async function getStockFundamentalsData(symbol: string): Promise<StockFundamentals | null> {
  const exchange = localStorage.getItem('selectedExchange') || 'india';
  try {
    const fullSymbol = exchange === 'india' && !symbol.endsWith('.NS')
      ? `${symbol}.NS`
      : symbol;
    const fundamentalsResponse = await getStockFundamentals(fullSymbol, exchange);
    if (!fundamentalsResponse) {
      console.error('Failed to fetch stock fundamentals');
      return null;
    }
    return {
      open: fundamentalsResponse.stock_data.open,
      high: fundamentalsResponse.stock_data.high,
      low: fundamentalsResponse.stock_data.low,
      close: fundamentalsResponse.stock_data.close,
      volume: fundamentalsResponse.stock_data.volume,
      avgVolume: fundamentalsResponse.stock_data.avg_volume,
      marketCap: fundamentalsResponse.stock_data.market_cap,
      weekHigh52: fundamentalsResponse.stock_data.high_52w,
      weekLow52: fundamentalsResponse.stock_data.low_52w,
      peratio: fundamentalsResponse.stock_data.trailing_pe,
      pbratio: fundamentalsResponse.stock_data.price_to_book,
      eps: fundamentalsResponse.stock_data.eps,
    };
  } catch (error) {
    console.error('Failed to load stock fundamentals:', error);
    return null;
  }
};
