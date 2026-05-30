/**
 * Chat API Service
 * Handles communication with the chatbot backend and Firebase storage
 */

import { saveChatMessage } from './firebaseService';
import { STORAGE_KEYS } from '../constants/storage';

const API_BASE_URL = 'https://demo2-664110982097.us-central1.run.app';

// Generate a unique session ID for the user
const generateSessionId = (): string => {
  const stored = localStorage.getItem(STORAGE_KEYS.CHAT_SESSION);
  if (stored) return stored;
  
  const newId = `user_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem(STORAGE_KEYS.CHAT_SESSION, newId);
  return newId;
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// New unified plot schema matching backend changes
export interface PlotData {
  type: 'ohlcv' | 'returns' | 'chart_with_indicators' | 'chart_with_backtest_results';
  start_date: string;
  end_date: string;
  data: {
    market?: string;
    symbols?: string | string[];
    symbol?: string;
    // OHLCV type data
    ohlcv_data?: {
      [symbol: string]: Array<{
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }>;
    };
    // Returns type data
    return_type?: string;
    returns_data?: Array<{
      date: string;
      price: number;
      return?: number;
    }>;
    total_return?: number;
    // Chart with indicators type data
    ohlcv?: Array<{
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
    overlays?: any[];
    windows?: any[];
    // Backtest type data
    indicators?: any;
    'Backtest Data'?: any[];
  };
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedDate: string;
  summary: string;
}

export interface ChatResponse {
  query: string;
  classification: {
    action: string;
    response?: string;
  };
  plan: any;
  agent_big_results: any;
  agent_results: Array<{
    agent: string;
    success: boolean;
    strings: string[];
    plots: Array<{
      tool?: string;
      plot_output?: PlotData;
    } | PlotData>;
    plan: any;
  }> | null;
  final_response: string;
  plots: PlotData[];
  news: NewsArticle[];
  memory: {
    used: boolean;
    conversation_history: Array<{
      user: string;
      assistant: string;
    }>;
    recent_context: string | null;
    history_length: number;
  };
}

/**
 * Send a message to the chatbot and save to Firebase
 */
export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const sessionId = generateSessionId();
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat API Error: ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    const responseTime = Date.now() - startTime;

    // Save to Firebase (non-blocking)
    saveChatMessage(
      sessionId,
      message,
      data,
      {
        classification: data.classification.action,
        action: data.classification.action,
        hasPlots: (data.plots?.length || 0) > 0,
        hasNews: (data.news?.length || 0) > 0,
        responseTime,
      }
    ).catch(error => {
      // Log error but don't fail the request
      console.error('Failed to save message to Firebase:', error);
    });

    return data;
  } catch (error) {
    console.error('Chat API Error:', error);
    throw error;
  }
}

/**
 * Get current session ID
 */
export function getCurrentSessionId(): string {
  return generateSessionId();
}

/**
 * Clear chat history (localStorage only)
 */
export function clearChatSession(): void {
  localStorage.removeItem(STORAGE_KEYS.CHAT_SESSION);
}

export default {
  sendChatMessage,
  clearChatSession,
  generateSessionId,
  getCurrentSessionId,
};