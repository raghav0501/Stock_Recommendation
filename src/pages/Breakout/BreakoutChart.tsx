import { useEffect, useRef } from 'react';
import {
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import { useTheme } from '../../config/ThemeContext';
import {
  createOscillatorPane,
  syncTimeScales,
  syncCrosshairs,
  buildPriceMap,
  buildValueMap,
} from '../../utils/chartUtils';
import type { EarlyAlertStock } from '../../models/Breakout';
import { CHART } from '../../config/signalColors';

const MAIN_HEIGHT = 230;
const RSI_HEIGHT = 140;

function nonZero(val: number | null | undefined): val is number {
  return val != null && val !== 0;
}

interface Props {
  stock: EarlyAlertStock;
}

export function EarlyAlertChart({ stock }: Props) {
  const { theme } = useTheme();
  const mainRef = useRef<HTMLDivElement>(null);
  const rsiRef = useRef<HTMLDivElement>(null);

  const hasBB = stock.bbSignal !== 0;
  const hasRSI = stock.rsiSignal !== 0;

  useEffect(() => {
    if (!mainRef.current) return;
    const container = mainRef.current;
    const isDark = theme === 'dark';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const borderColor = isDark ? '#334155' : '#cbd5e1';
    const width = container.clientWidth || 600;

    // ── Main chart ──────────────────────────────────────────────────
    const mainChart = createChart(container, {
      width,
      height: MAIN_HEIGHT,
      layout: { background: { color: 'transparent' }, textColor },
      grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor, minimumWidth: 65 },
      timeScale: {
        borderColor,
        visible: !hasRSI,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Close price line
    const closeSeries = mainChart.addSeries(LineSeries, {
      color: isDark ? '#e2e8f0' : '#334155',
      lineWidth: 2,
      title: 'Close',
      priceLineVisible: true,
      lastValueVisible: true,
    });
    const rawCloseData = stock.last5Days.filter(d => nonZero(d.close));
    const closeChartData = rawCloseData.map(d => ({ time: d.date as any, value: d.close }));
    closeSeries.setData(closeChartData);

    // BB actual bands (solid) + delta zone boundaries (dashed)
    if (hasBB) {
      const bbUpperData = stock.last5Days
        .filter(d => nonZero(d.bb_upper))
        .map(d => ({ time: d.date as any, value: d.bb_upper! }));
      const bbLowerData = stock.last5Days
        .filter(d => nonZero(d.bb_lower))
        .map(d => ({ time: d.date as any, value: d.bb_lower! }));
      const bbUpperDeltaData = stock.last5Days
        .filter(d => nonZero(d.bb_upper_delta))
        .map(d => ({ time: d.date as any, value: d.bb_upper_delta! }));
      const bbLowerDeltaData = stock.last5Days
        .filter(d => nonZero(d.bb_lower_delta))
        .map(d => ({ time: d.date as any, value: d.bb_lower_delta! }));

      if (bbUpperData.length) {
        mainChart.addSeries(LineSeries, {
          color: CHART.bb, lineWidth: 1, title: 'BB Upper',
          priceLineVisible: false, lastValueVisible: true,
        }).setData(bbUpperData);
      }
      if (bbLowerData.length) {
        mainChart.addSeries(LineSeries, {
          color: CHART.bb, lineWidth: 1, title: 'BB Lower',
          priceLineVisible: false, lastValueVisible: true,
        }).setData(bbLowerData);
      }
      if (bbUpperDeltaData.length) {
        mainChart.addSeries(LineSeries, {
          color: CHART.bbDelta, lineWidth: 1, lineStyle: LineStyle.Dashed,
          title: 'BB Δ Upper', priceLineVisible: false, lastValueVisible: false,
        }).setData(bbUpperDeltaData);
      }
      if (bbLowerDeltaData.length) {
        mainChart.addSeries(LineSeries, {
          color: CHART.bbDelta, lineWidth: 1, lineStyle: LineStyle.Dashed,
          title: 'BB Δ Lower', priceLineVisible: false, lastValueVisible: false,
        }).setData(bbLowerDeltaData);
      }
    }

    mainChart.timeScale().fitContent();

    // ── RSI pane (below main chart) ────────────────────────────────
    let rsiChart: IChartApi | null = null;
    let rsiLineSeries: ISeriesApi<'Line'> | null = null;

    if (hasRSI && rsiRef.current) {
      const rsiChartData = stock.last5Days
        .filter(d => nonZero(d.rsi))
        .map(d => ({ time: d.date as any, value: d.rsi! }));

      if (rsiChartData.length) {
        rsiChart = createOscillatorPane(rsiRef.current, theme, width, RSI_HEIGHT);

        rsiLineSeries = rsiChart.addSeries(LineSeries, {
          color: CHART.rsi, lineWidth: 2, title: 'RSI',
          priceLineVisible: false, lastValueVisible: true,
        });
        rsiLineSeries.setData(rsiChartData);

        // RSI delta zone boundaries (dashed) — cyan to distinguish from RSI line
        const rsiUpperDeltaData = stock.last5Days
          .filter(d => nonZero(d.rsi_upper_delta))
          .map(d => ({ time: d.date as any, value: d.rsi_upper_delta! }));
        const rsiLowerDeltaData = stock.last5Days
          .filter(d => nonZero(d.rsi_lower_delta))
          .map(d => ({ time: d.date as any, value: d.rsi_lower_delta! }));

        if (rsiUpperDeltaData.length) {
          rsiChart.addSeries(LineSeries, {
            color: CHART.rsiDelta, lineWidth: 1, lineStyle: LineStyle.Dashed,
            title: 'RSI Δ Upper', priceLineVisible: false, lastValueVisible: false,
          }).setData(rsiUpperDeltaData);
        }
        if (rsiLowerDeltaData.length) {
          rsiChart.addSeries(LineSeries, {
            color: CHART.rsiDelta, lineWidth: 1, lineStyle: LineStyle.Dashed,
            title: 'RSI Δ Lower', priceLineVisible: false, lastValueVisible: false,
          }).setData(rsiLowerDeltaData);
        }

        // Standard RSI reference levels
        rsiLineSeries.createPriceLine({ price: 70, color: CHART.rsiOver,  lineWidth: 1, lineStyle: LineStyle.Solid, axisLabelVisible: true, title: '70' });
        rsiLineSeries.createPriceLine({ price: 30, color: CHART.rsiUnder, lineWidth: 1, lineStyle: LineStyle.Solid, axisLabelVisible: true, title: '30' });

        rsiChart.timeScale().fitContent();

        // Sync scroll/zoom and crosshair between panes
        syncTimeScales(mainChart, rsiChart);
        const priceMap = buildPriceMap(rawCloseData);
        const rsiMap = buildValueMap(rsiChartData);
        syncCrosshairs(mainChart, rsiChart, closeSeries, rsiLineSeries, priceMap, rsiMap);
      }
    }

    // ── Responsive resize ──────────────────────────────────────────
    const observer = new ResizeObserver(() => {
      const newWidth = container.clientWidth;
      if (newWidth > 0) {
        mainChart.resize(newWidth, MAIN_HEIGHT);
        rsiChart?.resize(newWidth, RSI_HEIGHT);
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      mainChart.remove();
      rsiChart?.remove();
    };
  }, [theme, stock]);

  return (
    <div>
      <div ref={mainRef} className="w-full" />
      {hasRSI && <div ref={rsiRef} className="w-full" />}
    </div>
  );
}
