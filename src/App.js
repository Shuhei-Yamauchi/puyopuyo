import React, { useState } from 'react';
import DualBoard from './components/DualBoard';

function App() {
  const [gameKey, setGameKey] = useState(0); // 再スタート用

  const handleRestart = () => {
    setGameKey(prev => prev + 1); // コンポーネント再生成
  };

  return (
    <div className="App" style={{ textAlign: 'center' }}>
      <h1>Puyo Puyo vs CPU</h1>
      <button onClick={handleRestart}>Restart Game</button>
      <DualBoard key={gameKey} />
    </div>
  );
}

export default App;
