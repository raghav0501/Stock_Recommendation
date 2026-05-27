import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Tooltip } from '../../components/Tooltip';
import type { TechnicalParameter } from '../../models/Market';

interface TechnicalIndicatorsPageProps {
  technicalParameters: TechnicalParameter[];
  selectedParameters: string[];
  onParametersChange: (params: string[]) => void;
}

export function TechnicalIndicatorsPage({
  technicalParameters,
  selectedParameters,
  onParametersChange,
}: TechnicalIndicatorsPageProps) {
  const navigate = useNavigate();

  // Separate MCap filters from regular indicators
  const mcapFilters = technicalParameters.filter(p => p.category === 'Strategy');
  const regularIndicators = technicalParameters.filter(p => !(p.category === 'Strategy'));

  const toggleParameter = (id: string) => {
    if (selectedParameters.includes(id)) {
      onParametersChange(selectedParameters.filter(p => p !== id));
    } else {
      onParametersChange([...selectedParameters, id]);
    }
  };

  const toggleMcap = (id: string) => {
    // Mutually exclusive: deselect any other active mcap, then toggle this one
    const withoutAnyMcap = selectedParameters.filter(p => !p.startsWith('mcap_'));
    if (selectedParameters.includes(id)) {
      // Already active — deselect it
      onParametersChange(withoutAnyMcap);
    } else {
      // Select this one, deselecting others
      onParametersChange([...withoutAnyMcap, id]);
    }
  };

  const getButtonText = () => {
    if (selectedParameters.length === 0) return '';
    const maxDisplay = 4;
    const selectedNames = selectedParameters
      .slice(0, maxDisplay)
      .map(name => technicalParameters.find(p => p.id === name)?.name)
      .filter(Boolean);
    let text = selectedNames.join(', ');
    if (selectedParameters.length > maxDisplay) text += '...';
    return text;
  };

  return (
    <div className={`space-y-6 animate-fade-in ${selectedParameters.length > 0 ? 'pb-24' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary mb-2">
            Technical Indicators
          </h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Select indicators to analyze stocks ({selectedParameters.length} selected)
          </p>
        </div>

        {/* MCap filter pills */}
        {mcapFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary mr-1">
              Filter by:
            </span>
            {mcapFilters.map(filter => {
              const isActive = selectedParameters.includes(filter.id);
              return (
                <Tooltip key={filter.id} content={filter.description} position="bottom">
                  <button
                    onClick={() => toggleMcap(filter.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 dark:text-amber-400'
                        : 'bg-transparent border-light-border-primary dark:border-dark-border-primary text-light-text-secondary dark:text-dark-text-secondary hover:border-light-text-tertiary dark:hover:border-dark-text-tertiary'
                    }`}
                  >
                    {isActive && <Check className="w-3.5 h-3.5" />}
                    {filter.name}
                  </button>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>

      {/* Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {regularIndicators.map((param) => {
          const isSelected = selectedParameters.includes(param.id);

          return (
            <Tooltip key={param.id} content={param.description} position="top">
              <Card
                hover
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-light-accent-primary dark:ring-dark-accent-primary bg-light-accent-primary/5 dark:bg-dark-accent-primary/5'
                    : ''
                }`}
                onClick={() => toggleParameter(param.id)}
              >
                <div className="flex items-start justify-between my-1">
                  <div className="flex-1">
                    <h3 className="text-light-text-primary dark:text-dark-text-primary font-semibold">
                      {param.name}
                    </h3>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-gradient-to-br from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary border-light-accent-primary dark:border-dark-accent-primary'
                        : 'border-light-border-secondary dark:border-dark-border-secondary'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </Card>
            </Tooltip>
          );
        })}
      </div>

      {/* Sticky Bottom Button */}
      {selectedParameters.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-sm py-4 px-4 animate-slide-up">
          <div className="container mx-auto max-w-7xl">
            <Button
              onClick={() => navigate('/stocks')}
              size="lg"
              className="w-full"
            >
              <div className="flex flex-col items-start gap-1 w-full">
                <div className="flex items-center gap-2 w-full justify-center">
                  <span className="font-bold">GO </span>
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold opacity-90 truncate w-full text-center">
                  {getButtonText()}
                </div>
              </div>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
