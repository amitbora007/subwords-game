import React from 'react';
import { Zap } from 'lucide-react';
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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl glass-panel-emerald border border-emerald-500/30 gap-3 sm:gap-4 w-full shadow-lg">
      {/* Total Score Highlighting */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shrink-0">
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-emerald-400/30" />
        </div>
        <div>
          <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-emerald-300/80">Total Score</span>
          <div className="font-game text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wide leading-none flex items-baseline gap-1 tabular-nums">
            {score}
            <span className="text-xs font-sans text-emerald-400 font-semibold">pts</span>
          </div>
        </div>
      </div>

      {/* Score Formula Breakdown */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-xs font-mono bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800 text-center shrink-0">
        <div className="px-1">
          <div className="text-slate-400 text-[9px] sm:text-[10px] tracking-wider uppercase">Words</div>
          <div className="text-sm sm:text-base font-bold text-amber-400 tabular-nums">{wordCount}</div>
        </div>

        <div className="border-x border-slate-800 px-1 sm:px-2">
          <div className="text-slate-400 text-[9px] sm:text-[10px] tracking-wider uppercase">Rate</div>
          <div className="text-[11px] sm:text-xs font-bold text-emerald-300 font-game mt-0.5">1 pt / L</div>
        </div>

        <div className="px-1">
          <div className="text-slate-400 text-[9px] sm:text-[10px] tracking-wider uppercase">Letters</div>
          <div className="text-sm sm:text-base font-bold text-emerald-400 font-game tabular-nums">{basePoints} pts</div>
        </div>
      </div>
    </div>
  );
};
