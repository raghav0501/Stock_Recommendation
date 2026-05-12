import { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card';
import stockUniverse from '../../data/Stock_universe.json';

interface StockEntry {
  symbol: string;
  company_name: string;
  exchange: string;
}

const EXCHANGE_LABELS: Record<string, string> = {
  india: 'NSE & BSE',
  us: 'NASDAQ & NYSE',
  lse: 'LSE',
  sse: 'SSE',
};

export function WatchlistPage() {
  const navigate = useNavigate();
  const selectedExchange = localStorage.getItem('selectedExchange') || 'india';
  const exchangeLabel = EXCHANGE_LABELS[selectedExchange] || selectedExchange.toUpperCase();
  const [query, setQuery] = useState('');

  // Stock_universe.json uses "India" / "US" — match case-insensitively against localStorage key
  const stocks = (stockUniverse as StockEntry[]).filter(
    (s) => s.exchange.toLowerCase() === selectedExchange.toLowerCase()
  );

  const filtered = query.trim()
    ? stocks.filter(
        (s) =>
          s.symbol.toLowerCase().includes(query.toLowerCase()) ||
          s.company_name.toLowerCase().includes(query.toLowerCase())
      )
    : stocks;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary">
          Watchlist
        </h2>
      </div>

      <Card className="p-0 overflow-hidden">
        {/* Search bar + count */}
        <div className="px-6 py-4 border-b border-light-border-primary dark:border-dark-border-primary bg-light-bg-tertiary dark:bg-dark-bg-tertiary flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${exchangeLabel} stocks...`}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-border-primary dark:border-dark-border-primary text-sm text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-light-accent-primary dark:focus:ring-dark-accent-primary transition-all"
            />
          </div>
          <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary whitespace-nowrap">
            {filtered.length} stock{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-light-border-primary dark:border-dark-border-primary bg-light-bg-tertiary/50 dark:bg-dark-bg-tertiary/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                  Company Name
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border-primary/50 dark:divide-dark-border-primary/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-10 text-center text-light-text-tertiary dark:text-dark-text-tertiary text-sm">
                    No stocks match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((stock) => (
                  <tr
                    key={stock.symbol}
                    onClick={() =>
                      navigate(`/stocks/${stock.symbol}`, { state: { from: 'watchlist' } })
                    }
                    className="hover:bg-light-bg-tertiary/30 dark:hover:bg-dark-bg-tertiary/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                        {stock.symbol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-light-text-secondary dark:text-dark-text-secondary">
                      {stock.company_name}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
