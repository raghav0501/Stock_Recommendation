export type MarketSentiment = 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';

export interface TechnicalIndicators {
  bollinger?: {
    upper: number;
    middle: number;
    lower: number;
    position: number;
  };
  rsi_14?: number;
  sma_20?: number;
  sma_50?: number;
  sma_200?: number;
  ema_20?: number;
  ema_50?: number;
  ema_200?: number;
  wma_20?: number;
  tema_30?: number;
  kama_30?: number;
  mom_osc?: number;
  cci_20?: number;
  roc_10?: number;
  mom_10?: number;
  willr_14?: number;
  ult_osc?: number;
  atr_14?: number;
  natr?: number;
  mfi_14?: number;
  [key: string]: any;
}

export interface StockPriceHistory {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockSummary {
  symbol: string;
  price: number;
  changePercent: number;
  sentiment: MarketSentiment;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  sentiment: MarketSentiment;
  technicalIndicators: TechnicalIndicators;
  dayHigh?: number;
  dayLow?: number;
  weekHigh52?: number;
  weekLow52?: number;
  priceHistory?: StockPriceHistory[];
}

export interface PortfolioStock {
  symbol: string;
  name: string;
  allocation: number;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
}