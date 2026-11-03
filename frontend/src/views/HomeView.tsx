import React from 'react';
import { Gamepad2, Users, Bot, Sparkles, Clock, ShieldAlert, ArrowRight, Trophy } from 'lucide-react';
import { GameMode } from '../types/game';

interface HomeViewProps {
  onStart: (mode?: GameMode) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onStart }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-16 space-y-12 animate-fadeIn">
      {/* Hero Section */}
      <div className="text-center space-y-5 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Word Puzzle Arena</span>
        </div>

        <h1 className="font-game text-4xl sm:text-6xl font-bold tracking-tight text-white">
          Build Subwords. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400">
            Multiply Your Score.
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Given a 6+ letter root word, race against the clock to discover valid English subwords. Steal words from your opponent and watch your points compound!
        </p>

        {/* Primary Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onStart()}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-game text-xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            <Gamepad2 className="w-6 h-6 text-slate-950" />
            <span>Launch Game</span>
            <ArrowRight className="w-5 h-5 text-slate-950" />
          </button>
        </div>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Single Player Card */}
        <div 
          onClick={() => onStart('pvc')}
          className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
            <Bot className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-game text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">
              Single Player vs AI
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              3 AI Tiers
            </span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Test your vocabulary against an intelligent AI bot. Select from Easy, Medium, and Hard difficulty levels tuned to human skill.
          </p>
          <div className="flex items-center text-emerald-400 text-sm font-semibold gap-1.5 group-hover:translate-x-1 transition-transform">
            <span>Play vs Computer</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Two Player Card */}
        <div 
          onClick={() => onStart('pvp')}
          className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
            <Users className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-game text-2xl font-bold text-white group-hover:text-amber-300 transition-colors">
              Two Player Arena
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Pass & Play
            </span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Play turn-by-turn with a friend on the same device. Subwords claimed in round 1 are locked out for round 2—steal the best words!
          </p>
          <div className="flex items-center text-amber-400 text-sm font-semibold gap-1.5 group-hover:translate-x-1 transition-transform">
            <span>Play vs Player</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="border-t border-slate-800/80 pt-10">
        <h3 className="font-game text-xl font-bold text-slate-300 mb-6 text-center sm:text-left">
          Core Arena Mechanics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="text-emerald-400 mb-2 font-game font-bold text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <span>6+ Letter Roots</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every match begins with a curated base word having rich anagram permutations.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="text-amber-400 mb-2 font-game font-bold text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Custom Timers</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Configure session time limits from lightning 30s to relaxed 180s turns.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="text-emerald-400 mb-2 font-game font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>Multiplier Scoring</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Total score compounds by multiplying total word lengths by word count.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="text-rose-400 mb-2 font-game font-bold text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>Anti-Duplicate Lock</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Competitor claimed words cannot be reused by the opponent in that match.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
