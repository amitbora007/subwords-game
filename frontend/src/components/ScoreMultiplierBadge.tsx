import React from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { WordEntry } from '../types/game';

interface ScoreMultiplierBadgeProps {
  words: WordEntry[];
  score: number;
}

export const ScoreMultiplierBadge: React.FC<ScoreMultiplierBadgeProps> = ({ words, score }) => {
  const validWords = words.filter((w) => w.valid);
  const wordCount = validWords.length;
  const basePoints = validWords.reduce((acc, w) => acc + (w.length || w.word.length), 0);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 rounded-2xl glass-panel-emerald border border-emerald-500/30 gap-4">
      {/* Total Score Highlighting */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
          <Zap className="w-6 h-6 fill-emerald-400/30" />
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-300/80">Total Score</span>
          <div className="font-game text-3xl sm:text-4xl font-bold text-white tracking-wide leading-none flex items-baseline gap-1">
            {score}
            <span className="text-xs font-sans text-emerald-400 font-semibold">pts</span>
          </div>
        </div>
      </div>

      {/* Multiplier Formula Breakdown */}
      <div className="flex items-center gap-2 text-xs font-mono bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800 self-start sm:self-auto">
        <div className="text-center">
          <div className="text-slate-400 text-[10px]">SUM LENGTHS</div>
          <div className="text-base font-bold text-slate-100">{basePoints}</div>
        </div>

        <span className="text-emerald-400 text-lg font-bold">×</span>

        <div className="text-center">
          <div className="text-slate-400 text-[10px]">TOTAL WORDS</div>
          <div className="text-base font-bold text-amber-400">{wordCount}</div>
        </div>

        <span className="text-slate-500 text-lg font-bold">=</span>

        <div className="text-center pl-1">
          <div className="text-emerald-400 text-[10px] flex items-center gap-1 justify-center">
            <Sparkles className="w-3 h-3" /> MULTIPLIED
          </div>
          <div className="text-base font-bold text-emerald-300 font-game">{score}</div>
        </div>
      </div>
    </div>
  );
};
