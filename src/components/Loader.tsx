import { useEffect, useState } from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
}

export function Loader({ size = 'md', text = 'Loading', fullScreen = false }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  
  // Animate progress for visual interest
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const strokeWidths = {
    sm: 3,
    md: 4,
    lg: 5,
    xl: 6,
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const LoaderSVG = () => (
    <svg 
      className={`${sizeClasses[size]} transform -rotate-90`} 
      viewBox="0 0 100 100"
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id="loaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" className="text-light-accent-primary dark:text-dark-accent-primary" />
          <stop offset="100%" stopColor="currentColor" className="text-light-accent-secondary dark:text-dark-accent-secondary" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Background track */}
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidths[size]}
        className="text-light-bg-tertiary dark:text-dark-bg-tertiary opacity-30"
      />
      
      {/* Animated progress ring */}
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="url(#loaderGradient)"
        strokeWidth={strokeWidths[size]}
        strokeLinecap="round"
        strokeDasharray={`${2 * Math.PI * 40}`}
        strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
        className="transition-all duration-100 ease-linear"
        filter="url(#glow)"
        style={{
          transformOrigin: 'center',
          animation: 'spin 2s linear infinite',
        }}
      />
      
      {/* Inner pulsing dot */}
      <circle
        cx="50"
        cy="50"
        r="8"
        fill="currentColor"
        className="text-light-accent-primary dark:text-dark-accent-primary animate-pulse"
      >
        <animate
          attributeName="r"
          values="6;10;6"
          dur="1.5s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="1;0.5;1"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );

  const content = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <LoaderSVG />
        
        {/* Orbiting particles */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 ${size === 'sm' ? 'w-1 h-1' : 'w-2 h-2'} rounded-full bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary`} />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 ${size === 'sm' ? 'w-1 h-1' : 'w-2 h-2'} rounded-full bg-gradient-to-r from-light-accent-secondary to-light-accent-primary dark:from-dark-accent-secondary dark:to-dark-accent-primary`} />
        </div>
      </div>
      
      {text && (
        <div className="flex flex-col items-center gap-2">
          <span className={`${textSizes[size]} font-medium text-light-text-secondary dark:text-dark-text-secondary tracking-wide`}>
            {text}
          </span>
          
          {/* Animated dots */}
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5'} rounded-full bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary`}
                style={{
                  animation: 'bounce 1s infinite',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-light-bg-primary/80 dark:bg-dark-bg-primary/80 backdrop-blur-sm">
        <div className="p-8 rounded-2xl bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

// Skeleton loader for cards/content
export function SkeletonLoader({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      <div className="h-4 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded w-3/4" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded"
          style={{ width: `${Math.random() * 40 + 40}%` }}
        />
      ))}
    </div>
  );
}

// Shimmer effect loader for tables/lists
export function ShimmerLoader({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-2 pb-2 border-b border-light-border-primary dark:border-dark-border-primary">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 h-6 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-2 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className="flex-1 h-4 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded relative overflow-hidden"
            >
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-light-bg-secondary/50 dark:via-dark-bg-secondary/50 to-transparent -translate-x-full animate-shimmer"
                style={{ animationDelay: `${(rowIndex * columns + colIndex) * 0.1}s` }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Pulse dot loader for inline use
export function PulseLoader({ color = 'primary' }: { color?: 'primary' | 'success' | 'danger' }) {
  const colorClasses = {
    primary: 'bg-light-accent-primary dark:bg-dark-accent-primary',
    success: 'bg-emerald-500',
    danger: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${colorClasses[color]} animate-pulse`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}