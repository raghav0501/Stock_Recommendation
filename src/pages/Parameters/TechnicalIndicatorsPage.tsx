import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
// import { TECHNICAL_PARAMETERS } from '../../config/parameters';
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

  const toggleParameter = (id: string) => {
    if (selectedParameters.includes(id)) {
      onParametersChange(selectedParameters.filter(p => p !== id));
    } else {
      onParametersChange([...selectedParameters, id]);
    }
  };

  // Get display text for sticky button
  const getButtonText = () => {
    if (selectedParameters.length === 0) return '';
    
    const maxDisplay = 4;
    const selectedNames = selectedParameters
      .slice(0, maxDisplay)
      .map(name => technicalParameters.find(p => p.id === name)?.name)
      .filter(Boolean);
    
    let text = selectedNames.join(', ');
    
    if (selectedParameters.length > maxDisplay) {
      text += '...';
    }
    
    return text;
  };

  // const categories = Array.from(new Set(technicalParameters.map(p => p.category)));

  return (
    <div className={`space-y-6 animate-fade-in ${selectedParameters.length > 0 ? 'pb-24' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary mb-2">
            Technical Indicators
          </h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Select indicators to analyze stocks ({selectedParameters.length} selected)
          </p>
        </div>
      </div>

      {/* Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {technicalParameters.map((param) => {
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
                    {/* HIDDEN: Category badge */}
                    {/* <div className="hidden items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary">
                        {param.category}
                      </span>
                    </div> */}
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

      {/* HIDDEN: Category Legend */}
      {/* <div className="hidden flex-wrap gap-3 pt-6 border-t border-light-border-primary dark:border-dark-border-primary">
        <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary font-medium">
          Categories:
        </span>
        {categories.map(category => (
          <span
            key={category}
            className="text-xs px-3 py-1.5 rounded-full bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary border border-light-border-primary dark:border-dark-border-primary"
          >
            {category}
          </span>
        ))}
      </div> */}

      {/* Sticky Bottom Button - Only show when indicators are selected */}
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