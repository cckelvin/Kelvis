import React, { useState, useEffect } from "react";
import { Sparkles, RotateCcw, Award, User, Bot, HelpCircle, Layers, Flame } from "lucide-react";
import { playSound } from "../../utils/gameAudio";

export type WhotShape = "circle" | "triangle" | "cross" | "star" | "square" | "whot";

export interface WhotCard {
  id: string;
  shape: WhotShape;
  number: number;
}

const SHAPE_CONFIG: Record<WhotShape, { label: string; icon: string; color: string; bgColor: string }> = {
  circle: { label: "Circle", icon: "⭕", color: "text-rose-500", bgColor: "bg-rose-500/10 border-rose-500/30" },
  triangle: { label: "Triangle", icon: "🔺", color: "text-amber-500", bgColor: "bg-amber-500/10 border-amber-500/30" },
  cross: { label: "Cross", icon: "✝️", color: "text-blue-500", bgColor: "bg-blue-500/10 border-blue-500/30" },
  star: { label: "Star", icon: "⭐", color: "text-purple-500", bgColor: "bg-purple-500/10 border-purple-500/30" },
  square: { label: "Square", icon: "⬛", color: "text-emerald-500", bgColor: "bg-emerald-500/10 border-emerald-500/30" },
  whot: { label: "Whot 20", icon: "👑", color: "text-amber-400", bgColor: "bg-amber-400/20 border-amber-400/50" },
};

export const WhotCardsGame: React.FC = () => {
  const [deck, setDeck] = useState<WhotCard[]>([]);
  const [playerHand, setPlayerHand] = useState<WhotCard[]>([]);
  const [aiHand, setAiHand] = useState<WhotCard[]>([]);
  const [discardPile, setDiscardPile] = useState<WhotCard[]>([]);
  const [currentShape, setCurrentShape] = useState<WhotShape>("circle");
  const [turn, setTurn] = useState<"player" | "ai">("player");
  const [statusMessage, setStatusMessage] = useState<string>("Game started! Match the shape or number.");
  const [winner, setWinner] = useState<"player" | "ai" | null>(null);
  const [showShapePicker, setShowShapePicker] = useState<boolean>(false);
  const [pendingWhotCard, setPendingWhotCard] = useState<WhotCard | null>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Generate standard 54-card Whot Deck
  function createWhotDeck(): WhotCard[] {
    const shapes: WhotShape[] = ["circle", "triangle", "cross", "star", "square"];
    const numbers = [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14];
    const cards: WhotCard[] = [];

    shapes.forEach((s) => {
      numbers.forEach((n) => {
        cards.push({
          id: `${s}-${n}-${Math.random()}`,
          shape: s,
          number: n,
        });
      });
    });

    // Add four Whot 20 wild cards
    for (let i = 0; i < 4; i++) {
      cards.push({
        id: `whot-20-${i}`,
        shape: "whot",
        number: 20,
      });
    }

    // Shuffle deck
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return cards;
  }

  // Initialize new game
  const initGame = () => {
    playSound("card");
    const fullDeck = createWhotDeck();
    const pHand = fullDeck.splice(0, 5);
    const aHand = fullDeck.splice(0, 5);

    // Initial discard top card (ensure not 20 for starter)
    let startCardIndex = fullDeck.findIndex((c) => c.number !== 20 && c.number !== 2 && c.number !== 14);
    if (startCardIndex === -1) startCardIndex = 0;
    const starterCard = fullDeck.splice(startCardIndex, 1)[0];

    setDeck(fullDeck);
    setPlayerHand(pHand);
    setAiHand(aHand);
    setDiscardPile([starterCard]);
    setCurrentShape(starterCard.shape);
    setTurn("player");
    setStatusMessage(`Starter card: ${starterCard.number} of ${SHAPE_CONFIG[starterCard.shape].label}. Your turn!`);
    setWinner(null);
    setShowShapePicker(false);
    setPendingWhotCard(null);
  };

  useEffect(() => {
    initGame();
  }, []);

  const topDiscard = discardPile[discardPile.length - 1];

  // Validate if card can be played
  const canPlayCard = (card: WhotCard): boolean => {
    if (!topDiscard) return false;
    if (card.number === 20) return true; // Whot 20 can always be played
    if (card.shape === currentShape) return true; // Matches active shape
    if (card.number === topDiscard.number) return true; // Matches number
    return false;
  };

  // Player plays a card
  const handlePlayCard = (card: WhotCard) => {
    if (turn !== "player" || winner || isAiThinking) return;

    if (!canPlayCard(card)) {
      setStatusMessage("❌ Invalid move! Must match shape or number, or play Whot 20.");
      playSound("defeat");
      return;
    }

    // If Whot 20 played, open shape picker modal
    if (card.number === 20) {
      setPendingWhotCard(card);
      setShowShapePicker(true);
      return;
    }

    executePlay(card, "player", card.shape);
  };

  // Complete card play
  const executePlay = (card: WhotCard, who: "player" | "ai", chosenShape?: WhotShape) => {
    playSound("card");
    const activeChosenShape = chosenShape || (card.shape === "whot" ? "circle" : card.shape);

    // Remove from hand
    if (who === "player") {
      setPlayerHand((prev) => prev.filter((c) => c.id !== card.id));
    } else {
      setAiHand((prev) => prev.filter((c) => c.id !== card.id));
    }

    setDiscardPile((prev) => [...prev, card]);
    setCurrentShape(activeChosenShape);

    // Check winner
    const remainingHandSize = who === "player" ? playerHand.length - 1 : aiHand.length - 1;
    if (remainingHandSize === 0) {
      setWinner(who);
      playSound(who === "player" ? "victory" : "defeat");
      setStatusMessage(who === "player" ? "🎉 CHECK UP! You won the Whot game!" : "🤖 Kelvis AI shouts CHECK UP and won!");
      return;
    }

    // Special card action logic
    let nextTurn: "player" | "ai" = who === "player" ? "ai" : "player";
    let specialNote = "";

    if (card.number === 1) {
      // Hold On (Play again)
      nextTurn = who;
      specialNote = `HOLD ON (1)! ${who === "player" ? "You get" : "AI gets"} another turn.`;
      playSound("click");
    } else if (card.number === 2) {
      // Pick Two
      const target = who === "player" ? "ai" : "player";
      drawCardsFromMarket(target, 2);
      specialNote = `PICK TWO (2)! ${target === "player" ? "You draw" : "AI draws"} 2 cards.`;
      playSound("capture");
    } else if (card.number === 8) {
      // Suspension (Skip opponent)
      nextTurn = who;
      specialNote = `SUSPENSION (8)! ${who === "player" ? "You skipped AI" : "AI skipped your turn"}!`;
      playSound("click");
    } else if (card.number === 14) {
      // General Market
      const target = who === "player" ? "ai" : "player";
      drawCardsFromMarket(target, 1);
      specialNote = `GENERAL MARKET (14)! ${target === "player" ? "You draw" : "AI draws"} 1 card.`;
      playSound("capture");
    } else if (card.number === 20) {
      specialNote = `WHOT 20! Demanded shape is ${SHAPE_CONFIG[activeChosenShape].label} ${SHAPE_CONFIG[activeChosenShape].icon}`;
      playSound("victory");
    }

    setStatusMessage(specialNote || `${who === "player" ? "You" : "AI"} played ${card.number} ${SHAPE_CONFIG[card.shape].label}.`);
    setTurn(nextTurn);
  };

  // Draw cards from deck
  const drawCardsFromMarket = (who: "player" | "ai", count: number = 1) => {
    setDeck((prevDeck) => {
      let currentDeck = [...prevDeck];
      if (currentDeck.length < count) {
        // Reshuffle discard into deck
        const reshuffled = createWhotDeck();
        currentDeck = [...currentDeck, ...reshuffled];
      }
      const drawn = currentDeck.splice(0, count);

      if (who === "player") {
        setPlayerHand((prev) => [...prev, ...drawn]);
      } else {
        setAiHand((prev) => [...prev, ...drawn]);
      }

      return currentDeck;
    });
    playSound("card");
  };

  // Player manually goes to Market
  const handlePlayerDraw = () => {
    if (turn !== "player" || winner || isAiThinking) return;
    drawCardsFromMarket("player", 1);
    setStatusMessage("You drew 1 card from General Market. AI's turn!");
    setTurn("ai");
  };

  // AI Turn Logic
  useEffect(() => {
    if (turn !== "ai" || winner) return;

    setIsAiThinking(true);
    const timer = setTimeout(() => {
      // Find playable cards in AI hand
      const playableCards = aiHand.filter((c) => canPlayCard(c));

      if (playableCards.length > 0) {
        // AI chooses best playable card (prioritize special action cards: 2, 14, 8, 1, or 20)
        let chosen = playableCards[0];
        const specialAction = playableCards.find((c) => [2, 14, 8, 1, 20].includes(c.number));
        if (specialAction) chosen = specialAction;

        let requestedShape: WhotShape = "circle";
        if (chosen.number === 20) {
          // AI picks the shape it has the most cards of
          const shapeCounts: Record<string, number> = { circle: 0, triangle: 0, cross: 0, star: 0, square: 0 };
          aiHand.forEach((c) => {
            if (c.shape !== "whot") shapeCounts[c.shape]++;
          });
          const bestShape = Object.entries(shapeCounts).sort((a, b) => b[1] - a[1])[0][0] as WhotShape;
          requestedShape = bestShape || "triangle";
        }

        executePlay(chosen, "ai", requestedShape);
      } else {
        // AI goes to market
        drawCardsFromMarket("ai", 1);
        setStatusMessage("AI went to General Market to draw a card. Your turn!");
        setTurn("player");
      }

      setIsAiThinking(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [turn, winner, aiHand, deck, currentShape]);

  return (
    <div className="flex flex-col items-center justify-between h-full max-w-4xl mx-auto p-2 sm:p-4 select-none relative">
      {/* Top AI Hand Display */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl border border-slate-200 dark:border-zinc-700">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-zinc-100 flex items-center space-x-1.5">
              <span>Kelvis AI</span>
              {isAiThinking && (
                <span className="text-[10px] text-amber-500 font-mono animate-pulse">Playing...</span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">{aiHand.length} cards remaining</div>
          </div>
        </div>

        {/* AI Facedown Cards Stack */}
        <div className="flex items-center -space-x-4">
          {aiHand.map((_, idx) => (
            <div
              key={idx}
              className="w-8 h-12 sm:w-10 sm:h-14 rounded-lg bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 border border-amber-600/80 shadow-md transform rotate-2 flex items-center justify-center text-[10px] text-amber-300 font-bold"
            >
              W
            </div>
          ))}
        </div>
      </div>

      {/* Center Table: Discard Pile + Market Deck */}
      <div className="my-6 sm:my-8 flex flex-col items-center">
        {/* Status Notification Banner */}
        <div className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-semibold mb-4 text-center max-w-md shadow-xs">
          {statusMessage}
        </div>

        <div className="flex items-center space-x-8 sm:space-x-12">
          {/* General Market (Draw Deck) */}
          <div
            onClick={handlePlayerDraw}
            className={`group flex flex-col items-center cursor-pointer ${
              turn === "player" && !winner ? "hover:scale-105" : "opacity-80"
            } transition-transform`}
          >
            <div className="relative w-24 h-36 sm:w-28 sm:h-40 rounded-2xl bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 border-2 border-amber-600/80 shadow-2xl flex flex-col items-center justify-center text-amber-300">
              <Layers className="w-8 h-8 mb-1 opacity-80 group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-black tracking-wider uppercase">Market</span>
              <span className="text-[10px] opacity-70">({deck.length})</span>
            </div>
            <span className="text-[11px] font-bold text-slate-500 mt-2">
              {turn === "player" ? "Click to Draw" : "Market"}
            </span>
          </div>

          {/* Top Discard Card */}
          <div className="flex flex-col items-center">
            {topDiscard ? (
              <div
                className={`w-24 h-36 sm:w-28 sm:h-40 rounded-2xl bg-white dark:bg-zinc-800 border-2 shadow-2xl flex flex-col items-center justify-between p-3 transition-transform ${
                  SHAPE_CONFIG[topDiscard.shape].bgColor
                } border-amber-500/50`}
              >
                <div className="w-full flex items-center justify-between text-xs font-black">
                  <span>{topDiscard.number}</span>
                  <span>{SHAPE_CONFIG[topDiscard.shape].icon}</span>
                </div>
                <div className="text-3xl sm:text-4xl">{SHAPE_CONFIG[topDiscard.shape].icon}</div>
                <div className="w-full flex items-center justify-between text-xs font-black rotate-180">
                  <span>{topDiscard.number}</span>
                  <span>{SHAPE_CONFIG[topDiscard.shape].icon}</span>
                </div>
              </div>
            ) : (
              <div className="w-24 h-36 rounded-2xl border-2 border-dashed border-slate-300" />
            )}
            <div className="flex items-center space-x-1.5 mt-2">
              <span className="text-[11px] font-bold text-slate-400">Demand:</span>
              <span className={`text-xs font-bold ${SHAPE_CONFIG[currentShape].color} flex items-center space-x-1`}>
                <span>{SHAPE_CONFIG[currentShape].icon}</span>
                <span>{SHAPE_CONFIG[currentShape].label}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Player Hand */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2 px-2">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              Your Hand ({playerHand.length} cards)
            </span>
          </div>

          <button
            onClick={initGame}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 flex items-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restart</span>
          </button>
        </div>

        {/* Fanned out interactive hand cards */}
        <div className="flex items-center justify-center -space-x-3 sm:-space-x-4 overflow-x-auto py-4 px-2">
          {playerHand.map((card) => {
            const playable = canPlayCard(card) && turn === "player" && !winner;
            return (
              <div
                key={card.id}
                onClick={() => handlePlayCard(card)}
                className={`relative w-20 h-32 sm:w-24 sm:h-36 rounded-2xl bg-white dark:bg-zinc-800 border-2 shadow-xl flex flex-col justify-between p-2.5 transition-all duration-200 shrink-0 select-none ${
                  playable
                    ? "cursor-pointer hover:-translate-y-4 hover:shadow-2xl ring-2 ring-amber-400 border-amber-500"
                    : "opacity-60 border-slate-300 dark:border-zinc-700 cursor-not-allowed"
                } ${SHAPE_CONFIG[card.shape].bgColor}`}
              >
                <div className="w-full flex items-center justify-between text-xs font-extrabold">
                  <span>{card.number}</span>
                  <span>{SHAPE_CONFIG[card.shape].icon}</span>
                </div>
                <div className="text-center text-2xl sm:text-3xl my-auto">
                  {SHAPE_CONFIG[card.shape].icon}
                </div>
                <div className="w-full flex items-center justify-between text-xs font-extrabold rotate-180">
                  <span>{card.number}</span>
                  <span>{SHAPE_CONFIG[card.shape].icon}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for Whot 20 Shape Selection */}
      {showShapePicker && pendingWhotCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 mb-1">
              👑 WHOT 20! Choose Demand Shape
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
              Select which shape the next player must match:
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(["circle", "triangle", "cross", "star", "square"] as WhotShape[]).map((shape) => (
                <button
                  key={shape}
                  onClick={() => {
                    setShowShapePicker(false);
                    if (pendingWhotCard) {
                      executePlay(pendingWhotCard, "player", shape);
                      setPendingWhotCard(null);
                    }
                  }}
                  className={`p-3 rounded-2xl border flex items-center space-x-2.5 font-bold text-xs transition active:scale-95 cursor-pointer ${SHAPE_CONFIG[shape].bgColor}`}
                >
                  <span className="text-xl">{SHAPE_CONFIG[shape].icon}</span>
                  <span className="text-slate-800 dark:text-zinc-200">
                    {SHAPE_CONFIG[shape].label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Winner Popup */}
      {winner && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 mb-1">
              {winner === "player" ? "🏆 CHECK UP! VICTORY!" : "🤖 KELVIS AI CHECK UP!"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5">
              {winner === "player"
                ? "You emptied your hand and won the Whot tournament!"
                : "The AI outmaneuvered you with smart action cards."}
            </p>
            <button
              onClick={initGame}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              Play Another Round
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
