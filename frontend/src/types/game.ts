export type LeaderboardEntry = {
    name: string;
    score: number;
    level: number;
};

export type FoodParticle = {
    x: number;
    y: number;
    dx: number;
    dy: number;
    life: number;
    color: string;
};

export type SnakeSegment = {
    x: number;
    y: number;
};

export type Food = {
    x: number;
    y: number;
};

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';