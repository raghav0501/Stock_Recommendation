import {
  type IChartApi,
  type ISeriesApi,
  createChart,
  LineSeries,
  CandlestickSeries,
  createSeriesMarkers,
} from 'lightweight-charts';
import { TrendingUp, ChevronDown } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import type { PlotData } from '../../api/chatApi';
import { useTheme } from '../../config/ThemeContext';
import {
  createOscillatorPane,
  syncTimeScales,
  syncCrosshairs,
  buildPriceMap,
  buildValueMap,
} from '../../utils/chartUtils';


// ═══════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════

function validatePlotData(plot: PlotData): { valid: boolean; error?: string } {
  if (!plot.data) return { valid: false, error: 'Missing plot data' };
  if (!plot.type) return { valid: false, error: 'Missing plot type' };

  switch (plot.type) {
    case 'ohlcv':
      if (!plot.data.ohlcv_data || Object.keys(plot.data.ohlcv_data).length === 0)
        return { valid: false, error: 'Missing OHLCV data' };
      break;
    case 'returns':
      if (!plot.data.returns_data || plot.data.returns_data.length === 0)
        return { valid: false, error: 'Missing returns data' };
      break;
    case 'chart_with_indicators':
      if (!plot.data.ohlcv || plot.data.ohlcv.length === 0)
        return { valid: false, error: 'Missing OHLCV data for indicators chart' };
      break;
    case 'chart_with_backtest_results':
      if (!plot.data['Backtest Data'] || plot.data['Backtest Data'].length === 0)
        return { valid: false, error: 'Missing backtest data' };
      break;
  }
  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════════
// INDICATOR CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════

const INDICATOR_SCALE_MAP: Record<string, 'price' | 'oscillator'> = {
  SMA: 'price', EMA: 'price', WMA: 'price', TEMA: 'price',
  KAMA: 'price', BOLLINGER: 'price', BB: 'price',
  RSI: 'oscillator', MFI: 'oscillator', CCI: 'oscillator',
  WILLR: 'oscillator', ROC: 'oscillator', MOM: 'oscillator',
  MOMENTUM: 'oscillator', MACD: 'oscillator', STOCH: 'oscillator',
  ULTOSC: 'oscillator', ADX: 'oscillator', NATR: 'oscillator',
};

function isOscillatorIndicator(name: string): boolean {
  const upper = name.toUpperCase();
  for (const key in INDICATOR_SCALE_MAP) {
    if (upper.includes(key)) return INDICATOR_SCALE_MAP[key] === 'oscillator';
  }
  return false;
}

function getAvailableIndicators(plot: PlotData): {
  price: string[];
  oscillator: string[];
} {
  const price: string[] = [];
  const oscillator: string[] = [];

  if (
    plot.type !== 'chart_with_indicators' &&
    plot.type !== 'chart_with_backtest_results'
  )
    return { price, oscillator };

  flattenEntries(plot.data.overlays).forEach(({ name }) => {
    if (!name) return;
    (isOscillatorIndicator(name) ? oscillator : price).push(name);
  });

  // windows are always oscillators
  flattenEntries(plot.data.windows).forEach(({ name }) => {
    if (name) oscillator.push(name);
  });

  return { price, oscillator };
}

// ═══════════════════════════════════════════════════════════════════════
// Find first oscillator's raw data — needed for crosshair value map
// ═══════════════════════════════════════════════════════════════════════

function getFirstOscillatorData(
  plot: PlotData,
  selected: Set<string>
): { name: string; data: any[] } | null {
  // Check overlays (only oscillator-type ones)
  for (const entry of flattenEntries(plot.data.overlays)) {
    if (entry.name && selected.has(entry.name) && isOscillatorIndicator(entry.name) && entry.data?.length)
      return entry;
  }
  // Check windows (all are oscillators)
  for (const entry of flattenEntries(plot.data.windows)) {
    if (entry.name && selected.has(entry.name) && entry.data?.length)
      return entry;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════

interface PlotChartProps {
  plot: PlotData;
  messageIndex: number;
  plotIndex: number;
  chartRefsMap: React.MutableRefObject<Map<string, IChartApi>>;
}

export function PlotChart({ plot, messageIndex, plotIndex, chartRefsMap }: PlotChartProps) {
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const oscContainerRef = useRef<HTMLDivElement>(null);
  const syncCleanupRef = useRef<(() => void) | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);

  const mainKey = `msg-${messageIndex}-plot-${plotIndex}-main`;
  const oscKey = `msg-${messageIndex}-plot-${plotIndex}-osc`;
  const { theme } = useTheme();

  const [selectedPrice, setSelectedPrice] = useState<Set<string>>(new Set());
  const [selectedOsc, setSelectedOsc] = useState<Set<string>>(new Set());
  const [showDropdown, setShowDropdown] = useState(false);
  const [available, setAvailable] = useState<{ price: string[]; oscillator: string[] }>({
    price: [],
    oscillator: [],
  });

  const validation = validatePlotData(plot);

  // ★ Derived — does current selection need an oscillator pane?
  const needsOscPane =
    selectedOsc.size > 0 &&
    (plot.type === 'chart_with_indicators' || plot.type === 'chart_with_backtest_results');

  // ── initialize indicators ──────────────────────────────────────────
  useEffect(() => {
    if (plot.type === 'chart_with_indicators' || plot.type === 'chart_with_backtest_results') {
      const ind = getAvailableIndicators(plot);
      setAvailable(ind);
      setSelectedPrice(new Set(ind.price));
      setSelectedOsc(new Set(ind.oscillator));
    }
  }, [plot]);

  if (!validation.valid) return <></>;

  // ── cleanup ────────────────────────────────────────────────────────
  const cleanupCharts = () => {
    if (syncCleanupRef.current) {
      syncCleanupRef.current();
      syncCleanupRef.current = null;
    }
    mainSeriesRef.current = null;
    [mainKey, oscKey].forEach((key) => {
      const c = chartRefsMap.current.get(key);
      if (c) {
        try { c.remove(); } catch { /* */ }
        chartRefsMap.current.delete(key);
      }
    });
  };

  // ══════════════════════════════════════════════════════════════════════
  // MAIN CHART EFFECT — mirrors StockDetailPage pattern exactly
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!mainContainerRef.current || !plot.data) return;
    cleanupCharts();

    const isDark = theme === 'dark';
    const chartWidth = mainContainerRef.current.clientWidth;

    // ── MAIN CHART ────────────────────────────────────────────────────
    const mainChart = createChart(mainContainerRef.current, {
      width: chartWidth,
      height: 400,
      layout: {
        background: { color: 'transparent' },
        textColor: isDark ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: isDark ? '#374151' : '#e5e7eb' },
        horzLines: { color: isDark ? '#374151' : '#e5e7eb' },
      },
      crosshair: {
        mode: 0, // ★ Normal — required for setCrosshairPosition
        vertLine: {
          labelVisible: !needsOscPane, // ★ hide time label when osc pane shows it
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#4b5563' : '#d1d5db',
        minimumWidth: 65, // ★ align with oscillator chart
      },
      timeScale: {
        borderColor: isDark ? '#4b5563' : '#d1d5db',
        timeVisible: true,
        secondsVisible: false,
        visible: !needsOscPane, // ★ hide when osc pane has the shared axis
      },
    });
    chartRefsMap.current.set(mainKey, mainChart);

    let mainSeries: ISeriesApi<any> | null = null;

    try {
      switch (plot.type) {
        case 'ohlcv':
          mainSeries = renderOHLCVChart(mainChart, plot);
          break;
        case 'returns':
          mainSeries = renderReturnsChart(mainChart, plot);
          break;
        case 'chart_with_indicators':
          mainSeries = renderIndicatorsChart(mainChart, plot, selectedPrice);
          break;
        case 'chart_with_backtest_results':
          mainSeries = renderBacktestChart(mainChart, plot, selectedPrice);
          break;
      }
      mainSeriesRef.current = mainSeries;

      // ── OSCILLATOR PANE ─────────────────────────────────────────────
      if (needsOscPane && oscContainerRef.current) {
        const oscChart = createOscillatorPane(
          oscContainerRef.current,
          theme,
          chartWidth,
          200
        );
        // ★ Match main chart's time format
        oscChart.applyOptions({
          timeScale: { timeVisible: true, secondsVisible: false },
        });
        chartRefsMap.current.set(oscKey, oscChart);

        // Render oscillators into a shared series map
        const oscSeriesMap = new Map<string, ISeriesApi<any>>();
        renderOscillatorIndicators(oscChart, plot, selectedOsc, oscSeriesMap);

        // ★★★ GET FIRST OSCILLATOR SERIES FOR CROSSHAIR TARGET ★★★
        const firstOscSeries: ISeriesApi<any> | null =
          oscSeriesMap.size > 0 ? (oscSeriesMap.values().next().value ?? null) : null;

        // ★★★ WIRE UP SYNC — EXACTLY LIKE StockDetailPage ★★★
        if (mainSeries && firstOscSeries) {
          // Build lookup maps
          const ohlcvSource = plot.data.ohlcv || plot.data['Backtest Data'] || [];
          const priceMap = buildPriceMap(ohlcvSource);

          const firstOscData = getFirstOscillatorData(plot, selectedOsc);
          const oscValueMap = firstOscData
            ? buildValueMap(firstOscData.data, firstOscData.name)
            : new Map<string, number>();

          const cleanupTime = syncTimeScales(mainChart, oscChart);
          const cleanupCross = syncCrosshairs(
            mainChart,
            oscChart,
            mainSeries,
            firstOscSeries,
            priceMap,
            oscValueMap
          );

          syncCleanupRef.current = () => {
            cleanupTime();
            cleanupCross();
          };
        } else {
          // At minimum sync scroll/zoom
          const cleanupTime = syncTimeScales(mainChart, oscChart);
          syncCleanupRef.current = cleanupTime;
        }

        oscChart.timeScale().fitContent();
      }
    } catch (error) {
      console.error(`Failed to render ${plot.type} chart:`, error);
    }

    mainChart.timeScale().fitContent();

    // ── Resize BOTH charts ─────────────────────────────────────────
    const handleResize = () => {
      const w = mainContainerRef.current?.clientWidth;
      if (!w) return;
      [mainKey, oscKey].forEach((key) => {
        const c = chartRefsMap.current.get(key);
        if (c) {
          try { c.applyOptions({ width: w }); } catch { /* */ }
        }
      });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cleanupCharts();
    };
  }, [plot, mainKey, oscKey, chartRefsMap, theme, selectedPrice, selectedOsc]);

  // ── toggles ────────────────────────────────────────────────────────
  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, item: string) => {
    const next = new Set(set);
    next.has(item) ? next.delete(item) : next.add(item);
    setter(next);
  };

  const getSymbols = (): string => {
    if (plot.data.symbols)
      return Array.isArray(plot.data.symbols) ? plot.data.symbols.join(', ') : plot.data.symbols;
    if (plot.data.symbol) return plot.data.symbol;
    if (plot.data.ohlcv_data) return Object.keys(plot.data.ohlcv_data).join(', ');
    return 'Chart';
  };

  // ══════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-light-accent-primary dark:text-dark-accent-primary" />
          <span className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
            {getSymbols()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {plot.data.market && (
            <span className="text-xs px-2 py-1 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded text-light-text-tertiary dark:text-dark-text-tertiary">
              {plot.data.market.toUpperCase()}
            </span>
          )}

          {/* Indicator Dropdown */}
          {(plot.type === 'chart_with_indicators' || plot.type === 'chart_with_backtest_results') &&
            (available.price.length > 0 || available.oscillator.length > 0) && (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-light-bg-tertiary dark:bg-dark-bg-tertiary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded text-light-text-secondary dark:text-dark-text-secondary transition-colors"
                >
                  <span>Indicators ({selectedPrice.size + selectedOsc.size})</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                    {available.price.length > 0 && (
                      <div className="border-b border-light-border-primary dark:border-dark-border-primary">
                        <div className="px-3 py-2 bg-light-bg-tertiary dark:bg-dark-bg-tertiary">
                          <span className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary">
                            Price Overlays
                          </span>
                        </div>
                        {available.price.map((ind) => (
                          <DropdownCheckbox
                            key={ind}
                            label={ind}
                            checked={selectedPrice.has(ind)}
                            onChange={() => toggle(selectedPrice, setSelectedPrice, ind)}
                          />
                        ))}
                      </div>
                    )}
                    {available.oscillator.length > 0 && (
                      <div>
                        <div className="px-3 py-2 bg-light-bg-tertiary dark:bg-dark-bg-tertiary">
                          <span className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary">
                            Oscillators (Separate Pane)
                          </span>
                        </div>
                        {available.oscillator.map((ind) => (
                          <DropdownCheckbox
                            key={ind}
                            label={ind}
                            checked={selectedOsc.has(ind)}
                            onChange={() => toggle(selectedOsc, setSelectedOsc, ind)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          <span className="text-xs px-2 py-1 bg-light-accent-primary/10 dark:bg-dark-accent-primary/10 rounded text-light-accent-primary dark:text-dark-accent-primary font-medium">
            {formatPlotType(plot.type)}
          </span>
        </div>
      </div>

      {plot.start_date && plot.end_date && (
        <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-3">
          {plot.start_date} to {plot.end_date}
        </div>
      )}

      {plot.data.total_return !== undefined && (
        <div className="mb-3 px-3 py-2 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded-lg">
          <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
            Total Return:{' '}
            <span className={`font-semibold ${
              plot.data.total_return >= 0
                ? 'text-light-accent-success dark:text-dark-accent-success'
                : 'text-light-accent-danger dark:text-dark-accent-danger'
            }`}>
              {plot.data.total_return >= 0 ? '+' : ''}{plot.data.total_return}%
            </span>
          </span>
        </div>
      )}

      {/* ★ Main Chart — no bottom gap */}
      <div ref={mainContainerRef} className="w-full" />

      {/*
        ★ Oscillator Chart — ALWAYS rendered (ref must be stable)
        Hidden with CSS when not needed. Flush against main chart.
      */}
      <div
        ref={oscContainerRef}
        className={`w-full ${needsOscPane ? '' : 'hidden'}`}
        style={{ marginTop: -1 }}
      />

      {/* Backtest Metrics */}
      {plot.type === 'chart_with_backtest_results' && plot.data.indicators && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {Object.entries(plot.data.indicators).map(([key, value]) => (
            <div key={key} className="px-2 py-1 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded text-xs">
              <span className="text-light-text-tertiary dark:text-dark-text-tertiary">{key}: </span>
              <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                {typeof value === 'number' ? value.toFixed(2) : String(value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DROPDOWN CHECKBOX (extracted to reduce duplication)
// ═══════════════════════════════════════════════════════════════════════

function DropdownCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary text-left text-xs transition-colors"
    >
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
        checked
          ? 'bg-light-accent-primary dark:bg-dark-accent-primary border-light-accent-primary dark:border-dark-accent-primary'
          : 'border-light-border-secondary dark:border-dark-border-secondary'
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-light-text-primary dark:text-dark-text-primary">{label}</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RENDER FUNCTIONS — each returns the "main" series for crosshair sync
// ★ ALL setData calls normalize date→time via t() helper
// ═══════════════════════════════════════════════════════════════════════

function t(d: any): string {
  return d.time ?? d.date;
}

function formatPlotType(type: string): string {
  return ({ ohlcv: 'Price Chart', returns: 'Returns', chart_with_indicators: 'Indicators', chart_with_backtest_results: 'Backtest' })[type] || type;
}

// ── OHLCV ────────────────────────────────────────────────────────────

function renderOHLCVChart(chart: IChartApi, plot: PlotData): ISeriesApi<any> | null {
  if (!plot.data.ohlcv_data) return null;

  const symbols = Object.keys(plot.data.ohlcv_data);
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
  let first: ISeriesApi<any> | null = null;

  symbols.forEach((sym, i) => {
    const data = plot.data.ohlcv_data![sym];
    if (symbols.length === 1) {
      const s = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981', downColor: '#ef4444',
        borderUpColor: '#10b981', borderDownColor: '#ef4444',
        wickUpColor: '#10b981', wickDownColor: '#ef4444',
      });
      s.setData(data.map(d => ({ time: t(d), open: d.open, high: d.high, low: d.low, close: d.close })));
      if (!first) first = s;
    } else {
      const s = chart.addSeries(LineSeries, { color: colors[i % colors.length], lineWidth: 2, title: sym });
      s.setData(data.map(d => ({ time: t(d), value: d.close })));
      if (!first) first = s;
    }
  });

  return first;
}

// ── Returns ──────────────────────────────────────────────────────────

function renderReturnsChart(chart: IChartApi, plot: PlotData): ISeriesApi<any> | null {
  if (!plot.data.returns_data) return null;
  const s = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2, title: 'Returns' });
  s.setData(plot.data.returns_data.map(d => ({
    time: t(d),
    value: d.return !== undefined ? d.return : (d.price || 0),
  })));
  return s;
}

// ── Indicators (price overlays on main chart) ────────────────────────

function renderIndicatorsChart(
  chart: IChartApi,
  plot: PlotData,
  selectedPrice: Set<string>
): ISeriesApi<any> | null {
  if (!plot.data.ohlcv) return null;

  const candle = chart.addSeries(CandlestickSeries, {
    upColor: '#10b981', downColor: '#ef4444',
    borderUpColor: '#10b981', borderDownColor: '#ef4444',
    wickUpColor: '#10b981', wickDownColor: '#ef4444',
  });
  candle.setData(plot.data.ohlcv.map((d: any) => ({
    time: t(d), open: d.open, high: d.high, low: d.low, close: d.close,
  })));

  const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#14b8a6', '#ec4899', '#10b981'];
  let ci = 0;

  flattenEntries(plot.data.overlays).forEach(({ name, data }) => {
    if (selectedPrice.has(name) && !isOscillatorIndicator(name)) {
      renderPriceIndicator(chart, name, data, colors, ci++);
    }
  });

  return candle; // ★ returned for crosshair sync
}

// ── Backtest ─────────────────────────────────────────────────────────

function renderBacktestChart(
  chart: IChartApi,
  plot: PlotData,
  selectedPrice: Set<string>
): ISeriesApi<any> | null {
  const bd = plot.data['Backtest Data'];
  if (!bd) return null;

  const hasOHLC = bd.length > 0 && bd[0].open !== undefined && bd[0].high !== undefined;
  let mainSeries: any = null;

  if (hasOHLC) {
    mainSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#ef4444',
      borderUpColor: '#10b981', borderDownColor: '#ef4444',
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });
    mainSeries.setData(bd.map((d: any) => ({
      time: t(d), open: d.open, high: d.high, low: d.low, close: d.close,
    })));
  } else if (bd[0].close !== undefined) {
    mainSeries = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2, title: 'Price' });
    mainSeries.setData(bd.map((d: any) => ({ time: t(d), value: d.close })));
  }

  // Bollinger Bands overlay
  if (selectedPrice.has('Bollinger Bands') || selectedPrice.has('BB')) {
    const hasBB = bd[0].BB_UPPER !== undefined || bd[0].bb_upper !== undefined;
    if (hasBB) {
      const uk = bd[0].BB_UPPER !== undefined ? 'BB_UPPER' : 'bb_upper';
      const mk = bd[0].BB_MID !== undefined ? 'BB_MID' : 'bb_mid';
      const lk = bd[0].BB_LOWER !== undefined ? 'BB_LOWER' : 'bb_lower';
      [
        { key: uk, title: 'BB Upper', w: 1 },
        { key: mk, title: 'BB Mid', w: 2 },
        { key: lk, title: 'BB Lower', w: 1 },
      ].forEach(({ key, title, w }) => {
        const s = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: w as any, title, priceLineVisible: false });
        s.setData(bd.filter((d: any) => d[key] !== null).map((d: any) => ({ time: t(d), value: d[key] })));
      });
    }
  }

  // Trade markers
  if (mainSeries && bd.length > 0) {
    const markers: any[] = [];
    bd.forEach((d: any) => {
      if (d.trade && typeof d.trade === 'string') {
        const isBuy = d.trade.toUpperCase().includes('BUY');
        markers.push({
          time: t(d),
          position: isBuy ? 'belowBar' : 'aboveBar',
          color: isBuy ? '#10b981' : '#ef4444',
          shape: isBuy ? 'arrowUp' : 'arrowDown',
          text: isBuy ? 'B' : 'S',
          size: 1,
        });
      }
    });
    createSeriesMarkers(mainSeries, markers);
  }

  return mainSeries; // ★ returned for crosshair sync
}

// ═══════════════════════════════════════════════════════════════════════
// OSCILLATOR RENDERING (separate pane)
// ═══════════════════════════════════════════════════════════════════════

function renderOscillatorIndicators(
  chart: IChartApi,
  plot: PlotData,
  selectedOsc: Set<string>,
  seriesMap: Map<string, ISeriesApi<any>>
) {
  const colors = ['#8b5cf6', '#f59e0b', '#3b82f6', '#10b981', '#ec4899'];
  let ci = 0;

  // Overlays that happen to be oscillators
  flattenEntries(plot.data.overlays).forEach(({ name, data }) => {
    if (name && selectedOsc.has(name) && isOscillatorIndicator(name) && data?.length) {
      renderOscLine(chart, name, data, colors[ci++ % colors.length], seriesMap);
    }
  });

  // Windows are always oscillators
  flattenEntries(plot.data.windows).forEach(({ name, data }) => {
    if (name && selectedOsc.has(name) && data?.length) {
      renderOscLine(chart, name, data, colors[ci++ % colors.length], seriesMap);
    }
  });
}

// ── Single oscillator line ───────────────────────────────────────────

function renderOscLine(
  chart: IChartApi,
  name: string,
  data: any[],
  color: string,
  seriesMap: Map<string, ISeriesApi<any>>
) {
  if (!data?.length) return;

  const series = chart.addSeries(LineSeries, {
    color,
    lineWidth: 2,
    title: name,
    priceLineVisible: false,
    lastValueVisible: true,
  });

  const first = data[0];

  // ★★★ CRITICAL FIX: always map date→time ★★★
  if (first.value !== undefined) {
    series.setData(data.map(d => ({ time: t(d), value: d.value })));
  } else if (first[name] !== undefined) {
    series.setData(data.map(d => ({ time: t(d), value: d[name] })));
  } else {
    // Try to find any numeric key that's not date/time
    const numKey = Object.keys(first).find(k => k !== 'date' && k !== 'time' && typeof first[k] === 'number');
    if (numKey) {
      series.setData(data.map(d => ({ time: t(d), value: d[numKey] })));
    }
  }

  seriesMap.set(name, series);
}

// ── Single price overlay ─────────────────────────────────────────────

function renderPriceIndicator(
  chart: IChartApi,
  name: string,
  data: any[],
  colors: string[],
  ci: number
) {
  if (!data?.length) return;

  const first = data[0];

  // Bollinger Bands (3 lines)
  if (first.BB_UPPER !== undefined || first.upper !== undefined) {
    const uk = first.BB_UPPER !== undefined ? 'BB_UPPER' : 'upper';
    const mk = first.BB_MID !== undefined ? 'BB_MID' : first.mid !== undefined ? 'mid' : 'BB_MIDDLE';
    const lk = first.BB_LOWER !== undefined ? 'BB_LOWER' : 'lower';
    [
      { key: uk, title: 'BB Upper', w: 1 },
      { key: mk, title: 'BB Mid', w: 2 },
      { key: lk, title: 'BB Lower', w: 1 },
    ].forEach(({ key, title, w }) => {
      const s = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: w as any, title, priceLineVisible: false });
      // ★ always map date→time
      s.setData(data.map((d: any) => ({ time: t(d), value: d[key] })));
    });
  } else {
    // Regular indicator line
    const series = chart.addSeries(LineSeries, {
      color: colors[ci % colors.length],
      lineWidth: 2,
      title: name,
      priceLineVisible: false,
    });

    // ★★★ CRITICAL FIX: always map date→time ★★★
    if (first.value !== undefined) {
      series.setData(data.map(d => ({ time: t(d), value: d.value })));
    } else if (first[name] !== undefined) {
      series.setData(data.map(d => ({ time: t(d), value: d[name] })));
    } else {
      const numKey = Object.keys(first).find(k => k !== 'date' && k !== 'time' && typeof first[k] === 'number');
      if (numKey) {
        series.setData(data.map(d => ({ time: t(d), value: d[numKey] })));
      }
    }
  }
}

// ── Helper to flatten overlays/windows ──────────────────────────────

function flattenEntries(source: any): { name: string; data: any[] }[] {
  if (!source) return [];
  if (Array.isArray(source)) {
    return source.map((s: any) => ({
      name: (s.indicator || s.name) as string,
      data: (s.data || []) as any[],
    }));
  }
  return Object.entries(source).map(([k, v]: [string, any]) => ({
    name: k,
    data: (v?.data || []) as any[],
  }));
}