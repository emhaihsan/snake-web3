import { useCallback } from 'react';
import { Point } from '@/types/game';
import { FoodParticle } from '@/types/particle';

interface GameRendererProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  CANVAS_SIZE: number;
  GRID_SIZE: number;
  snake: Point[];
  food: Point;
  particles: FoodParticle[];
}

export const useGameRenderer = ({
  canvasRef,
  CANVAS_SIZE,
  GRID_SIZE,
  snake,
  food,
  particles,
}: GameRendererProps) => {
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#222222';
    for (let i = 0; i < CANVAS_SIZE; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }
  }, [CANVAS_SIZE, GRID_SIZE]);

  const drawSnake = useCallback((ctx: CanvasRenderingContext2D) => {
    snake.forEach(({ x, y }, index) => {
      const gradient = ctx.createLinearGradient(
        x * GRID_SIZE,
        y * GRID_SIZE,
        (x + 1) * GRID_SIZE,
        (y + 1) * GRID_SIZE
      );
      gradient.addColorStop(0, '#00ff00');
      gradient.addColorStop(1, '#008800');

      ctx.fillStyle = gradient;
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = index === 0 ? 10 : 5;
      ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
      ctx.shadowBlur = 0;
    });
  }, [snake, GRID_SIZE]);

  const drawFood = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [food, GRID_SIZE]);

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
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw components
    drawGrid(ctx);
    drawSnake(ctx);
    drawFood(ctx);
    drawParticles(ctx);
  }, [canvasRef, CANVAS_SIZE, drawGrid, drawSnake, drawFood, drawParticles]);

  const generateFood = useCallback((): Point => {
    let newFood: Point;
    do {
      newFood = {
        x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [CANVAS_SIZE, GRID_SIZE, snake]);

  return {
    drawGame,
    generateFood,
  };
};
