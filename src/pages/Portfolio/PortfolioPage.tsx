import { useState } from 'react';
import { STORAGE_KEYS } from '../../constants/storage';
import { useAsyncData } from '../../hooks/useAsyncData';
import { Plus, Trash2, Briefcase, AlertCircle } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loader } from '../../components/Loader';
import { StockSearchModal } from '../../components/StockSearchModal';
import { getHoldings, addHolding, removeHolding, stripSuffix } from '../../api/portfolioApi';
import { useToast } from '../../components/Toast';
import { toastMessage } from '../../utils/errorMessage';
import type { PortfolioHolding } from '../../models/Portfolio';

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function PortfolioPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [confirmSymbol, setConfirmSymbol] = useState<string | null>(null);

  const selectedExchange = localStorage.getItem(STORAGE_KEYS.EXCHANGE) || 'india';

  const {
    data: holdings,
    setData: setHoldings,
    loading,
    error: loadError,
  } = useAsyncData<PortfolioHolding[]>(getHoldings, [], [], {
    onError: err => showToast(toastMessage(err)),
  });

  const handleAdd = async (stock: PortfolioHolding) => {
    if (holdings.some(h => h.symbol === stock.symbol)) return;

    const optimistic: PortfolioHolding = { ...stock, addedAt: new Date().toISOString() };
    setHoldings(prev => [...prev, optimistic]);
    setShowModal(false);

    try {
      await addHolding(stock);
    } catch {
      setHoldings(prev => prev.filter(h => h.symbol !== stock.symbol));
      showToast(`Failed to add ${stripSuffix(stock.symbol)}. Please try again.`);
    }
  };

  const handleRemove = (symbol: string) => setConfirmSymbol(symbol);

  const confirmRemove = async () => {
    if (!confirmSymbol) return;
    const removed = holdings.find(h => h.symbol === confirmSymbol);

    setHoldings(prev => prev.filter(h => h.symbol !== confirmSymbol));
    setConfirmSymbol(null);

    try {
      await removeHolding(confirmSymbol);
    } catch {
      if (removed) setHoldings(prev => [...prev, removed]);
      showToast(`Failed to remove ${stripSuffix(confirmSymbol)}. Please try again.`);
    }
  };

  const addedSymbols = new Set(holdings.map(h => h.symbol));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="md" text="Loading portfolio..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-light-accent-primary/10 dark:bg-dark-accent-primary/10">
            <Briefcase className="w-6 h-6 text-light-accent-primary dark:text-dark-accent-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              Portfolio
            </h1>
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              {holdings.length} {holdings.length === 1 ? 'stock' : 'stocks'} tracked
            </p>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Stock
        </Button>
      </div>

      {/* ── Load error state ─────────────────────────────────────── */}
      {loadError ? (
        <EmptyState
          icon={<AlertCircle className="w-10 h-10 mx-auto text-rose-400 opacity-60" />}
          title="Failed to load portfolio"
          description="Check your connection and refresh the page"
        />
      ) : holdings.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-10 h-10 mx-auto text-light-text-tertiary dark:text-dark-text-tertiary opacity-40" />}
          title="Your portfolio is empty"
          description="Add stocks to start tracking alerts"
        />
      ) : (
        /* ── Holdings table ────────────────────────────────────── */
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-light-border-primary dark:border-dark-border-primary">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-light-text-tertiary dark:text-dark-text-tertiary">
                  Symbol
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-light-text-tertiary dark:text-dark-text-tertiary hidden sm:table-cell">
                  Company
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-light-text-tertiary dark:text-dark-text-tertiary hidden md:table-cell">
                  Exchange
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-light-text-tertiary dark:text-dark-text-tertiary hidden lg:table-cell">
                  Added
                </th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border-primary/50 dark:divide-dark-border-primary/50">
              {holdings.map(h => (
                <tr
                  key={h.symbol}
                  onClick={() => navigate(`/stocks/${stripSuffix(h.symbol)}`, { state: { from: 'portfolio', exchange: h.exchange } })}
                  className="hover:bg-light-bg-tertiary/50 dark:hover:bg-dark-bg-tertiary/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5 font-semibold text-light-text-primary dark:text-dark-text-primary whitespace-nowrap">
                    {stripSuffix(h.symbol)}
                  </td>
                  <td className="px-5 py-3.5 text-light-text-secondary dark:text-dark-text-secondary truncate max-w-[180px] hidden sm:table-cell">
                    {h.companyName}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary uppercase">
                      {h.exchange}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-light-text-tertiary dark:text-dark-text-tertiary whitespace-nowrap hidden lg:table-cell">
                    {formatDate(h.addedAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemove(h.symbol); }}
                      className="p-1.5 rounded-lg text-light-text-tertiary dark:text-dark-text-tertiary hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title={`Remove ${stripSuffix(h.symbol)}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── Search modal ──────────────────────────────────────────── */}
      <StockSearchModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleAdd}
        addedSymbols={addedSymbols}
        exchange={selectedExchange}
      />

      {/* ── Remove confirmation ───────────────────────────────────── */}
      {confirmSymbol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirmSymbol(null)} />
          <div className="relative bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
              Remove {stripSuffix(confirmSymbol)}?
            </h3>
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-5">
              This stock will be removed from your portfolio.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setConfirmSymbol(null)}>
                Cancel
              </Button>
              <button
                onClick={confirmRemove}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
