import React, { useState, useEffect, useCallback } from "react";
import { RotateCcw, Award, Sparkles, User, Bot, Crown } from "lucide-react";
import { playSound } from "../../utils/gameAudio";

type PieceColor = "w" | "b";
type PieceSymbol = "p" | "r" | "n" | "b" | "q" | "k";

interface ChessPiece {
  color: PieceColor;
  type: PieceSymbol;
}

type ChessBoard = (ChessPiece | null)[][];

interface Pos {
  r: number;
  c: number;
}

interface ChessMove {
  from: Pos;
  to: Pos;
  capture?: ChessPiece;
}

const PIECE_UNICODE: Record<string, string> = {
  "w-k": "♔",
  "w-q": "♕",
  "w-r": "♖",
  "w-b": "♗",
  "w-n": "♘",
  "w-p": "♙",
  "b-k": "♚",
  "b-q": "♛",
  "b-r": "♜",
  "b-b": "♝",
  "b-n": "♞",
  "b-p": "♟",
};

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 1000,
};

export const ChessGame: React.FC = () => {
  const [board, setBoard] = useState<ChessBoard>(() => initChessBoard());
  const [turn, setTurn] = useState<"w" | "b">("w");
  const [selectedPos, setSelectedPos] = useState<Pos | null>(null);
  const [validMoves, setValidMoves] = useState<ChessMove[]>([]);
  const [winner, setWinner] = useState<"player" | "ai" | null>(null);
  const [whiteCaptured, setWhiteCaptured] = useState<ChessPiece[]>([]);
  const [blackCaptured, setBlackCaptured] = useState<ChessPiece[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  function initChessBoard(): ChessBoard {
    const b: ChessBoard = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));

    // Black major pieces (Row 0)
    const blackRow: PieceSymbol[] = ["r", "n", "b", "q", "k", "b", "n", "r"];
    for (let c = 0; c < 8; c++) {
      b[0][c] = { color: "b", type: blackRow[c] };
      b[1][c] = { color: "b", type: "p" };
    }

    // White major pieces (Row 7)
    const whiteRow: PieceSymbol[] = ["r", "n", "b", "q", "k", "b", "n", "r"];
    for (let c = 0; c < 8; c++) {
      b[6][c] = { color: "w", type: "p" };
      b[7][c] = { color: "w", type: whiteRow[c] };
    }

    return b;
  }

  const resetGame = () => {
    playSound("click");
    setBoard(initChessBoard());
    setTurn("w");
    setSelectedPos(null);
    setValidMoves([]);
    setWinner(null);
    setWhiteCaptured([]);
    setBlackCaptured([]);
    setIsAiThinking(false);
    setMoveHistory([]);
  };

  // Generate Moves for a specific piece
  const getMovesForPiece = useCallback((b: ChessBoard, pos: Pos): ChessMove[] => {
    const piece = b[pos.r][pos.c];
    if (!piece) return [];

    const moves: ChessMove[] = [];
    const color = piece.color;
    const oppColor: PieceColor = color === "w" ? "b" : "w";

    const isInside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

    const addMove = (r: number, c: number) => {
      if (!isInside(r, c)) return false;
      const target = b[r][c];
      if (target === null) {
        moves.push({ from: pos, to: { r, c } });
        return true; // continue sliding
      }
      if (target.color === oppColor) {
        moves.push({ from: pos, to: { r, c }, capture: target });
      }
      return false; // hit piece, stop sliding
    };

    switch (piece.type) {
      case "p": {
        const dir = color === "w" ? -1 : 1;
        const startRow = color === "w" ? 6 : 1;

        // 1 step forward
        if (isInside(pos.r + dir, pos.c) && b[pos.r + dir][pos.c] === null) {
          moves.push({ from: pos, to: { r: pos.r + dir, c: pos.c } });
          // 2 steps forward from start
          if (pos.r === startRow && b[pos.r + dir * 2][pos.c] === null) {
            moves.push({ from: pos, to: { r: pos.r + dir * 2, c: pos.c } });
          }
        }
        // Diagonal captures
        for (const dc of [-1, 1]) {
          const nr = pos.r + dir;
          const nc = pos.c + dc;
          if (isInside(nr, nc)) {
            const target = b[nr][nc];
            if (target && target.color === oppColor) {
              moves.push({ from: pos, to: { r: nr, c: nc }, capture: target });
            }
          }
        }
        break;
      }
      case "n": {
        const knightJumps = [
          [-2, -1],
          [-2, 1],
          [-1, -2],
          [-1, 2],
          [1, -2],
          [1, 2],
          [2, -1],
          [2, 1],
        ];
        for (const [dr, dc] of knightJumps) {
          const nr = pos.r + dr;
          const nc = pos.c + dc;
          if (isInside(nr, nc)) {
            const target = b[nr][nc];
            if (target === null || target.color === oppColor) {
              moves.push({ from: pos, to: { r: nr, c: nc }, capture: target || undefined });
            }
          }
        }
        break;
      }
      case "b": {
        const dirs = [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ];
        for (const [dr, dc] of dirs) {
          let step = 1;
          while (addMove(pos.r + dr * step, pos.c + dc * step)) {
            step++;
          }
        }
        break;
      }
      case "r": {
        const dirs = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        for (const [dr, dc] of dirs) {
          let step = 1;
          while (addMove(pos.r + dr * step, pos.c + dc * step)) {
            step++;
          }
        }
        break;
      }
      case "q": {
        const dirs = [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        for (const [dr, dc] of dirs) {
          let step = 1;
          while (addMove(pos.r + dr * step, pos.c + dc * step)) {
            step++;
          }
        }
        break;
      }
      case "k": {
        const dirs = [
          [-1, -1],
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
          [1, 1],
        ];
        for (const [dr, dc] of dirs) {
          const nr = pos.r + dr;
          const nc = pos.c + dc;
          if (isInside(nr, nc)) {
            const target = b[nr][nc];
            if (target === null || target.color === oppColor) {
              moves.push({ from: pos, to: { r: nr, c: nc }, capture: target || undefined });
            }
          }
        }
        break;
      }
    }

    return moves;
  }, []);

  const getAllMovesForColor = useCallback(
    (b: ChessBoard, color: PieceColor): ChessMove[] => {
      const moves: ChessMove[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = b[r][c];
          if (p && p.color === color) {
            moves.push(...getMovesForPiece(b, { r, c }));
          }
        }
      }
      return moves;
    },
    [getMovesForPiece]
  );

  const handleSquareClick = (r: number, c: number) => {
    if (turn !== "w" || winner || isAiThinking) return;

    if (selectedPos) {
      const move = validMoves.find((m) => m.to.r === r && m.to.c === c);
      if (move) {
        executeMove(move);
        return;
      }
    }

    const piece = board[r][c];
    if (piece && piece.color === "w") {
      setSelectedPos({ r, c });
      setValidMoves(getMovesForPiece(board, { r, c }));
      playSound("click");
    } else {
      setSelectedPos(null);
      setValidMoves([]);
    }
  };

  const executeMove = (move: ChessMove) => {
    const newBoard = board.map((row) => [...row]);
    const piece = newBoard[move.from.r][move.from.c];
    if (!piece) return;

    newBoard[move.from.r][move.from.c] = null;

    // Pawn Promotion to Queen
    let finalPiece = piece;
    if (piece.type === "p" && (move.to.r === 0 || move.to.r === 7)) {
      finalPiece = { color: piece.color, type: "q" };
    }

    // Capture
    if (move.capture) {
      if (move.capture.color === "b") {
        setBlackCaptured((prev) => [...prev, move.capture!]);
      } else {
        setWhiteCaptured((prev) => [...prev, move.capture!]);
      }
      playSound("capture");
    } else {
      playSound("move");
    }

    newBoard[move.to.r][move.to.c] = finalPiece;

    setBoard(newBoard);
    setSelectedPos(null);
    setValidMoves([]);

    const cols = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const notation = `${piece.color === "w" ? "White" : "Black"}: ${piece.type.toUpperCase()}${
      cols[move.from.c]
    }${8 - move.from.r} -> ${cols[move.to.c]}${8 - move.to.r}${move.capture ? " (x)" : ""}`;
    setMoveHistory((prev) => [notation, ...prev.slice(0, 9)]);

    // Check if King was captured
    if (move.capture?.type === "k") {
      setWinner(piece.color === "w" ? "player" : "ai");
      playSound(piece.color === "w" ? "victory" : "defeat");
      return;
    }

    setTurn(piece.color === "w" ? "b" : "w");
  };

  // AI Turn Logic
  useEffect(() => {
    if (turn !== "b" || winner) return;

    setIsAiThinking(true);
    const timer = setTimeout(() => {
      const aiMoves = getAllMovesForColor(board, "b");
      if (aiMoves.length === 0) {
        setWinner("player");
        playSound("victory");
        setIsAiThinking(false);
        return;
      }

      // Score moves based on captures and piece value
      let bestMove = aiMoves[0];

      if (difficulty === "easy") {
        bestMove = aiMoves[Math.floor(Math.random() * aiMoves.length)];
      } else {
        const scoredMoves = aiMoves.map((m) => {
          let score = 0;
          if (m.capture) {
            score += PIECE_VALUES[m.capture.type] * 10;
          }
          // Center control bonus
          if (m.to.c >= 2 && m.to.c <= 5 && m.to.r >= 3 && m.to.r <= 5) {
            score += 4;
          }
          // Pawn promotion bonus
          if (board[m.from.r][m.from.c]?.type === "p" && m.to.r === 7) {
            score += 80;
          }
          return { move: m, score };
        });

        scoredMoves.sort((a, b) => b.score - a.score);
        bestMove = scoredMoves[0].move;
      }

      executeMove(bestMove);
      setIsAiThinking(false);
    }, 700);

    return () => clearTimeout(timer);
  }, [turn, winner, board, difficulty, getAllMovesForColor]);

  const cols = ["a", "b", "c", "d", "e", "f", "g", "h"];

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center justify-center h-full max-w-5xl mx-auto p-2 sm:p-4 select-none">
      {/* Center: 8x8 Chessboard */}
      <div className="flex flex-col items-center">
        {/* Black (AI) Header */}
        <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl mb-3 border border-slate-200 dark:border-zinc-700">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs text-lg">
              ♚
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center space-x-1.5">
                <span>Kelvis AI (Black)</span>
                {isAiThinking && (
                  <span className="text-[10px] text-amber-500 font-mono animate-pulse">
                    Calculating...
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1 text-xs text-slate-400">
                <span>Captured:</span>
                {whiteCaptured.map((p, i) => (
                  <span key={i} className="text-slate-800 dark:text-zinc-200">
                    {PIECE_UNICODE[`${p.color}-${p.type}`]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
              turn === "b"
                ? "bg-amber-500 text-white animate-pulse"
                : "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300"
            }`}
          >
            {turn === "b" ? "AI's Turn" : "Your Turn"}
          </span>
        </div>

        {/* Board Container */}
        <div className="relative p-2.5 sm:p-3.5 bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 rounded-3xl shadow-2xl border-4 border-stone-700">
          <div className="grid grid-cols-8 grid-rows-8 w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[460px] md:h-[460px] border border-stone-600 rounded-2xl overflow-hidden shadow-inner">
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
                        ? "bg-[#779952] hover:bg-[#88aa63]"
                        : "bg-[#edeed1] hover:bg-[#f6f6e8]"
                    } ${isSelected ? "ring-4 ring-amber-400 z-10" : ""}`}
                  >
                    {/* Rank & File Coordinate Labels */}
                    {c === 0 && (
                      <span className="absolute top-0.5 left-1 text-[9px] font-bold opacity-60 pointer-events-none">
                        {8 - r}
                      </span>
                    )}
                    {r === 7 && (
                      <span className="absolute bottom-0.5 right-1 text-[9px] font-bold opacity-60 pointer-events-none">
                        {cols[c]}
                      </span>
                    )}

                    {/* Move Indicator */}
                    {isValidTarget && (
                      <div className="absolute w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-400/80 shadow-md shadow-amber-400/40 animate-pulse z-20" />
                    )}

                    {/* Chess Piece */}
                    {piece && (
                      <span
                        className={`text-3xl sm:text-4xl md:text-5xl select-none leading-none transform transition-transform active:scale-95 ${
                          piece.color === "w"
                            ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                            : "text-zinc-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]"
                        } ${isSelected ? "scale-110" : ""}`}
                      >
                        {PIECE_UNICODE[`${piece.color}-${piece.type}`]}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* White (Player) Header */}
        <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl mt-3 border border-slate-200 dark:border-zinc-700">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-zinc-900 border border-slate-300 flex items-center justify-center shadow-xs text-lg font-bold">
              ♔
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                You (White Pieces)
              </div>
              <div className="flex items-center space-x-1 text-xs text-slate-400">
                <span>Captured:</span>
                {blackCaptured.map((p, i) => (
                  <span key={i} className="text-slate-800 dark:text-zinc-200">
                    {PIECE_UNICODE[`${p.color}-${p.type}`]}
                  </span>
                ))}
              </div>
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

      {/* Right Controls Panel */}
      <div className="w-full lg:w-72 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-3xl p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-zinc-100">
              Chess Grandmaster AI
            </h3>
          </div>

          {/* Difficulty */}
          <div className="mb-4">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              AI Engine Level
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

          {/* Notation / Move Log */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Move Notation
            </span>
            <div className="h-44 overflow-y-auto bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-slate-200 dark:border-zinc-700 text-[11px] font-mono space-y-1">
              {moveHistory.length === 0 ? (
                <div className="text-slate-400 text-center py-10">Make your opening move!</div>
              ) : (
                moveHistory.map((h, i) => (
                  <div
                    key={i}
                    className={h.startsWith("White") ? "text-emerald-500" : "text-amber-500"}
                  >
                    {h}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {winner && (
          <div
            className={`mt-4 p-4 rounded-2xl text-center shadow-lg border ${
              winner === "player"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
            }`}
          >
            <h4 className="text-base font-extrabold mb-1">
              {winner === "player" ? "🏆 Checkmate! You Won!" : "🤖 AI Checkmate!"}
            </h4>
            <p className="text-xs mb-3">
              {winner === "player"
                ? "Brilliant chess tactics!"
                : "Good tactical try! Rematch?"}
            </p>
            <button
              onClick={resetGame}
              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md active:scale-95 transition cursor-pointer"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
