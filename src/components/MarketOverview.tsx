import { TrendingUp, TrendingDown } from 'lucide-react';
import type { MarketIndex, MarketStatus } from '../models/Market';
import { Loader } from './Loader';
import { useState, useEffect } from 'react';

// Define the Props interface
interface MarketOverviewProps {
  indices: MarketIndex[];
  status: MarketStatus | null;
  loading: boolean;
}

export function MarketOverview({ indices, status, loading }: MarketOverviewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  if (loading) {
    return <Loader size="sm" text='Loading Market Data...' />; // Simplified loader for the header bar
  }

  return (
    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
      {/* Time & Status Section */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-full border border-light-border-secondary dark:border-dark-border-secondary shrink-0">
        {/* <Clock className="w-4 h-4 text-light-accent-primary dark:text-dark-accent-primary" /> */}
        <span className="text-sm font-bold tabular-nums">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
        <div className={`w-2 h-2 rounded-full ${status?.isOpen ? 'bg-green-500 animate-pulse' : 'bg-rose-500'}`} />
      </div>

      {/* Render Indices */}
      {indices.map((index) => (
        <IndexCard key={index.name} index={index} />
      ))}
    </div>
  );
}

// Helper component for individual index items
function IndexCard({ index }: { index: MarketIndex }) {
  const isPositive = (index.changePercent ?? 0) >= 0;
  return (
    <div className="flex items-center gap-3 shrink-0 group">
      <div className="flex flex-col">
        <span className="text-[10px] text-light-text-tertiary dark:text-dark-text-tertiary font-bold uppercase tracking-wider">
          {index.name}
        </span>
        <span className="text-sm font-bold tabular-nums">{index.value?.toLocaleString() ?? 'N/A'}</span>
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-green-500' : 'text-rose-500'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {index.changePercent?.toFixed(2)}%
      </div>
    </div>
  );
}