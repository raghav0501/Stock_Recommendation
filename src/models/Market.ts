export interface MarketIndex {
  name: string;
  value: number | null;
  change: number | null;
  changePercent: number | null;
  timestamp: Date;
  exchange: 'india' | 'us';
}

export interface TechnicalParameter {
  id: string;
  name: string;
  category: 'Trend' | 'Momentum' | 'Volatility' | 'Volume' | 'Strategy';
  description: string;
  chartable: boolean; // Whether this indicator can be plotted on a chart
  scale: 'price' | 'oscillator' | 'volume' | 'none'; // Which scale/pane to use
}

export interface MarketStatus {
  isOpen: boolean;
  currentTime: Date;
  nextOpen?: Date;
  nextClose?: Date;
}