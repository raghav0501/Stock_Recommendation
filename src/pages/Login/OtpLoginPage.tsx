import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle, Info, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../config/AuthContext';

type Step = 'email' | 'otp';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 10;

export function OtpLoginPage() {
  const navigate = useNavigate();
  const { requestOtp, loginWithOtp } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_COOLDOWN);

  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(OTP_LENGTH).fill(null));

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const sendOtp = async () => {
    await requestOtp(email);
    setResendCountdown(RESEND_COOLDOWN);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await sendOtp();
      setStep('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      setOtp(pasted.split(''));
      e.preventDefault();
      otpRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const otpValue = otp.join('');
    if (otpValue.length < OTP_LENGTH) {
      setError(`Please enter the complete ${OTP_LENGTH}-digit OTP.`);
      return;
    }
    setIsLoading(true);
    try {
      const success = await loginWithOtp(email, otpValue);
      if (success) {
        navigate('/exchange');
      } else {
        setError('Invalid OTP. Please try again.');
        setOtp(Array(OTP_LENGTH).fill(''));
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp(Array(OTP_LENGTH).fill(''));
    setError('');
    try {
      await sendOtp();
    } catch {
      setError('Failed to resend OTP. Please try again.');
    }
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  const handleChangeEmail = () => {
    setStep('email');
    setOtp(Array(OTP_LENGTH).fill(''));
    setError('');
  };

  return (
    <div className="min-h-screen bg-light-bg-secondary dark:bg-dark-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center mb-6">
            <img
              src="https://www.alumnux.com/wp-content/uploads/2025/07/Alumnus-Logo.webp"
              alt="Alumnus"
              className="h-12"
            />
            <p className="text-lg text-light-text-tertiary dark:text-dark-text-tertiary tracking-wider uppercase font-medium text-center">
              Stock Trader
            </p>
          </div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Sign in with OTP
          </p>
        </div>

        {/* Card */}
        <div className="bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-2xl p-8 shadow-lg">

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
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
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-600 dark:text-rose-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Sending OTP...' : (
                  <>Send OTP <ArrowRight className="w-5 h-5 ml-2" /></>
                )}
              </Button>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              {/* Info banner */}
              <div className="flex items-start gap-2 p-3 bg-light-accent-primary/10 dark:bg-dark-accent-primary/10 border border-light-accent-primary/30 dark:border-dark-accent-primary/30 rounded-lg text-light-accent-primary dark:text-dark-accent-primary text-sm">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>If the email is registered, an OTP has been sent.</span>
              </div>

              {/* Email hint */}
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center">
                Sending to{' '}
                <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                  {email}
                </span>
              </p>

              {/* OTP boxes */}
              <div>
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-3 text-center">
                  Enter OTP
                </label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-12 text-center text-xl font-bold bg-light-bg-tertiary dark:bg-dark-bg-tertiary border border-light-border-primary dark:border-dark-border-primary rounded-xl text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:border-light-accent-primary dark:focus:border-dark-accent-primary focus:ring-2 focus:ring-light-accent-primary/20 dark:focus:ring-dark-accent-primary/20 transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-600 dark:text-rose-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  'Verifying...'
                ) : (
                  <>
                    Verify OTP
                    <ShieldCheck className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {/* Resend + change email */}
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0}
                  className="text-light-accent-primary dark:text-dark-accent-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                >
                  {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                </button>
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-text-secondary dark:hover:text-dark-text-secondary transition-colors"
                >
                  Change email
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Toggle to password login */}
        {/* <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            disabled
            className="inline-flex items-center cursor-not-allowed gap-2 px-4 py-2 rounded-lg text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary border border-light-border-primary dark:border-dark-border-primary hover:bg-light-bg-elevated dark:hover:bg-dark-bg-elevated transition-all"
          >
            <Lock className="w-4 h-4" />
            Sign in with Password
          </button>
        </div> */}

        <p className="text-center text-sm text-light-text-tertiary dark:text-dark-text-tertiary mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
