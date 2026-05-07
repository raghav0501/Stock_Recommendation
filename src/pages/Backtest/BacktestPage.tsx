import { useState, useRef } from 'react';
import {
  Search, ChevronRight, ChevronLeft, Play,
  TrendingUp, TrendingDown, X, SlidersHorizontal,
  Check, RotateCcw,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loader } from '../../components/Loader';
import { TECHNICAL_PARAMETERS } from '../../config/parameters';
import stockUniverse from '../../data/Stock_universe.json';
import { runBacktest, type BacktestResult } from '../../api/backtestApi';

// ── Types ──────────────────────────────────────────────────────────
interface StockEntry {
  symbol: string;
  company_name: string;
  exchange: string;
}

type WizardStep = 1 | 2 | 3 | 4;
type ModalView = 'params' | 'stock' | 'indicator';

// ── Date helpers ───────────────────────────────────────────────────
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
const ONE_YEAR_AGO = new Date(TODAY.getTime() - 365 * 24 * 60 * 60 * 1000);

function dateFromDay(day: number): Date {
  return new Date(ONE_YEAR_AGO.getTime() + day * 24 * 60 * 60 * 1000);
}
function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ── Dual range slider (pointer-event-based, no stacked inputs) ─────
function DualRangeSlider({
  from,
  to,
  onChange,
}: {
  from: number;
  to: number;
  onChange: (from: number, to: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const fromPct = (from / 365) * 100;
  const toPct = (to / 365) * 100;

  const valueFromClientX = (clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return Math.round(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 365);
  };

  const makeHandleProps = (handle: 'from' | 'to') => ({
    onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      const val = valueFromClientX(e.clientX);
      if (handle === 'from') onChange(Math.max(0, Math.min(val, to - 1)), to);
      else onChange(from, Math.min(365, Math.max(val, from + 1)));
    },
    onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    },
  });

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const val = valueFromClientX(e.clientX);
    if (Math.abs(val - from) <= Math.abs(val - to)) {
      onChange(Math.max(0, Math.min(val, to - 1)), to);
    } else {
      onChange(from, Math.min(365, Math.max(val, from + 1)));
    }
  };

  const handleClass =
    'absolute top-1/2 w-5 h-5 -translate-y-1/2 -translate-x-1/2 rounded-full bg-light-bg-elevated dark:bg-dark-bg-elevated border-2 border-light-accent-primary dark:border-dark-accent-primary shadow cursor-grab active:cursor-grabbing touch-none z-10';

  return (
    <div className="relative h-10 flex items-center select-none">
      <div
        ref={trackRef}
        className="relative w-full h-1.5 rounded-full bg-light-border-primary dark:bg-dark-border-primary cursor-pointer"
        onClick={handleTrackClick}
      >
        <div
          className="absolute h-full rounded-full bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary pointer-events-none"
          style={{ left: `${fromPct}%`, width: `${toPct - fromPct}%` }}
        />
      </div>
      <div className={handleClass} style={{ left: `${fromPct}%` }} {...makeHandleProps('from')} />
      <div className={handleClass} style={{ left: `${toPct}%` }} {...makeHandleProps('to')} />
    </div>
  );
}

// ── Step progress indicator ────────────────────────────────────────
function StepProgress({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Stock' },
    { n: 2, label: 'Indicator' },
    { n: 3, label: 'Dates' },
  ];

  return (
    <div className="flex items-start">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                current > s.n
                  ? 'bg-light-accent-primary dark:bg-dark-accent-primary border-light-accent-primary dark:border-dark-accent-primary text-white'
                  : current === s.n
                  ? 'border-light-accent-primary dark:border-dark-accent-primary text-light-accent-primary dark:text-dark-accent-primary bg-light-accent-primary/10 dark:bg-dark-accent-primary/10'
                  : 'border-light-border-primary dark:border-dark-border-primary text-light-text-tertiary dark:text-dark-text-tertiary'
              }`}
            >
              {current > s.n ? <Check className="w-4 h-4" /> : s.n}
            </div>
            <span
              className={`text-xs mt-1 font-medium whitespace-nowrap ${
                current >= s.n
                  ? 'text-light-text-primary dark:text-dark-text-primary'
                  : 'text-light-text-tertiary dark:text-dark-text-tertiary'
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-3 mb-5 rounded-full ${
                current > s.n
                  ? 'bg-light-accent-primary dark:bg-dark-accent-primary'
                  : 'bg-light-border-primary dark:bg-dark-border-primary'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────
export function BacktestPage() {
  const [step, setStep] = useState<WizardStep>(1);
  const [selectedStock, setSelectedStock] = useState<StockEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [fromDay, setFromDay] = useState(270);
  const [toDay, setToDay] = useState(365);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [modalView, setModalView] = useState<ModalView>('params');
  const [modalStockQuery, setModalStockQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  const selectedExchange = localStorage.getItem('selectedExchange') || 'india';
  const exchangeStocks = (stockUniverse as StockEntry[]).filter(
    (s) => s.exchange.toLowerCase() === selectedExchange.toLowerCase()
  );

  const filteredStocks =
    searchQuery.length > 0
      ? exchangeStocks
          .filter(
            (s) =>
              s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.company_name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 8)
      : [];

  const modalFilteredStocks =
    modalStockQuery.length > 0
      ? exchangeStocks
          .filter(
            (s) =>
              s.symbol.toLowerCase().includes(modalStockQuery.toLowerCase()) ||
              s.company_name.toLowerCase().includes(modalStockQuery.toLowerCase())
          )
          .slice(0, 8)
      : [];

  const indicator = TECHNICAL_PARAMETERS.find((p) => p.id === selectedIndicator);
  const fromDate = dateFromDay(fromDay);
  const toDate = dateFromDay(toDay);

  const openFilterModal = () => {
    setModalView('params');
    setModalStockQuery('');
    setShowFilterModal(true);
  };

  // TODO: Replace runBacktest call with real API once backend is ready
  const handleRun = async (fDay = fromDay, tDay = toDay) => {
    if (!selectedStock || !selectedIndicator) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await runBacktest({
        symbol: selectedStock.symbol,
        indicator: selectedIndicator,
        from: isoDate(dateFromDay(fDay)),
        to: isoDate(dateFromDay(tDay)),
      });
      setResult(res);
      setStep(4);
    } catch {
      setError('Failed to run backtest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStock = (stock: StockEntry) => {
    setSelectedStock(stock);
    setSearchQuery(stock.symbol);
    setShowDropdown(false);
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="md" text="Running backtest..." />
      </div>
    );
  }

  // ── Step 4: Results ──────────────────────────────────────────────
  if (step === 4 && result) {
    const modalTitle =
      modalView === 'stock' ? 'Change Stock' : modalView === 'indicator' ? 'Change Indicator' : 'Edit Parameters';

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Filter modal */}
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowFilterModal(false)}
            />
            <div className="relative bg-light-bg-elevated dark:bg-dark-bg-elevated rounded-2xl shadow-2xl w-full max-w-md border border-light-border-primary dark:border-dark-border-primary animate-fade-in">
              {/* Modal header */}
              <div className="flex items-center gap-2 px-6 py-4 border-b border-light-border-primary dark:border-dark-border-primary">
                {modalView !== 'params' && (
                  <button
                    onClick={() => setModalView('params')}
                    className="p-1.5 rounded-lg hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <h3 className="flex-1 text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                  {modalTitle}
                </h3>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-1.5 rounded-lg hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5">

                {/* ── Params view ── */}
                {modalView === 'params' && (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      {/* Stock row */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-light-bg-tertiary dark:bg-dark-bg-tertiary">
                        <div className="min-w-0">
                          <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider mb-0.5">
                            Stock
                          </p>
                          <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                            {selectedStock?.symbol}
                          </p>
                          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary truncate">
                            {selectedStock?.company_name}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setModalStockQuery('');
                            setModalView('stock');
                          }}
                          className="text-xs text-light-accent-primary dark:text-dark-accent-primary hover:underline shrink-0 ml-4"
                        >
                          Change
                        </button>
                      </div>

                      {/* Indicator row */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-light-bg-tertiary dark:bg-dark-bg-tertiary">
                        <div className="min-w-0">
                          <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider mb-0.5">
                            Indicator
                          </p>
                          <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                            {indicator?.name}
                          </p>
                          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                            {indicator?.category}
                          </p>
                        </div>
                        <button
                          onClick={() => setModalView('indicator')}
                          className="text-xs text-light-accent-primary dark:text-dark-accent-primary hover:underline shrink-0 ml-4"
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    {/* Date range slider */}
                    <div>
                      <div className="flex justify-between text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                        <span>{formatDate(dateFromDay(fromDay))}</span>
                        <span>{formatDate(dateFromDay(toDay))}</span>
                      </div>
                      <DualRangeSlider
                        from={fromDay}
                        to={toDay}
                        onChange={(f, t) => {
                          setFromDay(f);
                          setToDay(t);
                        }}
                      />
                      <div className="flex justify-between text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
                        <span>{formatDate(ONE_YEAR_AGO)}</span>
                        <span>{formatDate(TODAY)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setShowFilterModal(false);
                        handleRun(fromDay, toDay);
                      }}
                      className="w-full"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Re-run Backtest
                    </Button>

                    {error && (
                      <p className="text-sm text-rose-600 dark:text-rose-400 text-center">{error}</p>
                    )}
                  </div>
                )}

                {/* ── Stock search view ── */}
                {modalView === 'stock' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary" />
                      <input
                        type="text"
                        value={modalStockQuery}
                        onChange={(e) => setModalStockQuery(e.target.value)}
                        autoFocus
                        placeholder="Search symbol or company..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-light-bg-tertiary dark:bg-dark-bg-tertiary border border-light-border-primary dark:border-dark-border-primary text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:border-light-accent-primary dark:focus:border-dark-accent-primary focus:ring-2 focus:ring-light-accent-primary/20 dark:focus:ring-dark-accent-primary/20 transition-all"
                      />
                    </div>

                    {modalFilteredStocks.length > 0 && (
                      <div className="max-h-56 overflow-y-auto rounded-lg border border-light-border-primary dark:border-dark-border-primary divide-y divide-light-border-primary/50 dark:divide-dark-border-primary/50">
                        {modalFilteredStocks.map((s) => (
                          <button
                            key={s.symbol}
                            onClick={() => {
                              setSelectedStock(s);
                              setModalView('params');
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary ${
                              selectedStock?.symbol === s.symbol
                                ? 'bg-light-accent-primary/10 dark:bg-dark-accent-primary/10'
                                : ''
                            }`}
                          >
                            <span className="font-semibold text-light-text-primary dark:text-dark-text-primary w-20 shrink-0">
                              {s.symbol}
                            </span>
                            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary truncate">
                              {s.company_name}
                            </span>
                            {selectedStock?.symbol === s.symbol && (
                              <Check className="w-4 h-4 text-light-accent-primary dark:text-dark-accent-primary shrink-0 ml-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {modalStockQuery.length > 0 && modalFilteredStocks.length === 0 && (
                      <p className="text-sm text-center text-light-text-tertiary dark:text-dark-text-tertiary py-6">
                        No stocks found
                      </p>
                    )}

                    {modalStockQuery.length === 0 && (
                      <p className="text-sm text-center text-light-text-tertiary dark:text-dark-text-tertiary py-6">
                        Type to search stocks
                      </p>
                    )}
                  </div>
                )}

                {/* ── Indicator selection view ── */}
                {modalView === 'indicator' && (
                  <div className="max-h-72 overflow-y-auto -mx-1 space-y-0.5">
                    {TECHNICAL_PARAMETERS.map((param) => (
                      <button
                        key={param.id}
                        onClick={() => {
                          setSelectedIndicator(param.id);
                          setModalView('params');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                          selectedIndicator === param.id
                            ? 'bg-light-accent-primary/10 dark:bg-dark-accent-primary/10 text-light-accent-primary dark:text-dark-accent-primary'
                            : 'hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary text-light-text-primary dark:text-dark-text-primary'
                        }`}
                      >
                        <span className="text-sm font-medium">{param.name}</span>
                        {selectedIndicator === param.id && (
                          <Check className="w-4 h-4 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary">
              Backtest Results
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
              <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                {selectedStock?.symbol}
              </span>
              <span className="text-light-text-tertiary dark:text-dark-text-tertiary">•</span>
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                {indicator?.name}
              </span>
              <span className="text-light-text-tertiary dark:text-dark-text-tertiary">•</span>
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                {formatDate(fromDate)} – {formatDate(toDate)}
              </span>
            </div>
          </div>

          <button
            onClick={openFilterModal}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary text-white font-medium text-sm shadow-md hover:shadow-lg hover:opacity-90 transition-all"
            title="Edit Parameters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        {/* Signal count cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="p-7 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
                BUY Signals
              </span>
            </div>
            <div className="text-5xl font-bold text-green-600 dark:text-green-400">
              {result.buy_signals}
            </div>
          </Card>

          <Card className="p-7 bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-rose-500/10">
                <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                SELL Signals
              </span>
            </div>
            <div className="text-5xl font-bold text-rose-600 dark:text-rose-400">
              {result.sell_signals}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── Steps 1–3: Setup wizard ──────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary">
          Backtest
        </h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">
          Test a technical indicator's signals on a stock over a selected date range
        </p>
      </div>

      <Card className="p-6 space-y-8">
        <StepProgress current={step as 1 | 2 | 3} />

        {/* ── Step 1: Stock ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              Select a Stock
            </h3>

            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                    if (!e.target.value) setSelectedStock(null);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  placeholder="Search by symbol or company name..."
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-light-bg-tertiary dark:bg-dark-bg-tertiary border border-light-border-primary dark:border-dark-border-primary text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:border-light-accent-primary dark:focus:border-dark-accent-primary focus:ring-2 focus:ring-light-accent-primary/20 dark:focus:ring-dark-accent-primary/20 transition-all"
                  autoFocus
                />
              </div>

              {showDropdown && filteredStocks.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-xl shadow-xl z-50 overflow-hidden">
                  {filteredStocks.map((s) => (
                    <button
                      key={s.symbol}
                      onMouseDown={() => handleSelectStock(s)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary text-left transition-colors"
                    >
                      <span className="font-semibold text-light-text-primary dark:text-dark-text-primary w-24 shrink-0">
                        {s.symbol}
                      </span>
                      <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary truncate">
                        {s.company_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedStock && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-light-accent-primary/10 dark:bg-dark-accent-primary/10 border border-light-accent-primary/30 dark:border-dark-accent-primary/30">
                <Check className="w-4 h-4 text-light-accent-primary dark:text-dark-accent-primary shrink-0" />
                <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                  {selectedStock.symbol}
                </span>
                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary truncate">
                  — {selectedStock.company_name}
                </span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} disabled={!selectedStock}>
                Next: Choose Indicator
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Indicator ── */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              Select a Technical Indicator
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TECHNICAL_PARAMETERS.map((param) => (
                <button
                  key={param.id}
                  onClick={() => setSelectedIndicator(param.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    selectedIndicator === param.id
                      ? 'border-light-accent-primary dark:border-dark-accent-primary bg-light-accent-primary/10 dark:bg-dark-accent-primary/10'
                      : 'border-light-border-primary dark:border-dark-border-primary hover:border-light-accent-primary/40 dark:hover:border-dark-accent-primary/40 bg-light-bg-tertiary dark:bg-dark-bg-tertiary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary">
                      {param.name}
                    </p>
                    {selectedIndicator === param.id && (
                      <Check className="w-4 h-4 text-light-accent-primary dark:text-dark-accent-primary shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!selectedIndicator}>
                Next: Set Date Range
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Dates ── */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              Select Date Range
            </h3>

            {/* Summary pills */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-3 py-1.5 rounded-full bg-light-bg-tertiary dark:bg-dark-bg-tertiary border border-light-border-primary dark:border-dark-border-primary text-light-text-secondary dark:text-dark-text-secondary font-medium">
                {selectedStock?.symbol}
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full bg-light-bg-tertiary dark:bg-dark-bg-tertiary border border-light-border-primary dark:border-dark-border-primary text-light-text-secondary dark:text-dark-text-secondary font-medium">
                {indicator?.name}
              </span>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                <span>{formatDate(fromDate)}</span>
                <span>{formatDate(toDate)}</span>
              </div>
              <DualRangeSlider
                from={fromDay}
                to={toDay}
                onChange={(f, t) => {
                  setFromDay(f);
                  setToDay(t);
                }}
              />
              <div className="flex justify-between text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                <span>{formatDate(ONE_YEAR_AGO)}</span>
                <span>{formatDate(TODAY)}</span>
              </div>
              <p className="text-xs text-center text-light-text-tertiary dark:text-dark-text-tertiary pt-1">
                Date range limited to the last 12 months
              </p>
            </div>

            {error && (
              <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => handleRun()}>
                <Play className="w-4 h-4 mr-2" />
                Run Backtest
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
