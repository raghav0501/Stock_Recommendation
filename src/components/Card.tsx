import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      className={`
        bg-light-bg-elevated dark:bg-dark-bg-elevated
        border border-light-border-primary dark:border-dark-border-primary
        rounded-xl p-3 shadow-card
        ${hover ? 'hover:shadow-card-hover transition-shadow duration-200' : 'shadow-card'}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}