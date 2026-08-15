import React, { useState } from "react";
import { TradingViewChart } from "./TradingViewChart";
import { POPULAR_SYMBOLS } from "../services/binanceWebSocket";
import {
  X,
  Activity,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  BarChart3,
  Search,
} from "lucide-react";

interface BinanceMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSymbol?: string;
}

export const BinanceMarketModal: React.FC<BinanceMarketModalProps> = ({
  isOpen,
  onClose,
  initialSymbol = "BTCUSDT",
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialSymbol);
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!isOpen) return null;

  const filteredSymbols = POPULAR_SYMBOLS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.base.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[95vh] flex flex-col rounded-3xl bg-slate-950 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Binance Live Market Data
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-semibold">
                  Public WebSocket
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time OHLCV Candlesticks with local EMA, RSI, MACD & Bollinger Bands
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Crypto Ticker Pills */}
        <div className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900/40 border-b border-slate-800/80 overflow-x-auto select-none no-scrollbar">
          <span className="text-xs font-semibold text-slate-400 shrink-0 mr-1">
            Pairs:
          </span>
          {POPULAR_SYMBOLS.map((s) => (
            <button
              key={s.symbol}
              type="button"
              onClick={() => setSelectedSymbol(s.symbol)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold shrink-0 transition-all cursor-pointer ${
                selectedSymbol === s.symbol
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-xs scale-105"
                  : "bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {s.base}/{s.quote}
            </button>
          ))}
        </div>

        {/* Modal Main Chart Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <TradingViewChart
            initialSymbol={selectedSymbol}
            height={520}
            onSymbolChange={(sym) => setSelectedSymbol(sym)}
          />

          {/* Educational info on indicators */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="font-bold text-cyan-400 mb-1 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>EMA (9, 21, 50)</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Exponential Moving Averages weight recent price action to identify momentum and dynamic support/resistance levels.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="font-bold text-sky-400 mb-1 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Bollinger Bands (20, 2)</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                20-period standard deviation envelope measuring volatility and price expansion/contraction cycles.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="font-bold text-violet-400 mb-1 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                <span>RSI (14)</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Wilder's Relative Strength Index measures velocity. Values above 70 indicate overbought; below 30 indicate oversold.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="font-bold text-blue-400 mb-1 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>MACD (12, 26, 9)</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Moving Average Convergence Divergence tracks trend direction, momentum crossovers, and divergence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
