import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Globe } from 'lucide-react';
import { Card } from '../../components/Card';
import { useAuth } from '../../config/AuthContext';
import type { Market } from '../../config/AuthContext';
import { Lock } from 'lucide-react';

interface Exchange {
  id: string;
  name: string;
  fullName: string;
  country: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

function marketToExchange(market: Market): Exchange {
  return {
    id: market.exchange,
    name: market.name,
    fullName: market.fullName,
    country: market.country,
    description: market.description,
    icon: market.exchange === 'india' ? <Building2 className="w-8 h-8" /> : <Globe className="w-8 h-8" />,
    enabled: true,
  };
}

export function ExchangePage() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const exchangeOptions = useMemo<Exchange[]>(
    () => (session?.markets ?? []).map(marketToExchange),
    [session]
  );

  const loading = false;

  const handleClick = (id: string) => {
    // if (selectedExchange) {
      // Store selected exchange in localStorage for future use
      localStorage.setItem('selectedExchange', id);
      navigate('/technical-indicators');
    // }
  };

  return (
    <div className="min-h-screen bg-light-bg-secondary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary flex items-center justify-center p-4">
      <div className="w-full max-w-6xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary blur-xl opacity-50"></div>
              {/* <div className="relative bg-gradient-to-br from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary p-4 rounded-2xl">
                <TrendingUp className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div> */}
            </div>
          </div>
          {/* <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary bg-clip-text text-transparent mb-3">
            Alumnus Stock Trader
          </h1> */}
          <div className='flex flex-col justify-center items-center mb-6'>
            {/* <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary bg-clip-text text-transparent">
              Alumnus
            </h1> */}
            <img src="https://www.alumnux.com/wp-content/uploads/2025/07/Alumnus-Logo.webp" alt="" className='h-12' />
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary tracking-wider uppercase font-medium text-center">
              Stock Trader
            </p>
          </div>
          <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Select Your Stock Exchange
          </p>
          <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
            Choose the exchange you want to analyze stocks from
          </p>
        </div>

        {/* Exchange Grid */}
        {loading ?
        <>
          <div className="flex items-center justify-center h-32">
            <div className="text-light-text-secondary dark:text-dark-text-secondary">Loading exchanges...</div>
          </div>
        </> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {exchangeOptions.map((exchange) => (
            <Card
              key={exchange.id}
              hover={true}
              className={`relative overflow-hidden transition-all duration-300 ${
                !exchange.enabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'}
                // selectedExchange === exchange.id
                //   ? 'ring-2 ring-light-accent-primary dark:ring-dark-accent-primary bg-light-accent-primary/5 dark:bg-dark-accent-primary/5'
                //   : ''
              `}
              onClick={() => handleClick(exchange.id)}
            >
              {/* Disabled Overlay */}
              {!exchange.enabled && (
                <div className="absolute top-4 right-4 z-10" >
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-light-text-tertiary/10 dark:bg-dark-text-tertiary/10 backdrop-blur-sm rounded-full border border-light-border-primary dark:border-dark-border-primary">
                    <Lock className="w-3 h-3 text-light-text-tertiary dark:text-dark-text-tertiary" />
                    <span className="text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary">
                      Coming Soon
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col h-full">
                {/* Icon and Name */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-xl `}>
                    {exchange.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
                      {exchange.name}
                    </h3>
                    <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {exchange.country}
                    </p>
                  </div>
                </div>

                {/* Full Name */}
                <p className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-3">
                  {exchange.fullName}
                </p>

                {/* Description */}
                <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary flex-1">
                  {exchange.description}
                </p>

                {/* Selection Indicator */}
                {/* {exchange.enabled && selectedExchange === exchange.id && (
                  <div className="mt-4 pt-4 border-t border-light-border-primary dark:border-dark-border-primary">
                    <div className="flex items-center gap-2 text-light-accent-primary dark:text-dark-accent-primary">
                      <div className="w-2 h-2 rounded-full bg-light-accent-primary dark:bg-dark-accent-primary animate-pulse"></div>
                      <span className="text-sm font-semibold">Selected</span>
                    </div>
                  </div>
                )} */}
              </div>
            </Card>
          ))}
        </div>}

        {/* Continue Button */}
        {/* <div className="flex justify-center">
          <Button
            onClick={handleClick}
            disabled={!selectedExchange}
            size="lg"
            className="px-8 py-4 text-lg"
          >
            Continue to Analysis
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div> */}

        {/* Info Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
            More exchanges will be available soon. Currently supporting Indian markets.
          </p>
        </div>
      </div>
    </div>
  );
}