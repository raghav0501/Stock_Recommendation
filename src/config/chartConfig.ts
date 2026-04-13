import type { DeepPartial, ChartOptions, CandlestickSeriesPartialOptions, LineSeriesPartialOptions } from 'lightweight-charts';

/**
 * Chart Configuration
 * Centralized configuration for all charts in the application
 */

export const CHART_THEME = {
  light: {
    background: 'transparent',
    textColor: '#475569',
    gridColor: '#e2e8f0',
    borderColor: '#cbd5e1',
  },
  dark: {
    background: 'transparent',
    textColor: '#94a3b8',
    gridColor: '#334155',
    borderColor: '#334155',
  },
};

export const CANDLESTICK_COLORS = {
  upColor: '#10b981',
  downColor: '#ef4444',
  borderUpColor: '#10b981',
  borderDownColor: '#ef4444',
  wickUpColor: '#10b981',
  wickDownColor: '#ef4444',
};

export const INDICATOR_COLORS = {
  sma20: '#f59e0b',
  sma50: '#3b82f6',
  sma200: '#8b5cf6',
  ema20: '#8b5cf6',
  ema50: '#ec4899',
  bollingerUpper: '#ef4444',
  bollingerMiddle: '#f59e0b',
  bollingerLower: '#10b981',
};

/**
 * Get base chart options for the current theme
 */
export function getBaseChartOptions(theme: 'light' | 'dark', width: number, height: number): DeepPartial<ChartOptions> {
  const themeColors = theme === 'light' ? CHART_THEME.light : CHART_THEME.dark;

  return {
    width,
    height,
    layout: {
      background: { color: themeColors.background },
      textColor: themeColors.textColor,
    },
    grid: {
      vertLines: { color: themeColors.gridColor },
      horzLines: { color: themeColors.gridColor },
    },
    crosshair: {
      mode: 1,
    },
    rightPriceScale: {
      borderColor: themeColors.borderColor,
    },
    timeScale: {
      borderColor: themeColors.borderColor,
      timeVisible: true,
      secondsVisible: false,
    },
  };
}

/**
 * Get candlestick series options
 */
export function getCandlestickOptions(): CandlestickSeriesPartialOptions {
  return {
    upColor: CANDLESTICK_COLORS.upColor,
    downColor: CANDLESTICK_COLORS.downColor,
    borderUpColor: CANDLESTICK_COLORS.borderUpColor,
    borderDownColor: CANDLESTICK_COLORS.borderDownColor,
    wickUpColor: CANDLESTICK_COLORS.wickUpColor,
    wickDownColor: CANDLESTICK_COLORS.wickDownColor,
  };
}

/**
 * Get line series options for a specific indicator
 */
export function getIndicatorLineOptions(indicator: keyof typeof INDICATOR_COLORS): LineSeriesPartialOptions {
  return {
    color: INDICATOR_COLORS[indicator],
    lineWidth: 2,
    title: indicator.toUpperCase(),
  };
}

/**
 * Chart size presets
 */
export const CHART_SIZES = {
  popup: {
    width: 500,
    height: 350,
  },
  detail: {
    width: 0, // Will be set dynamically based on container
    height: 400,
  },
  mobile: {
    width: 0, // Will be set dynamically
    height: 300,
  },
};