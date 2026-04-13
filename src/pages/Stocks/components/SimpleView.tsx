import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type {  StockSummary } from '../../../models/Stock';
import { Card } from '../../../components/Card';
import { formatStockPrice } from '../../../utils/formatter';

interface SimpleViewProps {
  stocks: StockSummary[];
}

export function SimpleView({ stocks }: SimpleViewProps) {
  const navigate = useNavigate();

  const bullishStocks = stocks.filter(s => 
    s.sentiment === 'strong_bullish' || s.sentiment === 'bullish'
  );
  
  // const neutralStocks = stocks.filter(s => s.sentiment === 'neutral');
  
  const bearishStocks = stocks.filter(s => 
    s.sentiment === 'bearish' || s.sentiment === 'strong_bearish'
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Card 1: Bullish (Green) */}
      <SentimentCard
        icon={<TrendingUp className="w-6 h-6" />}
        stocks={bullishStocks}
        color="success"
        onStockClick={(symbol) => navigate(`/stocks/${symbol}`)}
      />
      
      {/* Card 2: Bearish (Red) */}
      <SentimentCard
        icon={<TrendingDown className="w-6 h-6" />}
        stocks={bearishStocks}
        color="danger"
        onStockClick={(symbol) => navigate(`/stocks/${symbol}`)}
      />
      
      {/* Card 3: Neutral (Amber) */}
      {/* <SentimentCard
        icon={<Activity className="w-6 h-6" />}
        stocks={neutralStocks}
        color="warning"
        onStockClick={(symbol) => navigate(`/stocks/${symbol}`)}
      /> */}
    </div>
  );
}

interface SentimentCardProps {
  icon: React.ReactNode;
  stocks: StockSummary[];
  color: 'success' | 'warning' | 'danger';
  onStockClick: (symbol: string) => void;
}

function SentimentCard({ icon, stocks, color, onStockClick }: SentimentCardProps) {
  const colorClasses = {
    success: {
      bg: 'from-emerald-500/10 to-emerald-500/5 dark:from-emerald-400/10 dark:to-emerald-400/5',
      border: 'border-emerald-500/30 dark:border-emerald-400/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      icon: 'bg-emerald-500/10 dark:bg-emerald-400/10',
      badge: 'bg-emerald-500/20 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300',
    },
    warning: {
      bg: 'from-amber-500/10 to-amber-500/5 dark:from-amber-400/10 dark:to-amber-400/5',
      border: 'border-amber-500/30 dark:border-amber-400/30',
      text: 'text-amber-600 dark:text-amber-400',
      icon: 'bg-amber-500/10 dark:bg-amber-400/10',
      badge: 'bg-amber-500/20 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300',
    },
    danger: {
      bg: 'from-rose-500/10 to-rose-500/5 dark:from-rose-400/10 dark:to-rose-400/5',
      border: 'border-rose-500/30 dark:border-rose-400/30',
      text: 'text-rose-600 dark:text-rose-400',
      icon: 'bg-rose-500/10 dark:bg-rose-400/10',
      badge: 'bg-rose-500/20 dark:bg-rose-400/20 text-rose-700 dark:text-rose-300',
    },
  };

  const config = colorClasses[color];

  return (
    <Card className={`bg-gradient-to-br ${config.bg} border ${config.border}`}>
      {/* Header - NO LABEL, just icon and count */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${config.icon}`}>
            <div className={config.text}>{icon}</div>
          </div>
          <div>
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              {stocks.length} stock{stocks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Stock List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {stocks.length === 0 ? (
          <div className="text-center py-8 text-light-text-tertiary dark:text-dark-text-tertiary text-sm">
            No stocks in this category
          </div>
        ) : (
          stocks.map(stock => (
            <div
              key={stock.symbol}
              onClick={() => onStockClick(stock.symbol)}
              className="p-4 bg-light-bg-elevated dark:bg-dark-bg-elevated rounded-lg border border-light-border-primary dark:border-dark-border-primary hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-light-text-primary dark:text-dark-text-primary group-hover:text-light-accent-primary dark:group-hover:text-dark-accent-primary transition-colors">
                    {stock.symbol}
                  </div>
                  {/* HIDDEN: Company name */}
                  {/* <div className="hidden text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                    {stock.name}
                  </div> */}
                </div>
                
                {/* Price as Badge */}
                {/* <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.badge}`}>
                    ₹{stock.price.toFixed(2)}
                  </span>
                </div> */}
              </div>
              
              {/* Change info below */}
              <div className="mt-2">
                {/* <div className={`text-xs font-medium ${
                  stock.change >= 0 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                </div> */}
                <span className={`py-1 rounded-full text-sm font-light`}>
                    {/* ₹{stock.price.toFixed(2)} */}
                    {formatStockPrice(stock.price)}
                  </span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}