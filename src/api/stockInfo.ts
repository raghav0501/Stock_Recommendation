// import stockData from '../data/stockData.json';

// export interface StockDetail {
//   symbol: string;
//   name: string;
//   sector: string;
//   industry: string;
//   fundamentals: {
//     marketCap: number;
//     peRatio: number;
//     pbRatio: number;
//     dividendYield: number;
//     eps: number;
//     roe: number;
//     debtToEquity: number;
//     currentRatio: number;
//     bookValue: number;
//   };
//   summary: string;
//   chartData: Array<{
//     time: string;
//     open: number;
//     high: number;
//     low: number;
//     close: number;
//   }>;
//   news: Array<{
//     title: string;
//     source: string;
//     date: string;
//     summary: string;
//     imageUrl?: string;
//   }>;
// }

// /**
//  * Fetch detailed information for a specific stock
//  * @param symbol Stock symbol (e.g., "ITC", "RELIANCE")
//  * @returns Promise with stock details or null if not found
//  */
// export async function getStockDetail(symbol: string): Promise<StockDetail | null> {
//   // Simulate API delay
//   await delay(300);

//   const stockInfo = (stockData as any)[symbol.toUpperCase()];
  
//   if (!stockInfo) {
//     return null;
//   }

//   // Add image URLs to news items (mock image generation)
//   const newsWithImages = stockInfo.news.map((item: any, index: number) => ({
//     ...item,
//     imageUrl: generateMockImageUrl(symbol, index),
//   }));

//   return {
//     ...stockInfo,
//     news: newsWithImages,
//   };
// }

// /**
//  * Fetch current price for a stock
//  * @param symbol Stock symbol
//  * @returns Promise with current price data
//  */
// export async function getCurrentPrice(symbol: string): Promise<{
//   price: number;
//   change: number;
//   changePercent: number;
// } | null> {
//   await delay(200);

//   const stockInfo = (stockData as any)[symbol.toUpperCase()];
  
//   if (!stockInfo || !stockInfo.chartData || stockInfo.chartData.length === 0) {
//     return null;
//   }

//   const lastCandle = stockInfo.chartData[stockInfo.chartData.length - 1];
//   const firstCandle = stockInfo.chartData[0];
  
//   const price = lastCandle.close;
//   const change = lastCandle.close - firstCandle.close;
//   const changePercent = (change / firstCandle.close) * 100;

//   return {
//     price,
//     change,
//     changePercent,
//   };
// }

// /**
//  * Fetch list of available stocks
//  * @returns Promise with array of available stock symbols
//  */
// export async function getAvailableStocks(): Promise<string[]> {
//   await delay(100);
//   return Object.keys(stockData);
// }

// /**
//  * Generate mock image URL for news items
//  * In production, this would come from the news API
//  */
// function generateMockImageUrl(symbol: string, index: number): string {
//   // Using placeholder image service
//   const colors = ['3b82f6', '10b981', 'f59e0b', 'ef4444', '8b5cf6'];
//   const color = colors[index % colors.length];
  
//   return `https://via.placeholder.com/400x250/${color}/ffffff?text=${symbol}+News`;
// }

// /**
//  * Utility function to simulate API delay
//  */
// function delay(ms: number): Promise<void> {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }