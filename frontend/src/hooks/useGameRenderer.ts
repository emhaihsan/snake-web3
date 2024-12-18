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
    snake.forEach(({ x, y }, index) => {
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
      ctx.shadowBlur = index === 0 ? 10 : 5;
      ctx.fillRect(pixelX, pixelY, GRID_SIZE - 2, GRID_SIZE - 2);
      ctx.shadowBlur = 0;
    });
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
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
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
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw components
    drawGrid(ctx);
    drawSnake(ctx);
    drawFood(ctx);
    drawParticles(ctx);
  }, [canvasRef, canvasSize, drawGrid, drawSnake, drawFood, drawParticles]);

  const generateFood = useCallback((): Point => {
    let newFood: Point;
    do {
      newFood = {
        x: Math.floor(Math.random() * (canvasSize / GRID_SIZE)),
        y: Math.floor(Math.random() * (canvasSize / GRID_SIZE)),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [canvasSize, GRID_SIZE, snake]);

  return {
    drawGame,
    generateFood,
  };
};
