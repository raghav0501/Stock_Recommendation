import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import {
  CandlestickSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import {
  getStockDetail,
  getStockFundamentalsData,
  getStockNewsArticle,
  type StockDetail,
  type StockFundamentals,
  type StockNewsArticle,
} from '../../api/stockApi';
import { getBaseChartOptions, getCandlestickOptions } from '../../config/chartConfig';
import { useTheme } from '../../config/ThemeContext';
import {
  formatStockPrice,
  formatCurrency,
  formatDate,
  formatChange,
} from '../../utils/formatter';
import {
  addIndicatorLine,
  addBollingerBands,
  createOscillatorPane,
  addOscillatorIndicator,
  addMACDIndicator,
  addStochasticIndicator,
  syncTimeScales,
  syncCrosshairs,
  buildPriceMap,
  buildIndicatorValueMap,
  getPrimarySeriesKey,
} from '../../utils/chartUtils';
import type { TechnicalParameter } from '../../models/Market';
import { Loader } from '../../components/Loader';
import Markdown from 'markdown-to-jsx';
import { useToast } from '../../components/Toast';
import { toastMessage } from '../../utils/errorMessage';
import { getIndicators, type Indicators } from '../../api/backendService';

interface StockDetailPageProps {
  indicators: string[];
}

export function StockDetailPage({ indicators }: StockDetailPageProps) {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const location = useLocation();
  const { theme } = useTheme();

  const navState = location.state as { from?: string; exchange?: string; alertIndicators?: string[] } | null;
  const from = navState?.from;
  const stateExchange = navState?.exchange;
  const effectiveIndicators = [...new Set([...indicators, ...(navState?.alertIndicators ?? [])])];
  const backLabel =
    from === 'watchlist'  ? 'Back to Watchlist' :
    from === 'early-alert' ? 'Back to Early Alert Scanner' :
    from === 'alerts'     ? 'Back to Active Alerts' :
    from === 'portfolio'  ? 'Back to Portfolio' :
    'Back to Stocks';
  const backPath =
    from === 'watchlist'   ? '/watchlist' :
    from === 'early-alert' ? '/early-alert' :
    from === 'alerts'     ? '/alerts' :
    from === 'portfolio'  ? '/portfolio' :
    '/stocks';

  // ── chart refs ──────────────────────────────────────────────────────
  const mainChartContainerRef = useRef<HTMLDivElement>(null);
  const oscillatorChartContainerRef = useRef<HTMLDivElement>(null);
  const mainChartRef = useRef<IChartApi | null>(null);
  const oscillatorChartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<any> | null>(null); // ★
  const seriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());
  const syncCleanupRef = useRef<(() => void) | null>(null);

  // ── data state ──────────────────────────────────────────────────────
  const [stockDetail, setStockDetail] = useState<StockDetail | null>(null);
  const [stockNews, setStockNews] = useState<StockNewsArticle | null>(null);
  const [stockFundamentals, setStockFundamentals] = useState<StockFundamentals | null>(null);
  const [stockDetailLoading, setStockDetailLoading] = useState('');
  const [stockNewsLoading, setStockNewsLoading] = useState('');
  const [stockFundamentalsLoading, setStockFundamentalsLoading] = useState('');
  const [selectedIndicators, setSelectedIndicators] = useState<Set<string>>(
    new Set(effectiveIndicators)
  );
  const [showAllNews, setShowAllNews] = useState(false);

  const { data: rawIndicators = [], error: indicatorsError } = useQuery<Indicators[]>({
    queryKey: ['indicators'],
    queryFn: getIndicators,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (indicatorsError) showToast(toastMessage(indicatorsError));
  }, [indicatorsError]);
  const chartableIndicators = useMemo<TechnicalParameter[]>(
    () => rawIndicators
      .filter(ind => ind.category.toLowerCase() !== 'strategy')
      .map(ind => ({
        id: ind.id,
        name: ind.name,
        description: ind.description,
        category: ind.category as TechnicalParameter['category'],
        scale: ind.scale as TechnicalParameter['scale'],
        chartable: ind.scale !== 'none',
      })),
    [rawIndicators]
  );

  const displayedNews = showAllNews
    ? stockNews?.news
    : stockNews?.news.slice(0, 9);

  // const chartableIndicators = parameters.filter(p => p.chartable);
  const sortedIndicators = [
    ...chartableIndicators.filter((p) => effectiveIndicators.includes(p.id)),
    ...chartableIndicators.filter((p) => !effectiveIndicators.includes(p.id)),
  ];

  // ★ derived: does current selection include any oscillator?
  const hasOscillator = Array.from(selectedIndicators).some((id) => {
    const p = chartableIndicators.find((x) => x.id === id);
    return p?.scale === 'oscillator' || p?.scale === 'volume';
  });

  // ── data loading ────────────────────────────────────────────────────
  useEffect(() => {
    if (!symbol) return;

    setStockDetailLoading('Loading stock details...');
    getStockDetail(symbol, effectiveIndicators, stateExchange)
      .then(data => setStockDetail(data))
      .catch(err => showToast(toastMessage(err)))
      .finally(() => setStockDetailLoading(''));

    setStockNewsLoading('Loading news...');
    getStockNewsArticle(symbol)
      .then(data => setStockNews(data))
      .catch(err => showToast(toastMessage(err)))
      .finally(() => setStockNewsLoading(''));

    setStockFundamentalsLoading('Loading fundamentals...');
    getStockFundamentalsData(symbol, stateExchange)
      .then(data => setStockFundamentals(data))
      .catch(err => showToast(toastMessage(err)))
      .finally(() => setStockFundamentalsLoading(''));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  // ── cleanup helper ──────────────────────────────────────────────────
  const cleanupCharts = () => {
    // 1. tear down sync subscriptions FIRST
    if (syncCleanupRef.current) {
      syncCleanupRef.current();
      syncCleanupRef.current = null;
    }
    // 2. clear series map
    seriesRef.current.clear();
    candlestickSeriesRef.current = null;
    // 3. remove charts
    [mainChartRef, oscillatorChartRef].forEach((ref) => {
      if (ref.current) {
        try {
          ref.current.remove();
        } catch {
          /* already disposed */
        }
        ref.current = null;
      }
    });
  };

  // ══════════════════════════════════════════════════════════════════════
  // EFFECT 1 — CHART STRUCTURE (stock/theme change only)
  // Builds the main chart + candlestick. Does NOT touch indicators.
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!mainChartContainerRef.current || !stockDetail) return;
    cleanupCharts();

    const chartWidth = mainChartContainerRef.current.clientWidth;
    const baseOpts = getBaseChartOptions(theme, chartWidth, 400);
    const mainChart = createChart(mainChartContainerRef.current, {
      ...baseOpts,
      crosshair: { mode: 0, vertLine: { labelVisible: true } },
      rightPriceScale: { ...(baseOpts as any).rightPriceScale, minimumWidth: 65 },
      timeScale: { ...(baseOpts as any).timeScale, visible: true },
    });
    mainChartRef.current = mainChart;

    const candlestick = mainChart.addSeries(CandlestickSeries, getCandlestickOptions());
    candlestickSeriesRef.current = candlestick;

    if (stockDetail.chartData?.length) {
      const validCandles = stockDetail.chartData.filter(
        (d) => d.open != null && d.high != null && d.low != null && d.close != null
      );
      if (validCandles.length) {
        candlestick.setData(
          validCandles.map((d) => ({
            time: d.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }))
        );
      }
    }

    mainChart.timeScale().fitContent();

    const handleResize = () => {
      const w = mainChartContainerRef.current?.clientWidth;
      if (!w) return;
      try { mainChartRef.current?.applyOptions({ width: w }); } catch { /* */ }
      try { oscillatorChartRef.current?.applyOptions({ width: w }); } catch { /* */ }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cleanupCharts();
    };
  }, [stockDetail, theme]);

  // ══════════════════════════════════════════════════════════════════════
  // EFFECT 2 — INDICATOR LAYER (runs on toggle without rebuilding chart)
  // Clears old indicator series and re-adds the current selection.
  // Candlestick and pan/zoom state are preserved across toggles.
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!mainChartRef.current || !stockDetail) return;

    const mainChart = mainChartRef.current;

    // ── tear down previous sync + oscillator ──────────────────────────
    if (syncCleanupRef.current) {
      syncCleanupRef.current();
      syncCleanupRef.current = null;
    }
    if (oscillatorChartRef.current) {
      try { oscillatorChartRef.current.remove(); } catch { /* */ }
      oscillatorChartRef.current = null;
    }

    // ── remove previous indicator series from main chart ─────────────
    // Series that were on the oscillator chart are already gone above;
    // the try/catch silently skips them.
    seriesRef.current.forEach((series) => {
      try { mainChart.removeSeries(series); } catch { /* was on osc chart */ }
    });
    seriesRef.current.clear();

    // ── route selected indicators by scale ───────────────────────────
    const priceIds: string[] = [];
    const oscIds: string[] = [];
    selectedIndicators.forEach((id) => {
      const p = chartableIndicators.find((x) => x.id === id);
      if (!p?.chartable) return;
      if (p.scale === 'price') priceIds.push(id);
      else if (p.scale === 'oscillator' || p.scale === 'volume') oscIds.push(id);
    });
    const needOscPane = oscIds.length > 0;

    // ── update main chart options to reflect oscillator presence ──────
    mainChart.applyOptions({
      crosshair: { mode: 0, vertLine: { labelVisible: !needOscPane } },
      timeScale: { visible: !needOscPane },
    });

    const stockDataWithTechnicals = {
      ohlcv: stockDetail.chartData,
      technicals: stockDetail.technicalIndicators || [],
    };

    // ── price-scale overlay indicators ────────────────────────────────
    priceIds.forEach((id) => {
      if (id === 'bbands_20') {
        addBollingerBands(mainChart, stockDataWithTechnicals, '#f59e0b', seriesRef.current);
      } else if (id === 'macd') {
        addMACDIndicator(mainChart, stockDataWithTechnicals, seriesRef.current);
      } else if (
        (id === 'stoch_k' || id === 'stoch_d') &&
        !seriesRef.current.has('stoch_k')
      ) {
        addStochasticIndicator(mainChart, stockDataWithTechnicals, seriesRef.current);
      } else {
        const param = chartableIndicators.find((x) => x.id === id);
        addIndicatorLine(
          mainChart,
          id,
          stockDataWithTechnicals,
          {
            color: getIndicatorColor(id),
            lineWidth: 2,
            title: param?.name || id,
            priceLineVisible: false,
            lastValueVisible: true,
          },
          seriesRef.current
        );
      }
    });

    // ── oscillator pane ───────────────────────────────────────────────
    if (needOscPane && oscillatorChartContainerRef.current) {
      const chartWidth = mainChartContainerRef.current?.clientWidth ?? 800;
      const oscChart = createOscillatorPane(
        oscillatorChartContainerRef.current,
        theme,
        chartWidth,
        200
      );
      oscillatorChartRef.current = oscChart;

      oscIds.forEach((id) => {
        const param = chartableIndicators.find((x) => x.id === id);
        if (!param) return;
        const opts = {
          color: getIndicatorColor(id),
          lineWidth: 2,
          title: param.name,
          priceLineVisible: false,
          lastValueVisible: true,
        };
        if (id === 'macd') {
          addMACDIndicator(oscChart, stockDataWithTechnicals, seriesRef.current);
        } else if (
          (id === 'stoch_k' || id === 'stoch_d') &&
          !seriesRef.current.has('stoch_k')
        ) {
          addStochasticIndicator(oscChart, stockDataWithTechnicals, seriesRef.current);
        } else if (id === 'rsi_14' || id === 'mfi_14') {
          addOscillatorIndicator(oscChart, id, stockDataWithTechnicals, opts, seriesRef.current, 0, 100);
        } else if (id === 'willr_14') {
          addOscillatorIndicator(oscChart, id, stockDataWithTechnicals, opts, seriesRef.current, -100, 0);
        } else {
          addOscillatorIndicator(oscChart, id, stockDataWithTechnicals, opts, seriesRef.current);
        }
      });

      let firstOscSeries: ISeriesApi<any> | null = null;
      let firstOscIndicatorKey = '';
      for (const id of oscIds) {
        const seriesKey = getPrimarySeriesKey(id);
        const series = seriesRef.current.get(seriesKey);
        if (series) {
          firstOscSeries = series;
          firstOscIndicatorKey = seriesKey;
          break;
        }
      }

      if (firstOscSeries && candlestickSeriesRef.current) {
        const mainPriceMap = buildPriceMap(stockDetail.chartData);
        const oscValueMap = buildIndicatorValueMap(
          stockDetail.chartData,
          stockDataWithTechnicals.technicals,
          firstOscIndicatorKey
        );
        const cleanupTime = syncTimeScales(mainChart, oscChart);
        const cleanupCross = syncCrosshairs(
          mainChart,
          oscChart,
          candlestickSeriesRef.current,
          firstOscSeries,
          mainPriceMap,
          oscValueMap
        );
        syncCleanupRef.current = () => {
          cleanupTime();
          cleanupCross();
        };
      } else {
        const cleanupTime = syncTimeScales(mainChart, oscChart);
        syncCleanupRef.current = cleanupTime;
      }

      oscChart.timeScale().fitContent();
    }
  }, [stockDetail, theme, selectedIndicators, chartableIndicators]);

  // ── toggle ────────────────────────────────────────────────────────
  const toggleIndicator = (id: string) =>
    setSelectedIndicators((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const getIndicatorColor = (id: string): string => {
    const c: Record<string, string> = {
      sma_20: '#3b82f6',
      sma_50: '#10b981',
      sma_200: '#ef4444',
      ema_20: '#ec4899',
      ema_50: '#14b8a6',
      rsi_14: '#8b5cf6',
      macd: '#0ea5e9',
      bbands_20: '#f59e0b',
      mfi_14: '#f97316',
      cci_20: '#06b6d4',
      willr_14: '#84cc16',
      mom_10: '#f43f5e',
      roc_10: '#a855f7',
      stoch_k: '#8b5cf6',
      stoch_d: '#f59e0b',
      atr_14: '#6366f1',
      natr: '#10b981',
      wma_20: '#ec4899',
      tema_30: '#14b8a6',
      kama_30: '#f97316',
      mom_osc: '#f43f5e',
      ult_osc: '#a855f7',
    };
    return c[id] || '#6366f1';
  };

  // ── loading / not found ───────────────────────────────────────────
  if (stockDetailLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="md" text="Loading stock details..." />
      </div>
    );
  }

  if (!stockDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          Stock not found
        </p>
        <Button onClick={() => navigate(backPath)}>{backLabel}</Button>
      </div>
    );
  }

  // Use only candles with a valid close to avoid null-arithmetic errors
  const validPriceData = stockDetail.chartData.filter((d) => d.close != null);
  const latestPrice = validPriceData[validPriceData.length - 1]?.close ?? 0;
  const previousPrice = validPriceData[validPriceData.length - 2]?.close ?? latestPrice;
  const priceChange = latestPrice - previousPrice;
  const priceChangePercent = previousPrice !== 0 ? (priceChange / previousPrice) * 100 : 0;
  const changeInfo = formatChange(priceChange, priceChangePercent);

  const selectedChartableNames = effectiveIndicators
    .map((id) => chartableIndicators.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => p!.name);

  // ══════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(backPath)} size="sm">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {backLabel}
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            {stockDetail.metadata.name} ({stockDetail.metadata.symbol})
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            {stockDetail.metadata.sector} - {stockDetail.metadata.industry}
          </p>
        </div>

        <div className="text-left md:text-right">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              LTP:
            </span>
            <span className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
              {formatStockPrice(latestPrice)}
            </span>
            <span
              className={`text-sm font-medium ${
                changeInfo.isPositive
                  ? 'text-light-accent-success dark:text-dark-accent-success'
                  : 'text-light-accent-danger dark:text-dark-accent-danger'
              }`}
            >
              {changeInfo.text} ({changeInfo.percentText})
            </span>
          </div>
          <div className="flex gap-2 mt-1 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
            <span>
              Close: {formatCurrency(previousPrice, { decimals: 2 })}
            </span>
            <span>• {changeInfo.percentText}</span>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <Card className="w-full bg-gradient-to-r from-light-accent-primary/10 to-light-accent-secondary/10 dark:from-dark-accent-primary/10 dark:to-dark-accent-secondary/10 border border-light-border-primary dark:border-dark-border-primary">
        <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
          {selectedChartableNames.length > 0
            ? `Summary based on ${selectedChartableNames.join(', ')} (AI Generated)`
            : 'Summary (AI Generated)'}
        </h3>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          <Markdown>
            {stockDetail.summary || 'No summary available.'}
          </Markdown>
        </p>
      </Card>

      {/* ★★★ CHART SECTION ★★★ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        <div className="lg:col-span-3">
          <Card>
            <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              Chart (1D)
            </h2>

            {/* Main price chart — NO bottom margin */}
            <div ref={mainChartContainerRef} className="w-full" />

            {/*
              ★ Oscillator pane — flush against main chart.
              Always render the div so the ref is stable,
              but hide it with CSS when not needed.
            */}
            <div
              ref={oscillatorChartContainerRef}
              className={`w-full ${hasOscillator ? '' : 'hidden'}`}
              style={{ marginTop: -1 }} // ★ overlap 1px for seamless line
            />
          </Card>
        </div>

        {/* Indicators Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-3 pb-2 border-b border-light-border-primary dark:border-dark-border-primary sticky top-0 bg-light-bg-elevated dark:bg-dark-bg-elevated z-10">
              Indicators
            </h3>
            <div
              className={`space-y-1 min-h-0 ${
                hasOscillator ? 'max-h-[600px]' : 'max-h-[400px]'
              } overflow-y-auto pr-2`}
            >
              {sortedIndicators.map((indicator) => {
                const isSelected = selectedIndicators.has(indicator.id);
                return (
                  <div key={indicator.id}>
                    <button
                      onClick={() => toggleIndicator(indicator.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                        isSelected
                          ? 'bg-light-accent-primary/10 dark:bg-dark-accent-primary/10 border border-light-accent-primary/50 dark:border-dark-accent-primary/50'
                          : 'bg-light-bg-tertiary dark:bg-dark-bg-tertiary border hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: getIndicatorColor(indicator.id),
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-xs font-medium truncate block ${
                              isSelected
                                ? 'text-light-text-primary dark:text-dark-text-primary'
                                : 'text-light-text-secondary dark:text-dark-text-secondary'
                            }`}
                          >
                            {indicator.name}
                          </span>
                          {indicator.scale === 'oscillator' && (
                            <span className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                              Separate pane
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                          isSelected
                            ? 'bg-light-accent-primary dark:bg-dark-accent-primary'
                            : 'bg-light-border-secondary dark:bg-dark-border-secondary'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            isSelected ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Fundamentals */}
      <Card>
        {stockFundamentalsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader size="md" text="Loading fundamentals..." />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <DataItem label="Open"      value={stockFundamentals?.open      ?? '—'} />
            <DataItem label="High"      value={stockFundamentals?.high      ?? '—'} />
            <DataItem label="Low"       value={stockFundamentals?.low       ?? '—'} />
            <DataItem label="Close"     value={stockFundamentals?.close     ?? '—'} />
            <DataItem label="Volume"    value={stockFundamentals?.volume    ?? '—'} />
            <DataItem label="Avg. Vol"  value={stockFundamentals?.avgVolume ?? '—'} />
            <DataItem label="Mkt. Cap"  value={stockFundamentals?.marketCap ?? '—'} />
            <DataItem label="52wk high" value={stockFundamentals?.weekHigh52 ?? '—'} />
            <DataItem label="52wk low"  value={stockFundamentals?.weekLow52  ?? '—'} />
            <DataItem label="P/E Ratio" value={stockFundamentals?.peratio   ?? '—'} />
            <DataItem label="P/B Ratio" value={stockFundamentals?.pbratio   ?? '—'} />
            <DataItem label="EPS"       value={stockFundamentals?.eps       ?? '—'} />
          </div>
        )}
      </Card>

      {/* News Summary */}
      <Card className="w-full bg-gradient-to-r from-light-accent-primary/10 to-light-accent-secondary/10 dark:from-dark-accent-primary/10 dark:to-dark-accent-secondary/10 border border-light-border-primary dark:border-dark-border-primary">
        <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
          News Summary (AI Generated)
        </h3>
        {stockNewsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader size="md" text="Loading news summary..." />
          </div>
        ) : (
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            <Markdown>
              {stockNews?.newsSummary || 'No summary available.'}
            </Markdown>
          </p>
        )}
      </Card>

      {/* News */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
            News
          </h2>
          <span className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary font-medium">
            {stockNews?.news.length ?? 0} Total
          </span>
        </div>
        {stockNewsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader size="md" text="Loading news..." />
          </div>
        ) : !stockNews || stockNews.news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <p className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
              No news found for this stock.
            </p>
            {/* <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
              Check back later or visit the stock's investor relations page directly.
            </p> */}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedNews?.map((item) => (
                <a
                  key={item.newsId}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="flex gap-3 p-3 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded-lg hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors h-full border border-transparent hover:border-light-border-secondary dark:hover:border-dark-border-secondary">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded flex items-center justify-center text-white font-bold text-xs overflow-hidden ${
                        item.thumbnailUrl
                          ? 'bg-transparent' // Transparent when image exists
                          : 'bg-gradient-to-br from-rose-500 to-orange-500' // Gradient fallback
                      }`}
                    >
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        item.source.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
                        {item.source} •{' '}
                        {formatDate(item.publishedDate, 'relative')}
                      </div>
                      <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary group-hover:text-light-accent-primary dark:group-hover:text-dark-accent-primary transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {(stockNews?.news.length || 0) > 9 && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowAllNews(!showAllNews)}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-full border border-light-border-secondary dark:border-dark-border-secondary text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary hover:text-light-accent-primary dark:hover:text-dark-accent-primary transition-all shadow-sm"
                >
                  {showAllNews ? (
                    <>
                      View Less <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      View More ({(stockNews?.news.length || 0) - 9} more){' '}
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

interface DataItemProps {
  label: string;
  value: string;
}

function DataItem({ label, value }: DataItemProps) {
  return (
    <div className="p-3 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded-lg">
      <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
        {label}
      </div>
      <div className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
        {value}
      </div>
    </div>
  );
}