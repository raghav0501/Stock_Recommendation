import { AlertTriangle } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

export function ErrorFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <Card className="py-16 text-center space-y-4 max-w-md mx-auto mt-12">
      <AlertTriangle className="w-10 h-10 mx-auto text-light-accent-warning dark:text-dark-accent-warning opacity-70" />
      <div>
        <h2 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
          Something went wrong
        </h2>
        <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
          This page failed to render. Use the navigation above to go elsewhere, or try again.
        </p>
      </div>
      <Button onClick={resetErrorBoundary} size="sm">
        Try again
      </Button>
    </Card>
  );
}
