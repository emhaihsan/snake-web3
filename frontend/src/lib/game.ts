import { SnakeSegment, Food, Direction } from '../types/game';

export const CANVAS_SIZE: number = 400;
export const GRID_SIZE: number = 20;
export const CELL_SIZE: number = CANVAS_SIZE / GRID_SIZE;

export function generateFood(snake: SnakeSegment[]): Food {
    let newFood: Food;
    do {
        newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
}

export function moveSnake(snake: SnakeSegment[], direction: Direction): SnakeSegment[] {
    const head: SnakeSegment = { ...snake[0] };

    switch (direction) {
        case 'UP':
            head.y -= 1;
            break;
        case 'DOWN':
            head.y += 1;
            break;
        case 'LEFT':
            head.x -= 1;
            break;
        case 'RIGHT':
            head.x += 1;
            break;
    }

    return [head, ...snake.slice(0, -1)];
}

export function checkCollision(snake: SnakeSegment[]): boolean {
    const head: SnakeSegment = snake[0];

    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return true;
    }

    // Self collision
    return snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
}