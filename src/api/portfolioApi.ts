import { getPortfolio, addToPortfolio, removeFromPortfolio, getActiveAlerts as fetchActiveAlerts } from './backendService';
import { STORAGE_KEYS } from '../constants/storage';
import type { PortfolioHolding, PortfolioAlert, AlertsResult, AlertSignal } from '../models/Portfolio';
import { sanitizeSymbol, stripSuffix } from '../utils/sanitize';

export { stripSuffix };

export function toSignal(val: number): AlertSignal {
  if (val === 1) return 1;
  if (val === -1) return -1;
  return 0;
}

function mapItem(item: {
  symbol: string;
  companyName: string;
  exchange: string;
  addedAt: string;
}): PortfolioHolding {
  return {
    symbol: item.symbol,
    companyName: item.companyName,
    exchange: item.exchange,
    addedAt: item.addedAt,
  };
}

// ── Holdings CRUD ──────────────────────────────────────────────────

export async function getHoldings(): Promise<PortfolioHolding[]> {
  const exchange = localStorage.getItem(STORAGE_KEYS.EXCHANGE) || 'india';
  const response = await getPortfolio(exchange);
  if (response.status !== 'success' || !response.data?.watchlist) {
    throw new Error('Failed to load portfolio');
  }
  return response.data.watchlist.map(mapItem);
}

export async function addHolding(holding: PortfolioHolding): Promise<void> {
  await addToPortfolio(sanitizeSymbol(holding.symbol), holding.companyName.trim().slice(0, 200), holding.exchange);
}

export async function removeHolding(symbol: string): Promise<void> {
  await removeFromPortfolio(sanitizeSymbol(symbol));
}

// ── Active Alerts ──────────────────────────────────────────────────

export async function getAlerts(): Promise<AlertsResult> {
  const exchange = localStorage.getItem(STORAGE_KEYS.EXCHANGE) || 'india';
  const response = await fetchActiveAlerts(exchange);
  const hasHoldings = response.data?.has_holdings ?? false;

  if (!response.success || !response.data?.signals) return { alerts: [], hasHoldings };

  const alerts = response.data.signals
    .map(item => ({
      symbol: item.symbol,
      companyName: item.company_name,
      exchange,
      alerts: {
        bollingerBand: toSignal(item.bbands_20),
        rsi:           toSignal(item.rsi_14),
        earlyAlertBB:  toSignal(item.bbands_20_EA),
        earlyAlertRSI: toSignal(item.rsi_14_EA),
      },
      description: item.description || undefined,
    } as PortfolioAlert))
    .filter(a =>
      a.alerts.bollingerBand !== 0 ||
      a.alerts.rsi           !== 0 ||
      a.alerts.earlyAlertBB  !== 0 ||
      a.alerts.earlyAlertRSI !== 0
    );

  return { alerts, hasHoldings };
}
