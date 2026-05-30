import { getEarlyAlerts, type EarlyAlertSignalItem } from './backendService';
import { STORAGE_KEYS } from '../constants/storage';
import type { EarlyAlertStock } from '../models/Breakout';
import { toSignal } from './portfolioApi';
import { stripSuffix } from '../utils/sanitize';

export async function getEarlyAlertStocks(): Promise<EarlyAlertStock[]> {
  const exchange = localStorage.getItem(STORAGE_KEYS.EXCHANGE) || 'india';
  const response = await getEarlyAlerts(exchange);
  if (!response.success || !response.data?.signals) return [];
  return response.data.signals.map((item: EarlyAlertSignalItem) => ({
    symbol: stripSuffix(item.symbol),
    companyName: item.company_name,
    mcapTop100: item.mcap_top_100 === 1,
    bbSignal: toSignal(item.bbands_20_EA),
    rsiSignal: toSignal(item.rsi_14_EA),
    last5Days: [...item.last_5_days].sort((a, b) => a.date.localeCompare(b.date)),
  }));
}
