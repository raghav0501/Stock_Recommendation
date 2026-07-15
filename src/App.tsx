import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './config/queryClient';
import { ThemeProvider } from './config/ThemeContext';
import { AuthProvider, useAuth } from './config/AuthContext';
import { Header } from './components/Header';
import { ChatBot } from './components/ChatBot/ChatBot';
import { ToastProvider } from './components/Toast';
import { ErrorFallback } from './components/ErrorFallback';
import { Loader } from './components/Loader';
import type { TechnicalParameter } from './models/Market';

// ── Lazy page imports ──────────────────────────────────────────────
const OtpLoginPage            = lazy(() => import('./pages/Login/OtpLoginPage').then(m => ({ default: m.OtpLoginPage })));
const ExchangePage            = lazy(() => import('./pages/Exchange/ExchangePage').then(m => ({ default: m.ExchangePage })));
const StocksPage              = lazy(() => import('./pages/Stocks/StocksPage').then(m => ({ default: m.StocksPage })));
const StockDetailPage         = lazy(() => import('./pages/StockDetail/StockDetailPage').then(m => ({ default: m.StockDetailPage })));
const PortfolioPage           = lazy(() => import('./pages/Portfolio/PortfolioPage').then(m => ({ default: m.PortfolioPage })));
const WatchlistPage           = lazy(() => import('./pages/Watchlist/WatchlistPage').then(m => ({ default: m.WatchlistPage })));
const AlertsPage              = lazy(() => import('./pages/Alerts/AlertsPage').then(m => ({ default: m.AlertsPage })));
const EarlyAlertPage          = lazy(() => import('./pages/Breakout/BreakoutPage').then(m => ({ default: m.EarlyAlertPage })));
const BacktestPage            = lazy(() => import('./pages/Backtest/BacktestPage').then(m => ({ default: m.BacktestPage })));
const TechnicalIndicatorsPage = lazy(() => import('./pages/Parameters/TechnicalIndicatorsPage').then(m => ({ default: m.TechnicalIndicatorsPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader size="md" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-bg-secondary dark:bg-dark-bg-primary flex items-center justify-center">
        <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login/otp" replace />;
  }

  return <>{children}</>;
}

const CATEGORY_MAP: Record<string, TechnicalParameter['category']> = {
  trend: 'Trend',
  momentum: 'Momentum',
  volatility: 'Volatility',
  volume: 'Volume',
  strategy: 'Strategy',
};

function AppContent() {
  const { session } = useAuth();
  const [parameters, setParameters] = useState<TechnicalParameter[]>([]);
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);

  useEffect(() => {
    if (!session?.entitledIndicators?.length) return;
    const mapped: TechnicalParameter[] = session.entitledIndicators.map(ind => ({
      id: ind.id,
      name: ind.name,
      description: ind.description,
      category: CATEGORY_MAP[ind.category.toLowerCase()] ?? 'Strategy',
      scale: ind.scale as TechnicalParameter['scale'],
      chartable: ind.scale !== 'none',
    }));
    setParameters(mapped);
  }, [session]);

  return (
    <div className="min-h-screen bg-light-bg-secondary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary transition-colors duration-200">
      <Routes>
        {/* Public Routes */}
        <Route path="/login/otp" element={
          <Suspense fallback={<PageLoader />}>
            <OtpLoginPage />
          </Suspense>
        } />

        {/* Protected Routes */}
        <Route path="/exchange" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <ExchangePage />
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/*" element={
          <ProtectedRoute>
            <>
              <Header />
              <main className="container mx-auto md:px-12 py-6 max-w-full">
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route
                        path="/technical-indicators"
                        element={
                          <TechnicalIndicatorsPage
                            technicalParameters={parameters}
                            selectedParameters={selectedParameters}
                            onParametersChange={setSelectedParameters}
                          />
                        }
                      />

                      <Route
                        path="/stocks"
                        element={
                          <StocksPage
                            parameters={selectedParameters}
                            allParameters={parameters}
                            onParametersChange={setSelectedParameters}
                          />
                        }
                      />

                      <Route
                        path="/stocks/:symbol"
                        element={<StockDetailPage indicators={selectedParameters} />}
                      />

                      <Route
                        path="/portfolio"
                        element={<PortfolioPage />}
                      />

                      <Route
                        path="/watchlist"
                        element={<WatchlistPage />}
                      />

                      <Route
                        path="/alerts"
                        element={<AlertsPage />}
                      />

                      <Route
                        path="/early-alert"
                        element={<EarlyAlertPage />}
                      />

                      <Route
                        path="/backtest"
                        element={<BacktestPage />}
                      />

                      <Route path="*" element={<Navigate to="/exchange" replace />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </main>

              <ChatBot />
            </>
          </ProtectedRoute>
        } />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login/otp" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
