import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import GameLoop from './components/GameLoop';
import { getStats } from './services/storageService';

// App modes
enum AppMode {
  DASHBOARD = 'DASHBOARD',
  GAME = 'GAME',
}

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [stats, setStats] = useState(getStats());

  // Refresh stats when returning to dashboard
  const handleGoToDashboard = () => {
    setStats(getStats());
    setMode(AppMode.DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-ninja-black text-white selection:bg-ninja-yellow selection:text-black">
      {mode === AppMode.DASHBOARD ? (
        <div className="min-h-screen flex flex-col items-center justify-center py-12 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
           <Dashboard stats={stats} onStartGame={() => setMode(AppMode.GAME)} />
        </div>
      ) : (
        <GameLoop onExit={handleGoToDashboard} />
      )}
    </div>
  );
}

export default App;