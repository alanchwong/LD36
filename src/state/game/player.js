import { yForX } from './level';

export const baseSpeed = 4;
export const slowerSpeedRatio = 0.5;

export const playerXOffset = 4; // Constant player position relative to edge of screen

export function playerCenter(position, level, unitLength=1, xOffset=playerXOffset) {
  return {
    x: xOffset * unitLength,
    y: yForX(level.curve, position) * unitLength,
  }
}