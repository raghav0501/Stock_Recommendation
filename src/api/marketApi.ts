import type { MarketIndex, MarketStatus } from '../models/Market';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Fetch real-time market indices from backend API
 */
export async function getMarketIndices(exchange?: string): Promise<MarketIndex[]> {
  try {
    // Get exchange from localStorage if not provided
    const selectedExchange = exchange || localStorage.getItem('selectedExchange') || 'india';
    
    const response = await fetch(`${API_BASE_URL}/api/indices/${selectedExchange}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform API response to MarketIndex array
    return transformIndicesData(data, selectedExchange);
  } catch (error) {
    console.error('Failed to fetch market indices:', error);
    // Fallback to mock data if API fails
    return getMockIndices(exchange);
  }
}

/**
 * Transform API response to MarketIndex format
 */
function transformIndicesData(data: any, exchange: string): MarketIndex[] {
  if (!data || !data.indices) {
    return [];
  }

  // Define which indices to include for each exchange
  const allowedIndices: { [key: string]: string[] } = {
    india: ['SENSEX', 'NIFTY 50'],
    us: ['S&P 500', 'NASDAQ', 'DOW JONES'],
  };

  // Map API keys to display names
  const indicesMap: { [key: string]: string } = {
    'SENSEX': 'SENSEX',
    'NIFTY 50': 'NIFTY 50',
    'NIFTY_50': 'NIFTY 50',
    'NIFTY50': 'NIFTY 50',
    'NASDAQ': 'NASDAQ',
    'SP500': 'S&P 500',
    'S&P 500': 'S&P 500',
    'DOW': 'DOW JONES',
    'DOW JONES': 'DOW JONES',
    'DOWJONES': 'DOW JONES',
  };

  const normalizedExchange = exchange.toLowerCase();
  const allowedForExchange = allowedIndices[normalizedExchange] || [];
  
  const transformed: MarketIndex[] = [];

  Object.entries(data.indices).forEach(([key, value]: [string, any]) => {
    const normalizedKey = indicesMap[key];
    
    // Skip if not in our allowed list
    if (!normalizedKey || !allowedForExchange.includes(normalizedKey)) {
      return;
    }
    
    // Calculate change and change percent from open and close
    const open = value.open || 0;
    const close = value.close || 0;
    const change = close - open;
    const changePercent = value.pct_change || (open !== 0 ? (change / open) * 100 : null);

    transformed.push({
      name: normalizedKey,
      value: close,
      change: change,
      changePercent: changePercent,
      timestamp: new Date(value.date || Date.now()),
      exchange: normalizedExchange === 'us' ? 'us' : 'india',
    });
  });

  // Sort to ensure consistent order
  const orderMap: { [key: string]: number } = {
    'NIFTY 50': 1,
    'SENSEX': 2,
    'S&P 500': 1,
    'NASDAQ': 2,
    'DOW JONES': 3,
  };

  return transformed.sort((a, b) => (orderMap[a.name] || 0) - (orderMap[b.name] || 0));
}

/**
 * Fallback mock data if API fails
 */
function getMockIndices(exchange?: string): MarketIndex[] {
  const selectedExchange = exchange || localStorage.getItem('selectedExchange') || 'india';
  
  const indiaIndices: MarketIndex[] = [
    {
      name: 'NIFTY 50',
      value: null,
      change: null,
      changePercent: null,
      timestamp: new Date(),
      exchange: 'india',
    },
    {
      name: 'SENSEX',
      value: null,
      change: null,
      changePercent: null,
      timestamp: new Date(),
      exchange: 'india',
    },
  ];

  const usIndices: MarketIndex[] = [
    {
      name: 'S&P 500',
      value: null,
      change: null,
      changePercent: null,
      timestamp: new Date(),
      exchange: 'us',
    },
    {
      name: 'NASDAQ',
      value: null,
      change: null,
      changePercent: null,
      timestamp: new Date(),
      exchange: 'us',
    },
    {
      name: 'DOW JONES',
      value: null,
      change: null,
      changePercent: null,
      timestamp: new Date(),
      exchange: 'us',
    },
  ];

  return selectedExchange === 'us' ? usIndices : indiaIndices;
}

export async function getMarketStatus(): Promise<MarketStatus> {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  
  const exchange = localStorage.getItem('selectedExchange') || 'india';
  
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