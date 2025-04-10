import React, { useRef, useEffect, useState } from 'react';

// ◆ 定数・設定 ◆
const COLS = 6;
const ROWS = 12;
const CELL_SIZE = 30; // 内部処理上のセルサイズ
const COLORS = ['red', 'green', 'blue', 'yellow'];
const INITIAL_HP = 1000; // HP初期値
const FALL_INTERVAL_MS = 600; // 落下間隔（ミリ秒）

// ◆ ぷよペア生成関数 ◆
function createNewPiece() {
  return {
    positions: [
      { x: Math.floor(COLS / 2), y: -1 },
      { x: Math.floor(COLS / 2), y: -2 }
    ],
    colors: [
      COLORS[Math.floor(Math.random() * COLORS.length)],
      COLORS[Math.floor(Math.random() * COLORS.length)]
    ]
  };
}

// ◆ ユーティリティ：ボードのディープコピー ◆
function cloneBoard(board) {
  return board.map(row => [...row]);
}

// ◆ 連鎖判定＆消去（4つ以上隣接したぷよを消す） ◆
function checkAndPop(board) {
  const toPop = [];
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];

  function bfs(startRow, startCol) {
    const color = board[startRow][startCol];
    if (!color) return [];
    let queue = [{ row: startRow, col: startCol }];
    const connected = [];
    visited[startRow][startCol] = true;
    while (queue.length) {
      const { row, col } = queue.shift();
      connected.push({ row, col });
      for (let d of directions) {
        const nr = row + d.y, nc = col + d.x;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
            !visited[nr][nc] && board[nr][nc] === color) {
          visited[nr][nc] = true;
          queue.push({ row: nr, col: nc });
        }
      }
    }
    return connected;
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] && !visited[r][c]) {
        const group = bfs(r, c);
        if (group.length >= 4) {
          toPop.push(...group);
        }
      }
    }
  }

  toPop.forEach(({ row, col }) => {
    board[row][col] = null;
  });

  return toPop.length;
}

// ◆ 重力適用：空白セルがあれば上のぷよを下に落とす ◆
function applyGravity(board) {
  for (let c = 0; c < COLS; c++) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!board[r][c]) {
        let nr = r - 1;
        while (nr >= 0 && !board[nr][c]) { nr--; }
        if (nr >= 0) {
          board[r][c] = board[nr][c];
          board[nr][c] = null;
        }
      }
    }
  }
}

// ◆ 連鎖処理ループ ◆
function resolveChains(board) {
  let chainCount = 0, totalPopped = 0;
  while (true) {
    const popped = checkAndPop(board);
    if (popped > 0) {
      chainCount++;
      totalPopped += popped;
      applyGravity(board);
    } else break;
  }
  return { chainCount, totalPopped };
}

// ◆ ダメージ計算（例: 連鎖数×50 + 消去個数×2） ◆
function calcDamage(chainCount, popped) {
  return chainCount === 0 ? 0 : chainCount * 50 + popped * 2;
}

// ◆ CPU の簡易移動ロジック ◆
function cpuAutoMove(cpuPiece, cpuBoard) {
  const move = Math.floor(Math.random() * 4);
  let newPiece = { ...cpuPiece, positions: cpuPiece.positions.map(p => ({ ...p })) };
  if (move === 0) newPiece.positions.forEach(p => p.x--);
  else if (move === 1) newPiece.positions.forEach(p => p.x++);
  else if (move === 2) rotatePiece(newPiece);
  if (checkCollision(newPiece, cpuBoard)) return cpuPiece;
  return newPiece;
}

// ◆ 衝突判定：ボード外または既に埋まっているか ◆
function checkCollision(piece, board) {
  for (let pos of piece.positions) {
    if (pos.x < 0 || pos.x >= COLS || pos.y >= ROWS) return true;
    if (pos.y >= 0 && board[pos.y][pos.x]) return true;
  }
  return false;
}

// ◆ ピースを盤面に固定する ◆
function lockPiece(piece, board) {
  piece.positions.forEach((pos, i) => {
    if (pos.y >= 0 && pos.y < ROWS) board[pos.y][pos.x] = piece.colors[i];
  });
}

// ◆ ぷよの回転：中心（positions[0]）を基準に90度回転 ◆
function rotatePiece(piece) {
  const center = piece.positions[0];
  for (let i = 1; i < piece.positions.length; i++) {
    const p = piece.positions[i];
    const dx = p.x - center.x, dy = p.y - center.y;
    p.x = center.x - dy;
    p.y = center.y + dx;
  }
}

//
// ─── 改善版 DualBoard コンポーネント ─────────────────────────────
//
const DualBoard = () => {
  // ゲーム状態をひとまとめにする
  const [gameState, setGameState] = useState({
    playerBoard: Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
    cpuBoard: Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
    playerPiece: createNewPiece(),
    cpuPiece: createNewPiece(),
    playerHP: INITIAL_HP,
    cpuHP: INITIAL_HP,
  });
  // 最新の状態を参照するための ref
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Canvas の参照
  const playerCanvasRef = useRef(null);
  const cpuCanvasRef = useRef(null);

  // ◆ 共通の描画処理 ◆
  const drawBoard = (ctx, board, piece) => {
    ctx.clearRect(0, 0, COLS * CELL_SIZE, ROWS * CELL_SIZE);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        const color = board[r][c];
        if (color) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
    piece.positions.forEach((pos, i) => {
      if (pos.y >= 0) {
        ctx.fillStyle = piece.colors[i];
        ctx.beginPath();
        ctx.arc(pos.x * CELL_SIZE + CELL_SIZE / 2, pos.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  // ◆ ゲームループ：定期的に状態を更新（重力・落下処理） ◆
  const gameLoop = () => {
    // 現在の状態を取得
    let { playerBoard, playerPiece, cpuBoard, cpuPiece, playerHP, cpuHP } = gameStateRef.current;

    // プレイヤーの落下処理
    const newPlayerPiece = movePieceDown(playerPiece, playerBoard, (lockedBoard) => {
      const boardCopy = cloneBoard(lockedBoard);
      const { chainCount, totalPopped } = resolveChains(boardCopy);
      if (chainCount > 0) {
        cpuHP = Math.max(cpuHP - calcDamage(chainCount, totalPopped), 0);
      }
      playerBoard = boardCopy;
      return createNewPiece();
    });

    // CPU の移動と落下処理（簡易ロジック）
    const cpuMovedPiece = cpuAutoMove(cpuPiece, cpuBoard);
    const newCpuPiece = movePieceDown(cpuMovedPiece, cpuBoard, (lockedBoard) => {
      const boardCopy = cloneBoard(lockedBoard);
      const { chainCount, totalPopped } = resolveChains(boardCopy);
      if (chainCount > 0) {
        playerHP = Math.max(playerHP - calcDamage(chainCount, totalPopped), 0);
      }
      cpuBoard = boardCopy;
      return createNewPiece();
    });

    // 最新の状態に更新
    setGameState({
      playerBoard,
      cpuBoard,
      playerPiece: newPlayerPiece,
      cpuPiece: newCpuPiece,
      playerHP,
      cpuHP,
    });
  };

  // ◆ movePieceDown 関数（変更なし）◆
  const movePieceDown = (piece, board, onLock) => {
    const movedPiece = { ...piece, positions: piece.positions.map(p => ({ ...p, y: p.y + 1 })) };
    if (checkCollision(movedPiece, board)) {
      lockPiece(piece, board);
      return onLock(board);
    } else {
      return movedPiece;
    }
  };

  // ◆ ゲームループ開始 ◆
  useEffect(() => {
    const interval = setInterval(() => { gameLoop(); }, FALL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // ◆ キーボード操作ハンドラ ◆
  const handleKeyDown = (e) => {
    // ゲームオーバーなら操作無視
    if (gameState.playerHP <= 0 || gameState.cpuHP <= 0) return;
    let { playerBoard, playerPiece } = gameState;
    const newPiece = { ...playerPiece, positions: playerPiece.positions.map(p => ({ ...p })) };
    if (e.key === 'ArrowLeft') {
      newPiece.positions.forEach(p => p.x--);
      if (!checkCollision(newPiece, playerBoard)) {
        setGameState(prev => ({ ...prev, playerPiece: newPiece }));
      }
    } else if (e.key === 'ArrowRight') {
      newPiece.positions.forEach(p => p.x++);
      if (!checkCollision(newPiece, playerBoard)) {
        setGameState(prev => ({ ...prev, playerPiece: newPiece }));
      }
    } else if (e.key === 'ArrowUp') {
      rotatePiece(newPiece);
      if (!checkCollision(newPiece, playerBoard)) {
        setGameState(prev => ({ ...prev, playerPiece: newPiece }));
      }
    } else if (e.key === 'ArrowDown') {
      const fastDown = { ...playerPiece, positions: playerPiece.positions.map(p => ({ ...p, y: p.y + 1 })) };
      if (checkCollision(fastDown, playerBoard)) {
        lockPiece(playerPiece, playerBoard);
        const boardCopy = cloneBoard(playerBoard);
        const { chainCount, totalPopped } = resolveChains(boardCopy);
        let newCpuHP = gameState.cpuHP;
        if (chainCount > 0) {
          newCpuHP = Math.max(gameState.cpuHP - calcDamage(chainCount, totalPopped), 0);
        }
        setGameState(prev => ({
          ...prev,
          playerBoard: boardCopy,
          playerPiece: createNewPiece(),
          cpuHP: newCpuHP
        }));
      } else {
        setGameState(prev => ({ ...prev, playerPiece: fastDown }));
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // ◆ モバイル操作用ハンドラ ◆
  const handleMoveLeft = () => {
    let newPiece = { ...gameState.playerPiece, positions: gameState.playerPiece.positions.map(p => ({ ...p })) };
    newPiece.positions.forEach(p => p.x--);
    if (!checkCollision(newPiece, gameState.playerBoard)) {
      setGameState(prev => ({ ...prev, playerPiece: newPiece }));
    }
  };

  const handleMoveRight = () => {
    let newPiece = { ...gameState.playerPiece, positions: gameState.playerPiece.positions.map(p => ({ ...p })) };
    newPiece.positions.forEach(p => p.x++);
    if (!checkCollision(newPiece, gameState.playerBoard)) {
      setGameState(prev => ({ ...prev, playerPiece: newPiece }));
    }
  };

  const handleRotate = () => {
    let newPiece = { ...gameState.playerPiece, positions: gameState.playerPiece.positions.map(p => ({ ...p })) };
    rotatePiece(newPiece);
    if (!checkCollision(newPiece, gameState.playerBoard)) {
      setGameState(prev => ({ ...prev, playerPiece: newPiece }));
    }
  };

  const handleMoveDown = () => {
    const fastDown = { ...gameState.playerPiece, positions: gameState.playerPiece.positions.map(p => ({ ...p, y: p.y + 1 })) };
    if (checkCollision(fastDown, gameState.playerBoard)) {
      lockPiece(gameState.playerPiece, gameState.playerBoard);
      const boardCopy = cloneBoard(gameState.playerBoard);
      const { chainCount, totalPopped } = resolveChains(boardCopy);
      let newCpuHP = gameState.cpuHP;
      if (chainCount > 0) {
        newCpuHP = Math.max(gameState.cpuHP - calcDamage(chainCount, totalPopped), 0);
      }
      setGameState(prev => ({
        ...prev,
        playerBoard: boardCopy,
        playerPiece: createNewPiece(),
        cpuHP: newCpuHP
      }));
    } else {
      setGameState(prev => ({ ...prev, playerPiece: fastDown }));
    }
  };

  // ◆ Canvas 描画更新（状態変更時） ◆
  useEffect(() => {
    const pCanvas = playerCanvasRef.current;
    const cCanvas = cpuCanvasRef.current;
    if (!pCanvas || !cCanvas) return;
    const pCtx = pCanvas.getContext('2d');
    const cCtx = cCanvas.getContext('2d');
    drawBoard(pCtx, gameState.playerBoard, gameState.playerPiece);
    drawBoard(cCtx, gameState.cpuBoard, gameState.cpuPiece);
  }, [gameState]);

  const { playerHP, cpuHP } = gameState;
  const playerWins = cpuHP <= 0 && playerHP > 0;
  const cpuWins = playerHP <= 0 && cpuHP > 0;
  const isGameOver = playerWins || cpuWins;

  return (
    <div className="flex flex-col items-center w-full relative">
      {/* フィールド部分：レスポンシブ対応 */}
      <div className="flex flex-wrap justify-center gap-8 w-full">
        <div className="flex flex-col items-center">
          <h2 className="mb-2">Player HP: {playerHP}</h2>
          <canvas
            ref={playerCanvasRef}
            width={COLS * CELL_SIZE}
            height={ROWS * CELL_SIZE}
            className="border-2 border-black shadow-lg"
            style={{ width: '100%', maxWidth: '300px', height: 'auto' }}
          />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="mb-2">CPU HP: {cpuHP}</h2>
          <canvas
            ref={cpuCanvasRef}
            width={COLS * CELL_SIZE}
            height={ROWS * CELL_SIZE}
            className="border-2 border-black shadow-lg"
            style={{ width: '100%', maxWidth: '300px', height: 'auto' }}
          />
        </div>
      </div>

      {/* ゲームオーバー表示 */}
      {isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 p-4 border-2 border-gray-700">
          {playerWins && <h1 className="text-2xl font-bold">Player Wins!</h1>}
          {cpuWins && <h1 className="text-2xl font-bold">CPU Wins!</h1>}
          <p className="mt-2">Press "Restart Game" to play again.</p>
        </div>
      )}

      {/* モバイル操作ボタン（スマホで表示） */}
      <div className="md:hidden mt-4">
        <div className="flex justify-center space-x-2">
          <button onClick={handleMoveLeft} className="bg-gray-300 p-3 rounded">←</button>
          <button onClick={handleRotate} className="bg-gray-300 p-3 rounded">⟲</button>
          <button onClick={handleMoveRight} className="bg-gray-300 p-3 rounded">→</button>
          <button onClick={handleMoveDown} className="bg-gray-300 p-3 rounded">↓</button>
        </div>
      </div>
    </div>
  );
};

export default DualBoard;
