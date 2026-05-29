import { Card } from './Card';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Card className="py-16 text-center space-y-3">
      {icon}
      <div>
        <p className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
          {title}
        </p>
        {description && (
          <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
            {description}
          </p>
        )}
      </div>
    </Card>
  );
}
