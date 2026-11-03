import React, { useState } from 'react';
import { Gamepad2, HelpCircle, X, Trophy, Clock, ShieldAlert, Volume2, VolumeX } from 'lucide-react';
import { soundEffects } from '../utils/sound';

interface NavbarProps {
  onHomeClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onHomeClick }) => {
  const [showRules, setShowRules] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEffects.isMuted());

  return (
    <>
      <header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <button
            onClick={onHomeClick}
            className="flex items-center gap-2.5 text-left group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-game text-xl font-bold tracking-wider text-white">SUBWORDS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">v2.0</span>
              </div>
              <p className="text-xs text-slate-400">Word Builder Arena</p>
            </div>
          </button>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                const nowMuted = soundEffects.toggleMute();
                setIsMuted(nowMuted);
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              title={isMuted ? "Unmute sound effects" : "Mute sound effects"}
              aria-label={isMuted ? "Unmute sound effects" : "Mute sound effects"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={() => setShowRules(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Rules</span>
            </button>
          </div>
        </div>
      </header>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 relative border border-slate-700 shadow-2xl">
            <button
              onClick={() => setShowRules(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Trophy className="w-5 h-5" />
              </div>
              <h2 className="font-game text-2xl font-bold text-white">How to Play</h2>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-emerald-400 font-game font-bold text-base">01</span>
                <div>
                  <h4 className="font-semibold text-white mb-0.5">Base Word (6+ Letters)</h4>
                  <p className="text-slate-400 text-xs">Each match begins with a randomly selected 6+ letter word. Create valid English subwords using only the available letters.</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-0.5">Configurable Turn Timer</h4>
                  <p className="text-slate-400 text-xs">Play within your chosen session time limit (e.g., 30s to 180s). Find as many subwords as you can before the clock runs out.</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-emerald-400 font-game font-bold text-base">∑×</span>
                <div>
                  <h4 className="font-semibold text-white mb-0.5">Multiplier Scoring Formula</h4>
                  <p className="text-slate-400 text-xs">
                    <span className="text-emerald-300 font-mono font-semibold">Score = (Sum of Word Lengths) × (Total Words Submitted)</span>.
                    Every additional word you find multiplies the value of all previous words!
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-rose-200 mb-0.5">Competitor Word Lockout</h4>
                  <p className="text-rose-300/80 text-xs">Subwords already claimed by a player <strong>cannot be used again</strong> by the competitor. Steal high-scoring words first!</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="w-full mt-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold transition-colors"
            >
              Got it, let's play!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
