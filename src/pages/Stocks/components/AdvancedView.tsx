import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, TrendingUp, TrendingDown, Plus, Search, Activity } from 'lucide-react';
import type { Stock, MarketSentiment } from '../../../models/Stock';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { StockChartPopup } from '../../../components/StockChartPopup';

interface AdvancedViewProps {
  stocks: Stock[];
  parameters: string[];
}

type SortField = 'symbol' | 'price' | 'change' | 'volume' | 'marketCap' | 'peRatio';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'bullish' | 'bearish' | 'neutral';

export function AdvancedView({ stocks, parameters }: AdvancedViewProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set());
  const [hoveredStock, setHoveredStock] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleStock = (symbol: string) => {
    const newSelected = new Set(selectedStocks);
    if (newSelected.has(symbol)) {
      newSelected.delete(symbol);
    } else {
      newSelected.add(symbol);
    }
    setSelectedStocks(newSelected);
  };

  const filteredAndSortedStocks = useMemo(() => {
    let filtered = stocks;

    if (searchQuery) {
      filtered = filtered.filter(
        stock =>
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filter === 'bullish') {
      filtered = filtered.filter(stock => stock.sentiment === 'bullish' || stock.sentiment === 'strong_bullish');
    } else if (filter === 'bearish') {
      filtered = filtered.filter(stock => stock.sentiment === 'bearish' || stock.sentiment === 'strong_bearish');
    } else if (filter === 'neutral') {
      filtered = filtered.filter(stock => stock.sentiment === 'neutral');
    }

    return [...filtered].sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (a[sortField] < b[sortField]) return -1 * multiplier;
      if (a[sortField] > b[sortField]) return 1 * multiplier;
      return 0;
    });
  }, [stocks, searchQuery, filter, sortField, sortOrder]);

  return (
    <>
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-tertiary dark:text-dark-text-tertiary" />
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-xl text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:border-light-accent-primary dark:focus:border-dark-accent-primary focus:ring-2 focus:ring-light-accent-primary/20 dark:focus:ring-dark-accent-primary/20 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
              All Stocks
            </FilterButton>
            <FilterButton active={filter === 'bullish'} onClick={() => setFilter('bullish')}>
              Bullish
            </FilterButton>
            <FilterButton active={filter === 'neutral'} onClick={() => setFilter('neutral')}>
              Neutral
            </FilterButton>
            <FilterButton active={filter === 'bearish'} onClick={() => setFilter('bearish')}>
              Bearish
            </FilterButton>
          </div>
        </div>

        {/* Selected Stocks Action */}
        {selectedStocks.size > 0 && (
          <div className="flex items-center justify-between p-4 bg-light-accent-primary/10 dark:bg-dark-accent-primary/10 border border-light-accent-primary/30 dark:border-dark-accent-primary/30 rounded-xl">
            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {selectedStocks.size} stock{selectedStocks.size !== 1 ? 's' : ''} selected
            </span>
            <Button onClick={() => navigate('/portfolio')} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add to Portfolio
            </Button>
          </div>
        )}

        {/* Stock Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-light-border-primary dark:border-dark-border-primary bg-light-bg-tertiary dark:bg-dark-bg-tertiary">
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedStocks.size === filteredAndSortedStocks.length && filteredAndSortedStocks.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStocks(new Set(filteredAndSortedStocks.map(s => s.symbol)));
                        } else {
                          setSelectedStocks(new Set());
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <SortableHeader field="symbol" currentField={sortField} order={sortOrder} onSort={handleSort}>
                    Symbol
                  </SortableHeader>
                  <SortableHeader field="price" currentField={sortField} order={sortOrder} onSort={handleSort}>
                    Price
                  </SortableHeader>
                  <SortableHeader field="change" currentField={sortField} order={sortOrder} onSort={handleSort}>
                    Change
                  </SortableHeader>
                  <SortableHeader field="volume" currentField={sortField} order={sortOrder} onSort={handleSort}>
                    Volume
                  </SortableHeader>
                  <SortableHeader field="marketCap" currentField={sortField} order={sortOrder} onSort={handleSort}>
                    Market Cap
                  </SortableHeader>
                  <SortableHeader field="peRatio" currentField={sortField} order={sortOrder} onSort={handleSort}>
                    P/E Ratio
                  </SortableHeader>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                    Market Sentiment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border-primary/50 dark:divide-dark-border-primary/50">
                {filteredAndSortedStocks.map((stock) => (
                  <tr
                    key={stock.symbol}
                    className="hover:bg-light-bg-tertiary/30 dark:hover:bg-dark-bg-tertiary/30 transition-colors cursor-pointer relative"
                    onMouseEnter={(e) => {
                      setHoveredStock(stock.symbol);
                      setMousePosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                      setMousePosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoveredStock(null)}
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest('input[type="checkbox"]')) {
                        navigate(`/stocks/${stock.symbol}`);
                      }
                    }}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedStocks.has(stock.symbol)}
                        onChange={() => toggleStock(stock.symbol)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                          {stock.symbol}
                        </div>
                        <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                          {stock.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-light-text-primary dark:text-dark-text-primary">
                      ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {stock.change >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-light-accent-success dark:text-dark-accent-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-light-accent-danger dark:text-dark-accent-danger" />
                        )}
                        <div>
                          <div className={`font-semibold ${stock.change >= 0 ? 'text-light-accent-success dark:text-dark-accent-success' : 'text-light-accent-danger dark:text-dark-accent-danger'}`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                          </div>
                          <div className={`text-xs ${stock.change >= 0 ? 'text-light-accent-success/70 dark:text-dark-accent-success/70' : 'text-light-accent-danger/70 dark:text-dark-accent-danger/70'}`}>
                            {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-light-text-secondary dark:text-dark-text-secondary">
                      {(stock.volume / 1000).toFixed(0)}K
                    </td>
                    <td className="px-6 py-4 text-light-text-secondary dark:text-dark-text-secondary">
                      ₹{(stock.marketCap / 100).toFixed(0)}Cr
                    </td>
                    <td className="px-6 py-4 text-light-text-secondary dark:text-dark-text-secondary">
                      {stock.peRatio.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <SentimentBadge sentiment={stock.sentiment} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSortedStocks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-light-text-tertiary dark:text-dark-text-tertiary">
                No stocks found matching your criteria
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Chart Popup */}
      {hoveredStock && (
        <StockChartPopup
          stock={filteredAndSortedStocks.find(s => s.symbol === hoveredStock)!}
          selectedParameters={parameters}
          onClose={() => setHoveredStock(null)}
          mousePosition={mousePosition}
        />
      )}
    </>
  );
}

interface SentimentBadgeProps {
  sentiment: MarketSentiment;
}

function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const getSentimentConfig = () => {
    switch (sentiment) {
      case 'strong_bullish':
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          label: 'Strong Bullish',
          bgColor: 'bg-emerald-500/10 dark:bg-emerald-400/10',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          borderColor: 'border-emerald-500/30 dark:border-emerald-400/30',
        };
      case 'bullish':
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          label: 'Bullish',
          bgColor: 'bg-green-500/10 dark:bg-green-400/10',
          textColor: 'text-green-600 dark:text-green-400',
          borderColor: 'border-green-500/30 dark:border-green-400/30',
        };
      case 'neutral':
        return {
          icon: <Activity className="w-4 h-4" />,
          label: 'Neutral',
          bgColor: 'bg-light-accent-warning/10 dark:bg-dark-accent-warning/10',
          textColor: 'text-light-accent-warning dark:text-dark-accent-warning',
          borderColor: 'border-light-accent-warning/30 dark:border-dark-accent-warning/30',
        };
      case 'bearish':
        return {
          icon: <TrendingDown className="w-4 h-4" />,
          label: 'Bearish',
          bgColor: 'bg-orange-500/10 dark:bg-orange-400/10',
          textColor: 'text-orange-600 dark:text-orange-400',
          borderColor: 'border-orange-500/30 dark:border-orange-400/30',
        };
      case 'strong_bearish':
        return {
          icon: <TrendingDown className="w-4 h-4" />,
          label: 'Strong Bearish',
          bgColor: 'bg-rose-500/10 dark:bg-rose-400/10',
          textColor: 'text-rose-600 dark:text-rose-400',
          borderColor: 'border-rose-500/30 dark:border-rose-400/30',
        };
    }
  };

  const config = getSentimentConfig();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
      {config.icon}
      <span className="text-xs font-semibold uppercase">{config.label}</span>
    </div>
  );
}

interface SortableHeaderProps {
  field: SortField;
  currentField: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}

function SortableHeader({ field, currentField, onSort, children }: SortableHeaderProps) {
  const isActive = currentField === field;

  return (
    <th
      onClick={() => onSort(field)}
      className="px-6 py-4 text-left text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider cursor-pointer hover:text-light-accent-primary dark:hover:text-dark-accent-primary transition-colors"
    >
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown
          className={`w-4 h-4 transition-colors ${isActive ? 'text-light-accent-primary dark:text-dark-accent-primary' : 'text-light-text-tertiary dark:text-dark-text-tertiary'}`}
        />
      </div>
    </th>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <Button
      variant={active ? 'primary' : 'secondary'}
      size="sm"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}