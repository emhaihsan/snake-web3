// src/constants/levels.ts
import { LevelInfo } from '../types/level';

export const LEVEL_INFO: Record<number, LevelInfo> = {
    1: {
        name: 'Very Easy',
        speed: 'Very Slow',
        points: '1x',
        info: 'Perfect for beginners! Snake moves very slowly giving you time to think. Each food gives 10 point and 10 ULO token.',
        controls: 'Use arrow keys or WASD to control the snake.'
    },
    2: {
        name: 'Easy',
        speed: 'Slow',
        points: '2x',
        info: 'A gentle challenge! Snake moves slowly and points are doubled. Each food gives 20 points and 20 ULO tokens.',
        controls: 'Basic reflexes required. Watch out for your growing tail!'
    },
    3: {
        name: 'Medium',
        speed: 'Normal',
        points: '3x',
        info: 'For intermediate players! Snake moves at normal speed and points are tripled. Each food gives 30 points and 30 ULO tokens.',
        controls: 'Plan your moves ahead. Space is limited as you grow!'
    },
    4: {
        name: 'Hard',
        speed: 'Fast',
        points: '4x',
        info: 'For skilled players! Fast snake movement with 4x points. Each food gives 40 points and 40 ULO tokens.',
        controls: 'Advanced precision needed. One wrong move and it\'s game over!'
    },
    5: {
        name: 'Very Hard',
        speed: 'Very Fast',
        points: '5x',
        info: 'The ultimate challenge! Very fast speed with maximum rewards. Each food gives 50 points and 50 ULO tokens.',
        controls: 'Expert reflexes required. Can you handle the pressure?'
    }
};

export const getLevelInfo = (level: number): LevelInfo => {
    return LEVEL_INFO[level] || LEVEL_INFO[1];
};