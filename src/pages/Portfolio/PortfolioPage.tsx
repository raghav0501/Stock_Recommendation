import { useState } from 'react';
import { PieChart, BarChart3, TrendingUp, Download, Share2, X } from 'lucide-react';
import type { PortfolioStock } from '../../models/Stock';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

const INITIAL_PORTFOLIO: PortfolioStock[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', allocation: 0, shares: 50, avgPrice: 2800, currentPrice: 2845.60, value: 142280 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', allocation: 0, shares: 70, avgPrice: 1650, currentPrice: 1645.30, value: 115171 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', allocation: 0, shares: 45, avgPrice: 3800, currentPrice: 3845.20, value: 173034 },
  { symbol: 'ITC', name: 'ITC Limited', allocation: 0, shares: 200, avgPrice: 435, currentPrice: 445.30, value: 89060 },
  { symbol: 'SBIN', name: 'State Bank of India', allocation: 0, shares: 180, avgPrice: 620, currentPrice: 634.50, value: 114210 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', allocation: 0, shares: 12, avgPrice: 12500, currentPrice: 12456.80, value: 149481 },
  { symbol: 'INFY', name: 'Infosys', allocation: 0, shares: 100, avgPrice: 1500, currentPrice: 1534.60, value: 153460 },
  { symbol: 'WIPRO', name: 'Wipro', allocation: 0, shares: 150, avgPrice: 450, currentPrice: 465.30, value: 69795 },
];

export function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>(INITIAL_PORTFOLIO);

  const totalValue = portfolio.reduce((sum, stock) => sum + stock.value, 0);
  const totalGainLoss = portfolio.reduce((sum, stock) => {
    const gain = (stock.currentPrice - stock.avgPrice) * stock.shares;
    return sum + gain;
  }, 0);
  const totalGainLossPercent = (totalGainLoss / (totalValue - totalGainLoss)) * 100;

  const removeStock = (symbol: string) => {
    setPortfolio(portfolio.filter(s => s.symbol !== symbol));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary mb-2">
            Portfolio
          </h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Track and manage your stock holdings
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          label="Total Value"
          value={`₹${totalValue.toLocaleString('en-IN')}`}
          icon={<PieChart className="w-5 h-5" />}
          color="primary"
        />
        <SummaryCard
          label="Total Gain/Loss"
          value={`₹${totalGainLoss.toLocaleString('en-IN')}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color={totalGainLoss >= 0 ? 'success' : 'danger'}
          subtext={`${totalGainLoss >= 0 ? '+' : ''}${totalGainLossPercent.toFixed(2)}%`}
        />
        <SummaryCard
          label="Number of Stocks"
          value={portfolio.length.toString()}
          icon={<BarChart3 className="w-5 h-5" />}
          color="secondary"
        />
      </div>

      {/* Portfolio Holdings */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-light-border-primary dark:border-dark-border-primary bg-light-bg-tertiary dark:bg-dark-bg-tertiary">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
            Holdings
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-light-border-primary dark:border-dark-border-primary bg-light-bg-tertiary/50 dark:bg-dark-bg-tertiary/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                  Shares
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                  Avg Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                  Current Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                  Gain/Loss
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border-primary/50 dark:divide-dark-border-primary/50">
              {portfolio.map((stock) => {
                const gainLoss = (stock.currentPrice - stock.avgPrice) * stock.shares;
                const gainLossPercent = ((stock.currentPrice - stock.avgPrice) / stock.avgPrice) * 100;

                return (
                  <tr key={stock.symbol} className="hover:bg-light-bg-tertiary/30 dark:hover:bg-dark-bg-tertiary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                          {stock.symbol}
                        </div>
                        <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                          {stock.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-light-text-secondary dark:text-dark-text-secondary">
                      {stock.shares}
                    </td>
                    <td className="px-6 py-4 text-right text-light-text-secondary dark:text-dark-text-secondary">
                      ₹{stock.avgPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-light-text-primary dark:text-dark-text-primary">
                      ₹{stock.currentPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-light-text-primary dark:text-dark-text-primary">
                      ₹{stock.value.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={gainLoss >= 0 ? 'text-light-accent-success dark:text-dark-accent-success' : 'text-light-accent-danger dark:text-dark-accent-danger'}>
                        <div className="font-semibold">
                          {gainLoss >= 0 ? '+' : ''}₹{gainLoss.toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs">
                          {gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => removeStock(stock.symbol)}
                        className="p-2 hover:bg-rose-500/10 rounded-lg text-light-text-tertiary dark:text-dark-text-tertiary hover:text-rose-600 dark:hover:text-rose-400 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'danger';
  subtext?: string;
}

function SummaryCard({ label, value, icon, color, subtext }: SummaryCardProps) {
  const colorClasses = {
    primary: 'from-light-accent-primary/10 to-light-accent-primary/5 dark:from-dark-accent-primary/10 dark:to-dark-accent-primary/5 border-light-accent-primary/30 dark:border-dark-accent-primary/30 text-light-accent-primary dark:text-dark-accent-primary',
    secondary: 'from-light-accent-secondary/10 to-light-accent-secondary/5 dark:from-dark-accent-secondary/10 dark:to-dark-accent-secondary/5 border-light-accent-secondary/30 dark:border-dark-accent-secondary/30 text-light-accent-secondary dark:text-dark-accent-secondary',
    success: 'from-light-accent-success/10 to-light-accent-success/5 dark:from-dark-accent-success/10 dark:to-dark-accent-success/5 border-light-accent-success/30 dark:border-dark-accent-success/30 text-light-accent-success dark:text-dark-accent-success',
    danger: 'from-light-accent-danger/10 to-light-accent-danger/5 dark:from-dark-accent-danger/10 dark:to-dark-accent-danger/5 border-light-accent-danger/30 dark:border-dark-accent-danger/30 text-light-accent-danger dark:text-dark-accent-danger',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={colorClasses[color].split(' ').slice(-2).join(' ')}>
          {icon}
        </div>
        <span className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
        {value}
      </div>
      {subtext && (
        <div className={`text-sm font-medium ${colorClasses[color].split(' ').slice(-2).join(' ')}`}>
          {subtext}
        </div>
      )}
    </div>
  );
}