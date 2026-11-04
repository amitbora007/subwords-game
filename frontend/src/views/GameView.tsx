import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GameState } from '../types/game';
import { gameApi } from '../services/api';
import { LetterTile } from '../components/LetterTile';
import { TimerRing } from '../components/TimerRing';
import { ScoreMultiplierBadge } from '../components/ScoreMultiplierBadge';
import { WordLedger } from '../components/WordLedger';
import { Send, Delete, RotateCcw, ArrowRight, User, Bot, AlertTriangle } from 'lucide-react';
import { soundEffects } from '../utils/sound';

interface GameViewProps {
  initialGame: GameState;
  onGameOver: (finalGame: GameState) => void;
}

export const GameView: React.FC<GameViewProps> = ({ initialGame, onGameOver }) => {
  const [game, setGame] = useState<GameState>(initialGame);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(initialGame.time_limit || 120);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isEndingTurn, setIsEndingTurn] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'lockout';
    message: string;
    points?: number;
  } | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // AI Playback State for live, realistic word discovery
  const [isAiPlaying, setIsAiPlaying] = useState<boolean>(false);
  const [aiTypingWord, setAiTypingWord] = useState<string>('');
  const [aiStatus, setAiStatus] = useState<string>('');
  const [aiRevealedWords, setAiRevealedWords] = useState<Array<{ word: string; valid: boolean; length: number; points: number }>>([]);
  const [aiLiveScore, setAiLiveScore] = useState<number>(0);
  const skipAiRef = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const timerRef = useRef<any>(null);
  const isEndingTurnRef = useRef<boolean>(false);
  const isComputerMode = game.mode === 'pvc';
  const isComputerTurn = isComputerMode && (game.current_player === 2 || isAiPlaying);

  // Active input buffer depending on who is typing
  const activeInputWord = isAiPlaying ? aiTypingWord : currentWord;

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
    for (const l of activeInputWord.toLowerCase()) counts[l] = (counts[l] || 0) + 1;
    return counts;
  }, [activeInputWord]);

  // Active player metrics (reflects live AI discoveries during AI turn)
  const currentPlayerNum = isAiPlaying ? 2 : game.current_player;
  const currentPlayerName = currentPlayerNum === 1 ? game.player1_name : game.player2_name;
  const currentWords = currentPlayerNum === 1 ? game.player1_words : (isAiPlaying ? aiRevealedWords : game.player2_words);
  const currentScore = currentPlayerNum === 1 ? game.player1_score : (isAiPlaying ? aiLiveScore : game.player2_score);

  const competitorNum = currentPlayerNum === 1 ? 2 : 1;
  const competitorName = competitorNum === 1 ? game.player1_name : game.player2_name;
  const competitorWords = competitorNum === 1 ? game.player1_words : (isAiPlaying ? aiRevealedWords : game.player2_words);

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

  // Turn End / Switch Handler with humanized AI move sequence
  const handleEndTurn = useCallback(async () => {
    if (isEndingTurnRef.current) return;
    isEndingTurnRef.current = true;
    setIsEndingTurn(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setCurrentWord('');
    setFeedback(null);

    try {
      if (isComputerMode) {
        // Step 1: Initialize AI live playback on the arena board
        setIsAiPlaying(true);
        skipAiRef.current = false;
        setAiStatus('Scanning letters for subwords...');

        // Step 2: Fetch AI target words from backend
        const aiResponse = await gameApi.computerTurn(game.id, game.difficulty || 'medium');
        const targetWords = aiResponse.words || [];

        let runningRevealed: Array<{ word: string; valid: boolean; length: number; points: number }> = [];

        // Step 3: Sequentially discover each word with realistic human-like delays
        for (let i = 0; i < targetWords.length; i++) {
          if (skipAiRef.current) break;

          const wordObj = targetWords[i];
          const wordText = wordObj.word.toLowerCase();

          // Human cognitive pause (1.2s - 2.0s jitter)
          setAiStatus(`Searching combinations... (${i + 1}/${targetWords.length})`);
          await new Promise((r) => setTimeout(r, 1100 + Math.random() * 800));
          if (skipAiRef.current) break;

          // Animate typing letter by letter with tile sound effects
          let typed = '';
          for (let c = 0; c < wordText.length; c++) {
            if (skipAiRef.current) break;
            typed += wordText[c];
            setAiTypingWord(typed);
            soundEffects.playTileClick();
            await new Promise((r) => setTimeout(r, 120));
          }
          if (skipAiRef.current) break;

          // Brief pause before submitting word
          await new Promise((r) => setTimeout(r, 280));
          if (skipAiRef.current) break;

          // Play chime and update score live
          soundEffects.playValidWord();
          runningRevealed = [...runningRevealed, wordObj];
          const liveScore = runningRevealed.reduce((acc, w) => acc + w.length, 0);

          setAiLiveScore(liveScore);
          setAiRevealedWords(runningRevealed);
          setFeedback({
            type: 'success',
            message: `AI found "${wordText.toUpperCase()}"! +${wordObj.length} pts`,
            points: liveScore,
          });
          setAiTypingWord('');
        }

        // Step 4: Conclude AI turn and transition smoothly
        setAiStatus('AI completed turn! Preparing match results...');
        if (!skipAiRef.current) {
          await new Promise((r) => setTimeout(r, 1200));
        }

        const finishedGame = await gameApi.getGame(game.id);
        setGame(finishedGame);
        setIsAiPlaying(false);
        onGameOver(finishedGame);
      } else {
        // Two Player Arena: pass turn to competitor
        const res = await gameApi.switchTurn(game.id);
        const updatedGame = await gameApi.getGame(game.id);
        setGame(updatedGame);

        if (res.status === 'finished' || updatedGame.status === 'finished') {
          onGameOver(updatedGame);
        } else {
          setTimeLeft(updatedGame.time_limit || 120);
          isEndingTurnRef.current = false;
          setIsEndingTurn(false);
        }
      }
    } catch (err) {
      console.error('Error completing turn:', err);
      setIsAiPlaying(false);
      isEndingTurnRef.current = false;
      setIsEndingTurn(false);
    }
  }, [game.id, game.difficulty, isComputerMode, onGameOver]);

  // Timer Countdown Effect
  useEffect(() => {
    if (game.status === 'finished' || isAiPlaying || isEndingTurn || isComputerTurn) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          handleEndTurn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [game.status, isAiPlaying, isEndingTurn, isComputerTurn, handleEndTurn]);

  // Handle invalid/error submission with auto-reset and visual feedback
  const triggerInputError = (message: string, isLockout = false) => {
    soundEffects.playInvalidWord();
    setFeedback({
      type: isLockout ? 'lockout' : 'error',
      message,
    });
    setIsShaking(true);
    setCurrentWord('');
    setTimeout(() => {
      setIsShaking(false);
    }, 400);
  };

  // Word Submit Handler
  const handleSubmitWord = async () => {
    const trimmed = currentWord.trim().toLowerCase();
    if (!trimmed || submitting || isComputerTurn) return;

    if (trimmed.length < 3) {
      triggerInputError('Word must be at least 3 letters');
      return;
    }

    setSubmitting(true);
    try {
      const res = await gameApi.submitWord(game.id, trimmed, currentPlayerNum);
      if (res.valid) {
        soundEffects.playValidWord();
        setFeedback({
          type: 'success',
          message: `Valid word! +${res.length || trimmed.length} pts`,
          points: res.total_score,
        });
        setCurrentWord('');
        await refreshGame();
      } else {
        const isLockout = res.reason.includes('claimed by competitor');
        triggerInputError(res.reason, isLockout);
      }
    } catch (err) {
      console.error('Submit word error:', err);
      triggerInputError('Error submitting word. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle direct typing in the input field (for mobile soft keyboards and physical typing)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isComputerTurn || submitting) return;
    const raw = e.target.value.toLowerCase().replace(/[^a-z]/g, '');

    // Re-validate character counts against main_word letter limits
    let newWord = '';
    const counts: Record<string, number> = {};
    for (const char of raw) {
      const cur = counts[char] || 0;
      const max = mainWordLetters.counts[char] || 0;
      if (cur < max) {
        counts[char] = cur + 1;
        newWord += char;
      }
    }

    if (newWord.length > currentWord.length) {
      soundEffects.playTileClick();
    }
    setCurrentWord(newWord);
    setFeedback(null);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitWord();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  // Append letter to current input
  const handleLetterClick = (letter: string) => {
    const l = letter.toLowerCase();
    const currentInInput = letterCountsInInput[l] || 0;
    const maxAvailable = mainWordLetters.counts[l] || 0;

    if (currentInInput < maxAvailable) {
      soundEffects.playTileClick();
      setCurrentWord((prev) => prev + l);
      setFeedback(null);
    }
  };

  // Backspace handler
  const handleBackspace = () => {
    soundEffects.playTileClick();
    setCurrentWord((prev) => prev.slice(0, -1));
    setFeedback(null);
  };

  // Clear handler
  const handleClear = () => {
    setCurrentWord('');
    setFeedback(null);
  };

  // Keyboard navigation listener (A-Z, Backspace, Enter) for when input is not focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComputerTurn || submitting) return;
      // If the input element itself is active, let native input handlers process it
      if (document.activeElement === inputRef.current) return;

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
          soundEffects.playTileClick();
          setCurrentWord((prev) => prev + l);
          setFeedback(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isComputerTurn, submitting, currentWord, letterCountsInInput, mainWordLetters]);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-8 space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Top Bar: Head-to-Head Scoreboard */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-6">
        {/* Player 1 Card */}
        <div
          className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl glass-panel border transition-all ${
            currentPlayerNum === 1
              ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
              : 'border-slate-800 opacity-70'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="font-game font-bold text-xs sm:text-base text-white truncate">
                {game.player1_name}
              </span>
            </div>
            {currentPlayerNum === 1 && (
              <span className="text-[9px] sm:text-[10px] font-mono uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold whitespace-nowrap shrink-0">
                Active
              </span>
            )}
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline justify-between">
            <span className="font-game text-xl sm:text-3xl font-bold text-white tabular-nums">
              {game.player1_score} <span className="text-[10px] sm:text-xs font-sans text-slate-400">pts</span>
            </span>
            <span className="text-[11px] sm:text-xs font-mono text-slate-400 tabular-nums">
              {game.player1_words.filter((w) => w.valid).length} words
            </span>
          </div>
        </div>

        {/* Player 2 Card */}
        <div
          className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl glass-panel border transition-all ${
            currentPlayerNum === 2
              ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
              : 'border-slate-800 opacity-70'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                {isComputerMode ? <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </div>
              <span className="font-game font-bold text-xs sm:text-base text-white truncate">
                {game.player2_name}
              </span>
            </div>
            {currentPlayerNum === 2 && (
              <span className={`text-[9px] sm:text-[10px] font-mono uppercase px-1.5 sm:px-2 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0 ${
                isAiPlaying ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-amber-500 text-slate-950'
              }`}>
                {isAiPlaying ? 'AI Playing' : 'Active'}
              </span>
            )}
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline justify-between">
            <span className="font-game text-xl sm:text-3xl font-bold text-white tabular-nums">
              {isAiPlaying ? aiLiveScore : game.player2_score} <span className="text-[10px] sm:text-xs font-sans text-slate-400">pts</span>
            </span>
            <span className="text-[11px] sm:text-xs font-mono text-slate-400 tabular-nums">
              {isAiPlaying ? aiRevealedWords.length : game.player2_words.filter((w) => w.valid).length} words
            </span>
          </div>
        </div>
      </div>

      {/* Main Word Banner & Live Timer / AI Status */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 lg:p-7 border border-slate-800 text-center relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-6">
          <div className="text-left min-w-0">
            <div className={`font-game font-bold text-sm sm:text-base truncate ${isAiPlaying ? 'text-amber-400' : 'text-emerald-400'}`}>
              {currentPlayerName}'s Turn
            </div>
            <div className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider">
              Base Word • <span className="tabular-nums">{game.main_word.length}</span> Letters
            </div>
          </div>

          <div className="shrink-0">
            {isAiPlaying ? (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] sm:text-xs font-mono font-semibold animate-pulse">
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span>AI Opponent</span>
              </div>
            ) : (
              <TimerRing timeLeft={timeLeft} totalTime={game.time_limit || 120} />
            )}
          </div>
        </div>

        {/* Display Main Word Letters as interactive tiles */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 xs:gap-2 sm:gap-3 py-1 sm:py-2">
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

        <p className="text-[11px] sm:text-xs text-slate-500 mt-2 sm:mt-4">
          {isAiPlaying
            ? 'Watch the AI opponent analyze anagrams and build subwords in real-time'
            : 'Click tiles or type on keyboard • Min 3 letters'}
        </p>
      </div>

      {/* Word Input & Controls Area */}
      {isAiPlaying ? (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900 border-2 border-amber-500/40 shadow-xl shadow-amber-500/5">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Bot className="w-7 h-7 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  AI Opponent Formulating Subword
                </div>
                <div className="font-game text-2xl sm:text-3xl font-bold tracking-widest min-h-[36px] flex items-center">
                  {aiTypingWord ? (
                    <span className="text-amber-300 font-extrabold">{aiTypingWord.toUpperCase()}</span>
                  ) : (
                    <span className="text-slate-500 text-sm font-sans tracking-normal italic">{aiStatus}</span>
                  )}
                  <span className="inline-block w-2.5 h-6 ml-1 bg-amber-400 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Skip AI Turn Button */}
            <button
              type="button"
              onClick={() => { skipAiRef.current = true; }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-400/50 text-slate-300 hover:text-white font-game font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
              title="Skip animation and view final score"
            >
              <span>Skip to Results</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* AI Inline Feedback Banner */}
          {feedback && (
            <div className="p-3.5 rounded-xl border text-sm flex items-center justify-between font-medium animate-fadeIn bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feedback.message}</span>
              </div>
              {feedback.points !== undefined && (
                <span className="font-game font-bold text-emerald-400">Total: {feedback.points} pts</span>
              )}
            </div>
          )}
        </div>
      ) : !isComputerTurn ? (
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitWord();
            }}
            className="flex items-center gap-1.5 sm:gap-2"
          >
            {/* Input field */}
            <div className={`relative flex-1 ${isShaking ? 'animate-shake' : ''}`}>
              <input
                ref={inputRef}
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="send"
                value={currentWord.toUpperCase()}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder="TYPE OR TAP TILES..."
                className={`w-full py-2.5 px-3 sm:py-4 sm:px-5 rounded-xl sm:rounded-2xl bg-slate-900 border-2 text-center font-game text-xl xs:text-2xl sm:text-3xl font-bold tracking-wider sm:tracking-widest placeholder:text-slate-600 placeholder:text-xs xs:placeholder:text-sm sm:placeholder:text-base md:placeholder:text-lg placeholder:tracking-normal focus:outline-none transition-colors ${
                  isShaking
                    ? 'border-rose-500 text-rose-400'
                    : 'border-slate-700 text-emerald-400 focus:border-emerald-500'
                }`}
              />
              {currentWord && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Clear input (Esc)"
                >
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>

            {/* Backspace Button */}
            <button
              type="button"
              onClick={handleBackspace}
              disabled={!currentWord}
              className="h-[46px] w-[46px] sm:h-[58px] sm:w-[58px] flex items-center justify-center shrink-0 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
              title="Delete last letter"
            >
              <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Submit Word Button */}
            <button
              type="submit"
              disabled={submitting || currentWord.length < 3}
              className="h-[46px] sm:h-[58px] px-3.5 sm:px-6 rounded-xl sm:rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-game font-bold text-sm sm:text-lg flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950" />
              <span className="hidden sm:inline">Submit</span>
            </button>
          </form>

          {/* Inline Feedback Banner */}
          {feedback && (
            <div
              className={`p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between font-medium animate-fadeIn ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : feedback.type === 'lockout'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-bold'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'lockout' && <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
              {feedback.points !== undefined && (
                <span className="font-game font-bold tabular-nums">Total: {feedback.points} pts</span>
              )}
            </div>
          )}
        </div>
      ) : null}

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
      {!isComputerTurn && !isAiPlaying && (
        <div className="pt-1 sm:pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleEndTurn}
            disabled={isEndingTurn || submitting}
            className="w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed font-game font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <span>{isEndingTurn ? 'Ending Turn...' : isComputerMode ? 'Finish & Run AI Turn' : 'Finish Turn Early'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
