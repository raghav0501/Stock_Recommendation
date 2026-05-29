import { useState } from 'react';
import { useAsyncData } from '../hooks/useAsyncData';
import { Activity, TrendingUp, Briefcase, Bell, Sun, Moon, Menu, X, LogOut, Settings, User, UserCircle, BookMarked, FlaskConical, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../config/ThemeContext';
import { useAuth } from '../config/AuthContext';
import { Dropdown, DropdownDivider, DropdownItem, DropdownSection } from './Dropdown';
import { MarketOverview } from './MarketOverview';
import type { MarketIndex, MarketStatus } from '../models/Market';
import { getMarketIndices, getMarketStatus } from '../api/marketApi';
import { useToast } from './Toast';
import { toastMessage } from '../utils/errorMessage';

export function Header() {
  const { logout, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: marketData, loading: isMarketLoading } = useAsyncData(
    () => Promise.all([getMarketIndices(), getMarketStatus()])
          .then(([indices, status]) => ({ indices, status })),
    { indices: [] as MarketIndex[], status: null as MarketStatus | null },
    [],
    { onError: err => showToast(toastMessage(err)) }
  );

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = [
    { path: '/alerts',               label: 'Alerts',      icon: <Bell     className="w-4 h-4" /> },
    { path: '/technical-indicators', label: 'Indicators',  icon: <Activity className="w-4 h-4" /> },
    { path: '/stocks',               label: 'Stocks',      icon: <TrendingUp className="w-4 h-4" /> },
  ];

  const settingsItems = [
    { path: '/watchlist',   label: 'Watchlist',    icon: <BookMarked   className="w-4 h-4" /> },
    { path: '/portfolio',   label: 'Portfolio',    icon: <Briefcase    className="w-4 h-4" /> },
    { path: '/early-alert', label: 'Early Alerts', icon: <Zap          className="w-4 h-4" /> },
    { path: '/backtest',    label: 'Backtest',     icon: <FlaskConical className="w-4 h-4" /> },
  ];


  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="border-b border-light-border-primary dark:border-dark-border-primary bg-light-bg-elevated dark:bg-dark-bg-elevated shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-12 py-4 max-w-full">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/exchange')}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:dark-accent-secondary blur-md opacity-50"></div>
                {/* <div className="relative bg-gradient-to-br from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary p-2.5 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div> */}
              </div>
              <div>
                {/* <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary bg-clip-text text-transparent">
                  Alumnus
                </h1> */}
                <img src="https://www.alumnux.com/wp-content/uploads/2025/07/Alumnus-Logo.webp" alt="" className='h-8' />
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary tracking-wider uppercase font-medium text-center">
                  Stock Trader
                </p>
              </div>
            </div>
            <MarketOverview 
              indices={marketData.indices} 
              status={marketData.status} 
              loading={isMarketLoading} 
            />

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              {location.pathname !== '/exchange' && (
                <nav className="flex gap-2">
                  {navItems.map(item => (
                    <NavButton
                      key={item.path}
                      icon={item.icon}
                      label={item.label}
                      active={isActive(item.path)}
                      onClick={() => navigate(item.path)}
                    />
                  ))}
                </nav>
              )}

              {/* Theme Toggle */}
              <ThemeToggle size="md" />

              {/* User Menu Dropdown */}
              {user && (
                <Dropdown
                  trigger={
                    <button
                      className="p-2.5 rounded-lg bg-light-bg-tertiary dark:bg-dark-bg-tertiary border border-light-border-primary dark:border-dark-border-primary text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-all"
                      title="User menu"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  }
                  align="right"
                  width="w-72"
                  closeOnClick={true}
                >
                  {/* User Info */}
                  <DropdownSection>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary flex items-center justify-center">
                        <UserCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-light-text-primary dark:text-dark-text-primary truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </DropdownSection>

                  <DropdownDivider />

                  {/* Menu Items */}
                  <DropdownItem
                    icon={<User className="w-4 h-4" />}
                    // onClick={() => navigate('/profile')}
                    className='cursor-not-allowed'
                  >
                    Profile
                  </DropdownItem>

                  {settingsItems.map(item => (
                    <DropdownItem
                      key={item.path}
                      icon={item.icon}
                      onClick={() => navigate(item.path)}
                    >
                      {item.label}
                    </DropdownItem>
                  ))}

                  <DropdownDivider />

                  <DropdownItem
                    icon={<LogOut className="w-4 h-4" />}
                    onClick={handleLogout}
                    variant="danger"
                  >
                    Logout
                  </DropdownItem>
                </Dropdown>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle size="sm" />
              
              {location.pathname !== '/exchange' && (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-lg bg-light-bg-tertiary dark:bg-dark-bg-tertiary border border-light-border-primary dark:border-dark-border-primary text-light-text-secondary dark:text-dark-text-secondary"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && location.pathname !== '/exchange' && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-64 bg-light-bg-elevated dark:bg-dark-bg-elevated border-l border-light-border-primary dark:border-dark-border-primary shadow-2xl z-50 md:hidden animate-slide-in">
            <div className="p-4">
              {/* Close button */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors"
                >
                  <X className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                </button>
              </div>

              {/* User info */}
              {user && (
                <div className="mb-6 p-3 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded-lg">
                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
                    Logged in as
                  </p>
                  <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary truncate">
                    {user.email}
                  </p>
                </div>
              )}

              {/* Navigation Items */}
              <nav className="space-y-1 mb-3">
                {navItems.map(item => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary text-white shadow-lg'
                        : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Divider */}
              <div className="border-t border-light-border-primary dark:border-dark-border-primary my-3" />

              {/* Settings items */}
              <nav className="space-y-1 mb-3">
                {settingsItems.map(item => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary text-white shadow-lg'
                        : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Divider */}
              <div className="border-t border-light-border-primary dark:border-dark-border-primary my-3" />

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function ThemeToggle({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={`${size === 'md' ? 'p-2.5' : 'p-2'} rounded-lg bg-light-bg-tertiary dark:bg-dark-bg-tertiary border border-light-border-primary dark:border-dark-border-primary text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-all`}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
}

function NavButton({ icon, label, active, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
        transition-all duration-200 relative overflow-hidden
        ${active 
          ? 'text-white shadow-lg' 
          : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
        }
      `}
    >
      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary"></div>
      )}
      {!active && (
        <div className="absolute inset-0 bg-light-bg-tertiary dark:bg-dark-bg-tertiary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors"></div>
      )}
      <span className="relative z-10">{icon}</span>
      <span className="relative z-10">{label}</span>
    </button>
  );
}