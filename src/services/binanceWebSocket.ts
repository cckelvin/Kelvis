import { Candle } from "../utils/technicalIndicators";

export type ConnectionStatus = "connected" | "connecting" | "reconnecting" | "disconnected";

export interface Binance24hTicker {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
}

export const POPULAR_SYMBOLS = [
  { symbol: "BTCUSDT", name: "Bitcoin", base: "BTC", quote: "USDT" },
  { symbol: "ETHUSDT", name: "Ethereum", base: "ETH", quote: "USDT" },
  { symbol: "SOLUSDT", name: "Solana", base: "SOL", quote: "USDT" },
  { symbol: "BNBUSDT", name: "BNB", base: "BNB", quote: "USDT" },
  { symbol: "XRPUSDT", name: "Ripple", base: "XRP", quote: "USDT" },
  { symbol: "DOGEUSDT", name: "Dogecoin", base: "DOGE", quote: "USDT" },
  { symbol: "ADAUSDT", name: "Cardano", base: "ADA", quote: "USDT" },
  { symbol: "AVAXUSDT", name: "Avalanche", base: "AVAX", quote: "USDT" },
  { symbol: "LINKUSDT", name: "Chainlink", base: "LINK", quote: "USDT" },
  { symbol: "NEARUSDT", name: "NEAR Protocol", base: "NEAR", quote: "USDT" },
  { symbol: "SUIUSDT", name: "Sui", base: "SUI", quote: "USDT" },
  { symbol: "PEPEUSDT", name: "Pepe", base: "PEPE", quote: "USDT" },
];

export const AVAILABLE_INTERVALS = [
  { label: "1m", value: "1m", seconds: 60 },
  { label: "5m", value: "5m", seconds: 300 },
  { label: "15m", value: "15m", seconds: 900 },
  { label: "1h", value: "1h", seconds: 3600 },
  { label: "4h", value: "4h", seconds: 14400 },
  { label: "1D", value: "1d", seconds: 86400 },
];

/**
 * Fetch initial historical candlesticks from public Binance REST API or server-side proxy
 */
export async function fetchBinanceKlines(
  symbol: string = "BTCUSDT",
  interval: string = "1m",
  limit: number = 100
): Promise<Candle[]> {
  const normSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  
  // Try direct Binance public REST API first
  try {
    const directUrl = `https://api.binance.com/api/v3/klines?symbol=${normSymbol}&interval=${interval}&limit=${limit}`;
    const res = await fetch(directUrl, { mode: "cors" });
    if (res.ok) {
      const rawData = await res.json();
      if (Array.isArray(rawData) && rawData.length > 0) {
        return parseRawKlines(rawData);
      }
    }
  } catch (err) {
    // If browser CORS or sandbox restricts direct call, fallback to our server proxy
    console.warn("Direct Binance REST fetch bypassed, trying server proxy fallback...");
  }

  // Server proxy fallback
  try {
    const proxyUrl = `/api/binance/klines?symbol=${normSymbol}&interval=${interval}&limit=${limit}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const rawData = await res.json();
      if (Array.isArray(rawData) && rawData.length > 0) {
        return parseRawKlines(rawData);
      }
    }
  } catch (proxyErr) {
    console.error("Failed to fetch klines from proxy:", proxyErr);
  }

  return [];
}

/**
 * Fetch 24h Ticker statistics
 */
export async function fetchBinanceTicker24h(symbol: string = "BTCUSDT"): Promise<Binance24hTicker | null> {
  const normSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");

  try {
    const directUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${normSymbol}`;
    const res = await fetch(directUrl, { mode: "cors" });
    if (res.ok) {
      const data = await res.json();
      return {
        symbol: data.symbol,
        lastPrice: parseFloat(data.lastPrice),
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        highPrice: parseFloat(data.highPrice),
        lowPrice: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume),
        quoteVolume: parseFloat(data.quoteVolume),
      };
    }
  } catch (e) {
    // Fallback to server proxy
  }

  try {
    const proxyUrl = `/api/binance/ticker?symbol=${normSymbol}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      return {
        symbol: data.symbol,
        lastPrice: parseFloat(data.lastPrice),
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        highPrice: parseFloat(data.highPrice),
        lowPrice: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume),
        quoteVolume: parseFloat(data.quoteVolume),
      };
    }
  } catch (proxyErr) {
    console.error("Failed to fetch ticker:", proxyErr);
  }

  return null;
}

function parseRawKlines(rawData: any[]): Candle[] {
  return rawData.map((item: any[]) => ({
    time: Number(item[0]), // open time
    open: parseFloat(item[1]),
    high: parseFloat(item[2]),
    low: parseFloat(item[3]),
    close: parseFloat(item[4]),
    volume: parseFloat(item[5]),
    isClosed: true,
  }));
}

/**
 * Binance Public WebSocket Client with Auto-Reconnection & Heartbeat
 */
export class BinanceMarketWebSocket {
  private ws: WebSocket | null = null;
  private symbol: string;
  private interval: string;
  private onCandleUpdate: (candle: Candle) => void;
  private onStatusChange?: (status: ConnectionStatus) => void;
  private onTickerUpdate?: (ticker: Partial<Binance24hTicker>) => void;
  
  private isIntentionallyClosed = false;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 15000;
  private reconnectTimeoutId: any = null;
  private pingIntervalId: any = null;

  constructor(
    symbol: string = "BTCUSDT",
    interval: string = "1m",
    onCandleUpdate: (candle: Candle) => void,
    onStatusChange?: (status: ConnectionStatus) => void,
    onTickerUpdate?: (ticker: Partial<Binance24hTicker>) => void
  ) {
    this.symbol = symbol.toLowerCase().replace(/[^a-z0-9]/g, "");
    this.interval = interval;
    this.onCandleUpdate = onCandleUpdate;
    this.onStatusChange = onStatusChange;
    this.onTickerUpdate = onTickerUpdate;
  }

  public connect() {
    this.isIntentionallyClosed = false;
    this.clearTimeouts();
    this.onStatusChange?.(this.reconnectAttempts > 0 ? "reconnecting" : "connecting");

    // Connect to Binance Public Combined WebSocket Stream (Kline + Ticker)
    const streamName = `${this.symbol}@kline_${this.interval}/${this.symbol}@miniTicker`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.onStatusChange?.("connected");
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle kline event
          if (data.e === "kline" && data.k) {
            const k = data.k;
            const updatedCandle: Candle = {
              time: Number(k.t), // candle open time
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
              volume: parseFloat(k.v),
              isClosed: Boolean(k.x),
            };
            this.onCandleUpdate(updatedCandle);
          } else if (data.e === "24hrMiniTicker") {
            this.onTickerUpdate?.({
              symbol: data.s,
              lastPrice: parseFloat(data.c),
              highPrice: parseFloat(data.h),
              lowPrice: parseFloat(data.l),
              volume: parseFloat(data.v),
              quoteVolume: parseFloat(data.q),
            });
          }
        } catch (err) {
          console.error("Error parsing Binance WS message:", err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("Binance WS error encountered:", err);
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        } else {
          this.onStatusChange?.("disconnected");
        }
      };
    } catch (err) {
      console.error("Failed to establish Binance WS:", err);
      this.scheduleReconnect();
    }
  }

  public updateSubscription(newSymbol: string, newInterval: string) {
    const formattedSym = newSymbol.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (this.symbol === formattedSym && this.interval === newInterval && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    this.symbol = formattedSym;
    this.interval = newInterval;
    this.close();
    this.connect();
  }

  private scheduleReconnect() {
    this.onStatusChange?.("reconnecting");
    this.reconnectAttempts++;
    // Exponential backoff with jitter
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts) + Math.random() * 500, this.maxReconnectDelay);
    
    this.clearTimeouts();
    this.reconnectTimeoutId = setTimeout(() => {
      if (!this.isIntentionallyClosed) {
        this.connect();
      }
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    // Periodically verify connection
    this.pingIntervalId = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ method: "ping" }));
        } catch (e) {
          // Ignore
        }
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  private clearTimeouts() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  public close() {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    this.clearTimeouts();
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this.onStatusChange?.("disconnected");
  }
}
