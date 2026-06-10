import { roundToStep } from './math';

export function snapPosition(value: number, step: number): number {
  return roundToStep(value, step);
}

export function snapRotation(radians: number, angleStep: number): number {
  const stepRad = (angleStep * Math.PI) / 180;
  return roundToStep(radians, stepRad);
}

export function snapScale(value: number, step: number): number {
  return Math.max(0.01, roundToStep(value, step));
}
