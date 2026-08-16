import React, { useState, useEffect, useCallback } from "react";
import { Crown, RotateCcw, Award, Sparkles, User, Bot, Volume2, VolumeX, ShieldAlert } from "lucide-react";
import { playSound } from "../../utils/gameAudio";

type PieceType = "red" | "black" | "red-king" | "black-king" | null;
type BoardState = PieceType[][];

interface Position {
  r: number;
  c: number;
}

interface Move {
  from: Position;
  to: Position;
  captures?: Position[];
}

export const CheckersGame: React.FC = () => {
  const [board, setBoard] = useState<BoardState>(() => initBoard());
  const [turn, setTurn] = useState<"player" | "ai">("player");
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [winner, setWinner] = useState<"player" | "ai" | "draw" | null>(null);
  const [redCaptured, setRedCaptured] = useState(0);
  const [blackCaptured, setBlackCaptured] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  function initBoard(): BoardState {
    const b: BoardState = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));

    // Black pieces (AI) at top rows 0, 1, 2 on dark squares (r+c is odd)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          b[r][c] = "black";
        }
      }
    }

    // Red pieces (Player) at bottom rows 5, 6, 7 on dark squares
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          b[r][c] = "red";
        }
      }
    }

    return b;
  }

  const resetGame = () => {
    playSound("click");
    setBoard(initBoard());
    setTurn("player");
    setSelectedPos(null);
    setValidMoves([]);
    setWinner(null);
    setRedCaptured(0);
    setBlackCaptured(0);
    setIsAiThinking(false);
    setMoveHistory([]);
  };

  // Get all valid moves for a piece at (r, c)
  const getMovesForPiece = useCallback((b: BoardState, pos: Position): Move[] => {
    const piece = b[pos.r][pos.c];
    if (!piece) return [];

    const isRed = piece.startsWith("red");
    const isKing = piece.endsWith("-king");
    const moves: Move[] = [];

    // Directions
    const directions: number[][] = [];
    if (isRed || isKing) {
      directions.push([-1, -1], [-1, 1]); // Move up
    }
    if (!isRed || isKing) {
      directions.push([1, -1], [1, 1]); // Move down
    }

    // Check simple 1-step diagonal moves
    for (const [dr, dc] of directions) {
      const nr = pos.r + dr;
      const nc = pos.c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        if (b[nr][nc] === null) {
          moves.push({ from: pos, to: { r: nr, c: nc } });
        }
      }
    }

    // Check 2-step capture jumps
    for (const [dr, dc] of directions) {
      const midR = pos.r + dr;
      const midC = pos.c + dc;
      const jumpR = pos.r + dr * 2;
      const jumpC = pos.c + dc * 2;

      if (jumpR >= 0 && jumpR < 8 && jumpC >= 0 && jumpC < 8) {
        const midPiece = b[midR][midC];
        if (midPiece && midPiece.startsWith(isRed ? "black" : "red") && b[jumpR][jumpC] === null) {
          moves.push({
            from: pos,
            to: { r: jumpR, c: jumpC },
            captures: [{ r: midR, c: midC }],
          });
        }
      }
    }

    return moves;
  }, []);

  // Check if player has any captures available across the board (mandatory jump rule preference)
  const getAllMovesForSide = useCallback(
    (b: BoardState, side: "player" | "ai"): Move[] => {
      const isRedSide = side === "player";
      const allMoves: Move[] = [];
      const jumpMoves: Move[] = [];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = b[r][c];
          if (p && p.startsWith(isRedSide ? "red" : "black")) {
            const pieceMoves = getMovesForPiece(b, { r, c });
            for (const m of pieceMoves) {
              if (m.captures && m.captures.length > 0) {
                jumpMoves.push(m);
              }
              allMoves.push(m);
            }
          }
        }
      }

      return jumpMoves.length > 0 ? jumpMoves : allMoves;
    },
    [getMovesForPiece]
  );

  // Handle Square Click
  const handleSquareClick = (r: number, c: number) => {
    if (turn !== "player" || winner || isAiThinking) return;

    // If already selected, check if clicked a valid target square
    if (selectedPos) {
      const matchingMove = validMoves.find((m) => m.to.r === r && m.to.c === c);
      if (matchingMove) {
        executeMove(matchingMove);
        return;
      }
    }

    // Select new player piece
    const piece = board[r][c];
    if (piece && piece.startsWith("red")) {
      const allSideMoves = getAllMovesForSide(board, "player");
      const moves = allSideMoves.filter((m) => m.from.r === r && m.from.c === c);
      setSelectedPos({ r, c });
      setValidMoves(moves);
      playSound("click");
    } else {
      setSelectedPos(null);
      setValidMoves([]);
    }
  };

  // Execute a Move
  const executeMove = (move: Move) => {
    const newBoard = board.map((row) => [...row]);
    const piece = newBoard[move.from.r][move.from.c];
    if (!piece) return;

    newBoard[move.from.r][move.from.c] = null;

    // Check King promotion
    let finalPiece = piece;
    if (piece === "red" && move.to.r === 0) {
      finalPiece = "red-king";
      playSound("victory");
    } else if (piece === "black" && move.to.r === 7) {
      finalPiece = "black-king";
    }

    newBoard[move.to.r][move.to.c] = finalPiece;

    // Handle Captures
    if (move.captures && move.captures.length > 0) {
      for (const cap of move.captures) {
        const capturedPiece = newBoard[cap.r][cap.c];
        newBoard[cap.r][cap.c] = null;
        if (capturedPiece?.startsWith("black")) {
          setBlackCaptured((prev) => prev + 1);
        } else if (capturedPiece?.startsWith("red")) {
          setRedCaptured((prev) => prev + 1);
        }
      }
      playSound("capture");
    } else {
      playSound("move");
    }

    setBoard(newBoard);
    setSelectedPos(null);
    setValidMoves([]);

    const moveNotation = `${piece?.startsWith("red") ? "Player" : "AI"}: (${move.from.r},${move.from.c}) -> (${move.to.r},${move.to.c})`;
    setMoveHistory((prev) => [moveNotation, ...prev.slice(0, 9)]);

    // Check winner
    const nextSide = turn === "player" ? "ai" : "player";
    const nextMoves = getAllMovesForSide(newBoard, nextSide);

    if (nextMoves.length === 0) {
      setWinner(turn); // current mover wins
      playSound(turn === "player" ? "victory" : "defeat");
      return;
    }

    setTurn(nextSide);
  };

  // AI Turn Logic
  useEffect(() => {
    if (turn !== "ai" || winner) return;

    setIsAiThinking(true);
    const timer = setTimeout(() => {
      const aiMoves = getAllMovesForSide(board, "ai");
      if (aiMoves.length === 0) {
        setWinner("player");
        playSound("victory");
        setIsAiThinking(false);
        return;
      }

      // Prioritize capture jumps, then king moves, then center control
      let chosenMove: Move = aiMoves[0];

      if (difficulty === "easy") {
        chosenMove = aiMoves[Math.floor(Math.random() * aiMoves.length)];
      } else {
        const scoredMoves = aiMoves.map((m) => {
          let score = 0;
          if (m.captures && m.captures.length > 0) score += 20;
          if (m.to.r === 7 && board[m.from.r][m.from.c] === "black") score += 15; // Promotion
          if (m.to.c >= 2 && m.to.c <= 5 && m.to.r >= 2 && m.to.r <= 5) score += 5; // Center
          return { move: m, score };
        });

        scoredMoves.sort((a, b) => b.score - a.score);
        chosenMove = scoredMoves[0].move;
      }

      executeMove(chosenMove);
      setIsAiThinking(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [turn, winner, board, difficulty, getAllMovesForSide]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center justify-center h-full max-w-5xl mx-auto p-2 sm:p-4 select-none">
      {/* Left / Center: Checkers 8x8 Board */}
      <div className="flex flex-col items-center">
        {/* Top Status Bar: AI Opponent Info */}
        <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl mb-3 border border-slate-200 dark:border-zinc-700">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center space-x-1.5">
                <span>Kelvis AI (Black)</span>
                {isAiThinking && (
                  <span className="text-[10px] text-amber-500 font-mono animate-pulse">
                    Thinking...
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">Captured: {redCaptured} pieces</div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                turn === "ai"
                  ? "bg-amber-500 text-white animate-pulse"
                  : "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300"
              }`}
            >
              {turn === "ai" ? "AI's Turn" : "Your Turn"}
            </span>
          </div>
        </div>

        {/* 8x8 Board Container */}
        <div className="relative p-2.5 sm:p-3.5 bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950 rounded-3xl shadow-2xl border-4 border-amber-800/80">
          <div className="grid grid-cols-8 grid-rows-8 w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[460px] md:h-[460px] border-2 border-amber-900/60 rounded-2xl overflow-hidden shadow-inner">
            {board.map((row, r) =>
              row.map((piece, c) => {
                const isDark = (r + c) % 2 === 1;
                const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                const isValidTarget = validMoves.some((m) => m.to.r === r && m.to.c === c);

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    className={`relative flex items-center justify-center transition-colors cursor-pointer ${
                      isDark
                        ? "bg-[#3e2723] hover:bg-[#4e342e]"
                        : "bg-[#d7ccc8]"
                    } ${isSelected ? "ring-4 ring-amber-400 z-10" : ""}`}
                  >
                    {/* Valid Move Indicator Dot / Ring */}
                    {isValidTarget && (
                      <div className="absolute w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-400/90 shadow-lg shadow-amber-400/50 animate-bounce z-20" />
                    )}

                    {/* Piece Rendering */}
                    {piece && (
                      <div
                        className={`w-4/5 h-4/5 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-10 ${
                          piece.startsWith("red")
                            ? "bg-gradient-to-tr from-red-600 via-rose-500 to-red-400 border-2 border-red-300 text-white shadow-red-500/40"
                            : "bg-gradient-to-tr from-zinc-950 via-zinc-800 to-zinc-700 border-2 border-zinc-500 text-amber-400 shadow-black/60"
                        } ${isSelected ? "scale-105" : ""}`}
                      >
                        {piece.endsWith("-king") && (
                          <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 fill-amber-300 drop-shadow-md" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Status Bar: Player Info */}
        <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl mt-3 border border-slate-200 dark:border-zinc-700">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                You (Red Pieces)
              </div>
              <div className="text-[10px] text-slate-400">Captured: {blackCaptured} pieces</div>
            </div>
          </div>

          <button
            onClick={resetGame}
            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 dark:hover:bg-zinc-600 text-slate-700 dark:text-zinc-200 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Right Controls / Dashboard Panel */}
      <div className="w-full lg:w-72 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-3xl p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-zinc-100">
              Live Checkers Arena
            </h3>
          </div>

          {/* Difficulty Selector */}
          <div className="mb-4">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              AI Difficulty
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                    difficulty === d
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-slate-200 dark:bg-zinc-700/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-300"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Rules / Guide */}
          <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 text-xs text-slate-600 dark:text-zinc-300 space-y-1.5 mb-4">
            <div className="font-bold text-slate-900 dark:text-zinc-100 flex items-center space-x-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Rules of Checkers</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              • Move 1 step forward diagonally.
              <br />
              • Jump over opponent pieces to capture.
              <br />• Reach row 0 to become a 👑 King (can move backwards!).
            </p>
          </div>

          {/* Recent Moves Log */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Move History
            </span>
            <div className="h-28 overflow-y-auto bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-slate-200 dark:border-zinc-700 text-[11px] font-mono space-y-1">
              {moveHistory.length === 0 ? (
                <div className="text-slate-400 text-center py-6">Game started. Make a move!</div>
              ) : (
                moveHistory.map((h, i) => (
                  <div
                    key={i}
                    className={h.startsWith("Player") ? "text-red-500" : "text-amber-500"}
                  >
                    {h}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Winner Dialog Banner */}
        {winner && (
          <div
            className={`mt-4 p-4 rounded-2xl text-center shadow-lg border ${
              winner === "player"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
            }`}
          >
            <h4 className="text-base font-extrabold mb-1">
              {winner === "player" ? "🎉 Victory! You Won!" : "🤖 Kelvis AI Won!"}
            </h4>
            <p className="text-xs mb-3">
              {winner === "player"
                ? "Brilliant draughts tactics against the AI."
                : "Good game! Ready for a rematch?"}
            </p>
            <button
              onClick={resetGame}
              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md active:scale-95 transition cursor-pointer"
            >
              Play Rematch
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
