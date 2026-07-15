import { CHIP } from '../config/signalColors';

export type AlertSignal = 1 | -1 | 0;

export interface PortfolioHolding {
  symbol: string;
  companyName: string;
  exchange: string;
  addedAt?: string;
}

export interface AlertFlags {
  bollingerBand: AlertSignal;
  rsi: AlertSignal;
  earlyAlertBB: AlertSignal;
  earlyAlertRSI: AlertSignal;
}

export interface PortfolioAlert extends PortfolioHolding {
  alerts: AlertFlags;
  description?: string;
}

export interface AlertsResult {
  alerts: PortfolioAlert[];
  hasHoldings: boolean;
}

export const ALERT_LABELS: Record<keyof AlertFlags, string> = {
  bollingerBand: 'Bollinger Band',
  rsi:           'RSI',
  earlyAlertBB:  'Early Alert BB',
  earlyAlertRSI: 'Early Alert RSI',
};

export const ALERT_COLORS: Record<keyof AlertFlags, string> = {
  bollingerBand: CHIP.bollingerBand,
  rsi:           CHIP.rsi,
  earlyAlertBB:  CHIP.earlyAlertBB,
  earlyAlertRSI: CHIP.earlyAlertRSI,
};
