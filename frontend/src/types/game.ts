export type LeaderboardEntry = {
    playerAddress: string;
    playerName: string;
    score: number;
    level: number;
    timestamp: number;
};

export type FoodParticle = {
    x: number;
    y: number;
    dx: number;
    dy: number;
    alpha: number;
    color: string;
    life: number;
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