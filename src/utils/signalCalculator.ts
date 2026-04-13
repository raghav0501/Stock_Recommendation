import type { MarketSentiment, TechnicalIndicators } from "../models/Stock";

/**
 * Calculate market sentiment based on selected technical indicators
 * Returns sentiment analysis based on weighted scoring of indicators
 */
export function calculateSentiment(
  indicators: TechnicalIndicators,
  selectedParameters: string[]
): MarketSentiment {
  if (selectedParameters.length === 0) {
    return 'neutral';
  }

  let score = 0;
  let totalWeight = 0;

  selectedParameters.forEach(param => {
    const weight = 1;
    totalWeight += weight;

    switch (param) {
      case 'bollinger':
        if (indicators.bollinger) {
          // Below lower band = bullish, above upper band = bearish
          if (indicators.bollinger.position < 0.3) score += weight;
          else if (indicators.bollinger.position > 0.7) score -= weight;
        }
        break;

      case 'rsi_14':
        if (indicators.rsi_14 !== undefined) {
          // RSI < 30 = oversold (bullish), RSI > 70 = overbought (bearish)
          if (indicators.rsi_14 < 30) score += weight;
          else if (indicators.rsi_14 > 70) score -= weight;
          else if (indicators.rsi_14 > 40 && indicators.rsi_14 < 60) score += weight * 0.3;
        }
        break;

      case 'sma_20':
      case 'sma_50':
      case 'sma_200':
      case 'ema_20':
      case 'ema_50':
      case 'ema_200':
        // Price above MA = bullish, below = bearish
        const maValue = indicators[param];
        if (maValue !== undefined && indicators.currentPrice) {
          if (indicators.currentPrice > maValue) score += weight * 0.5;
          else score -= weight * 0.3;
        }
        break;

      case 'mom_osc':
      case 'mom_10':
        if (indicators[param] !== undefined) {
          // Positive momentum = bullish
          if (indicators[param] > 0) score += weight * 0.6;
          else score -= weight * 0.4;
        }
        break;

      case 'cci_20':
        if (indicators.cci_20 !== undefined) {
          // CCI > 100 = overbought, < -100 = oversold
          if (indicators.cci_20 < -100) score += weight;
          else if (indicators.cci_20 > 100) score -= weight;
        }
        break;

      case 'mfi_14':
        if (indicators.mfi_14 !== undefined) {
          // Similar to RSI but volume-weighted
          if (indicators.mfi_14 < 20) score += weight;
          else if (indicators.mfi_14 > 80) score -= weight;
        }
        break;

      case 'willr_14':
        if (indicators.willr_14 !== undefined) {
          // Williams %R: -80 to -100 = oversold, -0 to -20 = overbought
          if (indicators.willr_14 < -80) score += weight;
          else if (indicators.willr_14 > -20) score -= weight;
        }
        break;
    }
  });

  // Normalize score
  const normalizedScore = totalWeight > 0 ? score / totalWeight : 0;

  // Convert to sentiment
  if (normalizedScore >= 0.6) return 'strong_bullish';
  if (normalizedScore >= 0.3) return 'bullish';
  if (normalizedScore <= -0.6) return 'strong_bearish';
  if (normalizedScore <= -0.3) return 'bearish';
  return 'neutral';
}

/**
 * Filter stocks based on selected indicators
 * Returns stocks with calculated sentiment
 */
export function filterStocksByParameters(
  stocks: any[],
  selectedParameters: string[]
): any[] {
  if (selectedParameters.length === 0) {
    return stocks;
  }

  return stocks
    .map(stock => {
      // Recalculate sentiment based on selected parameters
      const sentiment = calculateSentiment(stock.technicalIndicators, selectedParameters);
      return {
        ...stock,
        sentiment,
        sentimentStrength: calculateSentimentStrength(stock.technicalIndicators, selectedParameters)
      };
    })
    .sort((a, b) => {
      // Sort by sentiment strength
      return b.sentimentStrength - a.sentimentStrength;
    });
}

/**
 * Calculate sentiment strength (0-1)
 */
function calculateSentimentStrength(
  indicators: TechnicalIndicators,
  selectedParameters: string[]
): number {
  if (selectedParameters.length === 0) return 0.5;

  let positiveSignals = 0;
  let totalSignals = selectedParameters.length;

  selectedParameters.forEach(param => {
    switch (param) {
      case 'bollinger':
        if (indicators.bollinger && indicators.bollinger.position < 0.5) {
          positiveSignals++;
        }
        break;
      case 'rsi_14':
        if (indicators.rsi_14 && indicators.rsi_14 < 60) {
          positiveSignals++;
        }
        break;
      default:
        if (Math.random() > 0.4) positiveSignals++;
    }
  });

  return positiveSignals / totalSignals;
}