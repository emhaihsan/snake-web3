import { useCallback, useEffect } from 'react';
import { Point, GameState } from '@/types/game';

interface UseGameLogicProps {
    gameState: GameState;
    canvasSize: number;
    GRID_SIZE: number;
    updateGameState: (updates: Partial<GameState>) => void;
    createFoodParticles: (x: number, y: number) => void;
    generateFood: () => Point;
    handleGameOver: () => void;
    updateParticles: () => void;
    drawGame: () => void;
    getSnakeSpeed: number;
}

export const useGameLogic = ({
    gameState,
    canvasSize,
    GRID_SIZE,
    updateGameState,
    createFoodParticles,
    generateFood,
    handleGameOver,
    updateParticles,
    drawGame,
    getSnakeSpeed,
}: UseGameLogicProps) => {
    const { snake, food, direction, gameStarted, gameOver, level } = gameState;

    const checkCollision = useCallback((head: Point) => {
        return snake.slice(1).some((segment) => segment.x === head.x && segment.y === head.y);
    }, [snake]);

    const moveSnake = useCallback(() => {
        const newSnake = [...snake];
        const head = { ...newSnake[0] };

        switch (direction) {
            case 'UP':
                head.y = (head.y - 1 + canvasSize / GRID_SIZE) % (canvasSize / GRID_SIZE);
                break;
            case 'DOWN':
                head.y = (head.y + 1) % (canvasSize / GRID_SIZE);
                break;
            case 'LEFT':
                head.x = (head.x - 1 + canvasSize / GRID_SIZE) % (canvasSize / GRID_SIZE);
                break;
            case 'RIGHT':
                head.x = (head.x + 1) % (canvasSize / GRID_SIZE);
                break;
        }

        if (checkCollision(head)) {
            handleGameOver();
            return;
        }

        if (head.x === food.x && head.y === food.y) {
            updateGameState({
                score: gameState.score + (level * 10)
            });
            createFoodParticles(food.x, food.y);
            updateGameState({ food: generateFood() });
        } else {
            newSnake.pop();
        }

        newSnake.unshift(head);
        updateGameState({ snake: newSnake });
        drawGame();
    }, [snake, food, direction, level, canvasSize, GRID_SIZE, checkCollision, createFoodParticles, drawGame, generateFood, handleGameOver, updateGameState, gameState.score]);

    const handleKeyPress = useCallback((e: KeyboardEvent) => {
        if (!gameStarted || gameOver) return;

        switch (e.key.toLowerCase()) {
            case 'w':
                if (direction !== 'DOWN') updateGameState({ direction: 'UP' });
                break;
            case 's':
                if (direction !== 'UP') updateGameState({ direction: 'DOWN' });
                break;
            case 'a':
                if (direction !== 'RIGHT') updateGameState({ direction: 'LEFT' });
                break;
            case 'd':
                if (direction !== 'LEFT') updateGameState({ direction: 'RIGHT' });
                break;
        }
    }, [gameStarted, gameOver, direction, updateGameState]);

    // Game loop with particle updates
    useEffect(() => {
        if (!gameStarted || gameOver) return;

        const gameInterval = setInterval(() => {
            moveSnake();
            updateParticles();
        }, getSnakeSpeed);

        return () => clearInterval(gameInterval);
    }, [gameStarted, gameOver, getSnakeSpeed, moveSnake, updateParticles]);

    // Handle keyboard controls
    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);

    return {
        moveSnake,
        handleKeyPress
    };
};
