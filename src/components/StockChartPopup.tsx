import { useEffect, useRef } from 'react';
import { CandlestickSeries, createChart, LineSeries, type IChartApi } from 'lightweight-charts';
import type { Stock } from '../models/Stock';
import { X } from 'lucide-react';
import { useTheme } from '../config/ThemeContext';
import { getBaseChartOptions, getCandlestickOptions, getIndicatorLineOptions, CHART_SIZES } from '../config/chartConfig';
import stockData from '../data/stockData.json';

interface StockChartPopupProps {
  stock: Stock;
  selectedParameters: string[];
  onClose: () => void;
  mousePosition: { x: number; y: number };
}

export function StockChartPopup({ stock, selectedParameters, onClose, mousePosition }: StockChartPopupProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with theme-aware config
    const chartOptions = getBaseChartOptions(
      theme,
      CHART_SIZES.popup.width,
      CHART_SIZES.popup.height
    );

    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    // Get stock data
    const stockDetails = (stockData as any)[stock.symbol];
    if (stockDetails && stockDetails.chartData) {
      // Add candlestick series
      const candlestickSeries = chart.addSeries( CandlestickSeries, getCandlestickOptions());
      candlestickSeries.setData(stockDetails.chartData);

      // Add indicator lines based on selected parameters
      if (selectedParameters.includes('sma_20') && stock.technicalIndicators.sma_20) {
        const sma20Series = chart.addSeries( LineSeries, getIndicatorLineOptions('sma20'));
        const sma20Data = stockDetails.chartData.map((d: any) => ({
          time: d.time,
          value: stock.technicalIndicators.sma_20,
        }));
        sma20Series.setData(sma20Data);
      }

      if (selectedParameters.includes('ema_20') && stock.technicalIndicators.ema_20) {
        const ema20Series = chart.addSeries( LineSeries, getIndicatorLineOptions('ema20'));
        const ema20Data = stockDetails.chartData.map((d: any) => ({
          time: d.time,
          value: stock.technicalIndicators.ema_20,
        }));
        ema20Series.setData(ema20Data);
      }

      // Fit content
      chart.timeScale().fitContent();
    }

    return () => {
      chart.remove();
    };
  }, [stock, selectedParameters, theme]);

  // Position the popup near the mouse but ensure it stays in viewport
  const getPopupStyle = () => {
    const popupWidth = 520;
    const popupHeight = 450;
    const padding = 20;

    let left = mousePosition.x + 20;
    let top = mousePosition.y - popupHeight / 2;

    // Adjust if popup goes off right edge
    if (left + popupWidth > window.innerWidth - padding) {
      left = mousePosition.x - popupWidth - 20;
    }

    // Adjust if popup goes off top edge
    if (top < padding) {
      top = padding;
    }

    // Adjust if popup goes off bottom edge
    if (top + popupHeight > window.innerHeight - padding) {
      top = window.innerHeight - popupHeight - padding;
    }

    return {
      position: 'fixed' as const,
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 1000,
    };
  };

  return (
    <div style={getPopupStyle()} className="animate-fade-in">
      <div className="bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-light-bg-tertiary dark:bg-dark-bg-tertiary border-b border-light-border-primary dark:border-dark-border-primary flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
              {stock.symbol}
            </h3>
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
              {stock.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded transition-colors"
          >
            <X className="w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary" />
          </button>
        </div>

        {/* Chart */}
        <div className="p-4">
          <div ref={chartContainerRef} />
        </div>

        {/* Legend */}
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
              <span className="text-light-text-tertiary dark:text-dark-text-tertiary">Price (Up)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-rose-500 rounded-sm"></div>
              <span className="text-light-text-tertiary dark:text-dark-text-tertiary">Price (Down)</span>
            </div>
            {selectedParameters.includes('sma_20') && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-amber-500"></div>
                <span className="text-light-text-tertiary dark:text-dark-text-tertiary">SMA 20</span>
              </div>
            )}
            {selectedParameters.includes('ema_20') && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-purple-500"></div>
                <span className="text-light-text-tertiary dark:text-dark-text-tertiary">EMA 20</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}