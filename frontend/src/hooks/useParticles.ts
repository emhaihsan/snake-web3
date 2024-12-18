// src/hooks/useParticles.ts
import { useState, useCallback } from 'react';
import { FoodParticle } from '@/types/particle';

export const useParticles = (GRID_SIZE: number) => {
  const [particles, setParticles] = useState<FoodParticle[]>([]);

  const createFoodParticles = useCallback((x: number, y: number) => {
    const newParticles: FoodParticle[] = [];
    const particleCount = 8;
    const colors = ['#ff0000', '#ff4400', '#ff8800'];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2;
      newParticles.push({
        x: (x * GRID_SIZE) + (GRID_SIZE / 2),
        y: (y * GRID_SIZE) + (GRID_SIZE / 2),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3,
        decay: 0.02
      });
    }

    setParticles(prev => [...prev, ...newParticles]);
  }, [GRID_SIZE]);

  const updateParticles = useCallback(() => {
    setParticles(prevParticles => 
      prevParticles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          alpha: particle.alpha - particle.decay
        }))
        .filter(particle => particle.alpha > 0)
    );
  }, []);

  return { particles, createFoodParticles, updateParticles };
};