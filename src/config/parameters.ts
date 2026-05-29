import type { TechnicalParameter } from "../models/Market";

export const TECHNICAL_PARAMETERS: TechnicalParameter[] = [
  { 
    id: 'bbands_20',
    name: 'Bollinger Bands', 
    category: 'Volatility', 
    description: 'Shows price volatility and potential reversal points using standard deviation bands',
    chartable: true,
    scale: 'price' // Overlays on price chart
  },
  { 
    id: 'rsi_14', 
    name: 'RSI',
    category: 'Momentum', 
    description: 'Relative Strength Index - measures speed and magnitude of price changes (0-100)',
    chartable: true,
    scale: 'oscillator' // Separate pane with 0-100 scale
  },
  // { 
  //   id: 'sma_20', 
  //   name: 'SMA (20)', 
  //   category: 'Trend', 
  //   description: 'Simple Moving Average - 20-day average price trend indicator',
  //   chartable: true,
  //   scale: 'price'
  // },
  // { 
  //   id: 'sma_50', 
  //   name: 'SMA (50)', 
  //   category: 'Trend', 
  //   description: 'Simple Moving Average - 50-day medium-term trend indicator',
  //   chartable: true,
  //   scale: 'price'
  // },
  // { 
  //   id: 'sma_200', 
  //   name: 'SMA (200)', 
  //   category: 'Trend', 
  //   description: 'Simple Moving Average - 200-day long-term trend indicator',
  //   chartable: true,
  //   scale: 'price'
  // },
  // { 
  //   id: 'ema_20', 
  //   name: 'EMA (20)', 
  //   category: 'Trend', 
  //   description: 'Exponential Moving Average - 20-day weighted trend with more emphasis on recent prices',
  //   chartable: true,
  //   scale: 'price'
  // },
  // { 
  //   id: 'ema_50', 
  //   name: 'EMA (50)', 
  //   category: 'Trend', 
  //   description: 'Exponential Moving Average - 50-day weighted medium-term trend',
  //   chartable: true,
  //   scale: 'price'
  // },
  // { 
  //   id: 'wma_20', 
  //   name: 'WMA (20)', 
  //   category: 'Trend', 
  //   description: 'Weighted Moving Average - linear weighting emphasizing recent prices',
  //   chartable: true,
  //   scale: 'price'
  // },
  // { 
  //   id: 'tema_30', 
  //   name: 'TEMA (30)', 
  //   category: 'Trend', 
  //   description: 'Triple Exponential Moving Average - reduces lag for faster trend detection',
  //   chartable: true,
  //   scale: 'price'
  // },
  // { 
  //   id: 'kama_30', 
  //   name: 'KAMA (30)', 
  //   category: 'Trend', 
  //   description: 'Kaufman Adaptive Moving Average - adapts to market volatility automatically',
  //   chartable: true,
  //   scale: 'price'
  // },
  // { 
  //   id: 'stoch_osc_14', 
  //   name: 'Stochastic Oscillator (Stochastic %K)', 
  //   category: 'Momentum', 
  //   description: 'Measures rate of price change to identify trend strength',
  //   chartable: true,
  //   scale: 'oscillator'
  // },
  // { 
  //   id: 'cci_20', 
  //   name: 'CCI (20)', 
  //   category: 'Momentum', 
  //   description: 'Commodity Channel Index - identifies cyclical trends and overbought/oversold conditions',
  //   chartable: true,
  //   scale: 'oscillator'
  // },
  // { 
  //   id: 'roc_10', 
  //   name: 'ROC (10)', 
  //   category: 'Momentum', 
  //   description: 'Rate of Change - percentage price change over 10 periods',
  //   chartable: true,
  //   scale: 'oscillator'
  // },
  // { 
  //   id: 'mom_10', 
  //   name: 'Momentum (10)', 
  //   category: 'Momentum', 
  //   description: '10-day momentum indicator showing price velocity',
  //   chartable: true,
  //   scale: 'oscillator'
  // },
  // { 
  //   id: 'willr_14', 
  //   name: 'Williams %R (14)', 
  //   category: 'Momentum', 
  //   description: 'Measures overbought/oversold levels on a scale of 0 to -100',
  //   chartable: true,
  //   scale: 'oscillator'
  // },
  // { 
  //   id: 'ultosc_28', 
  //   name: 'Ultimate Oscillator', 
  //   category: 'Momentum', 
  //   description: 'Multi-timeframe momentum oscillator combining three time periods',
  //   chartable: true,
  //   scale: 'oscillator'
  // },
  // { 
  //   id: 'atr_14', 
  //   name: 'ATR (14)', 
  //   category: 'Volatility', 
  //   description: 'Average True Range - measures market volatility over 14 periods',
  //   chartable: true,
  //   scale: 'volume' // Can be shown in separate pane or with volume
  // },
  // { 
  //   id: 'natr', 
  //   name: 'NATR', 
  //   category: 'Volatility', 
  //   description: 'Normalized Average True Range - volatility as percentage of closing price',
  //   chartable: true,
  //   scale: 'oscillator'
  // },
  // { 
  //   id: 'mfi_14', 
  //   name: 'MFI (14)', 
  //   category: 'Volume', 
  //   description: 'Money Flow Index - volume-weighted RSI showing buying/selling pressure',
  //   chartable: true,
  //   scale: 'oscillator'
  // },
  { 
    id: 'mcap_top_100', 
    name: 'Mcap Top 100', 
    category: 'Strategy', 
    description: 'Filter for top 100 stocks by market capitalization',
    chartable: false, // Cannot be plotted on chart - it's a filter
    scale: 'none'
  },
];

// Helper function to get chartable indicators only
export function getChartableIndicators(): TechnicalParameter[] {
  return TECHNICAL_PARAMETERS.filter(p => p.chartable);
}

// Helper function to get indicators by scale
export function getIndicatorsByScale(scale: 'price' | 'oscillator' | 'volume'): TechnicalParameter[] {
  return TECHNICAL_PARAMETERS.filter(p => p.chartable && p.scale === scale);
}