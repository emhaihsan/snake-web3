// src/constants/levels.ts
import { LevelInfo } from '../types/level';

export const LEVEL_INFO: Record<number, LevelInfo> = {
    1: {
        name: 'Easy',
        speed: 'Slow',
        points: '1x',
        info: 'Perfect for beginners! Snake moves slowly giving you time to think. Each food gives 10 point and 10 ULO token.',
        controls: 'Use arrow keys or WASD to control the snake.'
    },
    2: {
        name: 'Medium',
        speed: 'Normal',
        points: '2x',
        info: 'A balanced challenge! Snake moves faster and points are doubled. Each food gives 20 points and 20 ULO tokens.',
        controls: 'Quick reflexes required. Watch out for your growing tail!'
    },
    3: {
        name: 'Hard',
        speed: 'Fast',
        points: '3x',
        info: 'For experienced players! Snake moves quickly and points are tripled. Each food gives 30 points and 30 ULO tokens.',
        controls: 'Plan your moves ahead. Space is limited as you grow!'
    },
    4: {
        name: 'Expert',
        speed: 'Very Fast',
        points: '4x',
        info: 'The ultimate challenge! Lightning-fast snake movement with 4x points. Each food gives 40 points and 40 ULO tokens.',
        controls: 'Master-level precision needed. One wrong move and it\'s game over!'
    },
    5: {
        name: 'Master',
        speed: 'Insane',
        points: '5x',
        info: 'Only for the elite! Insane speed with maximum rewards. Each food gives 50 points and 50 ULO tokens.',
        controls: 'Superhuman reflexes required. Can you handle the pressure?'
    }
};

export const getLevelInfo = (level: number): LevelInfo => {
    return LEVEL_INFO[level] || LEVEL_INFO[1];
};