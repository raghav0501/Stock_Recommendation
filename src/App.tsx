import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './config/ThemeContext';
import { AuthProvider, useAuth } from './config/AuthContext';
import { Header } from './components/Header';
import { ChatBot } from './components/ChatBot/ChatBot';
import { LoginPage } from './pages/Login/LoginPage';
import { OtpLoginPage } from './pages/Login/OtpLoginPage';
import { ExchangePage } from './pages/Exchange/ExchangePage';
import { StocksPage } from './pages/Stocks/StocksPage';
import { PortfolioPage } from './pages/Portfolio/PortfolioPage';
import { WatchlistPage } from './pages/Watchlist/WatchlistPage';
import { BacktestPage } from './pages/Backtest/BacktestPage';
import { StockDetailPage } from './pages/StockDetail/StockDetailPage';
import { TechnicalIndicatorsPage } from './pages/Parameters/TechnicalIndicatorsPage';
// import { getSignals } from './api/backendService';
import type { TechnicalParameter } from './models/Market';
import { TECHNICAL_PARAMETERS } from './config/parameters';

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
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const [parameters, setParameters] = useState<TechnicalParameter[]>([]);
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);

  useEffect(() => {
    const getTechnicalParameters = async () => {
      try {
        // const res = await getSignals();
        // if (res.signals.length > 0) {
        setParameters(TECHNICAL_PARAMETERS);
        // }
      } catch (error) {
        console.error('Error fetching technical parameters:', error);
      }
    }
    getTechnicalParameters();
  }, []);

  return (
    <div className="min-h-screen bg-light-bg-secondary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary transition-colors duration-200">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        {/* TODO: /login/otp is the primary login route once backend OTP API is ready */}
        <Route path="/login/otp" element={<OtpLoginPage />} />
        
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
              <main className="container mx-auto px-4 py-6 max-w-7xl">
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
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;