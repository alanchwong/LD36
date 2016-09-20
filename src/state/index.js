import { createDefaultSettings } from './settings';
import { createInitialState as createGame } from './game';

export function createInitialState () {
  return {
    settings: createDefaultSettings(),
    game: undefined,
  }
}

export function newGame (state, seed) {
  return { ...state, game: createGame(seed) };
}