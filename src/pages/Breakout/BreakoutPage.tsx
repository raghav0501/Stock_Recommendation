import { useState, useEffect, useMemo, useRef } from 'react';
import { Zap, TrendingUp, ExternalLink, TrendingDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/Card';
import { Loader } from '../../components/Loader';
import { EarlyAlertChart } from './BreakoutChart';
import { getEarlyAlertStocks } from '../../api/breakoutApi';
import type { EarlyAlertStock, EarlyAlertFilter } from '../../models/Breakout';
import { EARLY_ALERT_LABELS, EARLY_ALERT_COLORS } from '../../models/Breakout';
import { BADGE, CHIP } from '../../config/signalColors';
import { FilterChip } from '../../components/FilterChip';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { toastMessage } from '../../utils/errorMessage';
import { STORAGE_KEYS } from '../../constants/storage';

const ALL_FILTERS: EarlyAlertFilter[] = ['earlyAlertBB', 'earlyAlertRSI', 'mcapTop100'];

function SignalBadge({ label, signal }: { label: string; signal: 1 | -1 }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${signal === 1 ? BADGE.up : BADGE.down}`}>
      {label}
    </span>
  );
}

function closePriceInfo(stock: EarlyAlertStock): { price: number; pct: number } | null {
  const valid = stock.last5Days.filter(d => d.close != null && d.close !== 0);
  if (valid.length < 2) return null;
  const last = valid[valid.length - 1].close;
  const prev = valid[valid.length - 2].close;
  return { price: last, pct: ((last - prev) / prev) * 100 };
}

export function EarlyAlertPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const incomingSymbol = (location.state as { symbol?: string } | null)?.symbol;
  const [selected, setSelected] = useState<EarlyAlertStock | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<EarlyAlertFilter>>(new Set());

  const selectedExchange = localStorage.getItem(STORAGE_KEYS.EXCHANGE) || 'india';

  const { data: stocks = [], isLoading: loading, error } = useQuery<EarlyAlertStock[]>({
    queryKey: ['early-alert-stocks', selectedExchange],
    queryFn: getEarlyAlertStocks,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (error) showToast(toastMessage(error));
  }, [error]);

  useEffect(() => {
    if (stocks.length === 0) return;
    setSelected(prev => prev ?? (
      incomingSymbol
        ? (stocks.find(s => s.symbol === incomingSymbol) ?? stocks[0] ?? null)
        : (stocks[0] ?? null)
    ));
  }, [stocks, incomingSymbol]);

  const toggleFilter = (key: EarlyAlertFilter) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const visibleStocks = useMemo(() => {
    const sorted = stocks
      .filter(stock => {
        if (activeFilters.has('earlyAlertBB') && stock.bbSignal === 0) return false;
        if (activeFilters.has('earlyAlertRSI') && stock.rsiSignal === 0) return false;
        if (activeFilters.has('mcapTop100') && !stock.mcapTop100) return false;
        return true;
      })
      .sort((a, b) => a.symbol.localeCompare(b.symbol));

    if (incomingSymbol) {
      const idx = sorted.findIndex(s => s.symbol === incomingSymbol);
      if (idx > 0) {
        const [pinned] = sorted.splice(idx, 1);
        sorted.unshift(pinned);
      }
    }

    return sorted;
  }, [stocks, activeFilters, incomingSymbol]);

  // When active filters change and selected stock is no longer visible, pick the first visible one
  const visibleStocksRef = useRef(visibleStocks);
  visibleStocksRef.current = visibleStocks;
  useEffect(() => {
    setSelected(prev => {
      if (!prev) return prev;
      const visible = visibleStocksRef.current;
      return visible.some(s => s.symbol === prev.symbol) ? prev : (visible[0] ?? null);
    });
  }, [activeFilters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="md" text="Scanning for early alerts…" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-light-accent-primary/10 dark:bg-dark-accent-primary/10">
            <Zap className="w-6 h-6 text-light-accent-primary dark:text-dark-accent-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              Early Alert Scanner
            </h1>
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              {stocks.length} stock{stocks.length !== 1 ? 's' : ''} in early alert zone · last 5 sessions
            </p>
          </div>
        </div>

        {/* ── Filter chips ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary mr-1">
            Filter by:
          </span>
          {ALL_FILTERS.map(key => (
            <FilterChip
              key={key}
              label={EARLY_ALERT_LABELS[key]}
              isActive={activeFilters.has(key)}
              activeClass={EARLY_ALERT_COLORS[key]}
              onClick={() => toggleFilter(key)}
            />
          ))}
        </div>
      </div>

      {/* ── Empty state ───────────────────────────────────────────── */}
      {stocks.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-10 h-10 mx-auto text-light-text-tertiary dark:text-dark-text-tertiary opacity-40" />}
          title="No early alert stocks detected right now"
        />
      ) : (
        <div className="flex flex-col md:flex-row gap-4 items-start">
          {/* ── Stock list ─────────────────────────────────────────── */}
          <div className="w-full md:w-72 shrink-0 md:sticky md:top-6">
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-light-border-primary dark:border-dark-border-primary">
                <p className="text-xs font-semibold uppercase tracking-wider text-light-text-tertiary dark:text-dark-text-tertiary">
                  {visibleStocks.length}{visibleStocks.length !== stocks.length ? ` / ${stocks.length}` : ''} Early Alert{stocks.length !== 1 ? 's' : ''}
                </p>
              </div>
              {visibleStocks.length === 0 ? (
                <p className="text-xs text-center text-light-text-tertiary dark:text-dark-text-tertiary px-4 py-6">
                  No stocks match the selected filters.
                </p>
              ) : (
                <div className="overflow-y-auto max-h-60 md:max-h-[450px]">
                  {visibleStocks.map(stock => (
                    <button
                      key={stock.symbol}
                      onClick={() => setSelected(stock)}
                      className={`w-full text-left px-4 py-3 border-b border-light-border-primary/50 dark:border-dark-border-primary/50 last:border-0 transition-colors ${
                        selected?.symbol === stock.symbol
                          ? 'bg-light-accent-primary/10 dark:bg-dark-accent-primary/10'
                          : 'hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary">
                          {stock.symbol}
                        </p>
                        {stock.mcapTop100 && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${CHIP.mcapTop100}`}>
                            Mcap 100
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary truncate mb-1.5">
                        {stock.companyName}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {stock.bbSignal !== 0 && (
                          <SignalBadge label="Early Alert BB" signal={stock.bbSignal} />
                        )}
                        {stock.rsiSignal !== 0 && (
                          <SignalBadge label="Early Alert RSI" signal={stock.rsiSignal} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ── Detail panel ───────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {selected && (
              <Card className="p-0 overflow-hidden">
                {/* Stock info header */}
                <div className="px-6 py-4 border-b border-light-border-primary dark:border-dark-border-primary">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                          {selected.symbol}
                        </h2>
                        {selected.mcapTop100 && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CHIP.mcapTop100}`}>
                            Mcap Top 100
                          </span>
                        )}
                        {(() => {
                          const info = closePriceInfo(selected);
                          if (!info) return null;
                          const isPos = info.pct >= 0;
                          return (
                            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                              Close:{' '}
                              <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                                ₹{info.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              {' • '}
                              <span className={isPos ? 'text-emerald-500' : 'text-rose-500'}>
                                {isPos ? '+' : ''}{info.pct.toFixed(2)}%
                              </span>
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mt-0.5">
                        {selected.companyName}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selected.bbSignal !== 0 && (
                          <SignalBadge label="Early Alert BB" signal={selected.bbSignal} />
                        )}
                        {selected.rsiSignal !== 0 && (
                          <SignalBadge label="Early Alert RSI" signal={selected.rsiSignal} />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {selected.bbSignal !== 0 && (
                        <div className="flex items-center gap-1 text-light-text-tertiary dark:text-dark-text-tertiary">
                          {selected.bbSignal === 1
                            ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                            : <TrendingDown className="w-4 h-4 text-rose-400" />}
                        </div>
                      )}
                      <button
                        onClick={() => navigate(`/stocks/${selected.symbol}`, { state: { from: 'early-alert' } })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-light-border-primary dark:border-dark-border-primary text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="p-4">
                  <EarlyAlertChart stock={selected} />
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
