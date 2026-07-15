import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot,} from 'lucide-react';
import { Card } from '../Card';
import { sendChatMessage, type ChatMessage, type ChatResponse, type PlotData, type NewsArticle } from '../../api/chatApi';
import { MessageBubble } from './MessageBubble';
import type { IChartApi } from 'lightweight-charts';

// Extend ChatMessage to include full response data
export interface ExtendedChatMessage extends ChatMessage {
  plots?: PlotData[];
  news?: NewsArticle[];
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMessages, setHasMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Store chart refs by message index and plot index
  const chartRefsMap = useRef<Map<string, IChartApi>>(new Map());

  // Cleanup all charts when component unmounts
  useEffect(() => {
    return () => {
      chartRefsMap.current.forEach((chart) => {
        try {
          chart.remove();
        } catch (e) {
          // Chart already disposed
        }
      });
      chartRefsMap.current.clear();
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !hasMessages) {
      inputRef.current?.focus();
    }
  }, [isOpen, hasMessages]);

  const handleSend = async () => {
    if (message.trim() && !isLoading) {
      const userMessage: ExtendedChatMessage = {
        role: 'user',
        content: message.trim(),
        timestamp: new Date(),
      };

      // Add user message immediately
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      setIsLoading(true);
      setHasMessages(true);

      try {
        const response: ChatResponse = await sendChatMessage(userMessage.content);

        // Extract plots from agent_results if not in root plots array
        let allPlots: PlotData[] = response.plots || [];
        
        if (response.agent_results && Array.isArray(response.agent_results)) {
          response.agent_results.forEach(agentResult => {
            if (agentResult.plots && Array.isArray(agentResult.plots)) {
              agentResult.plots.forEach(plot => {
                // Handle nested plot_output structure
                if (typeof plot === 'object' && plot !== null && 'plot_output' in plot) {
                  allPlots.push((plot as { plot_output: PlotData }).plot_output);
                } else {
                  allPlots.push(plot as PlotData);
                }
              });
            }
          });
        }

        // Add assistant response with full data
        const assistantMessage: ExtendedChatMessage = {
          role: 'assistant',
          content: response.final_response,
          timestamp: new Date(),
          plots: allPlots,
          news: response.news || [],
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Failed to send message:', error);
        
        // Add error message
        const errorMessage: ExtendedChatMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determine chat window width based on whether user has sent messages
  const chatWidth = hasMessages ? 'w-[95vw]' : 'lg:w-[400px] w-[95vw]';

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-20 right-6 z-40 ${chatWidth} h-full max-h-[90vh] transition-all duration-500 ease-out animate-slide-up`}>
          <Card className="p-0 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Alumnus AI Assistant</h3>
                  {/* <p className="text-white/80 text-xs">Powered by advanced market intelligence</p> */}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="h-[70vh] bg-light-bg-secondary dark:bg-dark-bg-secondary p-6 overflow-y-auto">
              {messages.length === 0 ? (
                /* Welcome Message */
                <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in">
                  <div>
                    {/* <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary bg-clip-text text-transparent">
                      Alumnus
                    </h1> */}
                    <img src="https://www.alumnux.com/wp-content/uploads/2025/07/Alumnus-Logo.webp" alt="" className='h-8' />
                    <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary tracking-wider uppercase font-medium text-center">
                      Stock Trader
                    </p>
                  </div>
                  
                  <div className="text-center max-w-md">
                    <h3 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
                      Welcome to Alumnus AI
                    </h3>
                    {/* <p className="text-light-text-secondary dark:text-dark-text-secondary">
                      Your intelligent trading companion powered by advanced AI
                    </p> */}
                  </div>

                  {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                    <SuggestionCard
                      icon="📊"
                      title="Stock Analysis"
                      description="Get detailed analysis of any stock"
                      onClick={() => setMessage('Analyze AAPL stock')}
                    />
                    <SuggestionCard
                      icon="📈"
                      title="Compare Stocks"
                      description="Compare multiple stocks side-by-side"
                      onClick={() => setMessage('Compare AAPL and MSFT')}
                    />
                    <SuggestionCard
                      icon="💹"
                      title="Price Charts"
                      description="View historical price movements"
                      onClick={() => setMessage('Show me AAPL price chart for 30 days')}
                    />
                    <SuggestionCard
                      icon="🔔"
                      title="Market Insights"
                      description="Get latest market trends and news"
                      onClick={() => setMessage('What are today\'s market trends?')}
                    />
                  </div> */}
                </div>
              ) : (
                /* Message History */
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <MessageBubble 
                      key={index} 
                      message={msg} 
                      messageIndex={index}
                      chartRefsMap={chartRefsMap}
                    />
                  ))}
                  
                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="flex gap-3 animate-fade-in">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-lg rounded-tl-none p-4">
                          <div className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-light-accent-primary dark:text-dark-accent-primary animate-spin" />
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-light-accent-primary dark:bg-dark-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-light-accent-primary dark:bg-dark-accent-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-light-accent-primary dark:bg-dark-accent-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                              Analyzing your request...
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="bg-light-bg-elevated dark:bg-dark-bg-elevated border-t border-light-border-primary dark:border-dark-border-primary p-4">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about stocks, markets, or trading..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-light-bg-tertiary dark:bg-dark-bg-tertiary border border-light-border-primary dark:border-dark-border-primary rounded-lg text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:border-light-accent-primary dark:focus:border-dark-accent-primary focus:ring-2 focus:ring-light-accent-primary/20 dark:focus:ring-dark-accent-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !message.trim()}
                  className="px-5 py-3 bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-2 text-center">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary text-white rounded-full shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-200 flex items-center justify-center group"
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {/* Notification Dot */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-light-bg-secondary dark:border-dark-bg-primary animate-pulse" />
          </>
        )}
      </button>
    </>
  );
}