import React, { useEffect } from 'react';
import { GameState } from '../types/game';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Home, CheckCircle2, Award, Zap } from 'lucide-react';

interface ResultsViewProps {
  game: GameState;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ game, onPlayAgain, onHome }) => {
  const p1Score = game.player1_score;
  const p2Score = game.player2_score;
  const isTie = p1Score === p2Score;
  const p1Wins = p1Score > p2Score;
  const p2Wins = p2Score > p1Score;

  const winnerName = isTie
    ? "It's a Tie!"
    : p1Wins
    ? `${game.player1_name} Wins!`
    : `${game.player2_name} Wins!`;

  // Trigger celebration confetti if not tie
  useEffect(() => {
    if (!isTie) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899'],
      });
    }
  }, [isTie]);

  const p1ValidWords = game.player1_words.filter((w) => w.valid);
  const p2ValidWords = game.player2_words.filter((w) => w.valid);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fadeIn">
      {/* Victory Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-xl shadow-amber-500/10">
          <Trophy className="w-12 h-12" />
        </div>
        <h1 className="font-game text-4xl sm:text-5xl font-bold tracking-tight text-white">
          {winnerName}
        </h1>
        <p className="text-slate-400 text-sm">
          Base Word: <span className="text-emerald-400 font-game font-bold tracking-widest uppercase">{game.main_word}</span>
        </p>
      </div>

      {/* Head-to-Head Comparative Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Player 1 Outcome Card */}
        <div
          className={`p-6 rounded-3xl glass-panel border transition-all ${
            p1Wins
              ? 'border-amber-400 bg-amber-500/10 shadow-2xl shadow-amber-500/20 scale-[1.02]'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-game text-xl font-bold text-white flex items-center gap-2">
              <Award className={`w-5 h-5 ${p1Wins ? 'text-amber-400' : 'text-slate-500'}`} />
              {game.player1_name}
            </span>
            {p1Wins && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                VICTORY
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-400 font-mono">TOTAL SCORE</span>
              <span className="font-game text-3xl font-bold text-emerald-400">
                {p1Score} <span className="text-xs font-sans text-slate-500">pts</span>
              </span>
            </div>

            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>VALID WORDS</span>
              <span className="text-white font-bold">{p1ValidWords.length}</span>
            </div>

            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>BASE LENGTH SUM</span>
              <span className="text-white font-bold">
                {p1ValidWords.reduce((acc, w) => acc + (w.length || w.word.length), 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Player 2 Outcome Card */}
        <div
          className={`p-6 rounded-3xl glass-panel border transition-all ${
            p2Wins
              ? 'border-amber-400 bg-amber-500/10 shadow-2xl shadow-amber-500/20 scale-[1.02]'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-game text-xl font-bold text-white flex items-center gap-2">
              <Award className={`w-5 h-5 ${p2Wins ? 'text-amber-400' : 'text-slate-500'}`} />
              {game.player2_name}
            </span>
            {p2Wins && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                VICTORY
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-400 font-mono">TOTAL SCORE</span>
              <span className="font-game text-3xl font-bold text-emerald-400">
                {p2Score} <span className="text-xs font-sans text-slate-500">pts</span>
              </span>
            </div>

            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>VALID WORDS</span>
              <span className="text-white font-bold">{p2ValidWords.length}</span>
            </div>

            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>BASE LENGTH SUM</span>
              <span className="text-white font-bold">
                {p2ValidWords.reduce((acc, w) => acc + (w.length || w.word.length), 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Word Recap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Player 1 Subwords */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <div className="font-game text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>{game.player1_name}'s Words ({p1ValidWords.length})</span>
          </div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {p1ValidWords.length === 0 ? (
              <span className="text-xs text-slate-500">No words found.</span>
            ) : (
              p1ValidWords.map((w, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-semibold text-emerald-300 uppercase flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{w.word}</span>
                  <span className="text-[10px] text-slate-400">({w.length || w.word.length}L)</span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Player 2 Subwords */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <div className="font-game text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{game.player2_name}'s Words ({p2ValidWords.length})</span>
          </div>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {p2ValidWords.length === 0 ? (
              <span className="text-xs text-slate-500">No words found.</span>
            ) : (
              p2ValidWords.map((w, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-semibold text-amber-300 uppercase flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3 h-3 text-amber-400" />
                  <span>{w.word}</span>
                  <span className="text-[10px] text-slate-400">({w.length || w.word.length}L)</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onPlayAgain}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-game text-lg font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <RefreshCw className="w-5 h-5 text-slate-950" />
          <span>Play Again</span>
        </button>

        <button
          onClick={onHome}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-game text-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Home className="w-5 h-5" />
          <span>Return Home</span>
        </button>
      </div>
    </div>
  );
};
