import { useCallback } from 'react';
import { Point } from '@/types/game';
import { FoodParticle } from '@/types/particle';

interface GameRendererProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasSize: number;
  GRID_SIZE: number;
  snake: Point[];
  food: Point;
  particles: FoodParticle[];
  gridToPixel: (coord: number) => number;
}

export const useGameRenderer = ({
  canvasRef,
  canvasSize,
  GRID_SIZE,
  snake,
  food,
  particles,
  gridToPixel
}: GameRendererProps) => {
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#222222';
    for (let i = 0; i < canvasSize; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasSize, i);
      ctx.stroke();
    }
  }, [canvasSize, GRID_SIZE]);

  const drawSnake = useCallback((ctx: CanvasRenderingContext2D) => {
    // Gambar badan ular terlebih dahulu
    snake.slice(1).forEach(({ x, y }) => {
      const pixelX = gridToPixel(x);
      const pixelY = gridToPixel(y);

      const gradient = ctx.createLinearGradient(
        pixelX,
        pixelY,
        pixelX + GRID_SIZE,
        pixelY + GRID_SIZE
      );
      gradient.addColorStop(0, '#00ff00');
      gradient.addColorStop(1, '#008800');

      ctx.fillStyle = gradient;
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 5;
      ctx.fillRect(pixelX, pixelY, GRID_SIZE, GRID_SIZE);
      ctx.shadowBlur = 0;
    });

    // Gambar kepala ular dengan warna yang berbeda
    if (snake.length > 0) {
      const head = snake[0];
      const pixelX = gridToPixel(head.x);
      const pixelY = gridToPixel(head.y);

      const headGradient = ctx.createLinearGradient(
        pixelX,
        pixelY,
        pixelX + GRID_SIZE,
        pixelY + GRID_SIZE
      );
      headGradient.addColorStop(0, '#00ff88'); // Warna kepala lebih terang
      headGradient.addColorStop(1, '#00cc66');

      ctx.fillStyle = headGradient;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 15; // Glow effect lebih kuat untuk kepala
      ctx.fillRect(pixelX, pixelY, GRID_SIZE, GRID_SIZE);
      ctx.shadowBlur = 0;
    }
  }, [snake, GRID_SIZE, gridToPixel]);

  const drawFood = useCallback((ctx: CanvasRenderingContext2D) => {
    const pixelX = gridToPixel(food.x);
    const pixelY = gridToPixel(food.y);

    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(
      pixelX + GRID_SIZE / 2,
      pixelY + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [food, GRID_SIZE, gridToPixel]);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.alpha;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }, [particles]);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw game elements
    drawGrid(ctx);
    drawSnake(ctx);
    drawFood(ctx);
    drawParticles(ctx);
  }, [canvasRef, canvasSize, drawGrid, drawSnake, drawFood, drawParticles]);

  return {
    drawGame
  };
};
