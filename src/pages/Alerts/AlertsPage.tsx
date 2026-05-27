import { useState, useEffect, useCallback } from 'react';
import { Bell, RefreshCw, ExternalLink, Zap, Search, X, SlidersHorizontal, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Loader } from '../../components/Loader';
import { getAlerts } from '../../api/portfolioApi';
import { useToast } from '../../components/Toast';
import { BADGE } from '../../config/signalColors';
import type { PortfolioAlert, AlertFlags, AlertSignal } from '../../models/Portfolio';
import { ALERT_LABELS, ALERT_COLORS } from '../../models/Portfolio';

// ── Directional badge ──────────────────────────────────────────────

function SignalBadge({ label, signal }: { label: string; signal: AlertSignal }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${signal === 1 ? BADGE.up : BADGE.down}`}>
      {label}
    </span>
  );
}

// ── 4 type-based filter chips (matches any direction) ──────────────

const ALL_FILTER_KEYS: (keyof AlertFlags)[] = ['bollingerBand', 'rsi', 'earlyAlertBB', 'earlyAlertRSI'];

const INACTIVE_CHIP = 'bg-transparent border-light-border-primary dark:border-dark-border-primary text-light-text-tertiary dark:text-dark-text-tertiary hover:border-light-text-tertiary dark:hover:border-dark-text-tertiary';

// ── Helpers ────────────────────────────────────────────────────────

function activeSignals(flags: AlertFlags): { key: keyof AlertFlags; signal: AlertSignal }[] {
  return (Object.keys(flags) as (keyof AlertFlags)[])
    .filter(k => flags[k] !== 0)
    .map(k => ({ key: k, signal: flags[k] }));
}

const EARLY_ALERT_KEYS: (keyof AlertFlags)[] = ['earlyAlertBB', 'earlyAlertRSI'];

export function AlertsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState<PortfolioAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<keyof AlertFlags>>(new Set());

  const refreshAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const data = await getAlerts();
      setAlerts(data);
      setLastRefreshed(new Date());
    } catch {
      showToast('Failed to fetch alerts. Please try again.');
    } finally {
      setAlertsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    getAlerts()
      .then(data => { setAlerts(data); setLastRefreshed(new Date()); })
      .catch(() => showToast('Failed to load alerts.'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const toggleFilter = (key: keyof AlertFlags) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const totalFlags = alerts.reduce((n, a) => n + activeSignals(a.alerts).length, 0);
  const hasEarlyAlert = (flags: AlertFlags) => EARLY_ALERT_KEYS.some(k => flags[k] !== 0);

  const q = searchQuery.trim().toLowerCase();
  const visibleStocks = alerts.filter(stock => {
    const matchesSearch =
      !q ||
      stock.symbol.toLowerCase().includes(q) ||
      stock.companyName.toLowerCase().includes(q);
    const matchesFilter =
      activeFilters.size === 0 ||
      ALL_FILTER_KEYS.some(key => activeFilters.has(key) && stock.alerts[key] !== 0);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="md" text="Loading alerts…" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-light-accent-primary/10 dark:bg-dark-accent-primary/10">
            <Bell className="w-6 h-6 text-light-accent-primary dark:text-dark-accent-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              Alerts
            </h1>
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              {alerts.length} {alerts.length === 1 ? 'stock' : 'stocks'} from your portfolio with active alerts
            </p>
          </div>
        </div>
        <button
          onClick={refreshAlerts}
          disabled={alertsLoading}
          className="flex items-center gap-1.5 text-xs text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-text-secondary dark:hover:text-dark-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${alertsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Summary card ─────────────────────────────────────────── */}
      <Card className="p-5">
        {alertsLoading ? (
          <div className="flex items-center gap-2 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Fetching latest alerts…
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                No alerts today
              </p>
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                None of your tracked stocks have triggered an alert.
                {lastRefreshed && ` Last checked at ${lastRefreshed.toLocaleTimeString()}.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                {alerts.length} {alerts.length === 1 ? 'stock' : 'stocks'} from your portfolio with{' '}
                {totalFlags} active {totalFlags === 1 ? 'alert' : 'alerts'}
              </p>
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                Alerts are generated from your tracked portfolio stocks only.
              </p>
              {lastRefreshed && (
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                  Last checked at {lastRefreshed.toLocaleTimeString()}.
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* ── Empty-state navigation ───────────────────────────────── */}
      {!loading && !alertsLoading && alerts.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/technical-indicators')}
            className="text-left p-5 rounded-xl border border-light-border-primary dark:border-dark-border-primary bg-light-bg-elevated dark:bg-dark-bg-elevated hover:border-light-accent-primary dark:hover:border-dark-accent-primary hover:bg-light-accent-primary/5 dark:hover:bg-dark-accent-primary/5 transition-all group"
          >
            <div className="p-2.5 rounded-lg bg-light-accent-primary/10 dark:bg-dark-accent-primary/10 w-fit mb-3 group-hover:bg-light-accent-primary/20 dark:group-hover:bg-dark-accent-primary/20 transition-colors">
              <SlidersHorizontal className="w-5 h-5 text-light-accent-primary dark:text-dark-accent-primary" />
            </div>
            <p className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary mb-1">
              Stock Screener
            </p>
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary leading-relaxed">
              Run the technical indicators screener to find opportunities across the market.
            </p>
          </button>

          <button
            onClick={() => navigate('/portfolio')}
            className="text-left p-5 rounded-xl border border-light-border-primary dark:border-dark-border-primary bg-light-bg-elevated dark:bg-dark-bg-elevated hover:border-light-accent-primary dark:hover:border-dark-accent-primary hover:bg-light-accent-primary/5 dark:hover:bg-dark-accent-primary/5 transition-all group"
          >
            <div className="p-2.5 rounded-lg bg-light-accent-primary/10 dark:bg-dark-accent-primary/10 w-fit mb-3 group-hover:bg-light-accent-primary/20 dark:group-hover:bg-dark-accent-primary/20 transition-colors">
              <Briefcase className="w-5 h-5 text-light-accent-primary dark:text-dark-accent-primary" />
            </div>
            <p className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary mb-1">
              My Portfolio
            </p>
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary leading-relaxed">
              Add stocks to your portfolio to start tracking alerts for your holdings.
            </p>
          </button>
        </div>
      )}

      {/* ── Search + filter ──────────────────────────────────────── */}
      {!alertsLoading && alerts.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by symbol or company…"
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:ring-1 focus:ring-light-accent-primary dark:focus:ring-dark-accent-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-text-primary dark:hover:text-dark-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary mr-1">
              Filter by:
            </span>
            {ALL_FILTER_KEYS.map(key => {
              const isActive = activeFilters.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleFilter(key)}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    isActive ? ALERT_COLORS[key] : INACTIVE_CHIP
                  }`}
                >
                  {ALERT_LABELS[key]}
                </button>
              );
            })}
            {activeFilters.size > 0 && (
              <button
                onClick={() => setActiveFilters(new Set())}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Alerted stocks list ───────────────────────────────────── */}
      {!alertsLoading && alerts.length > 0 && (
        <div className="space-y-3">
          {visibleStocks.length === 0 && (
            <p className="text-sm text-center text-light-text-tertiary dark:text-dark-text-tertiary py-8">
              No stocks match your search or filter.
            </p>
          )}
          {visibleStocks.map(stock => {
            const signals = activeSignals(stock.alerts);
            const showEarlyAlertLink = hasEarlyAlert(stock.alerts);
            return (
              <Card key={stock.symbol} className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 space-y-2 flex-1">
                    <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                      {stock.symbol.replace(/\.(NS|BSE)$/i, '')}
                    </p>
                    <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary truncate">
                      {stock.companyName}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {signals.map(({ key, signal }) => (
                        <SignalBadge key={key} label={ALERT_LABELS[key]} signal={signal} />
                      ))}
                    </div>
                    {stock.description && (
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
                        {stock.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {showEarlyAlertLink && (
                      <button
                        onClick={() => navigate('/early-alert', { state: { symbol: stock.symbol.replace(/\.(NS|BSE)$/i, '') } })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Early Alert
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/stocks/${stock.symbol.replace(/\.(NS|BSE)$/i, '')}`, { state: { from: 'alerts', exchange: stock.exchange } })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-light-border-primary dark:border-dark-border-primary text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Details
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
