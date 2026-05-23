import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './config/ThemeContext';
import { AuthProvider, useAuth } from './config/AuthContext';
import { Header } from './components/Header';
import { ChatBot } from './components/ChatBot/ChatBot';
import { ToastProvider } from './components/Toast';
// import { LoginPage } from './pages/Login/LoginPage';
import { OtpLoginPage } from './pages/Login/OtpLoginPage';
import { ExchangePage } from './pages/Exchange/ExchangePage';
import { StocksPage } from './pages/Stocks/StocksPage';
import { PortfolioPage } from './pages/Portfolio/PortfolioPage';
import { WatchlistPage } from './pages/Watchlist/WatchlistPage';
import { BacktestPage } from './pages/Backtest/BacktestPage';
import { EarlyAlertPage } from './pages/Breakout/BreakoutPage';
import { AlertsPage } from './pages/Alerts/AlertsPage';
import { StockDetailPage } from './pages/StockDetail/StockDetailPage';
import { TechnicalIndicatorsPage } from './pages/Parameters/TechnicalIndicatorsPage';
import type { TechnicalParameter } from './models/Market';

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
      chartable: true,
    }));
    setParameters(mapped);
  }, [session]);

  return (
    <div className="min-h-screen bg-light-bg-secondary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary transition-colors duration-200">
      <Routes>
        {/* Public Routes */}
        <Route path="/login/otp" element={<OtpLoginPage />} />
        {/* <Route path="/login" element={<LoginPage />} /> */}
        
        {/* Protected Routes */}
        <Route path="/exchange" element={
          <ProtectedRoute>
            <ExchangePage />
          </ProtectedRoute>
        } />
        
        <Route path="/*" element={
          <ProtectedRoute>
            <>
              <Header />
              <main className="container mx-auto px-12 py-6 max-w-full">
                {/* <MarketOverview /> */}
                
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
                        // technicalParameters={parameters}
                        parameters={selectedParameters}
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
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;