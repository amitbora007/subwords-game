import React from 'react';
import { Bot, Loader2, Cpu } from 'lucide-react';
import { Difficulty } from '../types/game';

interface ComputerThinkingModalProps {
  difficulty?: Difficulty;
}

export const ComputerThinkingModal: React.FC<ComputerThinkingModalProps> = ({ difficulty = 'medium' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-8 border border-emerald-500/30 text-center shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* AI Icon with Pulsing Halo */}
        <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-50" />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-xl shadow-emerald-500/30 border border-emerald-400/40 relative z-10">
            <Bot className="w-10 h-10 text-slate-950" />
          </div>
        </div>

        <h3 className="font-game text-2xl font-bold text-white mb-1">AI Opponent Thinking</h3>
        <p className="text-slate-400 text-xs mb-4">Searching subword combinations...</p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-mono mb-6">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>Difficulty:</span>
          <span className="font-bold uppercase text-white">{difficulty}</span>
        </div>

        <div className="flex items-center justify-center gap-2 text-slate-300 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <span>Generating move set...</span>
        </div>
      </div>
    </div>
  );
};
