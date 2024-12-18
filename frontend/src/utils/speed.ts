// src/utils/speed.ts
import { BASE_SPEED, SPEED_DECREASE } from '../constant/game';

export const calculateSnakeSpeed = (level: number): number => {
    return BASE_SPEED - (level - 1) * SPEED_DECREASE;
};