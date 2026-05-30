import { STORAGE_KEYS } from '../constants/storage';

/**
 * Formatting Utilities
 * Centralized functions for formatting numbers, currency, dates, etc.
 */

/**
 * Format number with Indian numbering system (lakhs, crores)
 * @param value Number to format
 * @param options Formatting options
 */
export function formatIndianNumber(
  value: number,
  options: {
    decimals?: number;
    useShortForm?: boolean;
  } = {}
): string {
  const { decimals = 2, useShortForm = false } = options;

  if (useShortForm) {
    if (value >= 10000000) {
      return `${(value / 10000000).toFixed(decimals)}Cr`;
    }
    if (value >= 100000) {
      return `${(value / 100000).toFixed(decimals)}L`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(decimals)}K`;
    }
  }

  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency with appropriate symbol based on exchange
 * @param value Amount to format
 * @param options Formatting options
 */
export function formatCurrency(
  value: number,
  options: {
    decimals?: number;
    useShortForm?: boolean;
    symbol?: string;
  } = {}
): string {
  const { decimals = 2, useShortForm = false } = options;
  
  // Get symbol based on exchange if not provided
  let symbol = options.symbol;
  if (!symbol) {
    const exchange = localStorage.getItem(STORAGE_KEYS.EXCHANGE) || 'india';
    symbol = exchange === 'india' ? '₹' : '$';
  }
  
  const formatted = formatIndianNumber(value, { decimals, useShortForm });
  return `${symbol}${formatted}`;
}

/**
 * Format percentage with sign
 * @param value Percentage value
 * @param options Formatting options
 */
export function formatPercentage(
  value: number,
  options: {
    decimals?: number;
    showSign?: boolean;
  } = {}
): string {
  const { decimals = 2, showSign = true } = options;
  
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format number with commas (US format)
 * @param value Number to format
 * @param decimals Number of decimal places
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format large numbers in compact form (K, M, B)
 * @param value Number to format
 * @param decimals Number of decimal places
 */
export function formatCompactNumber(value: number, decimals: number = 1): string {
  if(value === 0) return 'N/A';
  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const tier = Math.floor(Math.log10(Math.abs(value)) / 3);
  
  if (tier === 0) return value.toFixed(decimals);
  
  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = value / scale;
  
  return `${scaled.toFixed(decimals)}${suffix}`;
}

/**
 * Format date to readable string
 * @param date Date string or object
 * @param format Format type
 */
export function formatDate(
  date: string | Date,
  format: 'short' | 'long' | 'relative' = 'short'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'relative') {
    return formatRelativeDate(dateObj);
  }
  
  const options: Intl.DateTimeFormatOptions = 
    format === 'short'
      ? { month: 'short', day: 'numeric', year: 'numeric' }
      : { month: 'long', day: 'numeric', year: 'numeric' };
  
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Format date as relative time (e.g., "2 days ago")
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 30) return formatDate(date, 'short');
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'Just now';
}

/**
 * Format stock price with appropriate decimals
 * @param price Stock price
 */
export function formatStockPrice(price: number): string {
  if (price >= 1000) {
    return formatCurrency(price, { decimals: 2 });
  }
  return formatCurrency(price, { decimals: 2 });
}

/**
 * Format market cap with Indian system
 * @param value Market cap value
 */
export function formatMarketCap(value: number): string {
  return formatCurrency(value, { decimals: 2, useShortForm: true });
}

/**
 * Format volume with compact notation
 * @param value Volume value
 */
export function formatVolume(value: number): string {
  return formatCompactNumber(value, 0);
}

/**
 * Truncate text with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Format change with sign and percentage
 * @param change Absolute change
 * @param changePercent Percentage change
 */
export function formatChange(change: number, changePercent: number): {
  text: string;
  percentText: string;
  isPositive: boolean;
} {
  const isPositive = change >= 0;
  const sign = isPositive ? '+' : '';
  
  return {
    text: `${sign}${change.toFixed(2)}`,
    percentText: formatPercentage(changePercent, { showSign: true }),
    isPositive,
  };
}