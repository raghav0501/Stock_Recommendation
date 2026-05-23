import { getEarlyAlerts, type EarlyAlertSignalItem } from './backendService';
import type { EarlyAlertStock, EarlyAlertSignal } from '../models/Breakout';

function toSignal(val: number): EarlyAlertSignal {
  if (val === 1) return 1;
  if (val === -1) return -1;
  return 0;
}

export async function getEarlyAlertStocks(): Promise<EarlyAlertStock[]> {
  const exchange = localStorage.getItem('selectedExchange') || 'india';
  try {
    const response = await getEarlyAlerts(exchange);
    if (!response.success || !response.data?.signals) return [];
    return response.data.signals.map((item: EarlyAlertSignalItem) => ({
      symbol: item.symbol.replace(/\.(NS|BSE)$/i, ''),
      companyName: item.company_name,
      mcapTop100: item.mcap_top_100 === 1,
      bbSignal: toSignal(item.bbands_20_EA),
      rsiSignal: toSignal(item.rsi_14_EA),
      last5Days: [...item.last_5_days].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  } catch (error) {
    console.error('Failed to fetch early alert stocks:', error);
    return [];
  }
}
