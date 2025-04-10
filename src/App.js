import React from 'react';
import GameCanvas from './components/GameCanvas';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <header className="py-4">
        <h1 className="text-3xl font-bold text-center">Puyo Puyo Game</h1>
      </header>
      <main>
        <GameCanvas />
      </main>
    </div>
  );
}

export default App;
