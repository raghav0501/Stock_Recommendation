import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import type { StockSummary } from '../../models/Stock';
import { getFilteredStocks } from '../../api/stockApi';
import { useToast } from '../../components/Toast';
import { toastMessage } from '../../utils/errorMessage';
import { TECHNICAL_PARAMETERS } from '../../config/parameters';
import { Button } from '../../components/Button';
import { SimpleView } from './components/SimpleView';
import { Loader } from '../../components/Loader';

interface StocksPageProps {
  parameters: string[];
  onParametersChange: (params: string[]) => void;
}

// type ViewMode = 'simple' | 'advanced';

export function StocksPage({ parameters, onParametersChange }: StocksPageProps) {
  const { showToast } = useToast();
  const [stocks, setStocks] = useState<StockSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const viewMode = 'simple';
  const [showParameterDropdown, setShowParameterDropdown] = useState(false);
  const [tempParameters, setTempParameters] = useState<string[]>(parameters);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadStocks();
  }, [parameters]);

  useEffect(() => {
    // Reset temp parameters when actual parameters change
    setTempParameters(parameters);
    setHasChanges(false);
  }, [parameters]);

  const loadStocks = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const data = await getFilteredStocks(parameters);
      setStocks(data);
    } catch (err) {
      showToast(toastMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleTempParameter = (paramId: string) => {
    const newParams = tempParameters.includes(paramId)
      ? tempParameters.filter(p => p !== paramId)
      : [...tempParameters, paramId];
    
    setTempParameters(newParams);
    setHasChanges(JSON.stringify(newParams.sort()) !== JSON.stringify(parameters.sort()));
  };

  const applyParameterChanges = () => {
    onParametersChange(tempParameters);
    setShowParameterDropdown(false);
    setHasChanges(false);
  };

  // if (loading) {
  //   return (
  //     // <div className="flex items-center justify-center h-64">
  //     //   <div className="text-light-text-secondary dark:text-dark-text-secondary">Loading stocks...</div>
  //     // </div>
  //     <Loader size="sm" text="Loading stocks..." fullScreen />
  //   );
  // }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary mb-2">
            Stock Analysis
          </h2>
          <div className="flex items-center gap-3 text-light-text-secondary dark:text-dark-text-secondary">
            <span>Based on:</span>
            
            {/* Selected Indicators Display */}
            <div className="flex flex-wrap items-center gap-2">
              {parameters.length === 0 ? (
                <span className="text-sm italic text-light-text-tertiary dark:text-dark-text-tertiary">
                  No indicators selected
                </span>
              ) : (
                parameters.map(paramId => {
                  const param = TECHNICAL_PARAMETERS.find(p => p.id === paramId);
                  return param ? (
                    <span 
                      key={paramId}
                      className="px-2 py-1 bg-light-bg-tertiary dark:bg-dark-bg-tertiary border border-light-border-primary dark:border-dark-border-primary rounded text-xs font-medium"
                    >
                      {param.name}
                    </span>
                  ) : null;
                })
              )}
              {/* {parameters.length > 3 && (
                <span className="px-2 py-1 bg-light-bg-tertiary dark:bg-dark-bg-tertiary border border-light-border-primary dark:border-dark-border-primary rounded text-xs font-medium">
                  +{parameters.length - 3} more
                </span>
              )} */}
            </div>
            
            {/* Settings Wheel Icon with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowParameterDropdown(!showParameterDropdown)}
                className="p-2 rounded-lg bg-light-bg-tertiary dark:bg-dark-bg-tertiary border border-light-border-primary dark:border-dark-border-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors"
                title="Change indicators"
              >
                <Settings className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
              </button>

              {showParameterDropdown && (
                <div className="absolute top-full left-0 mt-2 w-96 max-h-[500px] bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-lg shadow-2xl z-20">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                        Select Technical Indicators
                      </h3>
                      {/* {hasChanges && ( */}
                        <Button
                          onClick={applyParameterChanges}
                          size="sm"
                          className={`ml-auto ${hasChanges ? '': 'cursor-not-allowed border'}`}
                          variant={hasChanges ? 'primary' : 'ghost'}
                        >
                          GO
                        </Button>
                      {/* )} */}
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {TECHNICAL_PARAMETERS.map(param => (
                        <label key={param.id} className="flex items-start gap-3 border-b cursor-pointer hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary p-2 rounded transition-colors">
                          <input
                            type="checkbox"
                            checked={tempParameters.includes(param.id)}
                            onChange={() => toggleTempParameter(param.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                              {param.name}
                            </div>
                            {/* <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                              {param.description}
                            </div> */}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        {/* <div className="flex items-center gap-2 bg-light-bg-tertiary dark:bg-dark-bg-tertiary p-1 rounded-lg border border-light-border-primary dark:border-dark-border-primary">
          <button
            onClick={() => setViewMode('simple')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${
              viewMode === 'simple'
                ? 'bg-light-bg-elevated dark:bg-dark-bg-elevated text-light-text-primary dark:text-dark-text-primary shadow-sm'
                : 'text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-text-primary dark:hover:text-dark-text-primary'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Simple</span>
          </button>
          
          <button
            // onClick={() => setViewMode('advanced')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all cursor-not-allowed ${
              viewMode === 'advanced'
                ? 'bg-light-bg-elevated dark:bg-dark-bg-elevated text-light-text-primary dark:text-dark-text-primary shadow-sm'
                : 'text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-text-primary dark:hover:text-dark-text-primary'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            <span>Advanced</span>
          </button>
        </div> */}
      </div>

      {/* View Content */}
      {loading ? (
        <Loader size="md" text="Loading stocks..." />
      ) : viewMode === 'simple' ? (
        <SimpleView stocks={stocks} />
      ) : (
        // <AdvancedView stocks={stocks} parameters={parameters} />
        <></>
      )
      }
      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-light-accent-warning/10 dark:bg-dark-accent-warning/10 border border-light-accent-warning/30 dark:border-dark-accent-warning/30 rounded-xl">
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          <strong className="text-light-accent-warning dark:text-dark-accent-warning">Disclaimer:</strong> The market sentiment displayed is based on technical indicators and is for informational purposes only. This is not financial advice. We do not recommend buying or selling any securities. Please consult with a qualified financial advisor before making investment decisions.
        </p>
      </div>
    </div>
  );
}