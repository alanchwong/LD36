import { createDefaultSettings } from './settings';

export function createInitialState () {
  return {
    game: undefined,
    settings: createDefaultSettings(),
  }
}