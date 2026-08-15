export interface Candle {
  time: number; // Unix timestamp in ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed?: boolean;
}

export interface CalculatedCandle extends Candle {
  ema9?: number | null;
  ema21?: number | null;
  ema50?: number | null;
  rsi?: number | null;
  macd?: {
    macd: number | null;
    signal: number | null;
    histogram: number | null;
  };
  bollinger?: {
    upper: number | null;
    middle: number | null;
    lower: number | null;
  };
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null);
  if (data.length < period) return result;

  // Initial SMA for first EMA seed
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let prevEMA = sum / period;
  result[period - 1] = prevEMA;

  const multiplier = 2 / (period + 1);

  for (let i = period; i < data.length; i++) {
    const currentEMA = (data[i] - prevEMA) * multiplier + prevEMA;
    result[i] = currentEMA;
    prevEMA = currentEMA;
  }

  return result;
}

/**
 * Calculates Relative Strength Index (RSI) using Wilder's Smoothing Method
 */
export function calculateRSI(closes: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return result;

  let gains = 0;
  let losses = 0;

  // First period changes
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    result[period] = 100 - 100 / (1 + rs);
  }

  // Wilder's smoothing for subsequent periods
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - 100 / (1 + rs);
    }
  }

  return result;
}

/**
 * Calculates MACD (Moving Average Convergence Divergence)
 * Standard: Fast = 12, Slow = 26, Signal = 9
 */
export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  const length = closes.length;
  const macdLine: (number | null)[] = new Array(length).fill(null);
  const signalLine: (number | null)[] = new Array(length).fill(null);
  const histogram: (number | null)[] = new Array(length).fill(null);

  if (length < slowPeriod) {
    return { macd: macdLine, signal: signalLine, histogram };
  }

  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  // Compute MACD Line = Fast EMA - Slow EMA
  const validMacdValues: { index: number; val: number }[] = [];
  for (let i = 0; i < length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      const val = fastEMA[i]! - slowEMA[i]!;
      macdLine[i] = val;
      validMacdValues.push({ index: i, val });
    }
  }

  if (validMacdValues.length >= signalPeriod) {
    const macdSeries = validMacdValues.map((v) => v.val);
    const signalEma = calculateEMA(macdSeries, signalPeriod);

    for (let j = 0; j < validMacdValues.length; j++) {
      const originalIdx = validMacdValues[j].index;
      const sigVal = signalEma[j];
      signalLine[originalIdx] = sigVal;
      if (sigVal !== null && macdLine[originalIdx] !== null) {
        histogram[originalIdx] = macdLine[originalIdx]! - sigVal;
      }
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

/**
 * Calculates Bollinger Bands (20-period SMA +/- 2 Standard Deviations)
 */
export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  multiplier: number = 2
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const length = closes.length;
  const upper: (number | null)[] = new Array(length).fill(null);
  const middle: (number | null)[] = new Array(length).fill(null);
  const lower: (number | null)[] = new Array(length).fill(null);

  if (length < period) {
    return { upper, middle, lower };
  }

  for (let i = period - 1; i < length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += closes[j];
    }
    const sma = sum / period;
    middle[i] = sma;

    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(closes[j] - sma, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);

    upper[i] = sma + multiplier * stdDev;
    lower[i] = sma - multiplier * stdDev;
  }

  return { upper, middle, lower };
}

/**
 * Calculates all technical indicators for a full candlestick series
 */
export function enrichCandlesWithIndicators(candles: Candle[]): CalculatedCandle[] {
  if (!candles || candles.length === 0) return [];

  const closes = candles.map((c) => c.close);

  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const rsi = calculateRSI(closes, 14);
  const { macd, signal, histogram } = calculateMACD(closes, 12, 26, 9);
  const { upper, middle, lower } = calculateBollingerBands(closes, 20, 2);

  return candles.map((c, i) => ({
    ...c,
    ema9: ema9[i],
    ema21: ema21[i],
    ema50: ema50[i],
    rsi: rsi[i],
    macd: {
      macd: macd[i],
      signal: signal[i],
      histogram: histogram[i],
    },
    bollinger: {
      upper: upper[i],
      middle: middle[i],
      lower: lower[i],
    },
  }));
}
