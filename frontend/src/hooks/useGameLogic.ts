import { useCallback, useEffect } from 'react';
import { Point, GameState } from '@/types/game';

interface UseGameLogicProps {
    gameState: GameState;
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
    updateGameState,
    createFoodParticles,
    generateFood,
    handleGameOver,
    updateParticles,
    drawGame,
    getSnakeSpeed,
}: UseGameLogicProps) => {
    const { snake, food, direction, gameStarted, gameOver, level } = gameState;
    const CELL_COUNT = 25; // Konstanta untuk jumlah sel

    const checkCollision = useCallback((head: Point) => {
        // Skip checking the last segment since it will be removed
        return snake.slice(0, -1).some((segment) => segment.x === head.x && segment.y === head.y);
    }, [snake]);

    const moveSnake = useCallback(() => {
        const newSnake = [...snake];
        const head = { ...newSnake[0] };
        const newHead = { ...head };

        switch (direction) {
            case 'UP':
                newHead.y = (head.y - 1 + CELL_COUNT) % CELL_COUNT;
                break;
            case 'DOWN':
                newHead.y = (head.y + 1) % CELL_COUNT;
                break;
            case 'LEFT':
                newHead.x = (head.x - 1 + CELL_COUNT) % CELL_COUNT;
                break;
            case 'RIGHT':
                newHead.x = (head.x + 1) % CELL_COUNT;
                break;
        }

        // Update snake position first
        newSnake.unshift(newHead);
        if (newHead.x === food.x && newHead.y === food.y) {
            updateGameState({
                score: gameState.score + (level * 10)
            });
            createFoodParticles(food.x, food.y);
            updateGameState({ food: generateFood() });
        } else {
            newSnake.pop();
        }

        // Update state to show the collision frame
        updateGameState({ snake: newSnake });
        drawGame();

        // Check collision after updating position
        if (checkCollision(newHead)) {
            // Delay game over slightly to show collision frame
            setTimeout(() => {
                handleGameOver();
            }, 50);
            return;
        }

    }, [snake, food, direction, level, CELL_COUNT, checkCollision, createFoodParticles, drawGame, generateFood, handleGameOver, updateGameState, gameState.score]);

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
