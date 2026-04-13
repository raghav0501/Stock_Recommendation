import { ExternalLink } from "lucide-react";
import type { NewsArticle } from "../../api/chatApi";

// News Card Component
export function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 bg-light-bg-elevated dark:bg-dark-bg-elevated border border-light-border-primary dark:border-dark-border-primary rounded-lg hover:border-light-accent-primary dark:hover:border-dark-accent-primary hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary group-hover:text-light-accent-primary dark:group-hover:text-dark-accent-primary transition-colors line-clamp-2 mb-1">
            {article.title}
          </h5>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary line-clamp-2 mb-2">
            {article.summary}
          </p>
          <div className="flex items-center gap-2 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
            <span className="font-medium text-light-accent-primary dark:text-dark-accent-primary">
              {article.source}
            </span>
            <span>•</span>
            <span>{new Date(article.publishedDate).toLocaleDateString()}</span>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary flex-shrink-0 group-hover:text-light-accent-primary dark:group-hover:text-dark-accent-primary transition-colors" />
      </div>
    </a>
  );
}