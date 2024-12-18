// src/hooks/useParticles.ts
import { useState } from 'react';
import { FoodParticle } from '../types/game';
import { PARTICLE_COLORS, PARTICLE_COUNT, PARTICLE_LIFE_DECREASE, PARTICLE_VELOCITY_DECAY } from '../constant/game';

export const useParticles = (GRID_SIZE: number) => {
    const [particles, setParticles] = useState<FoodParticle[]>([]);

    const getRandomColor = (): string => {
        return PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    };

    const createFoodParticles = (x: number, y: number): void => {
        const newParticles: FoodParticle[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const angle = (Math.PI * 2 * i) / PARTICLE_COUNT;
            newParticles.push({
                x: x * GRID_SIZE + GRID_SIZE / 2,
                y: y * GRID_SIZE + GRID_SIZE / 2,
                dx: Math.cos(angle) * 2,
                dy: Math.sin(angle) * 2,
                alpha: 1,
                color: getRandomColor(),
                life: 1
            });
        }
        setParticles(newParticles);
    };

    const updateParticles = (): void => {
        setParticles(prevParticles =>
            prevParticles
                .map(p => ({
                    ...p,
                    x: p.x + p.dx,
                    y: p.y + p.dy,
                    life: p.life - PARTICLE_LIFE_DECREASE,
                    dx: p.dx * PARTICLE_VELOCITY_DECAY,
                    dy: p.dy * PARTICLE_VELOCITY_DECAY
                }))
                .filter(p => p.life > 0)
        );
    };

    return {
        particles,
        createFoodParticles,
        updateParticles
    };
};