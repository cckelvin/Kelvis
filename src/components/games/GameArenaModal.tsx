import React, { useState } from "react";
import { X, Maximize2, Minimize2, Sparkles, Gamepad2, Shield, Layers, Crosshair, Award } from "lucide-react";
import { CheckersGame } from "./CheckersGame";
import { ChessGame } from "./ChessGame";
import { WhotCardsGame } from "./WhotCardsGame";
import { ThreeShooterGame } from "./ThreeShooterGame";
import { GameType } from "../../types";

interface GameArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGame?: GameType;
}

export const GameArenaModal: React.FC<GameArenaModalProps> = ({
  isOpen,
  onClose,
  initialGame = "checkers",
}) => {
  const [selectedGame, setSelectedGame] = useState<GameType>(initialGame);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sync initial game when opened
  React.useEffect(() => {
    if (initialGame) {
      const gStr = String(initialGame).toLowerCase();
      const normalized: GameType =
        gStr === "white" || gStr === "cards" || gStr === "whot"
          ? "whot"
          : gStr.includes("shooter") || gStr.includes("3d")
          ? "3d-shooter"
          : gStr.includes("chess")
          ? "chess"
          : "checkers";
      setSelectedGame(normalized);
    }
  }, [initialGame, isOpen]);

  if (!isOpen) return null;

  const gamesList: Array<{ id: GameType; name: string; icon: any; color: string; badge: string }> = [
    { id: "checkers", name: "Checkers", icon: Award, color: "text-red-500", badge: "8x8 Draughts" },
    { id: "chess", name: "Chess", icon: Shield, color: "text-amber-500", badge: "Tactical Chess" },
    { id: "whot", name: "Cards / Whot!", icon: Layers, color: "text-emerald-500", badge: "Classic Whot" },
    { id: "3d-shooter", name: "3D Shooter", icon: Crosshair, color: "text-sky-500", badge: "Battle Arena" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col transition-all duration-300 ${
          isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[92vh] max-h-[850px]"
        }`}
      >
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-900/50 rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-2xs">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-zinc-100">
                  Kelvis AI Game Arena
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Live AI Play
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 hidden sm:block">
                Challenge Kelvis in real-time tactical board games, African Whot, or 3D Battle Shooters.
              </p>
            </div>
          </div>

          {/* Game Switcher Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-200/60 dark:bg-zinc-800/60 p-1 rounded-2xl border border-slate-200 dark:border-zinc-700/60 overflow-x-auto max-w-[280px] sm:max-w-none">
            {gamesList.map((g) => {
              const Icon = g.icon;
              const isActive = selectedGame === g.id || (selectedGame === "cards" && g.id === "whot");
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGame(g.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? g.color : ""}`} />
                  <span>{g.name}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 shrink-0 ml-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Close Arena"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Game Canvas Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 relative">
          {selectedGame === "checkers" && <CheckersGame />}
          {selectedGame === "chess" && <ChessGame />}
          {(selectedGame === "whot" || selectedGame === "cards") && <WhotCardsGame />}
          {(selectedGame === "3d-shooter" || selectedGame === "shooter") && <ThreeShooterGame />}
        </div>
      </div>
    </div>
  );
};
