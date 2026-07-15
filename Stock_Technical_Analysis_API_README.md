# 📈 Stock Technical Analysis API

Backend API reference for the Alumnus Stock Recommendation Platform. Documents every endpoint consumed by the frontend, grouped by service, with request and response structures.

---

## 🌍 Services & Base URLs

| Service | Env Variable | Purpose |
|---|---|---|
| Main Backend | `VITE_API_BASE_URL` | Stock data, screening, watchlist, alerts, news, chat |
| Middleware | `VITE_MIDDLEWARE_URL` | OTP authentication, backtesting |

### Environment Configuration

Create a `.env` file:

```
VITE_API_BASE_URL=<main-backend-url>
VITE_MIDDLEWARE_URL=<middleware-url>
```

---

## 🔐 Authentication

All Main Backend endpoints (except auth) require a Bearer token:

```
Authorization: Bearer <accessToken>
```

When a response body contains `{ "code": "INVALID_TOKEN" }`, the frontend silently calls the refresh endpoint (single-flight — concurrent requests share one refresh) and retries the original request once. If the retry also fails, the user is force-logged-out.

---

# 📡 Middleware Endpoints

## 1️⃣ POST /api/auth/otp/request

Sends a one-time password to the user's email. Always returns success (does not reveal whether the email is registered).

### Request
```json
{ "email": "user@alumnux.com" }
```

---

## 2️⃣ POST /api/auth/otp/verify

Verifies the OTP and returns the full session payload.

### Request
```json
{ "email": "user@alumnux.com", "otp": "123456" }
```

### Response
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "u_123",
      "name": "Raghav",
      "email": "user@alumnux.com",
      "role": "user",
      "theme": "dark"
    },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "sessionId": "sess_abc",
    "markets": [
      {
        "id": "india",
        "name": "India",
        "fullName": "National Stock Exchange & Bombay Stock Exchange",
        "country": "India",
        "description": "NSE & BSE listed equities"
      }
    ],
    "entitledIndicators": [
      {
        "id": "rsi_14",
        "name": "RSI (14)",
        "description": "Buy when RSI < 30, Sell when RSI > 70",
        "category": "momentum",
        "scale": "oscillator"
      }
    ]
  }
}
```

> `markets` drives the Exchange page; `entitledIndicators` drives which indicators the user can select across the app.

---

## 3️⃣ POST /api/backtest/signalcount

Runs a single-indicator backtest over a date range.

### Request
```json
{
  "exchange": "india",
  "symbol": "RELIANCE.NS",
  "indicator": "rsi_14",
  "date_from": "2025-09-01",
  "date_to": "2026-03-01"
}
```

### Response
```json
{
  "status": "success",
  "data": {
    "exchange": "india",
    "symbol": "RELIANCE.NS",
    "date_from": "2025-09-01",
    "date_to": "2026-03-01",
    "indicator": "rsi_14",
    "bull_count": 7,
    "bear_count": 4,
    "plot_chart_signal": [
      {
        "date": "2025-09-01",
        "signal": 1,
        "open": 2900.5,
        "high": 2950.0,
        "low": 2890.1,
        "close": 2942.3,
        "volume": 4521000,
        "rsi_14": 28.4
      }
    ]
  }
}
```

> `signal`: `1` = buy, `-1` = sell, `0` = none. Each point also carries the indicator value(s) keyed by indicator id (e.g. `rsi_14`, `bb_upper`).

---

# 📡 Main Backend Endpoints

## 4️⃣ POST /api/auth/refresh

Exchanges a refresh token for a new token pair. Called automatically on token expiry.

### Request
```json
{ "refreshToken": "<jwt>" }
```

### Response
```json
{
  "status": "success",
  "data": {
    "accessToken": "<new-jwt>",
    "refreshToken": "<new-jwt>"
  }
}
```

---

## 5️⃣ GET /api/signals

Returns all available technical indicators with descriptions and trading logic.

### Response
```json
{
  "signals": [
    { "name": "sma_20", "description": "Buy when price is 1% above 20-day SMA, Sell when 1% below" },
    { "name": "rsi_14", "description": "Buy when RSI < 30, Sell when RSI > 70" }
  ]
}
```

---

## 6️⃣ GET /api/exchanges

Returns supported stock exchanges.

### Response
```json
{
  "exchanges": [
    { "value": "india", "label": "India" },
    { "value": "us", "label": "US" }
  ]
}
```

---

## 7️⃣ GET /api/indicators/all

Returns the full indicator catalogue with metadata.

### Response
```json
{
  "status": "success",
  "data": {
    "indicators": [
      {
        "id": "rsi_14",
        "name": "RSI (14)",
        "description": "Buy when RSI < 30, Sell when RSI > 70",
        "category": "momentum",
        "scale": "oscillator",
        "isActive": true
      }
    ]
  }
}
```

---

## 8️⃣ GET /api/markets/indices/{exchange}

Returns real-time market indices for the given exchange (`india` | `us`).

### Response
```json
{
  "status": "success",
  "data": {
    "indices": [
      {
        "name": "NIFTY 50",
        "value": 24312.5,
        "change": 152.3,
        "changePercent": 0.63,
        "timestamp": "2026-06-23T10:15:00Z",
        "exchange": "india"
      }
    ]
  }
}
```

---

## 9️⃣ POST /api/screen

Screens stocks based on selected technical indicators. Each filter id maps to an (currently empty) options object.

### Request
```json
{
  "exchange": "india",
  "filters": {
    "rsi_14": {},
    "bbands_20": {}
  }
}
```

### Response
```json
{
  "success": true,
  "data": {
    "exchange": "india",
    "count": 393,
    "buy": [
      {
        "symbol": "AFCONS.NS",
        "latest_price": 320.20,
        "price_change_pct": -0.958
      }
    ],
    "neutral": [],
    "sell": []
  }
}
```

---

## 🔟 POST /api/stock-details

Returns stock metadata, OHLCV history, calculated technicals for the requested indicators, and an AI-generated summary.

### Request
```json
{
  "exchange": "india",
  "symbol": "TATACOMM.NS",
  "indicators": ["rsi_14", "bbands_20"]
}
```

### Response
```json
{
  "success": true,
  "metadata": {
    "company_name": "Tata Communications Limited",
    "sector": "Communication Services",
    "industry": "Telecom Services",
    "description": "Tata Communications Limited provides telecom services worldwide...",
    "website": "https://www.tatacommunications.com",
    "country": "India",
    "employees": 5852
  },
  "ohlcv": [
    {
      "time": "2026-05-18",
      "open": 1991.37,
      "high": 2000.04,
      "low": 1948.01,
      "close": 1965.75,
      "volume": 226556
    }
  ],
  "technicals": [
    {
      "time": "2026-05-18",
      "rsi_14": 42.7,
      "bb_upper": 2050.1,
      "bb_mid": 1980.4,
      "bb_lower": 1910.7
    }
  ],
  "summary": "Tata Communications is currently trading near its 20-day mean..."
}
```

> `technicals` fields vary with the requested `indicators`. Possible keys include: `sma_20`, `sma_50`, `sma_200`, `ema_20`, `ema_50`, `wma_20`, `tema_30`, `kama_30`, `adx_14`, `trix`, `rsi_14`, `macd`, `macd_signal`, `macd_hist`, `stoch_k`, `stoch_d`, `cci_20`, `roc_10`, `mom_10`, `willr_14`, `ultosc`, `apo`, `ppo`, `atr_14`, `natr`, `bb_upper`, `bb_mid`, `bb_lower`, `stddev_20`, `var_20`, `obv`, `adosc`, `mfi_14`, `chaikin`, `ados`.

---

## 1️⃣1️⃣ POST /api/stock-details/stock_snapshot/{exchange}/{symbol}

Returns the latest fundamentals snapshot for a stock.

### Example
```
POST /api/stock-details/stock_snapshot/india/TATACOMM.NS
```

### Response
```json
{
  "exchange": "india",
  "ticker": "TATACOMM.NS",
  "currency": "INR",
  "stock_data": {
    "symbol": "TATACOMM.NS",
    "date": "2026-06-20",
    "open": 1720.0,
    "high": 1745.5,
    "low": 1710.2,
    "close": 1738.9,
    "volume": 412000,
    "avg_volume": 385000,
    "trailing_pe": 31.54,
    "forward_pe": 25.59,
    "market_cap": 485440520192.0,
    "eps": 55.12,
    "high_52w": 2091.0,
    "low_52w": 1291.0,
    "price_to_book": 17.05
  }
}
```

---

## 1️⃣2️⃣ GET /api/stock-details/news/stock/combined/{symbol}

Returns combined RSS + Telegram news for a stock, each with its own AI summary.

### Example
```
GET /api/stock-details/news/stock/combined/TATACOMM.NS
```

### Response
```json
{
  "success": true,
  "ticker": "TATACOMM.NS",
  "rss_news": [
    {
      "news_id": "1508342b584cef680f44b08426298720",
      "title": "Tata Communications expands data centre footprint",
      "url": "https://www.livemint.com/...",
      "source": "LiveMint",
      "published_date": "2026-06-20T07:02:01+00:00",
      "description": "Tata Communications announced...",
      "thumbnail_url": "https://www.livemint.com/lm-img/...",
      "score": 1.0
    }
  ],
  "rss_news_count": 18,
  "rss_summary": "Recent coverage focuses on...",
  "telegram_news": [],
  "telegram_news_count": 0,
  "telegram_summary": "",
  "full_summary": "Overall sentiment is neutral to positive...",
  "error": null
}
```

---

## 1️⃣3️⃣ GET /api/watchlist?exchange={exchange}

Returns the user's portfolio holdings for the given exchange.

### Response
```json
{
  "status": "success",
  "data": {
    "watchlist": [
      {
        "symbol": "RELIANCE.NS",
        "companyName": "Reliance Industries Limited",
        "exchange": "india",
        "addedAt": "2026-05-02T09:30:00Z"
      }
    ]
  }
}
```

---

## 1️⃣4️⃣ POST /api/watchlist

Adds a stock to the user's portfolio.

### Request
```json
{
  "symbol": "RELIANCE.NS",
  "company_name": "Reliance Industries Limited",
  "exchange": "india"
}
```

---

## 1️⃣5️⃣ DELETE /api/watchlist/{symbol}

Removes a stock from the user's portfolio.

### Example
```
DELETE /api/watchlist/RELIANCE.NS
```

---

## 1️⃣6️⃣ GET /api/watchlist/alerts/active?exchange={exchange}

Returns active technical alerts for the user's portfolio holdings. Signal values: `1` = bullish, `-1` = bearish, `0` = no signal.

### Response
```json
{
  "success": true,
  "data": {
    "signals": [
      {
        "symbol": "RELIANCE.NS",
        "company_name": "Reliance Industries Limited",
        "bbands_20": 1,
        "rsi_14": 0,
        "bbands_20_EA": 0,
        "rsi_14_EA": -1,
        "description": "Price closed above the upper Bollinger Band..."
      }
    ],
    "has_holdings": true
  },
  "error": null
}
```

> `bbands_20` / `rsi_14` are confirmed alerts; `bbands_20_EA` / `rsi_14_EA` are early-alert (approaching-threshold) flags. `has_holdings` distinguishes "no alerts" from "empty portfolio".

---

## 1️⃣7️⃣ GET /api/watchlist/alerts/early?exchange={exchange}

Returns stocks in the early-alert zone with 5 sessions of OHLCV + band/RSI data for charting.

### Response
```json
{
  "success": true,
  "data": {
    "signals": [
      {
        "symbol": "RELIANCE.NS",
        "company_name": "Reliance Industries Limited",
        "mcap_top_100": 1,
        "bbands_20_EA": 1,
        "rsi_14_EA": 0,
        "last_5_days": [
          {
            "date": "2026-06-16",
            "open": 2905.0,
            "high": 2952.0,
            "low": 2898.5,
            "close": 2942.3,
            "volume": 4521000,
            "bb_lower": 2860.2,
            "bb_lower_delta": 2874.5,
            "bb_upper": 2980.7,
            "bb_upper_delta": 2966.4,
            "rsi": 61.2,
            "rsi_lower": 30,
            "rsi_lower_delta": 33,
            "rsi_upper": 70,
            "rsi_upper_delta": 67
          }
        ]
      }
    ]
  },
  "error": null
}
```

> `*_delta` fields are the early-alert zone boundaries (rendered as dashed lines). `mcap_top_100`: `1` if the stock is in the top 100 by market cap.

---

## 1️⃣8️⃣ POST /api/chat/respond

Sends a message to the AI chatbot. `session_id` maintains conversation memory across messages.

### Request
```json
{
  "message": "Show me RELIANCE price chart for 30 days",
  "session_id": "user_k3j2h1g4f5"
}
```

### Response
```json
{
  "query": "Show me RELIANCE price chart for 30 days",
  "classification": {
    "action": "plot",
    "response": null
  },
  "plan": {},
  "agent_big_results": {},
  "agent_results": [
    {
      "agent": "plot_agent",
      "success": true,
      "strings": [],
      "plots": [
        {
          "tool": "ohlcv_plot",
          "plot_output": {
            "type": "ohlcv",
            "start_date": "2026-05-23",
            "end_date": "2026-06-23",
            "data": {
              "market": "india",
              "symbols": "RELIANCE.NS",
              "ohlcv_data": {
                "RELIANCE.NS": [
                  {
                    "date": "2026-05-23",
                    "open": 2905.0,
                    "high": 2952.0,
                    "low": 2898.5,
                    "close": 2942.3,
                    "volume": 4521000
                  }
                ]
              }
            }
          }
        }
      ],
      "plan": {}
    }
  ],
  "final_response": "Here is the 30-day price chart for RELIANCE...",
  "plots": [],
  "news": [
    {
      "title": "Reliance announces...",
      "url": "https://...",
      "source": "LiveMint",
      "publishedDate": "2026-06-22T08:00:00Z",
      "summary": "..."
    }
  ],
  "memory": {
    "used": true,
    "conversation_history": [
      { "user": "previous question", "assistant": "previous answer" }
    ],
    "recent_context": null,
    "history_length": 1
  }
}
```

> `plots[].type` can be `ohlcv`, `returns`, `chart_with_indicators`, or `chart_with_backtest_results` — each with a different `data` shape. Plots may appear at the root `plots` array or nested inside `agent_results[].plots[].plot_output`; the frontend merges both.

---

# 📊 Endpoint Summary

| # | Method | Endpoint | Service | Used By |
|---|---|---|---|---|
| 1 | POST | `/api/auth/otp/request` | Middleware | OTP Login |
| 2 | POST | `/api/auth/otp/verify` | Middleware | OTP Login |
| 3 | POST | `/api/backtest/signalcount` | Middleware | Backtest page |
| 4 | POST | `/api/auth/refresh` | Main | Silent token refresh |
| 5 | GET | `/api/signals` | Main | Indicator catalogue |
| 6 | GET | `/api/exchanges` | Main | Exchange list |
| 7 | GET | `/api/indicators/all` | Main | Indicator catalogue |
| 8 | GET | `/api/markets/indices/{exchange}` | Main | Market overview |
| 9 | POST | `/api/screen` | Main | Stock screener |
| 10 | POST | `/api/stock-details` | Main | Stock detail page |
| 11 | POST | `/api/stock-details/stock_snapshot/{exchange}/{symbol}` | Main | Stock detail fundamentals |
| 12 | GET | `/api/stock-details/news/stock/combined/{symbol}` | Main | Stock detail news |
| 13 | GET | `/api/watchlist?exchange=` | Main | Portfolio page |
| 14 | POST | `/api/watchlist` | Main | Add to portfolio |
| 15 | DELETE | `/api/watchlist/{symbol}` | Main | Remove from portfolio |
| 16 | GET | `/api/watchlist/alerts/active?exchange=` | Main | Alerts page |
| 17 | GET | `/api/watchlist/alerts/early?exchange=` | Main | Early Alert page |
| 18 | POST | `/api/chat/respond` | Main | AI Chatbot |
