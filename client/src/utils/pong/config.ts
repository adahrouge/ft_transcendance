import type { GameConfig, BallSpeedLevel } from "../../types/pong";
import { i18n } from "../../services/i18n";

// Default game configuration for vertical retro pong
export const DEFAULT_GAME_CONFIG: GameConfig = {
  width: 600,
  height: 600,
  paddleW: 80,
  paddleH: 12,
  ballSize: 12,
  paddleSpeed: 400,
  ballSpeed: 350,
  scoreToWin: 5,
};

export const BALL_SPEEDS: Record<BallSpeedLevel, number> = {
  slow: 250,
  normal: 350,
  fast: 500,
};

export const AI_DIFFICULTY_LABELS = ["EASY", "MEDIUM", "HARD"];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getAIConfigFromDifficulty(difficulty: number) {
  const t = difficulty / 100;

  const easy = {
    maxSpeed: 280,
    maxAccel: 1200,
    minReactionMs: 300,
    maxReactionMs: 450,
    minJitter: 25,
    maxJitter: 50,
    defocusFrac: 0.45,
    defocusMultiplier: 2.0,
    visionMs: 1200,
    overshootBias: 0.2,
  };

  const medium = {
    maxSpeed: 600,
    maxAccel: 8000,
    minReactionMs: 60,
    maxReactionMs: 120,
    minJitter: 5,
    maxJitter: 15,
    defocusFrac: 0.1,
    defocusMultiplier: 1.2,
    visionMs: 300,
    overshootBias: 0.05,
  };

  const hard = {
    maxSpeed: 1500,
    maxAccel: 80000,
    minReactionMs: 0,
    maxReactionMs: 0,
    minJitter: 0,
    maxJitter: 0,
    defocusFrac: 0.0,
    defocusMultiplier: 1.0,
    visionMs: 0,
    overshootBias: 0.0,
  };

  if (t <= 0.5) {
    const localT = t / 0.5;
    return {
      maxSpeed: lerp(easy.maxSpeed, medium.maxSpeed, localT),
      maxAccel: lerp(easy.maxAccel, medium.maxAccel, localT),
      minReactionMs: lerp(easy.minReactionMs, medium.minReactionMs, localT),
      maxReactionMs: lerp(easy.maxReactionMs, medium.maxReactionMs, localT),
      minJitter: lerp(easy.minJitter, medium.minJitter, localT),
      maxJitter: lerp(easy.maxJitter, medium.maxJitter, localT),
      defocusFrac: lerp(easy.defocusFrac, medium.defocusFrac, localT),
      defocusMultiplier: lerp(easy.defocusMultiplier, medium.defocusMultiplier, localT),
      visionMs: lerp(easy.visionMs, medium.visionMs, localT),
      overshootBias: lerp(easy.overshootBias, medium.overshootBias, localT),
    };
  } else {
    const localT = (t - 0.5) / 0.5;
    return {
      maxSpeed: lerp(medium.maxSpeed, hard.maxSpeed, localT),
      maxAccel: lerp(medium.maxAccel, hard.maxAccel, localT),
      minReactionMs: lerp(medium.minReactionMs, hard.minReactionMs, localT),
      maxReactionMs: lerp(medium.maxReactionMs, hard.maxReactionMs, localT),
      minJitter: lerp(medium.minJitter, hard.minJitter, localT),
      maxJitter: lerp(medium.maxJitter, hard.maxJitter, localT),
      defocusFrac: lerp(medium.defocusFrac, hard.defocusFrac, localT),
      defocusMultiplier: lerp(medium.defocusMultiplier, hard.defocusMultiplier, localT),
      visionMs: lerp(medium.visionMs, hard.visionMs, localT),
      overshootBias: lerp(medium.overshootBias, hard.overshootBias, localT),
    };
  }
}

export function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 33) return i18n.t('easy');
  if (difficulty <= 66) return i18n.t('medium');
  return i18n.t('hard');
}
