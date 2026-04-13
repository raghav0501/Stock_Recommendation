interface SuggestionCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

export function SuggestionCard({ icon, title, description, onClick }: SuggestionCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-4 bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-lg hover:border-light-accent-primary dark:hover:border-dark-accent-primary hover:shadow-lg transition-all text-left group"
    >
      <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
        {icon}
      </span>
      <div className="flex-1">
        <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1 group-hover:text-light-accent-primary dark:group-hover:text-dark-accent-primary transition-colors">
          {title}
        </h4>
        <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
          {description}
        </p>
      </div>
    </button>
  );
}