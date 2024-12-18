export type LeaderboardEntry = {
    playerAddress: string;
    playerName: string;
    score: number;
    level: number;
    timestamp: number;
};

export interface Point {
    x: number;
    y: number;
}

export type FoodParticle = {
    x: number;
    y: number;
    dx: number;
    dy: number;
    alpha: number;
    color: string;
    life: number;
};

export type SnakeSegment = Point;

export type Food = Point;

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface GameState {
    snake: Point[];
    food: Point;
    direction: Direction;
    score: number;
    gameOver: boolean;
    gameStarted: boolean;
    level: number;
}

export interface LevelInfo {
    requiredScore: number;
    speedMultiplier: number;
}