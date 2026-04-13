import { useState, useRef, useEffect, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipWidth = 320; // max-width from className
      const tooltipHeight = 100; // approximate
      
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - tooltipHeight - 12;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + 12;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - 12;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + 12;
          break;
      }

      // Keep tooltip within viewport
      const padding = 16;
      if (left < padding) left = padding;
      if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding;
      }
      if (top < padding) top = rect.bottom + 12; // Flip to bottom if no space on top

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <>
          {/* Tooltip */}
          <div
            className="fixed z-50 animate-fade-in"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
            }}
          >
            <div className="bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-xl shadow-card-hover p-4 max-w-[320px]">
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
                {content}
              </p>
            </div>
          </div>
          
          {/* Arrow */}
          <div
            className="fixed z-50"
            style={{
              top: position === 'top' 
                ? `${tooltipPosition.top + 100}px` 
                : position === 'bottom'
                ? `${tooltipPosition.top - 8}px`
                : `${tooltipPosition.top + 50}px`,
              left: position === 'top' || position === 'bottom'
                ? `${tooltipPosition.left + 160 - 6}px`
                : position === 'left'
                ? `${tooltipPosition.left + 320}px`
                : `${tooltipPosition.left - 8}px`,
            }}
          >
            <div
              className={`w-3 h-3 bg-light-bg-elevated dark:bg-dark-bg-elevated border-light-border-primary dark:border-dark-border-primary transform rotate-45 ${
                position === 'top' ? 'border-b border-r' :
                position === 'bottom' ? 'border-t border-l' :
                position === 'left' ? 'border-t border-r' :
                'border-t border-l'
              }`}
            />
          </div>
        </>
      )}
    </div>
  );
}