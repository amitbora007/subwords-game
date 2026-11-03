import React, { useState } from 'react';
import { GameMode, Difficulty, GameState } from '../types/game';
import { gameApi } from '../services/api';
import { ArrowLeft, Bot, Users, Clock, Play, User, AlertCircle, Loader2 } from 'lucide-react';

interface SetupViewProps {
  initialMode?: GameMode;
  onBack: () => void;
  onGameCreated: (game: GameState) => void;
}

const TIMER_PRESETS = [30, 60, 90, 120, 180];

export const SetupView: React.FC<SetupViewProps> = ({
  initialMode = 'pvc',
  onBack,
  onGameCreated,
}) => {
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [timeLimit, setTimeLimit] = useState<number>(120);
  const [player1Name, setPlayer1Name] = useState<string>('Player 1');
  const [player2Name, setPlayer2Name] = useState<string>('Player 2');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartGame = async () => {
    if (!player1Name.trim()) {
      setErrorMsg('Please enter a name for Player 1');
      return;
    }
    if (mode === 'pvp' && !player2Name.trim()) {
      setErrorMsg('Please enter a name for Player 2');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const game = await gameApi.createGame({
        player1_name: player1Name.trim(),
        player2_name: mode === 'pvc' ? 'Computer AI' : player2Name.trim(),
        mode,
        difficulty: mode === 'pvc' ? difficulty : undefined,
        time_limit: timeLimit,
      });

      onGameCreated(game);
    } catch (err: any) {
      console.error('Failed to create game:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to create game. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 p-2 rounded-lg hover:bg-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-8">
        <div>
          <h2 className="font-game text-3xl font-bold text-white">Match Setup</h2>
          <p className="text-slate-400 text-sm mt-1">Configure your arena rules and competitor settings.</p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Game Mode Selector */}
        <div className="space-y-3">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            1. Select Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('pvc')}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                mode === 'pvc'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-xl ${mode === 'pvc' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-game font-bold text-base leading-tight">Vs Computer</div>
                <div className="text-xs text-slate-400">Play solo vs AI bot</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('pvp')}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                mode === 'pvp'
                  ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-xl ${mode === 'pvp' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="font-game font-bold text-base leading-tight">2 Players</div>
                <div className="text-xs text-slate-400">Pass & Play match</div>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Difficulty Selector (PvC Only) */}
        {mode === 'pvc' && (
          <div className="space-y-3 animate-fadeIn">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              2. AI Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    difficulty === diff
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-game capitalize text-base">{diff}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {diff === 'easy' ? '3-5 words' : diff === 'medium' ? '5-8 words' : '8-12 words'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Configurable Turn Timer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{mode === 'pvc' ? '3.' : '2.'} Turn Time Limit</span>
            </label>
            <span className="text-xs font-game font-bold text-amber-400">{timeLimit} Seconds</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {TIMER_PRESETS.map((seconds) => (
              <button
                key={seconds}
                type="button"
                onClick={() => setTimeLimit(seconds)}
                className={`flex-1 min-w-[55px] py-2 px-3 rounded-xl border text-center text-xs font-mono font-bold transition-all cursor-pointer ${
                  timeLimit === seconds
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {seconds}s
              </button>
            ))}
          </div>
        </div>

        {/* 4. Player Names */}
        <div className="space-y-4">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            {mode === 'pvc' ? '4.' : '3.'} Competitor Names
          </label>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-400 mb-1 block">Player 1</span>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus-within:border-emerald-500 transition-colors">
                <User className="w-4 h-4 text-emerald-400" />
                <input
                  type="text"
                  maxLength={20}
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  placeholder="Enter Player 1 name"
                  className="bg-transparent text-white text-sm w-full focus:outline-none"
                />
              </div>
            </div>

            {mode === 'pvp' && (
              <div className="animate-fadeIn">
                <span className="text-xs text-slate-400 mb-1 block">Player 2</span>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus-within:border-amber-500 transition-colors">
                  <User className="w-4 h-4 text-amber-400" />
                  <input
                    type="text"
                    maxLength={20}
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    placeholder="Enter Player 2 name"
                    className="bg-transparent text-white text-sm w-full focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Start Game CTA */}
        <button
          type="button"
          disabled={loading}
          onClick={handleStartGame}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-game text-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating Arena...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Enter Arena</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
