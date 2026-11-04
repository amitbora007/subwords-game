import React from 'react';
import { WordEntry } from '../types/game';
import { Lock, CheckCircle2, XCircle } from 'lucide-react';

interface WordLedgerProps {
  myWords: WordEntry[];
  competitorWords?: WordEntry[];
  competitorName?: string;
  isComputerTurn?: boolean;
}

export const WordLedger: React.FC<WordLedgerProps> = ({
  myWords,
  competitorWords = [],
  competitorName = 'Competitor',
  isComputerTurn = false,
}) => {
  const validWords = myWords.filter((w) => w.valid);
  const claimedCompetitorWords = competitorWords.filter((w) => w.valid);

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      {/* Active Player's Submitted Words */}
      <div className="glass-panel rounded-2xl p-3.5 sm:p-5 border border-slate-800 shadow-lg transition-all w-full">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="font-game text-sm sm:text-base font-bold text-white tracking-wide">
              {isComputerTurn ? "Computer's Subwords" : "Your Subwords"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 tabular-nums">
              {validWords.length}
            </span>
          </div>
          <span className="text-[11px] sm:text-xs text-emerald-400 font-mono font-semibold">1 pt per letter</span>
        </div>

        {myWords.length === 0 ? (
          <div className="min-h-[120px] sm:min-h-[150px] flex flex-col items-center justify-center text-center text-slate-500 text-xs sm:text-sm px-4">
            <p className="font-medium text-slate-400">No subwords submitted yet</p>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-1 max-w-xs">
              Tap letters or type to build valid words!
            </p>
          </div>
        ) : (
          <div className="min-h-[120px] max-h-48 sm:max-h-56 lg:max-h-72 overflow-y-auto pr-1 flex flex-wrap content-start gap-1.5 sm:gap-2">
            {myWords.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                  item.valid
                    ? 'bg-slate-900/90 border-slate-700/80 text-white shadow-sm hover:border-emerald-500/50'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400 line-through opacity-70'
                }`}
              >
                {item.valid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span className="font-game tracking-wider uppercase">{item.word}</span>
                {item.valid && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 tabular-nums">
                    +{(item.length || item.points || item.word.length)} pts
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Competitor Locked Words (Anti-duplicate rule) */}
      {claimedCompetitorWords.length > 0 && (
        <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-rose-500/25 bg-rose-500/5 shadow-md w-full">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-rose-500/20">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
              <span className="font-game text-xs font-bold text-rose-300 truncate">
                Claimed by {competitorName}
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-rose-400/90 uppercase font-mono font-semibold shrink-0 tabular-nums">
              {claimedCompetitorWords.length} Locked
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-20 sm:max-h-28 overflow-y-auto pr-1">
            {claimedCompetitorWords.map((cw, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-lg bg-rose-950/70 border border-rose-800/50 text-rose-300/80 text-xs font-mono uppercase line-through select-none"
                title={`Claimed by ${competitorName} - locked out`}
              >
                {cw.word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
