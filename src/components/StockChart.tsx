import { useMemo } from 'react';
import { formatChartData } from '../utils/chartUtils';
import type { Stock } from '../models/Stock';

interface StockChartProps {
  stock: Stock;
  selectedParameters: string[];
  height?: number;
}

export function StockChart({ stock, selectedParameters, height = 200 }: StockChartProps) {
  const chartData = useMemo(() => {
    if (!stock.priceHistory) return [];
    return formatChartData(stock.priceHistory, stock.technicalIndicators, selectedParameters);
  }, [stock, selectedParameters]);

  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (chartData.length === 0) {
      return { minPrice: 0, maxPrice: 0, priceRange: 0 };
    }
    
    const prices = chartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return {
      minPrice: min * 0.98,
      maxPrice: max * 1.02,
      priceRange: max * 1.02 - min * 0.98
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-light-text-tertiary dark:text-dark-text-tertiary">
        No chart data available
      </div>
    );
  }

  const width = 300;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate points for the price line
  const pricePoints = chartData.map((d, i) => {
    const x = padding + (i / (chartData.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((d.price - minPrice) / priceRange) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // Calculate points for indicators if selected
  // const getIndicatorPoints = (key: string) => {
  //   return chartData.map((d, i) => {
  //     if (!d[key]) return null;
  //     const x = padding + (i / (chartData.length - 1)) * chartWidth;
  //     const y = padding + chartHeight - ((d[key] - minPrice) / priceRange) * chartHeight;
  //     return `${x},${y}`;
  //   }).filter(Boolean).join(' ');
  // };

  return (
    <div className="bg-light-bg-primary dark:bg-dark-bg-primary p-4 rounded-lg border border-light-border-primary dark:border-dark-border-primary">
      <div className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
        {stock.symbol} - Last 30 Days
      </div>
      
      <svg width={width} height={height} className="w-full">
        {/* Grid lines */}
        <line
          x1={padding}
          y1={padding + chartHeight / 2}
          x2={width - padding}
          y2={padding + chartHeight / 2}
          stroke="currentColor"
          className="text-light-border-secondary dark:text-dark-border-secondary opacity-30"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        
        {/* Price line */}
        <polyline
          points={pricePoints}
          fill="none"
          stroke="currentColor"
          className="text-light-accent-primary dark:text-dark-accent-primary"
          strokeWidth="2"
        />
        
        {/* SMA 20 */}
        {selectedParameters.includes('sma_20') && stock.technicalIndicators.sma_20 && (
          <line
            x1={padding}
            y1={padding + chartHeight - ((stock.technicalIndicators.sma_20 - minPrice) / priceRange) * chartHeight}
            x2={width - padding}
            y2={padding + chartHeight - ((stock.technicalIndicators.sma_20 - minPrice) / priceRange) * chartHeight}
            stroke="currentColor"
            className="text-amber-500"
            strokeWidth="1.5"
            strokeDasharray="4,2"
          />
        )}
        
        {/* Bollinger Bands */}
        {selectedParameters.includes('bollinger') && stock.technicalIndicators.bollinger && (
          <>
            <line
              x1={padding}
              y1={padding + chartHeight - ((stock.technicalIndicators.bollinger.upper - minPrice) / priceRange) * chartHeight}
              x2={width - padding}
              y2={padding + chartHeight - ((stock.technicalIndicators.bollinger.upper - minPrice) / priceRange) * chartHeight}
              stroke="currentColor"
              className="text-rose-400 opacity-50"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <line
              x1={padding}
              y1={padding + chartHeight - ((stock.technicalIndicators.bollinger.lower - minPrice) / priceRange) * chartHeight}
              x2={width - padding}
              y2={padding + chartHeight - ((stock.technicalIndicators.bollinger.lower - minPrice) / priceRange) * chartHeight}
              stroke="currentColor"
              className="text-emerald-400 opacity-50"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          </>
        )}
        
        {/* Axes */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="currentColor"
          className="text-light-border-primary dark:text-dark-border-primary"
          strokeWidth="1"
        />
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="currentColor"
          className="text-light-border-primary dark:text-dark-border-primary"
          strokeWidth="1"
        />
        
        {/* Price labels */}
        <text
          x={padding - 5}
          y={padding + 5}
          textAnchor="end"
          className="text-xs fill-light-text-tertiary dark:fill-dark-text-tertiary"
        >
          ₹{maxPrice.toFixed(0)}
        </text>
        <text
          x={padding - 5}
          y={height - padding + 5}
          textAnchor="end"
          className="text-xs fill-light-text-tertiary dark:fill-dark-text-tertiary"
        >
          ₹{minPrice.toFixed(0)}
        </text>
      </svg>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-light-accent-primary dark:bg-dark-accent-primary"></div>
          <span className="text-light-text-tertiary dark:text-dark-text-tertiary">Price</span>
        </div>
        {selectedParameters.includes('sma_20') && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-amber-500"></div>
            <span className="text-light-text-tertiary dark:text-dark-text-tertiary">SMA 20</span>
          </div>
        )}
        {selectedParameters.includes('bollinger') && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-rose-400"></div>
            <span className="text-light-text-tertiary dark:text-dark-text-tertiary">Bollinger</span>
          </div>
        )}
      </div>
    </div>
  );
}