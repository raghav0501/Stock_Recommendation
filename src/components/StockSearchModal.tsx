import { useState, useEffect, useRef } from 'react';
import { Search, X, Check, Plus } from 'lucide-react';
import stockUniverse from '../data/Stock_universe.json';
import { searchBySymbolAndName } from '../utils/searchStocks';

interface StockEntry {
  symbol: string;
  company_name: string | null;
  exchange: string;
}

interface StockSearchModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the selected stock when the user clicks Add */
  onSelect: (stock: { symbol: string; companyName: string; exchange: string }) => void;
  /** Symbols already added — shown with a checkmark instead of the Add button */
  addedSymbols?: Set<string>;
  /** Filter results to a specific exchange (case-insensitive) */
  exchange?: string;
}

export function StockSearchModal({
  open,
  onClose,
  onSelect,
  addedSymbols = new Set(),
  exchange,
}: StockSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const universe = stockUniverse as StockEntry[];
  const exchangeFiltered = exchange
    ? universe.filter((s) => s.exchange.toLowerCase() === exchange.toLowerCase())
    : universe;

  const results = query.trim().length > 0
    ? searchBySymbolAndName(exchangeFiltered, query, s => s.symbol, s => s.company_name ?? '', 30)
    : [];

  const handleSelect = (s: StockEntry) => {
    onSelect({ symbol: s.symbol, companyName: s.company_name || "", exchange: s.exchange });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 -top-6"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-light-border-primary dark:border-dark-border-primary">
          <Search className="w-5 h-5 text-light-text-tertiary dark:text-dark-text-tertiary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by symbol or company name..."
            className="flex-1 bg-transparent text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none text-sm"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary text-light-text-tertiary dark:text-dark-text-tertiary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 p-2">
          {query.trim().length === 0 && (
            <p className="text-center text-sm text-light-text-tertiary dark:text-dark-text-tertiary py-10">
              Start typing to search stocks
            </p>
          )}

          {query.trim().length > 0 && results.length === 0 && (
            <p className="text-center text-sm text-light-text-tertiary dark:text-dark-text-tertiary py-10">
              Sorry, we do not support this stock yet.
            </p>
          )}

          {results.map((s) => {
            const isAdded = addedSymbols.has(s.symbol);
            return (
              <div
                key={s.symbol}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                    {s.symbol}
                  </p>
                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary truncate">
                    {s.company_name}
                  </p>
                </div>
                {isAdded ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-light-accent-primary/10 dark:bg-dark-accent-primary/10 text-light-accent-primary dark:text-dark-accent-primary">
                    <Check className="w-3 h-3" />
                    Added
                  </span>
                ) : (
                  <button
                    onClick={() => handleSelect(s)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-light-accent-primary dark:bg-dark-accent-primary text-white hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
