import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../config/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@alumnux.com');
  const [password, setPassword] = useState('12345678');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/exchange');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg-secondary dark:bg-dark-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary blur-xl opacity-50"></div>
              {/* <div className="relative bg-gradient-to-br from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary p-4 rounded-2xl">
                <TrendingUp className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div> */}
            </div>
          </div>
          {/* <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary bg-clip-text text-transparent mb-2">
            Alumnus Stock Trader
          </h1> */}
          <div className='flex flex-col items-center justify-center mb-6'>
            {/* <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary bg-clip-text text-transparent">
              Alumnus
            </h1> */}
            <img src="https://www.alumnux.com/wp-content/uploads/2025/07/Alumnus-Logo.webp" alt="" className='h-12' />
            <p className="text-lg text-light-text-tertiary dark:text-dark-text-tertiary tracking-wider uppercase font-medium text-center">
              Stock Trader
            </p>
          </div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Sign in to start analyzing stocks
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-tertiary dark:text-dark-text-tertiary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 bg-light-bg-tertiary dark:bg-dark-bg-tertiary border border-light-border-primary dark:border-dark-border-primary rounded-xl text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:border-light-accent-primary dark:focus:border-dark-accent-primary focus:ring-2 focus:ring-light-accent-primary/20 dark:focus:ring-dark-accent-primary/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-tertiary dark:text-dark-text-tertiary" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-4 py-3 bg-light-bg-tertiary dark:bg-dark-bg-tertiary border border-light-border-primary dark:border-dark-border-primary rounded-xl text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:border-light-accent-primary dark:focus:border-dark-accent-primary focus:ring-2 focus:ring-light-accent-primary/20 dark:focus:ring-dark-accent-primary/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-600 dark:text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                'Signing in...'
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle to OTP login */}
          <div className="mt-6 pt-6 border-t border-light-border-primary dark:border-dark-border-primary text-center">
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-3">
              Prefer a passwordless experience?
            </p>
            <button
              type="button"
              onClick={() => navigate('/login/otp')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-light-accent-primary dark:text-dark-accent-primary border border-light-accent-primary/40 dark:border-dark-accent-primary/40 hover:bg-light-accent-primary/10 dark:hover:bg-dark-accent-primary/10 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              Sign in with OTP
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-light-text-tertiary dark:text-dark-text-tertiary mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}