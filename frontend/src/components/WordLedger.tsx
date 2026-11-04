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
    <div className="space-y-4">
      {/* Active Player's Submitted Words */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="font-game text-base font-bold text-white">
              {isComputerTurn ? "Computer's Subwords" : "Your Subwords"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
              {validWords.length}
            </span>
          </div>
          <span className="text-xs text-emerald-400 font-mono font-semibold">1 pt per letter</span>
        </div>

        {myWords.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            <p>No subwords submitted yet.</p>
            <p className="text-xs text-slate-600 mt-1">Tap letters or type on keyboard to submit!</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
            {myWords.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                  item.valid
                    ? 'bg-slate-900/80 border-slate-700/80 text-white shadow-sm'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400 line-through opacity-70'
                }`}
              >
                {item.valid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                )}
                <span className="font-game tracking-wider uppercase">{item.word}</span>
                {item.valid && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
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
        <div className="glass-panel rounded-2xl p-4 border border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-rose-500/20">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              <span className="font-game text-xs font-bold text-rose-300">
                Claimed by {competitorName} (Locked)
              </span>
            </div>
            <span className="text-[10px] text-rose-400/80 uppercase font-semibold">Cannot Reuse</span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {claimedCompetitorWords.map((cw, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-300/80 text-xs font-mono uppercase line-through"
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
