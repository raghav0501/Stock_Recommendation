import { CHIP } from '../config/signalColors';

export type EarlyAlertSignal = 1 | -1 | 0;

export interface EarlyAlertDayData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  bb_lower: number | null;
  bb_lower_delta: number | null;
  bb_upper: number | null;
  bb_upper_delta: number | null;
  rsi: number | null;
  rsi_lower: number | null;
  rsi_lower_delta: number | null;
  rsi_upper: number | null;
  rsi_upper_delta: number | null;
}

export interface EarlyAlertStock {
  symbol: string;
  companyName: string;
  mcapTop100: boolean;
  bbSignal: EarlyAlertSignal;
  rsiSignal: EarlyAlertSignal;
  last5Days: EarlyAlertDayData[];
}

export type EarlyAlertFilter = 'earlyAlertBB' | 'earlyAlertRSI' | 'mcapTop100';

export const EARLY_ALERT_LABELS: Record<EarlyAlertFilter, string> = {
  earlyAlertBB:  'Early Alert BB',
  earlyAlertRSI: 'Early Alert RSI',
  mcapTop100:    'Mcap Top 100',
};

export const EARLY_ALERT_COLORS: Record<EarlyAlertFilter, string> = {
  earlyAlertBB:  CHIP.earlyAlertBB,
  earlyAlertRSI: CHIP.earlyAlertRSI,
  mcapTop100:    CHIP.mcapTop100,
};
