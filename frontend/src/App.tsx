import { useState } from 'react';
import { ViewState, GameMode, GameState } from './types/game';
import { Navbar } from './components/Navbar';
import { HomeView } from './views/HomeView';
import { SetupView } from './views/SetupView';
import { GameView } from './views/GameView';
import { ResultsView } from './views/ResultsView';

const getInitialState = (): { view: ViewState; game: GameState | null; mode: GameMode } => {
  if (typeof window === 'undefined') return { view: 'home', game: null, mode: 'pvc' };
  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo');
  if (demo === 'game') {
    return {
      view: 'game',
      mode: 'pvc',
      game: {
        id: 'demo-match-1',
        main_word: 'PLANETS',
        mode: 'pvc',
        time_limit: 120,
        current_player: 1,
        round: 1,
        status: 'active',
        player1_name: 'Player 1',
        player2_name: 'Computer (AI)',
        player1_score: 14,
        player2_score: 9,
        player1_words: [
          { word: 'planes', valid: true, length: 6, points: 6 },
          { word: 'plant', valid: true, length: 5, points: 5 },
          { word: 'net', valid: true, length: 3, points: 3 },
        ],
        player2_words: [
          { word: 'plate', valid: true, length: 5, points: 5 },
          { word: 'lane', valid: true, length: 4, points: 4 },
        ],
        difficulty: 'medium',
        created_at: new Date().toISOString()
      }
    };
  }
  if (params.get('view') === 'setup') {
    return { view: 'setup', game: null, mode: (params.get('mode') as GameMode) || 'pvc' };
  }
  return { view: 'home', game: null, mode: 'pvc' };
};

export function App() {
  const [initial] = useState(getInitialState);
  const [view, setView] = useState<ViewState>(initial.view);
  const [selectedMode, setSelectedMode] = useState<GameMode>(initial.mode);
  const [currentGame, setCurrentGame] = useState<GameState | null>(initial.game);

  const handleStartFromHome = (mode: GameMode = 'pvc') => {
    setSelectedMode(mode);
    setView('setup');
  };

  const handleGameCreated = (game: GameState) => {
    setCurrentGame(game);
    setView('game');
  };

  const handleGameOver = (finalGame: GameState) => {
    setCurrentGame(finalGame);
    setView('results');
  };

  const handlePlayAgain = () => {
    setView('setup');
  };

  const handleReturnHome = () => {
    setCurrentGame(null);
    setView('home');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar onHomeClick={handleReturnHome} />

      <main className={`flex-1 flex flex-col ${view === 'game' ? 'justify-start' : 'justify-center'}`}>
        {view === 'home' && <HomeView onStart={handleStartFromHome} />}

        {view === 'setup' && (
          <SetupView
            initialMode={selectedMode}
            onBack={handleReturnHome}
            onGameCreated={handleGameCreated}
          />
        )}

        {view === 'game' && currentGame && (
          <GameView initialGame={currentGame} onGameOver={handleGameOver} />
        )}

        {view === 'results' && currentGame && (
          <ResultsView
            game={currentGame}
            onPlayAgain={handlePlayAgain}
            onHome={handleReturnHome}
          />
        )}
      </main>

      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Subwords Arena • 2-Player & AI Turn-Based Game</span>
          <span className="font-mono text-[10px] text-slate-600">Built with React + Vite + Tailwind & FastAPI</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
