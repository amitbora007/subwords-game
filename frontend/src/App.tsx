import { useState } from 'react';
import { ViewState, GameMode, GameState } from './types/game';
import { Navbar } from './components/Navbar';
import { HomeView } from './views/HomeView';
import { SetupView } from './views/SetupView';
import { GameView } from './views/GameView';
import { ResultsView } from './views/ResultsView';

export function App() {
  const [view, setView] = useState<ViewState>('home');
  const [selectedMode, setSelectedMode] = useState<GameMode>('pvc');
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar onHomeClick={handleReturnHome} />

      <main className="flex-1 flex flex-col justify-center">
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
