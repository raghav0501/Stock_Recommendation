import type { MarketIndex, MarketStatus } from '../models/Market';
import { STORAGE_KEYS } from '../constants/storage';
import { getMarketData } from './backendService';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Fetch real-time market indices from backend API
 */
export async function getMarketIndices(exchange?: string): Promise<MarketIndex[]> {
  return getMarketData(exchange);
}

export async function getMarketStatus(): Promise<MarketStatus> {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  
  const exchange = localStorage.getItem(STORAGE_KEYS.EXCHANGE) || 'india';
  
  let marketOpen: number;
  let marketClose: number;
  
  if (exchange === 'us') {
    // US market: 9:30 AM - 4:00 PM EST
    marketOpen = 9 * 60 + 30;
    marketClose = 16 * 60;
  } else {
    // Indian market: 9:15 AM - 3:30 PM IST
    marketOpen = 9 * 60 + 15;
    marketClose = 15 * 60 + 30;
  }
  
  return {
    isOpen: currentMinutes >= marketOpen && currentMinutes <= marketClose,
    currentTime: now,
  };
}