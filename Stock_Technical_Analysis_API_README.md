# 📈 Stock Technical Analysis API

A FastAPI-based backend service for Indian and US stock market analysis with technical indicators, stock screening, and company market data APIs.

---

## 🌍 Base URL

https://demo2-664110982097.us-central1.run.app

---

## 🚀 Overview

This API provides:

- 20+ Technical Indicators (SMA, EMA, RSI, MACD, Bollinger Bands, etc.)
- Advanced Stock Screening with multi-filter support
- Company Metadata with OHLCV historical data
- Real-time Market Data integration
- Pre-calculated technical indicators using TA-Lib

---

# 📡 API Endpoints

## 1️⃣ GET /api/signals

Returns all available technical indicators with descriptions and trading logic.

### Response Example
```json
{
  "signals": [
    {
      "name": "sma_20",
      "description": "Buy when price is 1% above 20-day SMA, Sell when 1% below"
    },
    {
      "name": "rsi_14",
      "description": "Buy when RSI < 30, Sell when RSI > 70"
    },
    ...
  ]
}
```

---

## 2️⃣ GET /api/exchanges

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

## 3️⃣ POST /api/screen

Filters stocks based on selected technical indicators.

### Request Example
```json
{
  "exchange": "india",
  "filters": ["rsi_14", "bbands_20"]
}
```

### Response Example
```json
{
  "success": true,
  "data": {
    "exchange": "india",
    "count": 393,
    "buy": [
      {
          "symbol": "AFCONS.NS",
          "latest_price": 320.20001220703125,
          "price_change_pct": -0.9588542230080837
      },
      ...
    ],
    "neutral":[...],
    "sell":[...]
  }
}
```

---

## 4️⃣ POST /api/stock-details

Returns stock metadata, OHLCV data, and calculated technical indicators.

### Request Example
```json
{
  "exchange": "india",
  "symbol": "TATACOMM.NS"
}
```

### Response Example
```json
{
  "success": true,
    "metadata": {
        "name": "Tata Communications Limited",
        "sector": "Communication Services",
        "industry": "Telecom Services",
        "description": "Tata Communications Limited provides telecom services worldwide. The company operates ...",
        "website": "https://www.tatacommunications.com",
        "country": "India",
        "employees": 5852
    },
    "ohlcv": [
        {
            "time": "2024-09-18",
            "open": 1991.372706987314,
            "high": 2000.0433206472856,
            "low": 1948.019879237148,
            "close": 1965.755126953125,
            "volume": 226556
        },
        {
            "time": "2024-09-19",
            "open": 1970.5831095351853,
            "high": 1999.1072519357679,
            "low": 1919.3479486872704,
            "close": 1946.1971435546875,
            "volume": 501366
        },
        ...
    ],
    "technicals": [
      {
          "time": "2024-09-10",
          "sma_20": null,
          "sma_50": null,
          "sma_200": null,
          "ema_20": null,
          "ema_50": null,
          "wma_20": null,
          "tema_30": null,
          "kama_30": null,
          "adx_14": null,
          "trix": null,
          "rsi_14": null,
          "macd": null,
          "macd_signal": null,
          "macd_hist": null,
          "stoch_k": null,
          "stoch_d": null,
          "cci_20": null,
          "roc_10": null,
          "mom_10": null,
          "willr_14": null,
          "ultosc": null,
          "apo": null,
          "ppo": null,
          "atr_14": null,
          "natr": null,
          "bb_upper": null,
          "bb_mid": null,
          "bb_lower": null,
          "stddev_20": null,
          "var_20": null,
          "obv": 1071168.0,
          "adosc": null,
          "mfi_14": null,
          "chaikin": null,
          "ados": 825928.2816611822
      },
      ...
    ],
    "fundamentals": {
        "profitability": [
          {
              "date": "2025-06-30",
              "Net Income": 1899800000.0,
              "Total Revenue": 59598500000.0,
              "Operating Income": 4711200000.0,
              "Gross Profit": 32307800000.0,
              "EBITDA": 11334700000.0,
              "EBIT": 4677800000.0
          },
          ...
        ],
        "valuation": [
          {
              "date": "2026-02-11",
              "P/E Ratio": 31.548435,
              "Forward P/E": 25.598349,
              "P/B Ratio": 17.054317,
              "Market Cap": 485440520192.0
          },
          ...
        ],
        "financial_health": [
          {
              "date": "2025-03-31",
              "Total Assets": 265845800000.0,
              "Total Debt": 123573200000.0,
              "Stockholders Equity": 30211700000.0,
              "Current Assets": 72386800000.0,
              "Current Liabilities": 125039100000.0,
              "Cash & Equivalents": 5339000000.0,
              "Working Capital": -52652300000.0
          },
          ...
        ]
    }
}
```

---

## 4️⃣ POST /api/news/stock

Returns company metadata, OHLCV data, and calculated technical indicators.

### Example URL
```json
https://demo2-664110982097.us-central1.run.app/api/news/stock/TATACOMM.NS
```

### Response Example
```json
{
  "success": true,
  "ticker": "TATACOMM.NS",
  "stock_metadata": {
      "company_name": "Tata Communications Limited",
      "sector": "Communication Services",
      "industry": "Telecom Services",
      "exchange": "NSI",
      "market_region": "India"
  },
  "news": [
      {
          "news_id": "1508342b584cef680f44b08426298720",
          "title": "For Tata Power, Mundra remains the Achilles’s heel, overshadowing other segments",
          "url": "https://www.livemint.com/market/mark-to-market/tata-power-q3-earnings-tata-power-share-price-mundra-power-plant-11770357973356.html",
          "source": "LiveMint",
          "published_date": "2026-02-06T07:02:01+00:00",
          "description": "Tata Power’s shares have stayed largely flat over the past year, dragged down by Mundra’s underperformance.",
          "thumbnail_url": "https://www.livemint.com/lm-img/img/2026/02/06/1600x900/logo/2-0-784179017-tatapower-0_1680408594471_1770361021788.JPG",
          "score": 1.0,
          "rrf_formula": null
      },
      ...
  ],
  "news_count": 28,
  "queries_used": [
      "Company: Tata Communications Limited (fulltext)",
      "Ticker: TATACOMM (fulltext)",
      "Short name: Tata (fulltext)",
      "Industry: Telecom Services India (hybrid+fulltext)",
      "Sector: Communication Services India (hybrid+fulltext)",
      "Ticker: TATACOMM.NS (hybrid)"
  ],
  "search_strategy": {
    "order": "Company → Industry (priority) → Sector → Ticker Hybrid → Market",
    "priority": "Industry context prioritized over sector for better relevance"
  }
}
```
---


# 🛠 Environment Configuration

Create a .env file:

```
VITE_GET_SIGNALS=https://demo2-664110982097.us-central1.run.app/api/signals
VITE_GET_EXCHANGES=https://demo2-664110982097.us-central1.run.app/api/exchanges
VITE_GET_FILTER_STOCKS=https://demo2-664110982097.us-central1.run.app/api/screen
VITE_GET_STOCK_DETAILS=https://demo2-664110982097.us-central1.run.app/api/stock-details
VITE_GET_STOCK_NEWS=https://demo2-664110982097.us-central1.run.app/api/news/stock
```

---