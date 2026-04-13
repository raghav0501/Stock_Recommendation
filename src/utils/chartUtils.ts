import type { StockPriceHistory, TechnicalIndicators } from '../models/Stock';
import {
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';

// ─── INTERNAL HELPERS ────────────────────────────────────────────────

function buildTechnicalsMap(technicals: any[]): Map<string, any> {
  const map = new Map<string, any>();
  technicals.forEach((tech) => {
    if (tech.time != null) map.set(String(tech.time), tech);
  });
  return map;
}

function getIndicatorKey(indicatorId: string): string | null {
  const keyMap: Record<string, string> = {
    sma_20: 'sma_20',
    sma_50: 'sma_50',
    sma_200: 'sma_200',
    ema_20: 'ema_20',
    ema_50: 'ema_50',
    wma_20: 'wma_20',
    tema_30: 'tema_30',
    kama_30: 'kama_30',
    rsi_14: 'rsi_14',
    cci_20: 'cci_20',
    roc_10: 'roc_10',
    mom_10: 'mom_10',
    willr_14: 'willr_14',
    ult_osc: 'ultosc',
    atr_14: 'atr_14',
    natr: 'natr',
    mfi_14: 'mfi_14',
    mom_osc: 'mom_10',
    bbands_20: 'bb_upper',
  };
  return keyMap[indicatorId] || indicatorId.toLowerCase();
}

// ─── DATA MAP BUILDERS (for crosshair sync) ─────────────────────────

/**
 * Build a time → close price lookup map from OHLCV data.
 * Used to position the crosshair on the main chart when
 * the user hovers the oscillator chart.
 */
// export function buildPriceMap(ohlcvData: any[]): Map<string, number> {
//   const map = new Map<string, number>();
//   ohlcvData.forEach((d) => {
//     if (d.time != null) map.set(String(d.time), d.close);
//   });
//   return map;
// }

export function buildPriceMap(ohlcvData: any[]): Map<string, number> {
  const map = new Map<string, number>();
  ohlcvData.forEach((d) => {
    const time = d.time ?? d.date;
    if (time != null && d.close != null) map.set(String(time), d.close);
  });
  return map;
}

/**
 * Build a time → value lookup from any data array.
 * Tries d.value first, then d[valueKey].
 * Handles both { time } and { date } keys.
 */
export function buildValueMap(
  data: any[],
  valueKey?: string
): Map<string, number> {
  const map = new Map<string, number>();
  data.forEach((d) => {
    const time = d.time ?? d.date;
    let value: number | undefined;
    if (d.value != null) {
      value = d.value;
    } else if (valueKey && d[valueKey] != null) {
      value = d[valueKey];
    }
    if (time != null && value != null) {
      map.set(String(time), value);
    }
  });
  return map;
}

/**
 * Build a time → indicator value lookup map.
 * Used to position the crosshair on the oscillator chart when
 * the user hovers the main chart.
 */
export function buildIndicatorValueMap(
  ohlcvData: any[],
  technicals: any[],
  indicatorId: string
): Map<string, number> {
  const techMap = buildTechnicalsMap(technicals);
  const key = getIndicatorKey(indicatorId) || indicatorId;
  const map = new Map<string, number>();

  ohlcvData.forEach((d) => {
    const tech = techMap.get(String(d.time));
    if (tech && tech[key] != null) {
      map.set(String(d.time), tech[key]);
    }
  });

  return map;
}

/**
 * Given an oscillator indicator id that was added to seriesRef,
 * return the "primary" series key (handles paired indicators like stoch).
 */
export function getPrimarySeriesKey(indicatorId: string): string {
  if (indicatorId === 'stoch_d') return 'stoch_k';
  return indicatorId;
}

// ─── CHART FORMAT HELPER ─────────────────────────────────────────────

export function formatChartData(
  priceHistory: StockPriceHistory[],
  indicators: TechnicalIndicators,
  selectedParameters: string[]
) {
  return priceHistory.map((point) => {
    const data: any = { timestamp: point.timestamp, price: point.close };
    selectedParameters.forEach((param) => {
      switch (param) {
        case 'sma_20':
          data.sma20 = indicators.sma_20;
          break;
        case 'sma_50':
          data.sma50 = indicators.sma_50;
          break;
        case 'ema_20':
          data.ema20 = indicators.ema_20;
          break;
        case 'bollinger':
          if (indicators.bollinger) {
            data.bollingerUpper = indicators.bollinger.upper;
            data.bollingerMiddle = indicators.bollinger.middle;
            data.bollingerLower = indicators.bollinger.lower;
          }
          break;
      }
    });
    return data;
  });
}

// ─── SYNC: TIME SCALE (scroll / zoom) ───────────────────────────────

/**
 * Keep visible logical range (scroll position + zoom level)
 * of two charts in lock-step. Uses a guard so updates don't
 * bounce back infinitely.
 */
export function syncTimeScales(
  chartA: IChartApi,
  chartB: IChartApi
): () => void {
  let isSyncing = false;

  chartA
    .timeScale()
    .subscribeVisibleLogicalRangeChange((range) => {
      if (isSyncing || !range) return;
      isSyncing = true;
      try {
        chartB.timeScale().setVisibleLogicalRange(range);
      } catch {
        /* disposed */
      }
      isSyncing = false;
    });

  chartB
    .timeScale()
    .subscribeVisibleLogicalRangeChange((range) => {
      if (isSyncing || !range) return;
      isSyncing = true;
      try {
        chartA.timeScale().setVisibleLogicalRange(range);
      } catch {
        /* disposed */
      }
      isSyncing = false;
    });

  return () => {
    // Subscriptions are cleaned up when charts are disposed
  };
}

// ─── SYNC: CROSSHAIR (hover mirror) ─────────────────────────────────

export function syncCrosshairs(
  mainChart: IChartApi,
  oscChart: IChartApi,
  mainSeries: ISeriesApi<any>,
  oscSeries: ISeriesApi<any>,
  mainPriceMap: Map<string, number>,
  oscValueMap: Map<string, number>
): () => void {
  let isSyncing = false;

  // Hover on MAIN → mirror on OSCILLATOR
  mainChart.subscribeCrosshairMove((param) => {
    if (isSyncing) return;
    isSyncing = true;

    if (param.time) {
      const val = oscValueMap.get(String(param.time));
      if (val !== undefined) {
        try {
          oscChart.setCrosshairPosition(val, param.time, oscSeries);
        } catch { /* disposed */ }
      } else {
        // ★ Time exists but no matching osc value — clear instead of leaving stale
        try { oscChart.clearCrosshairPosition(); } catch { /* */ }
      }
    } else {
      try { oscChart.clearCrosshairPosition(); } catch { /* */ }
    }

    isSyncing = false;
  });

  // Hover on OSCILLATOR → mirror on MAIN
  oscChart.subscribeCrosshairMove((param) => {
    if (isSyncing) return;
    isSyncing = true;

    if (param.time) {
      const val = mainPriceMap.get(String(param.time));
      if (val !== undefined) {
        try {
          mainChart.setCrosshairPosition(val, param.time, mainSeries);
        } catch { /* disposed */ }
      } else {
        try { mainChart.clearCrosshairPosition(); } catch { /* */ }
      }
    } else {
      try { mainChart.clearCrosshairPosition(); } catch { /* */ }
    }

    isSyncing = false;
  });

  return () => {
    // Subscriptions are cleaned up when charts are disposed
  };
}


// ─── OSCILLATOR PANE FACTORY ─────────────────────────────────────────

/**
 * Create a separate chart instance for oscillator indicators.
 * Time axis is VISIBLE here (it is the bottom-most axis).
 */
export function createOscillatorPane(
  container: HTMLDivElement,
  theme: 'light' | 'dark',
  width: number,
  height: number = 150
): IChartApi {
  const isDark = theme === 'dark';

  return createChart(container, {
    width,
    height,
    layout: {
      background: { color: 'transparent' },
      textColor: isDark ? '#d1d5db' : '#374151',
    },
    grid: {
      vertLines: { color: isDark ? '#374151' : '#e5e7eb' },
      horzLines: { color: isDark ? '#374151' : '#e5e7eb' },
    },
    crosshair: {
      mode: 0, // Normal — matches main chart
      vertLine: {
        labelVisible: true, // ★ time label visible on bottom chart
      },
    },
    rightPriceScale: {
      borderColor: isDark ? '#4b5563' : '#d1d5db',
      minimumWidth: 65, // ★ align with main chart price scale
    },
    timeScale: {
      borderColor: isDark ? '#4b5563' : '#d1d5db',
      visible: true, // ★ bottom chart shows the shared time axis
    },
  });
}

// ─── PRICE-SCALE INDICATORS ─────────────────────────────────────────

export function addIndicatorLine(
  chart: any,
  indicatorId: string,
  stockData: any,
  lineOptions: any,
  seriesMap: Map<string, any>
): void {
  try {
    const lineSeries = chart.addSeries(LineSeries, lineOptions);
    const data: any[] = [];
    const indicatorKey = getIndicatorKey(indicatorId);
    if (!indicatorKey) {
      chart.removeSeries(lineSeries);
      return;
    }

    const techMap = buildTechnicalsMap(stockData.technicals || []);
    const ohlcv = stockData.ohlcv || stockData.chartData || [];

    ohlcv.forEach((c: any) => {
      const t = techMap.get(String(c.time));
      if (t?.[indicatorKey] != null) {
        data.push({ time: c.time, value: t[indicatorKey] });
      }
    });

    if (data.length > 0) {
      lineSeries.setData(data);
      seriesMap.set(indicatorId, lineSeries);
    } else {
      chart.removeSeries(lineSeries);
    }
  } catch (error) {
    console.error(`Failed to add indicator ${indicatorId}:`, error);
  }
}

export function addBollingerBands(
  chart: any,
  stockData: any,
  color: string,
  seriesMap: Map<string, any>
): void {
  try {
    const upperSeries = chart.addSeries(LineSeries, {
      color,
      lineWidth: 1,
      title: 'BB Upper',
      priceLineVisible: false,
      lastValueVisible: true,
    });
    const middleSeries = chart.addSeries(LineSeries, {
      color,
      lineWidth: 2,
      title: 'BB Middle',
      priceLineVisible: false,
      lastValueVisible: true,
    });
    const lowerSeries = chart.addSeries(LineSeries, {
      color,
      lineWidth: 1,
      title: 'BB Lower',
      priceLineVisible: false,
      lastValueVisible: true,
    });

    const upper: any[] = [],
      middle: any[] = [],
      lower: any[] = [];
    const techMap = buildTechnicalsMap(stockData.technicals || []);
    const ohlcv = stockData.ohlcv || stockData.chartData || [];

    ohlcv.forEach((c: any) => {
      const t = techMap.get(String(c.time));
      if (t?.bb_upper != null) {
        upper.push({ time: c.time, value: t.bb_upper });
        middle.push({ time: c.time, value: t.bb_mid ?? t.bb_middle ?? 0 });
        lower.push({ time: c.time, value: t.bb_lower ?? 0 });
      }
    });

    if (upper.length > 0) {
      upperSeries.setData(upper);
      middleSeries.setData(middle);
      lowerSeries.setData(lower);
      seriesMap.set('bollinger_upper', upperSeries);
      seriesMap.set('bollinger_middle', middleSeries);
      seriesMap.set('bollinger_lower', lowerSeries);
    } else {
      chart.removeSeries(upperSeries);
      chart.removeSeries(middleSeries);
      chart.removeSeries(lowerSeries);
    }
  } catch (error) {
    console.error('Failed to add Bollinger Bands:', error);
  }
}

// ─── OSCILLATOR INDICATORS ──────────────────────────────────────────

export function addOscillatorIndicator(
  chart: IChartApi,
  indicatorId: string,
  stockData: any,
  lineOptions: any,
  seriesMap: Map<string, any>,
  minValue?: number,
  maxValue?: number
): void {
  try {
    const lineSeries = chart.addSeries(LineSeries, lineOptions);
    const data: any[] = [];
    const key = getIndicatorKey(indicatorId);
    if (!key) {
      chart.removeSeries(lineSeries);
      return;
    }

    const techMap = buildTechnicalsMap(stockData.technicals || []);
    const ohlcv = stockData.ohlcv || stockData.chartData || [];

    ohlcv.forEach((c: any) => {
      const t = techMap.get(String(c.time));
      if (t?.[key] != null) data.push({ time: c.time, value: t[key] });
    });

    if (data.length > 0) {
      lineSeries.setData(data);
      seriesMap.set(indicatorId, lineSeries);

      if (minValue !== undefined && maxValue !== undefined) {
        chart.priceScale('right').applyOptions({
          autoScale: false,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        });
      }
    } else {
      chart.removeSeries(lineSeries);
    }
  } catch (error) {
    console.error(`Failed to add oscillator ${indicatorId}:`, error);
  }
}

export function addMACDIndicator(
  chart: IChartApi,
  stockData: any,
  seriesMap: Map<string, any>,
  colors?: { macd?: string; signal?: string; histogram?: string }
): void {
  try {
    const macdSeries = chart.addSeries(LineSeries, {
      color: colors?.macd || '#0ea5e9',
      lineWidth: 2,
      title: 'MACD',
      priceLineVisible: false,
      lastValueVisible: true,
    });
    const signalSeries = chart.addSeries(LineSeries, {
      color: colors?.signal || '#f59e0b',
      lineWidth: 2,
      title: 'Signal',
      priceLineVisible: false,
      lastValueVisible: true,
    });
    const histSeries = chart.addSeries(LineSeries, {
      color: colors?.histogram || '#6366f1',
      lineWidth: 1,
      title: 'Histogram',
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const macd: any[] = [],
      signal: any[] = [],
      hist: any[] = [];
    const techMap = buildTechnicalsMap(stockData.technicals || []);
    const ohlcv = stockData.ohlcv || stockData.chartData || [];

    ohlcv.forEach((c: any) => {
      const t = techMap.get(String(c.time));
      if (t) {
        if (t.macd != null) macd.push({ time: c.time, value: t.macd });
        if (t.macd_signal != null)
          signal.push({ time: c.time, value: t.macd_signal });
        if (t.macd_hist != null)
          hist.push({ time: c.time, value: t.macd_hist });
      }
    });

    if (macd.length > 0) {
      macdSeries.setData(macd);
      signalSeries.setData(signal);
      histSeries.setData(hist);
      seriesMap.set('macd', macdSeries);
      seriesMap.set('macd_signal', signalSeries);
      seriesMap.set('macd_hist', histSeries);
    } else {
      chart.removeSeries(macdSeries);
      chart.removeSeries(signalSeries);
      chart.removeSeries(histSeries);
    }
  } catch (error) {
    console.error('Failed to add MACD:', error);
  }
}

export function addStochasticIndicator(
  chart: IChartApi,
  stockData: any,
  seriesMap: Map<string, any>,
  colors?: { k?: string; d?: string }
): void {
  try {
    const kSeries = chart.addSeries(LineSeries, {
      color: colors?.k || '#8b5cf6',
      lineWidth: 2,
      title: '%K',
      priceLineVisible: false,
      lastValueVisible: true,
    });
    const dSeries = chart.addSeries(LineSeries, {
      color: colors?.d || '#f59e0b',
      lineWidth: 2,
      title: '%D',
      priceLineVisible: false,
      lastValueVisible: true,
    });

    const kData: any[] = [],
      dData: any[] = [];
    const techMap = buildTechnicalsMap(stockData.technicals || []);
    const ohlcv = stockData.ohlcv || stockData.chartData || [];

    ohlcv.forEach((c: any) => {
      const t = techMap.get(String(c.time));
      if (t) {
        if (t.stoch_k != null) kData.push({ time: c.time, value: t.stoch_k });
        if (t.stoch_d != null) dData.push({ time: c.time, value: t.stoch_d });
      }
    });

    if (kData.length > 0) {
      kSeries.setData(kData);
      dSeries.setData(dData);
      seriesMap.set('stoch_k', kSeries);
      seriesMap.set('stoch_d', dSeries);
      chart.priceScale('right').applyOptions({
        autoScale: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      });
    } else {
      chart.removeSeries(kSeries);
      chart.removeSeries(dSeries);
    }
  } catch (error) {
    console.error('Failed to add Stochastic:', error);
  }
}