import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Candle,
  CalculatedCandle,
  enrichCandlesWithIndicators,
} from "../utils/technicalIndicators";
import {
  BinanceMarketWebSocket,
  fetchBinanceKlines,
  fetchBinanceTicker24h,
  POPULAR_SYMBOLS,
  AVAILABLE_INTERVALS,
  ConnectionStatus,
  Binance24hTicker,
} from "../services/binanceWebSocket";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sliders,
  ChevronDown,
  Layers,
  BarChart2,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
} from "lucide-react";

interface TradingViewChartProps {
  initialSymbol?: string;
  initialInterval?: string;
  height?: number;
  compact?: boolean;
  onSymbolChange?: (symbol: string) => void;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  initialSymbol = "BTCUSDT",
  initialInterval = "1m",
  height = 480,
  compact = false,
  onSymbolChange,
}) => {
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [interval, setInterval] = useState<string>(initialInterval);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [ticker, setTicker] = useState<Binance24hTicker | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [chartMode, setChartMode] = useState<"candle" | "line">("candle");

  // Indicator Visibility Toggles
  const [showEMA9, setShowEMA9] = useState<boolean>(true);
  const [showEMA21, setShowEMA21] = useState<boolean>(true);
  const [showEMA50, setShowEMA50] = useState<boolean>(false);
  const [showBollinger, setShowBollinger] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [showRSI, setShowRSI] = useState<boolean>(true);
  const [showMACD, setShowMACD] = useState<boolean>(false);
  const [showControlsMenu, setShowControlsMenu] = useState<boolean>(false);

  // Hover Crosshair State
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Price Flash Effect on live tick
  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);
  const prevPriceRef = useRef<number | null>(null);

  // Container Dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 650,
    height: height,
  });

  const wsClientRef = useRef<BinanceMarketWebSocket | null>(null);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setDimensions({
            width: entry.contentRect.width,
            height: isFullscreen ? Math.max(window.innerHeight - 140, 520) : height,
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height, isFullscreen]);

  // Load initial historical data and start WebSocket
  const loadMarketData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [histCandles, tickerData] = await Promise.all([
        fetchBinanceKlines(symbol, interval, 120),
        fetchBinanceTicker24h(symbol),
      ]);

      if (histCandles.length > 0) {
        setCandles(histCandles);
      }
      if (tickerData) {
        setTicker(tickerData);
        prevPriceRef.current = tickerData.lastPrice;
      }
    } catch (e) {
      console.error("Error loading market data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, interval]);

  // Initialize and manage WebSocket connection
  useEffect(() => {
    loadMarketData();

    // Clean up previous WS
    if (wsClientRef.current) {
      wsClientRef.current.close();
    }

    const ws = new BinanceMarketWebSocket(
      symbol,
      interval,
      (updatedCandle) => {
        setCandles((prev) => {
          if (prev.length === 0) return [updatedCandle];

          const lastCandle = prev[prev.length - 1];

          // Flash price direction
          if (prevPriceRef.current !== null && updatedCandle.close !== prevPriceRef.current) {
            setPriceFlash(updatedCandle.close >= prevPriceRef.current ? "up" : "down");
            setTimeout(() => setPriceFlash(null), 400);
          }
          prevPriceRef.current = updatedCandle.close;

          // If candle has same start time, update active bar
          if (lastCandle.time === updatedCandle.time) {
            const next = [...prev];
            next[next.length - 1] = {
              ...lastCandle,
              open: updatedCandle.open,
              high: Math.max(lastCandle.high, updatedCandle.high),
              low: Math.min(lastCandle.low, updatedCandle.low),
              close: updatedCandle.close,
              volume: updatedCandle.volume,
              isClosed: updatedCandle.isClosed,
            };
            return next;
          } else if (updatedCandle.time > lastCandle.time) {
            // New candle started, append and maintain max 160 candles
            const next = [...prev, updatedCandle];
            return next.length > 160 ? next.slice(next.length - 160) : next;
          }
          return prev;
        });

        // Update live ticker price
        setTicker((prev) =>
          prev
            ? {
                ...prev,
                lastPrice: updatedCandle.close,
              }
            : {
                symbol,
                lastPrice: updatedCandle.close,
                priceChange: 0,
                priceChangePercent: 0,
                highPrice: updatedCandle.high,
                lowPrice: updatedCandle.low,
                volume: updatedCandle.volume,
                quoteVolume: 0,
              }
        );
      },
      (status) => {
        setConnectionStatus(status);
      },
      (tickerUpdate) => {
        setTicker((prev) => (prev ? { ...prev, ...tickerUpdate } : null));
      }
    );

    ws.connect();
    wsClientRef.current = ws;

    return () => {
      ws.close();
    };
  }, [symbol, interval, loadMarketData]);

  // Notify parent on symbol change
  const handleSelectSymbol = (newSymbol: string) => {
    setSymbol(newSymbol);
    onSymbolChange?.(newSymbol);
  };

  // Enrich candles with locally calculated EMA, RSI, MACD, Bollinger Bands
  const enrichedCandles: CalculatedCandle[] = useMemo(() => {
    return enrichCandlesWithIndicators(candles);
  }, [candles]);

  // Active Candle to display on HUD (hovered or latest)
  const activeCandle = useMemo(() => {
    if (enrichedCandles.length === 0) return null;
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < enrichedCandles.length) {
      return enrichedCandles[hoverIndex];
    }
    return enrichedCandles[enrichedCandles.length - 1];
  }, [enrichedCandles, hoverIndex]);

  // Calculate layout coordinates for SVG rendering
  const {
    chartWidth,
    mainChartHeight,
    rsiChartHeight,
    macdChartHeight,
    paddingRight,
    paddingLeft,
    paddingTop,
    priceMin,
    priceMax,
    candleWidth,
    gap,
    points,
    rsiPoints,
    macdPoints,
    volumeMax,
  } = useMemo(() => {
    const totalW = Math.max(dimensions.width, 320);
    const totalH = Math.max(dimensions.height, 360);

    const paddingRight = 75; // Right axis for price values
    const paddingLeft = 10;
    const paddingTop = 28;
    const paddingBottom = 26;

    // Allocate vertical space for sub-panels
    let rsiHeight = showRSI ? 80 : 0;
    let macdHeight = showMACD ? 80 : 0;
    const mainHeight = totalH - paddingTop - paddingBottom - rsiHeight - macdHeight;

    const renderCandles = enrichedCandles.slice(-100);
    const count = renderCandles.length;

    const usableWidth = totalW - paddingLeft - paddingRight;
    const slotWidth = count > 0 ? usableWidth / count : 10;
    const gap = Math.max(1, slotWidth * 0.25);
    const candleWidth = Math.max(2, slotWidth - gap);

    // Compute Price Scale with margins and indicator bounds
    let minP = Infinity;
    let maxP = -Infinity;
    let maxVol = 0;

    renderCandles.forEach((c) => {
      minP = Math.min(minP, c.low);
      maxP = Math.max(maxP, c.high);
      maxVol = Math.max(maxVol, c.volume);

      if (showBollinger && c.bollinger) {
        if (c.bollinger.lower !== null) minP = Math.min(minP, c.bollinger.lower);
        if (c.bollinger.upper !== null) maxP = Math.max(maxP, c.bollinger.upper);
      }
      if (showEMA9 && c.ema9 !== null) {
        minP = Math.min(minP, c.ema9!);
        maxP = Math.max(maxP, c.ema9!);
      }
      if (showEMA21 && c.ema21 !== null) {
        minP = Math.min(minP, c.ema21!);
        maxP = Math.max(maxP, c.ema21!);
      }
    });

    if (minP === Infinity || maxP === -Infinity) {
      minP = 100;
      maxP = 200;
    }

    // Add 4% buffer top and bottom
    const pMargin = (maxP - minP) * 0.05 || 1;
    minP -= pMargin;
    maxP += pMargin;

    // Map candles to SVG coordinates
    const scaleY = (p: number) => {
      return paddingTop + mainHeight - ((p - minP) / (maxP - minP)) * mainHeight;
    };

    const points = renderCandles.map((c, i) => {
      const xCenter = paddingLeft + i * slotWidth + slotWidth / 2;
      const xLeft = xCenter - candleWidth / 2;
      const yOpen = scaleY(c.open);
      const yClose = scaleY(c.close);
      const yHigh = scaleY(c.high);
      const yLow = scaleY(c.low);

      const isBull = c.close >= c.open;
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));

      // Volume bar height (mapped to bottom 25% of main chart)
      const volHeight = maxVol > 0 ? (c.volume / maxVol) * (mainHeight * 0.22) : 0;
      const volY = paddingTop + mainHeight - volHeight;

      return {
        ...c,
        rawIndex: enrichedCandles.length - renderCandles.length + i,
        xCenter,
        xLeft,
        yOpen,
        yClose,
        yHigh,
        yLow,
        bodyTop,
        bodyHeight,
        isBull,
        volHeight,
        volY,
        yEma9: c.ema9 !== null ? scaleY(c.ema9!) : null,
        yEma21: c.ema21 !== null ? scaleY(c.ema21!) : null,
        yEma50: c.ema50 !== null ? scaleY(c.ema50!) : null,
        yBBUpper: c.bollinger?.upper !== null ? scaleY(c.bollinger!.upper!) : null,
        yBBMiddle: c.bollinger?.middle !== null ? scaleY(c.bollinger!.middle!) : null,
        yBBLower: c.bollinger?.lower !== null ? scaleY(c.bollinger!.lower!) : null,
      };
    });

    // Map RSI coordinates
    const rsiTop = paddingTop + mainHeight + 10;
    const rsiScaleY = (rsiVal: number) => {
      return rsiTop + (rsiHeight - 15) - (rsiVal / 100) * (rsiHeight - 15);
    };

    const rsiPoints = showRSI
      ? points.map((p) => ({
          x: p.xCenter,
          y: p.rsi !== null ? rsiScaleY(p.rsi!) : null,
          rsi: p.rsi,
        }))
      : [];

    // Map MACD coordinates
    const macdTop = paddingTop + mainHeight + rsiHeight + 10;
    let maxMacd = 1;
    points.forEach((p) => {
      if (p.macd?.macd !== null) maxMacd = Math.max(maxMacd, Math.abs(p.macd!.macd!));
      if (p.macd?.signal !== null) maxMacd = Math.max(maxMacd, Math.abs(p.macd!.signal!));
      if (p.macd?.histogram !== null) maxMacd = Math.max(maxMacd, Math.abs(p.macd!.histogram!));
    });
    maxMacd *= 1.2;

    const macdScaleY = (val: number) => {
      const usableH = macdHeight - 15;
      const center = macdTop + usableH / 2;
      return center - (val / maxMacd) * (usableH / 2);
    };

    const macdPoints = showMACD
      ? points.map((p) => ({
          x: p.xCenter,
          yMacd: p.macd?.macd !== null ? macdScaleY(p.macd!.macd!) : null,
          ySignal: p.macd?.signal !== null ? macdScaleY(p.macd!.signal!) : null,
          yHist: p.macd?.histogram !== null ? macdScaleY(p.macd!.histogram!) : null,
          yZero: macdScaleY(0),
          histVal: p.macd?.histogram,
        }))
      : [];

    return {
      chartWidth: totalW,
      mainChartHeight: mainHeight,
      rsiChartHeight: rsiHeight,
      macdChartHeight: macdHeight,
      paddingRight,
      paddingLeft,
      paddingTop,
      priceMin: minP,
      priceMax: maxP,
      candleWidth,
      gap,
      points,
      rsiPoints,
      macdPoints,
      volumeMax: maxVol,
    };
  }, [
    dimensions,
    enrichedCandles,
    showEMA9,
    showEMA21,
    showEMA50,
    showBollinger,
    showRSI,
    showMACD,
  ]);

  // Handle chart mouse/touch interactions for crosshair
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find closest candle by X coordinate
    let closestIdx = 0;
    let minDist = Infinity;

    points.forEach((p, idx) => {
      const dist = Math.abs(p.xCenter - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });

    if (closestIdx >= 0 && closestIdx < points.length) {
      setHoverIndex(points[closestIdx].rawIndex);
      setHoverPos({ x: points[closestIdx].xCenter, y: mouseY });
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setHoverPos(null);
  };

  // Helper formatter
  const formatPrice = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return "—";
    if (val >= 1000) {
      return val.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    if (val >= 1) return val.toFixed(4);
    return val.toFixed(6);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    if (interval === "1d") {
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Generate SVG path for line series
  const generatePath = (
    pts: { x: number; y: number | null }[],
    close = false,
    baseY?: number
  ) => {
    let path = "";
    let started = false;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (p.y !== null && !isNaN(p.y)) {
        if (!started) {
          path += `M ${p.x} ${p.y}`;
          started = true;
        } else {
          path += ` L ${p.x} ${p.y}`;
        }
      }
    }

    if (close && started && baseY !== undefined) {
      const lastP = pts[pts.length - 1];
      const firstP = pts[0];
      path += ` L ${lastP.x} ${baseY} L ${firstP.x} ${baseY} Z`;
    }

    return path;
  };

  // Generate Bollinger Bands filled area path
  const generateBollingerArea = () => {
    const valid = points.filter((p) => p.yBBUpper !== null && p.yBBLower !== null);
    if (valid.length === 0) return "";

    let path = `M ${valid[0].xCenter} ${valid[0].yBBUpper}`;
    for (let i = 1; i < valid.length; i++) {
      path += ` L ${valid[i].xCenter} ${valid[i].yBBUpper}`;
    }
    for (let i = valid.length - 1; i >= 0; i--) {
      path += ` L ${valid[i].xCenter} ${valid[i].yBBLower}`;
    }
    path += " Z";
    return path;
  };

  // Price grid ticks (5 levels)
  const priceGridTicks = useMemo(() => {
    const ticks = [];
    const step = (priceMax - priceMin) / 5;
    for (let i = 0; i <= 5; i++) {
      const p = priceMin + step * i;
      const y = paddingTop + mainChartHeight - ((p - priceMin) / (priceMax - priceMin)) * mainChartHeight;
      ticks.push({ price: p, y });
    }
    return ticks;
  }, [priceMin, priceMax, paddingTop, mainChartHeight]);

  const lastPoint = points.length > 0 ? points[points.length - 1] : null;

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border border-slate-300 dark:border-zinc-800 bg-slate-950 text-slate-100 shadow-md overflow-hidden flex flex-col font-sans select-none transition-all ${
        isFullscreen ? "fixed inset-2 z-50 bg-slate-950/98 backdrop-blur-md" : "w-full my-3"
      }`}
      style={{ minHeight: compact ? 360 : height }}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs gap-2">
        {/* Symbol and Ticker Info */}
        <div className="flex items-center space-x-2.5">
          {/* Symbol Selector Dropdown */}
          <div className="relative">
            <select
              value={symbol}
              onChange={(e) => handleSelectSymbol(e.target.value)}
              className="appearance-none bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-100 font-bold px-3 py-1.5 pr-7 rounded-xl cursor-pointer text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              {POPULAR_SYMBOLS.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.base}/{s.quote} — {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Live Price Flash Badge */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl font-mono text-sm font-bold transition-all duration-300 ${
              priceFlash === "up"
                ? "bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500 scale-105"
                : priceFlash === "down"
                ? "bg-rose-500/30 text-rose-300 ring-1 ring-rose-500 scale-105"
                : "bg-slate-800/80 text-white"
            }`}
          >
            <span>${formatPrice(ticker?.lastPrice || activeCandle?.close)}</span>
            {ticker && (
              <span
                className={`text-[11px] font-semibold flex items-center ${
                  ticker.priceChangePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {ticker.priceChangePercent >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                )}
                {ticker.priceChangePercent >= 0 ? "+" : ""}
                {ticker.priceChangePercent.toFixed(2)}%
              </span>
            )}
          </div>

          {/* 24h High / Low info */}
          {ticker && !compact && (
            <div className="hidden lg:flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
              <div>
                <span className="text-slate-500">24h H:</span>{" "}
                <span className="text-slate-200">${formatPrice(ticker.highPrice)}</span>
              </div>
              <div>
                <span className="text-slate-500">24h L:</span>{" "}
                <span className="text-slate-200">${formatPrice(ticker.lowPrice)}</span>
              </div>
              <div>
                <span className="text-slate-500">24h Vol:</span>{" "}
                <span className="text-slate-200">
                  {(ticker.volume > 1000
                    ? `${(ticker.volume / 1000).toFixed(1)}K`
                    : ticker.volume.toFixed(1))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Interval Selector & Tool Controls */}
        <div className="flex items-center space-x-1.5">
          {/* Intervals */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60">
            {AVAILABLE_INTERVALS.map((inv) => (
              <button
                key={inv.value}
                type="button"
                onClick={() => setInterval(inv.value)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  interval === inv.value
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
              >
                {inv.label}
              </button>
            ))}
          </div>

          {/* Chart Mode Toggle */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => setChartMode("candle")}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                chartMode === "candle"
                  ? "bg-slate-700 text-emerald-400"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartMode("line")}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                chartMode === "line"
                  ? "bg-slate-700 text-sky-400"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Line Chart"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Indicators Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowControlsMenu(!showControlsMenu)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Indicators</span>
            </button>

            {showControlsMenu && (
              <div className="absolute right-0 top-8 w-56 p-2.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl z-30 text-xs space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1 mb-1">
                  Overlays & Indicators
                </div>

                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span>EMA (9)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showEMA9}
                    onChange={(e) => setShowEMA9(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span>EMA (21)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showEMA21}
                    onChange={(e) => setShowEMA21(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <span>EMA (50)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showEMA50}
                    onChange={(e) => setShowEMA50(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                    <span>Bollinger Bands (20, 2)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showBollinger}
                    onChange={(e) => setShowBollinger(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                </label>

                <div className="border-t border-slate-800 my-1"></div>

                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
                    <span>RSI (14)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showRSI}
                    onChange={(e) => setShowRSI(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <span>MACD (12, 26, 9)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showMACD}
                    onChange={(e) => setShowMACD(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
                  <span>Volume Histogram</span>
                  <input
                    type="checkbox"
                    checked={showVolume}
                    onChange={(e) => setShowVolume(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                </label>
              </div>
            )}
          </div>

          {/* WebSocket Status Indicator */}
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded-xl text-[10px] font-semibold border ${
              connectionStatus === "connected"
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-400"
                : connectionStatus === "reconnecting"
                ? "bg-amber-950/80 border-amber-500/40 text-amber-300 animate-pulse"
                : "bg-rose-950/80 border-rose-500/40 text-rose-400"
            }`}
            title={`Binance WebSocket: ${connectionStatus}`}
          >
            {connectionStatus === "connected" ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span className="capitalize">{connectionStatus}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Chart"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Real-Time HUD / Legend Information Bar */}
      <div className="flex flex-wrap items-center px-3.5 py-1.5 bg-slate-900/60 border-b border-slate-800/80 text-[11px] font-mono text-slate-300 gap-x-4 gap-y-1">
        {activeCandle ? (
          <>
            <div>
              <span className="text-slate-500">Time:</span>{" "}
              <span className="text-slate-200">{formatTime(activeCandle.time)}</span>
            </div>
            <div>
              <span className="text-slate-500">O:</span>{" "}
              <span className="text-slate-200">${formatPrice(activeCandle.open)}</span>
            </div>
            <div>
              <span className="text-slate-500">H:</span>{" "}
              <span className="text-slate-200">${formatPrice(activeCandle.high)}</span>
            </div>
            <div>
              <span className="text-slate-500">L:</span>{" "}
              <span className="text-slate-200">${formatPrice(activeCandle.low)}</span>
            </div>
            <div>
              <span className="text-slate-500">C:</span>{" "}
              <span
                className={`font-bold ${
                  activeCandle.close >= activeCandle.open ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                ${formatPrice(activeCandle.close)}
              </span>
            </div>

            {/* Indicator values */}
            {showEMA9 && activeCandle.ema9 && (
              <div className="text-cyan-400">
                <span>EMA9:</span> ${formatPrice(activeCandle.ema9)}
              </div>
            )}
            {showEMA21 && activeCandle.ema21 && (
              <div className="text-amber-400">
                <span>EMA21:</span> ${formatPrice(activeCandle.ema21)}
              </div>
            )}
            {showBollinger && activeCandle.bollinger?.upper && (
              <div className="text-sky-300">
                <span>BB:</span> [{formatPrice(activeCandle.bollinger.lower)} -{" "}
                {formatPrice(activeCandle.bollinger.upper)}]
              </div>
            )}
            {showRSI && activeCandle.rsi !== null && activeCandle.rsi !== undefined && (
              <div className="text-violet-400">
                <span>RSI(14):</span> {activeCandle.rsi.toFixed(2)}
              </div>
            )}
            {showMACD && activeCandle.macd?.histogram !== null && (
              <div className="text-blue-400">
                <span>MACD:</span> {activeCandle.macd?.macd?.toFixed(2)} /{" "}
                <span className="text-amber-400">{activeCandle.macd?.signal?.toFixed(2)}</span>
              </div>
            )}
          </>
        ) : (
          <span className="text-slate-500">Streaming live Binance OHLCV candlestick data...</span>
        )}
      </div>

      {/* SVG Canvas Chart */}
      <div className="relative flex-1 bg-slate-950 overflow-hidden cursor-crosshair">
        {isLoading && candles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-20">
            <div className="flex items-center space-x-2.5 text-slate-300 text-xs font-semibold">
              <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>Connecting to Binance Public WebSocket...</span>
            </div>
          </div>
        ) : null}

        <svg
          width="100%"
          height={dimensions.height - 75}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="select-none"
        >
          <defs>
            {/* Gradient for Line Mode */}
            <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Bollinger Bands Fill */}
            <linearGradient id="bbFillGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          <g className="opacity-15">
            {priceGridTicks.map((tick, i) => (
              <line
                key={i}
                x1={paddingLeft}
                y1={tick.y}
                x2={chartWidth - paddingRight}
                y2={tick.y}
                stroke="#64748b"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Price Axis on Right Side */}
          <g className="text-[10px] font-mono fill-slate-400">
            {priceGridTicks.map((tick, i) => (
              <text
                key={i}
                x={chartWidth - paddingRight + 8}
                y={tick.y + 3}
                textAnchor="start"
              >
                ${formatPrice(tick.price)}
              </text>
            ))}
          </g>

          {/* Bollinger Bands Shaded Area & Lines */}
          {showBollinger && (
            <g>
              <path d={generateBollingerArea()} fill="url(#bbFillGradient)" />
              {/* Upper Line */}
              <path
                d={generatePath(points.map((p) => ({ x: p.xCenter, y: p.yBBUpper })))}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1.2"
                strokeDasharray="2 2"
                opacity="0.8"
              />
              {/* Middle Line */}
              <path
                d={generatePath(points.map((p) => ({ x: p.xCenter, y: p.yBBMiddle })))}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1"
                opacity="0.5"
              />
              {/* Lower Line */}
              <path
                d={generatePath(points.map((p) => ({ x: p.xCenter, y: p.yBBLower })))}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1.2"
                strokeDasharray="2 2"
                opacity="0.8"
              />
            </g>
          )}

          {/* Volume Histogram Bars */}
          {showVolume && (
            <g opacity="0.45">
              {points.map((p, i) => (
                <rect
                  key={`vol-${i}`}
                  x={p.xLeft}
                  y={p.volY}
                  width={candleWidth}
                  height={p.volHeight}
                  fill={p.isBull ? "#10b981" : "#f43f5e"}
                  rx="1"
                />
              ))}
            </g>
          )}

          {/* Candlesticks OR Line Mode */}
          {chartMode === "candle" ? (
            <g>
              {points.map((p, i) => (
                <g key={`candle-${i}`}>
                  {/* High-Low Wick */}
                  <line
                    x1={p.xCenter}
                    y1={p.yHigh}
                    x2={p.xCenter}
                    y2={p.yLow}
                    stroke={p.isBull ? "#10b981" : "#f43f5e"}
                    strokeWidth="1.5"
                  />
                  {/* Candle Body */}
                  <rect
                    x={p.xLeft}
                    y={p.bodyTop}
                    width={candleWidth}
                    height={p.bodyHeight}
                    fill={p.isBull ? "#10b981" : "#f43f5e"}
                    rx="1"
                  />
                </g>
              ))}
            </g>
          ) : (
            <g>
              {/* Area Under Line */}
              <path
                d={generatePath(
                  points.map((p) => ({ x: p.xCenter, y: p.yClose })),
                  true,
                  paddingTop + mainChartHeight
                )}
                fill="url(#chartAreaGradient)"
              />
              {/* Line */}
              <path
                d={generatePath(points.map((p) => ({ x: p.xCenter, y: p.yClose })))}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />
            </g>
          )}

          {/* EMA Overlays */}
          {showEMA9 && (
            <path
              d={generatePath(points.map((p) => ({ x: p.xCenter, y: p.yEma9 })))}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.5"
            />
          )}
          {showEMA21 && (
            <path
              d={generatePath(points.map((p) => ({ x: p.xCenter, y: p.yEma21 })))}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
          )}
          {showEMA50 && (
            <path
              d={generatePath(points.map((p) => ({ x: p.xCenter, y: p.yEma50 })))}
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.5"
            />
          )}

          {/* Current Active Price Line & Badge */}
          {lastPoint && (
            <g>
              <line
                x1={paddingLeft}
                y1={lastPoint.yClose}
                x2={chartWidth - paddingRight}
                y2={lastPoint.yClose}
                stroke={lastPoint.isBull ? "#10b981" : "#f43f5e"}
                strokeDasharray="2 2"
                strokeWidth="1"
                opacity="0.8"
              />
              <rect
                x={chartWidth - paddingRight}
                y={lastPoint.yClose - 9}
                width={paddingRight - 5}
                height="18"
                fill={lastPoint.isBull ? "#10b981" : "#f43f5e"}
                rx="4"
              />
              <text
                x={chartWidth - paddingRight + 6}
                y={lastPoint.yClose + 4}
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                ${formatPrice(lastPoint.close)}
              </text>
            </g>
          )}

          {/* RSI Sub-Panel */}
          {showRSI && rsiChartHeight > 0 && (
            <g>
              <rect
                x={paddingLeft}
                y={paddingTop + mainChartHeight + 10}
                width={chartWidth - paddingLeft - paddingRight}
                height={rsiChartHeight - 15}
                fill="#090d16"
                stroke="#1e293b"
                strokeWidth="1"
                rx="6"
              />
              {/* RSI 70 Line */}
              <line
                x1={paddingLeft}
                y1={paddingTop + mainChartHeight + 10 + (rsiChartHeight - 15) * 0.3}
                x2={chartWidth - paddingRight}
                y2={paddingTop + mainChartHeight + 10 + (rsiChartHeight - 15) * 0.3}
                stroke="#f43f5e"
                strokeDasharray="3 3"
                strokeWidth="1"
                opacity="0.4"
              />
              {/* RSI 30 Line */}
              <line
                x1={paddingLeft}
                y1={paddingTop + mainChartHeight + 10 + (rsiChartHeight - 15) * 0.7}
                x2={chartWidth - paddingRight}
                y2={paddingTop + mainChartHeight + 10 + (rsiChartHeight - 15) * 0.7}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth="1"
                opacity="0.4"
              />
              {/* RSI Curve */}
              <path
                d={generatePath(rsiPoints)}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="1.6"
              />
              {/* RSI Labels */}
              <text
                x={chartWidth - paddingRight + 8}
                y={paddingTop + mainChartHeight + 25}
                fill="#a78bfa"
                fontSize="9"
                fontFamily="monospace"
              >
                RSI 70
              </text>
              <text
                x={chartWidth - paddingRight + 8}
                y={paddingTop + mainChartHeight + 60}
                fill="#a78bfa"
                fontSize="9"
                fontFamily="monospace"
              >
                RSI 30
              </text>
            </g>
          )}

          {/* MACD Sub-Panel */}
          {showMACD && macdChartHeight > 0 && (
            <g>
              <rect
                x={paddingLeft}
                y={paddingTop + mainChartHeight + rsiChartHeight + 10}
                width={chartWidth - paddingLeft - paddingRight}
                height={macdChartHeight - 15}
                fill="#090d16"
                stroke="#1e293b"
                strokeWidth="1"
                rx="6"
              />
              {/* MACD Histogram */}
              {macdPoints.map((mp, i) => {
                if (mp.yHist === null || mp.histVal === null) return null;
                const hTop = Math.min(mp.yZero, mp.yHist);
                const hHeight = Math.max(1, Math.abs(mp.yHist - mp.yZero));
                const isPos = mp.histVal >= 0;
                return (
                  <rect
                    key={`hist-${i}`}
                    x={mp.x - candleWidth / 2}
                    y={hTop}
                    width={candleWidth}
                    height={hHeight}
                    fill={isPos ? "#10b981" : "#f43f5e"}
                    opacity="0.75"
                  />
                );
              })}
              {/* MACD Line */}
              <path
                d={generatePath(macdPoints.map((p) => ({ x: p.x, y: p.yMacd })))}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
              />
              {/* Signal Line */}
              <path
                d={generatePath(macdPoints.map((p) => ({ x: p.x, y: p.ySignal })))}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Crosshair Cursor Lines */}
          {hoverPos && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={hoverPos.x}
                y1={paddingTop}
                x2={hoverPos.x}
                y2={dimensions.height - 30}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {/* Horizontal Crosshair Line */}
              <line
                x1={paddingLeft}
                y1={hoverPos.y}
                x2={chartWidth - paddingRight}
                y2={hoverPos.y}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Bottom Timeline Axis */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 text-[10px] font-mono text-slate-400">
        <div className="flex items-center space-x-2">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Binance Public Live Market Stream</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Zero API Key / Unauthenticated WebSocket</span>
        </div>
        <div className="flex items-center space-x-4">
          {points.length > 0 && (
            <>
              <span>From: {formatTime(points[0].time)}</span>
              <span>To: {formatTime(points[points.length - 1].time)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
