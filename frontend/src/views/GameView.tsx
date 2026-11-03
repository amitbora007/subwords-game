import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GameState } from '../types/game';
import { gameApi } from '../services/api';
import { LetterTile } from '../components/LetterTile';
import { TimerRing } from '../components/TimerRing';
import { ScoreMultiplierBadge } from '../components/ScoreMultiplierBadge';
import { WordLedger } from '../components/WordLedger';
import { ComputerThinkingModal } from '../components/ComputerThinkingModal';
import { Send, Delete, RotateCcw, ArrowRight, User, Bot, AlertTriangle } from 'lucide-react';

interface GameViewProps {
  initialGame: GameState;
  onGameOver: (finalGame: GameState) => void;
}

export const GameView: React.FC<GameViewProps> = ({ initialGame, onGameOver }) => {
  const [game, setGame] = useState<GameState>(initialGame);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(initialGame.time_limit || 120);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [computerThinking, setComputerThinking] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'lockout';
    message: string;
    points?: number;
  } | null>(null);

  const timerRef = useRef<any>(null);
  const isComputerMode = game.mode === 'pvc';
  const isComputerTurn = isComputerMode && game.current_player === 2;

  // Compute character counts in main_word
  const mainWordLetters = useMemo(() => {
    const letters = game.main_word.toLowerCase().split('');
    const counts: Record<string, number> = {};
    for (const l of letters) counts[l] = (counts[l] || 0) + 1;
    return { letters, counts };
  }, [game.main_word]);

  // Compute letters remaining in input buffer
  const letterCountsInInput = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of currentWord.toLowerCase()) counts[l] = (counts[l] || 0) + 1;
    return counts;
  }, [currentWord]);

  // Active player metrics
  const currentPlayerNum = game.current_player;
  const currentPlayerName = currentPlayerNum === 1 ? game.player1_name : game.player2_name;
  const currentWords = currentPlayerNum === 1 ? game.player1_words : game.player2_words;
  const currentScore = currentPlayerNum === 1 ? game.player1_score : game.player2_score;

  const competitorNum = currentPlayerNum === 1 ? 2 : 1;
  const competitorName = competitorNum === 1 ? game.player1_name : game.player2_name;
  const competitorWords = competitorNum === 1 ? game.player1_words : game.player2_words;

  // Refresh latest game state from backend
  const refreshGame = useCallback(async () => {
    try {
      const updated = await gameApi.getGame(game.id);
      setGame(updated);
      if (updated.status === 'finished') {
        onGameOver(updated);
      }
    } catch (err) {
      console.error('Failed to refresh game:', err);
    }
  }, [game.id, onGameOver]);

  // Turn Switch Handler
  const handleEndTurn = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const res = await gameApi.switchTurn(game.id);
      const updatedGame = await gameApi.getGame(game.id);
      setGame(updatedGame);
      setCurrentWord('');
      setFeedback(null);

      if (res.status === 'finished' || updatedGame.status === 'finished') {
        onGameOver(updatedGame);
      } else {
        // Reset timer for next player
        setTimeLeft(updatedGame.time_limit || 120);
      }
    } catch (err) {
      console.error('Error switching turn:', err);
    }
  }, [game.id, onGameOver]);

  // Computer AI turn orchestration
  const runComputerTurn = useCallback(async () => {
    setComputerThinking(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Simulate natural thinking delay
    await new Promise((resolve) => setTimeout(resolve, 2500));

    try {
      await gameApi.computerTurn(game.id, game.difficulty || 'medium');
      const finishedGame = await gameApi.getGame(game.id);
      setGame(finishedGame);
      setComputerThinking(false);
      onGameOver(finishedGame);
    } catch (err) {
      console.error('Computer turn failed:', err);
      setComputerThinking(false);
    }
  }, [game.id, game.difficulty, onGameOver]);

  // Detect computer's turn
  useEffect(() => {
    if (isComputerMode && game.current_player === 2 && game.status === 'active') {
      runComputerTurn();
    }
  }, [game.current_player, game.status, isComputerMode, runComputerTurn]);

  // Timer Countdown Effect
  useEffect(() => {
    if (game.status === 'finished' || computerThinking || isComputerTurn) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleEndTurn();
          return game.time_limit || 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [game.status, game.time_limit, computerThinking, isComputerTurn, handleEndTurn]);

  // Word Submit Handler
  const handleSubmitWord = async () => {
    const trimmed = currentWord.trim().toLowerCase();
    if (!trimmed || submitting || isComputerTurn) return;

    if (trimmed.length < 3) {
      setFeedback({ type: 'error', message: 'Word must be at least 3 letters' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await gameApi.submitWord(game.id, trimmed, currentPlayerNum);
      if (res.valid) {
        setFeedback({
          type: 'success',
          message: `Valid word! +${res.length} letters`,
          points: res.total_score,
        });
        setCurrentWord('');
        await refreshGame();
      } else {
        const isLockout = res.reason.includes('claimed by competitor');
        setFeedback({
          type: isLockout ? 'lockout' : 'error',
          message: res.reason,
        });
      }
    } catch (err) {
      console.error('Submit word error:', err);
      setFeedback({ type: 'error', message: 'Error submitting word. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Append letter to current input
  const handleLetterClick = (letter: string) => {
    const l = letter.toLowerCase();
    const currentInInput = letterCountsInInput[l] || 0;
    const maxAvailable = mainWordLetters.counts[l] || 0;

    if (currentInInput < maxAvailable) {
      setCurrentWord((prev) => prev + l);
      setFeedback(null);
    }
  };

  // Backspace handler
  const handleBackspace = () => {
    setCurrentWord((prev) => prev.slice(0, -1));
    setFeedback(null);
  };

  // Clear handler
  const handleClear = () => {
    setCurrentWord('');
    setFeedback(null);
  };

  // Keyboard navigation listener (A-Z, Backspace, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComputerTurn || submitting) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmitWord();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        const l = e.key.toLowerCase();
        const currentInInput = letterCountsInInput[l] || 0;
        const maxAvailable = mainWordLetters.counts[l] || 0;
        if (currentInInput < maxAvailable) {
          setCurrentWord((prev) => prev + l);
          setFeedback(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isComputerTurn, submitting, currentWord, letterCountsInInput, mainWordLetters]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-8 space-y-6 animate-fadeIn">
      {/* AI Thinking Overlay */}
      {computerThinking && <ComputerThinkingModal difficulty={game.difficulty} />}

      {/* Top Bar: Head-to-Head Scoreboard */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* Player 1 Card */}
        <div
          className={`p-3 sm:p-4 rounded-2xl glass-panel border transition-all ${
            currentPlayerNum === 1
              ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
              : 'border-slate-800 opacity-70'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="font-game font-bold text-sm sm:text-base text-white truncate max-w-[100px] sm:max-w-none">
                {game.player1_name}
              </span>
            </div>
            {currentPlayerNum === 1 && (
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold">
                Active Turn
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-game text-2xl sm:text-3xl font-bold text-white">
              {game.player1_score} <span className="text-xs font-sans text-slate-400">pts</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              {game.player1_words.filter((w) => w.valid).length} words
            </span>
          </div>
        </div>

        {/* Player 2 Card */}
        <div
          className={`p-3 sm:p-4 rounded-2xl glass-panel border transition-all ${
            currentPlayerNum === 2
              ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
              : 'border-slate-800 opacity-70'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                {isComputerMode ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <span className="font-game font-bold text-sm sm:text-base text-white truncate max-w-[100px] sm:max-w-none">
                {game.player2_name}
              </span>
            </div>
            {currentPlayerNum === 2 && (
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                Active Turn
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-game text-2xl sm:text-3xl font-bold text-white">
              {game.player2_score} <span className="text-xs font-sans text-slate-400">pts</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              {game.player2_words.filter((w) => w.valid).length} words
            </span>
          </div>
        </div>
      </div>

      {/* Main Word Banner & Live Timer */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 text-center relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest">
            <span className="font-game font-bold text-emerald-400 text-sm tracking-normal mr-2">
              {currentPlayerName}'s Turn
            </span>
            <span>• Base Word ({game.main_word.length} Letters)</span>
          </div>

          <TimerRing timeLeft={timeLeft} totalTime={game.time_limit || 120} />
        </div>

        {/* Display Main Word Letters as interactive tiles */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-2">
          {mainWordLetters.letters.map((letter, idx) => {
            const count = mainWordLetters.counts[letter] || 1;
            const inInput = letterCountsInInput[letter] || 0;
            const remaining = Math.max(0, count - inInput);

            return (
              <LetterTile
                key={`${letter}-${idx}`}
                letter={letter}
                count={count}
                remainingCount={remaining}
                onClick={handleLetterClick}
                disabled={isComputerTurn}
              />
            );
          })}
        </div>

        <p className="text-xs text-slate-500 mt-4">
          Click tiles or type directly on keyboard • Min 3 letters
        </p>
      </div>

      {/* Word Input & Controls Area */}
      {!isComputerTurn && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {/* Input field */}
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={currentWord.toUpperCase()}
                placeholder="TYPE OR TAP TILES..."
                className="w-full py-4 px-5 rounded-2xl bg-slate-900 border-2 border-slate-700 text-center font-game text-2xl sm:text-3xl font-bold tracking-widest text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {currentWord && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Clear input (Esc)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Backspace Button */}
            <button
              type="button"
              onClick={handleBackspace}
              disabled={!currentWord}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Delete last letter"
            >
              <Delete className="w-6 h-6" />
            </button>

            {/* Submit Word Button */}
            <button
              type="button"
              onClick={handleSubmitWord}
              disabled={submitting || currentWord.length < 3}
              className="py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-game font-bold text-lg flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Send className="w-5 h-5 fill-slate-950" />
              <span className="hidden sm:inline">Submit</span>
            </button>
          </div>

          {/* Inline Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-sm flex items-center justify-between font-medium animate-fadeIn ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : feedback.type === 'lockout'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-bold'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'lockout' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                <span>{feedback.message}</span>
              </div>
              {feedback.points !== undefined && (
                <span className="font-game font-bold">Score: {feedback.points} pts</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Multiplier Score breakdown for active player */}
      <ScoreMultiplierBadge words={currentWords} score={currentScore} />

      {/* Submitted Word Ledger & Competitor Claimed Words */}
      <WordLedger
        myWords={currentWords}
        competitorWords={competitorWords}
        competitorName={competitorName}
        isComputerTurn={isComputerTurn}
      />

      {/* Turn End Button */}
      {!isComputerTurn && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleEndTurn}
            className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 font-game font-bold text-base flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Finish Turn Early</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
