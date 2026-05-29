const INACTIVE_CLASS = 'bg-transparent border-light-border-primary dark:border-dark-border-primary text-light-text-tertiary dark:text-dark-text-tertiary hover:border-light-text-tertiary dark:hover:border-dark-text-tertiary';

interface FilterChipProps {
  label: string;
  isActive: boolean;
  activeClass: string;
  onClick: () => void;
}

export function FilterChip({ label, isActive, activeClass, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
        isActive ? activeClass : INACTIVE_CLASS
      }`}
    >
      {label}
    </button>
  );
}
