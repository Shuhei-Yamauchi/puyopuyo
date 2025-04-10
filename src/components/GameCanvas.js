import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

const GRID_COLS = 6;
const GRID_ROWS = 12;
const CELL_SIZE = 40; // 各セルのサイズ（px）
const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;
const COLORS = ['red', 'blue', 'green', 'yellow'];

/**
 * ランダムな色を取得
 */
function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

const GameCanvas = () => {
  const canvasRef = useRef(null);

  // 盤面は初期状態ではすべて null（空セル）にする
  const [board, setBoard] = useState(() => {
    return Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
  });

  // 現在落下中のぷよ（2個セット）の情報
  const [currentPiece, setCurrentPiece] = useState({
    positions: [{ x: 2, y: 0 }, { x: 2, y: 1 }],
    colors: [getRandomColor(), getRandomColor()]
  });

  /**
   * キャンバスに盤面および落下中のぷよを描画する
   */
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 盤面グリッドの描画
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        // 盤面にぷよがあれば描画
        if (board[row][col]) {
          ctx.beginPath();
          ctx.arc(col * CELL_SIZE + CELL_SIZE / 2, row * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
          ctx.fillStyle = board[row][col];
          ctx.fill();
          ctx.closePath();
        }
      }
    }

    // 現在の落下中のぷよを描画
    currentPiece.positions.forEach((pos, index) => {
      ctx.beginPath();
      ctx.arc(pos.x * CELL_SIZE + CELL_SIZE / 2, pos.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fillStyle = currentPiece.colors[index];
      ctx.fill();
      ctx.closePath();
    });
  };

  /**
   * 定期的にぷよを下に移動させる
   */
  useEffect(() => {
    const interval = setInterval(() => {
      movePieceDown();
    }, 500);
    return () => clearInterval(interval);
    // currentPiece や board が更新されるたびに最新状態を参照
  }, [currentPiece, board]);

  /**
   * 落下中のぷよを下に移動させるロジック
   */
  const movePieceDown = () => {
    // 新しい位置を計算（各ぷよを1セル下に）
    const newPositions = currentPiece.positions.map(pos => ({ x: pos.x, y: pos.y + 1 }));
    let collision = false;

    // 移動先が盤面の底、または既にぷよが存在する場合は衝突と判断
    newPositions.forEach(pos => {
      if (pos.y >= GRID_ROWS || (pos.y >= 0 && board[pos.y][pos.x])) {
        collision = true;
      }
    });

    if (!collision) {
      setCurrentPiece(prev => ({ ...prev, positions: newPositions }));
    } else {
      // 衝突時：現在のぷよを盤面に固定する
      const newBoard = board.map(row => row.slice());
      currentPiece.positions.forEach((pos, index) => {
        if (pos.y >= 0 && pos.y < GRID_ROWS && pos.x >= 0 && pos.x < GRID_COLS) {
          newBoard[pos.y][pos.x] = currentPiece.colors[index];
        }
      });
      setBoard(newBoard);

      // GSAPを使ってぷよ固定時のエフェクト（例：拡大縮小のアニメーション）
      gsap.fromTo(
        canvasRef.current,
        { scale: 1 },
        { scale: 1.05, duration: 0.1, yoyo: true, repeat: 1 }
      );

      // 新たなぷよを生成（初期位置にセット）
      setCurrentPiece({
        positions: [{ x: 2, y: 0 }, { x: 2, y: 1 }],
        colors: [getRandomColor(), getRandomColor()]
      });

      // ※ ここで連鎖判定や消去アニメーションなどを後日実装可能
    }
  };

  // board または currentPiece の状態が更新されたら再描画する
  useEffect(() => {
    draw();
  }, [board, currentPiece]);

  return (
    <div className="flex justify-center items-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-black shadow-lg"
      />
    </div>
  );
};

export default GameCanvas;
