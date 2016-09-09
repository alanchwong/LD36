//
// # Units and world size
//
// The game board is defined as a 16 unit x 9 unit rectangle.
//
// The player (the head of the rushing stream of water) is nominally
// centered at (4, 4.5) -- center left of the screen.
//

import { createEnemyProfile, isEnemyAcclerating } from './enemy.js'
import { createLevel, indexForX, segmentForIndex } from './level.js'
import { playerXOffset } from './player.js'

export const VELOCITY = {
  SLOW: 2.5,
  FAST: 4
};

const CHARACTER = {
  PLAYER: 1,
  ENEMY: 2,
}

export const GAMEMODE = {
  Title: 1,
  Playing: 2,
  GameOver: 3
};

export const HAZARD_RESULTS = {
  FAIL: { text: 'TOO FAST', velocity: 0.5 },
  GOOD: { text: 'GOOD', velocity: 1.2, window: 0.55 },
  GREAT: { text: 'GREAT!', velocity: 1.4, window: 0.25 },
  AMAZING: { text: 'AMAZING!!', velocity: 1.6, window: 0.1 },
};

const HAZARD_EVENT_TIME = 1;
const HAZARD_DETECTION_OFFSET = 0;

export function createInitialState(seed) {
  return {
    elapsedTime: 0,
    player: {
      position: 0,
      accelerating: false,
      lastHazardEvent: undefined, /*{
        time: undefined,
        result: undefined,
      }, */
    },
    level: createLevel(3, seed),
    enemyPlayer: {
      position: 0,
      accelerating: false,
      lastHazardEvent: undefined,
      enemyXOffset: 0,
    },
    enemyAI: createEnemyProfile(),
    enemyLevel: createLevel(6, seed + 1),
  }
}

export function updateInput(state, accelerating) {
  // Don't accept input after a failure
  const hazard = currentHazardResult(state); 
  if (hazard === HAZARD_RESULTS.FAIL) return state;

  return updateHazardEvent({
    ...state,
    player: {
      ...state.player,
      accelerating
    }
  });
}

export function updateTime(state, elapsedTime) {
  const dt = (elapsedTime - state.elapsedTime) / 1000;

  const newPlayerPosition = state.player.position + currentVelocity(state, CHARACTER.PLAYER) * dt;
  const newEnemyPosition = 
    isEnemyAtEndOfTrack(state) ? 
      state.enemyLevel.curve[state.enemyLevel.curve.length - 1].endpoint.x :
      state.enemyPlayer.position + currentVelocity(state, CHARACTER.ENEMY) * dt;

  const updatedMotion = {
    ...state,
    elapsedTime,
    player: {
      ...state.player,
      position: newPlayerPosition,
    },
    enemyPlayer: {
      ...state.enemyPlayer,
      accelerating: isEnemyAcceleratingNow,
      position: newEnemyPosition,
      xOffset: newEnemyPosition - (newPlayerPosition - playerXOffset)
    }
  };

  return updateHazardEvent(updateHazardEvent(updatedMotion, CHARACTER.PLAYER), CHARACTER.ENEMY);
}

export function updateGameMode(state, gameMode) {
  return {
    ...state,
    gameMode
  };
}

export function isPlayerAtEndOfTrack(state) {
  return isAtEndOfTrack(state.player.position, state.level.curve);
}

export function isEnemyAtEndOfTrack(state) {
  return isAtEndOfTrack(state.enemyPlayer.position, state.enemyLevel.curve);
}

function isAtEndOfTrack(position, curve) {
  return position >= curve[curve.length - 1].endpoint.x;
}

function updateHazardEvent(state, character = CHARACTER.PLAYER) {
  const { player, enemyPlayer, level, enemyLevel, elapsedTime } = state;
  const { position, accelerating } = character === CHARACTER.PLAYER ? player : enemyPlayer;
  const { curve, hazards } = character === CHARACTER.PLAYER ? level : enemyLevel;
  const positionVisualAdjust = position + HAZARD_DETECTION_OFFSET;
  const isHazard = hazards[indexForX(curve, positionVisualAdjust)];

  let hazardResult;

  if (accelerating && !currentHazardResult(state)) {
    if (isHazard) {
      hazardResult = HAZARD_RESULTS.FAIL;
    } else {
      const previousIndex = indexForX(level.curve, positionVisualAdjust) - 1;
      if (previousIndex >= 0 && hazards[previousIndex]) {
        const segment = segmentForIndex(curve, previousIndex);
        const hazardDistance = positionVisualAdjust - segment.endpoint.x;
        if (hazardDistance <= HAZARD_RESULTS.GOOD.window) hazardResult = HAZARD_RESULTS.GOOD;
        if (hazardDistance <= HAZARD_RESULTS.GREAT.window) hazardResult = HAZARD_RESULTS.GREAT;
        if (hazardDistance <= HAZARD_RESULTS.AMAZING.window) hazardResult = HAZARD_RESULTS.AMAZING;
      }
    }
  }

  if (hazardResult) {
    const newAccelerating = hazardResult === HAZARD_RESULTS.FAIL ? false : accelerating;
    const newLastHazardEvent = { time: elapsedTime, result: hazardResult }

    if (character === CHARACTER.PLAYER) {
      return {
        ...state,
        player: {
          ...player,
          accelerating: newAccelerating,
          lastHazardEvent: newLastHazardEvent,
        }
      }
    }
    else if (character === CHARACTER.ENEMY) {
      return {
        ...state,
        enemyPlayer: {
          ...enemyPlayer,
          accelerating: newAccelerating,
          lastHazardEvent: newLastHazardEvent,
        }
      }
    }
    else { return state; }
  }

  return state;
}

function currentHazardResult(state, character = CHARACTER.PLAYER) {
  const { lastHazardEvent } = character === CHARACTER.PLAYER ? state.player : state.enemyPlayer;
  if (
    lastHazardEvent
    && (state.elapsedTime - lastHazardEvent.time) / 1000 < HAZARD_EVENT_TIME
  ) {
    return lastHazardEvent.result;
  }
}

function hazardVelocityModifier(state, character = CHARACTER.PLAYER) {
  const hazard = currentHazardResult(state, character);
  return hazard ? hazard.velocity : 1;
}

export function currentVelocity(state, character = CHARACTER.PLAYER) {
  const accelerating = character === CHARACTER.PLAYER
    ? state.player.accelerating
    : isEnemyAcclerating(state.enemyLevel, state.enemyPlayer, state.enemyAI);
  const velocity = accelerating ? VELOCITY.FAST : VELOCITY.SLOW;
  return velocity * hazardVelocityModifier(state, character);
}