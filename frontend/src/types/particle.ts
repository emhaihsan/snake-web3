export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export interface FoodParticle extends Particle {
  size: number;
  decay: number;
}

export type ParticleColors = {
  foodParticle: string[];
};
