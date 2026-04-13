import { type ReactNode, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface DropdownProps {
  trigger?: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
  maxHeight?: string;
  className?: string;
  closeOnClick?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showCloseButton?: boolean;
  title?: string;
}

export function Dropdown({
  trigger,
  children,
  align = 'left',
  width = 'w-80',
  maxHeight = 'max-h-96',
  className = '',
  closeOnClick = true,
  isOpen: controlledIsOpen,
  onOpenChange,
  showCloseButton = false,
  title,
}: DropdownProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use controlled or internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, setIsOpen]);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  const handleContentClick = () => {
    if (closeOnClick) {
      setIsOpen(false);
    }
  };

  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      {trigger && (
        <div onClick={handleTriggerClick} className="cursor-pointer">
          {trigger}
        </div>
      )}

      {/* Dropdown Content */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 ${alignmentClasses[align]} ${width} bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-lg shadow-2xl z-50 animate-fade-in ${className}`}
        >
          {/* Header with title and close button */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-light-border-primary dark:border-dark-border-primary">
              {title && (
                <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary rounded transition-colors ml-auto"
                >
                  <X className="w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div
            className={`${maxHeight} overflow-y-auto`}
            onClick={handleContentClick}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// Dropdown Item component for consistent styling
interface DropdownItemProps {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  className?: string;
}

export function DropdownItem({ icon, children, onClick, variant = 'default', className = '' }: DropdownItemProps) {
  const variantClasses = {
    default: 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary hover:text-light-text-primary dark:hover:text-dark-text-primary',
    danger: 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
    </button>
  );
}

// Dropdown Divider
export function DropdownDivider() {
  return <div className="my-1 border-t border-light-border-primary dark:border-dark-border-primary" />;
}

// Dropdown Section with padding for custom content
interface DropdownSectionProps {
  children: ReactNode;
  className?: string;
}

export function DropdownSection({ children, className = '' }: DropdownSectionProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}