import type { IChartApi } from "lightweight-charts";
import { Bot } from "lucide-react";
import Markdown from "markdown-to-jsx";
import type { ExtendedChatMessage } from "./ChatBot";
import { NewsCard } from "./NewsCard";
import { PlotChart } from "./PlotChart";

interface MessageBubbleProps {
  message: ExtendedChatMessage;
  messageIndex: number;
  chartRefsMap: React.MutableRefObject<Map<string, IChartApi>>;
}

export function MessageBubble({ message, messageIndex, chartRefsMap }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const cleanedMarkdown = (message.content || '')
  .replace(/\t\*/g, '*');

  if (isUser) {
    return (
      <div className="flex gap-3 flex-row-reverse animate-fade-in">
        <div className="flex-1 flex justify-end">
          <div className="inline-block max-w-[80%] bg-gradient-to-r from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary text-white rounded-lg rounded-tr-none p-4">
            <p className="text-sm">{message.content}</p>
            <p className="text-xs mt-2 text-white/70">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message with structured layout
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-light-accent-primary to-light-accent-secondary dark:from-dark-accent-primary dark:to-dark-accent-secondary flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      
      <div className="flex-1 space-y-4">
        {/* Text Response with Markdown */}
        <div className="bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-lg rounded-tl-none p-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown
              options={{
                overrides: {
                  table: {
                    component: ({ children }) => (
                      <div className="overflow-x-auto my-3 rounded-lg border border-light-border-primary dark:border-dark-border-primary">
                        <table className="min-w-full text-sm border-collapse">
                          {children}
                        </table>
                      </div>
                    ),
                  },
                  thead: {
                    component: ({ children }) => (
                      <thead className="bg-light-bg-tertiary dark:bg-dark-bg-tertiary">
                        {children}
                      </thead>
                    ),
                  },
                  th: { 
                    component: ({ children }) => (
                      <th className="px-4 py-3 text-left font-semibold text-light-text-primary dark:text-dark-text-primary border-b border-light-border-primary dark:border-dark-border-primary">
                        {children}
                      </th>
                    )
                  },
                  td: { 
                    component: ({ children }) => (
                      <td className="px-4 py-3 text-light-text-secondary dark:text-dark-text-secondary border-b border-light-border-primary dark:border-dark-border-primary last:border-b-0">
                        {children}
                      </td>
                    )
                  },
                  tr: { 
                    component: ({ children }) => (
                      <tr className="hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors">
                        {children}
                      </tr>
                    )
                  },
                  p: { 
                    component: ({ children }) => (
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3 last:mb-0 leading-relaxed">
                        {children}
                      </p>
                    )
                  },
                  ul: { 
                    component: ({ children }) => (
                      <ul className="text-sm text-light-text-secondary dark:text-dark-text-secondary list-disc pl-5 mb-3 space-y-1">
                        {children}
                      </ul>
                    )
                  },
                },
              }}
            >
              {cleanedMarkdown}
            </Markdown>
          </div>
          <p className="text-xs mt-3 text-light-text-tertiary dark:text-dark-text-tertiary">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Plots Section */}
        {message.plots && message.plots.length > 0 && (
          <div className="">
            {/* <h4 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-light-accent-primary dark:text-dark-accent-primary" />
              Charts & Analysis
            </h4> */}
            <div className="grid grid-cols-1 gap-4">
              {message.plots.map((plot, plotIndex) => (
                <PlotChart 
                  key={`${messageIndex}-${plotIndex}`}
                  plot={plot} 
                  messageIndex={messageIndex}
                  plotIndex={plotIndex}
                  chartRefsMap={chartRefsMap}
                />
              ))}
            </div>
          </div>
        )}

        {/* News Section */}
        {message.news && message.news.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-[10px] text-white">N</span>
              Related News
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {message.news.map((article, idx) => (
                <NewsCard key={idx} article={article} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}