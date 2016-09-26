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

import logger from '../util/log.js'

const Log = logger("Core");

const VELOCITY = {
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

  const { position, accelerating } = state.player; 
  const velocity = accelerating ? VELOCITY.FAST : VELOCITY.SLOW;

  const enemyPosition = state.enemyPlayer.position;
  const enemyVelocity = state.enemyPlayer.accelerating ? VELOCITY.FAST : VELOCITY.SLOW;

  const newPlayerPosition = position + velocity * hazardVelocityModifier(state) * dt;
  const newEnemyPosition = isEnemyAtEndOfTrack(state) ?
    state.enemyLevel.curve[state.enemyLevel.curve.length - 1].endpoint.x : 
    enemyPosition + enemyVelocity * hazardVelocityModifier(state, CHARACTER.ENEMY) * dt;

  Log({ message: "UpdateTime Start " + elapsedTime });
  
  const updatedMotion = {
    ...state,
    elapsedTime,
    player: {
      ...state.player,
      position: newPlayerPosition,
    },
    enemyPlayer: {
      ...state.enemyPlayer,
      position: newEnemyPosition,
      xOffset: newEnemyPosition - (newPlayerPosition - playerXOffset)
    }
  };

  //return updateHazardEvent(updateHazardEvent(updatedMotion, CHARACTER.PLAYER), CHARACTER.ENEMY);
  const newState =  updateHazardEvent(updateHazardEvent(updatedMotion, CHARACTER.PLAYER), CHARACTER.ENEMY);

  // Do the thing
  const newNewState = {
    ...newState,
    enemyPlayer: {
      ...newState.enemyPlayer,
      accelerating: isEnemyAcclerating(newState)
    },
  };

  Log({ message:"UpdateTime finished " + elapsedTime });

  return newNewState;
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

  if (accelerating && !currentHazardResult(state, character)) {
    if (isHazard) {
      hazardResult = HAZARD_RESULTS.FAIL;
    } else {
      const previousIndex = indexForX(curve, positionVisualAdjust) - 1;

      if (character === CHARACTER.ENEMY) {
        Log({
          title: "EnemyHCalc1",
          valuesMap: [
            [ "x", positionVisualAdjust ],
            [ "PrevIdx", previousIndex ],
            [ "IsPrevHaz: ", hazards[previousIndex] ] ]
          });
      }

      if (previousIndex >= 0 && hazards[previousIndex]) {
        const segment = segmentForIndex(curve, previousIndex);
        const hazardDistance = positionVisualAdjust - segment.endpoint.x;
        if (hazardDistance <= HAZARD_RESULTS.GOOD.window) hazardResult = HAZARD_RESULTS.GOOD;
        if (hazardDistance <= HAZARD_RESULTS.GREAT.window) hazardResult = HAZARD_RESULTS.GREAT;
        if (hazardDistance <= HAZARD_RESULTS.AMAZING.window) hazardResult = HAZARD_RESULTS.AMAZING;

        if (character === CHARACTER.ENEMY) {
          Log({
            title: "EnemyHCalc2",
            valuesMap: [
              [ "prevX", segment.endpoint.x ],
              [ "HazDist", hazardDistance ] ]
            });
        }
      }
    }
  }

  if (character === CHARACTER.ENEMY) {
    Log({
      title: "EnemyHCalc3",
      valuesMap: [ 
        [ "T", elapsedTime ],
        [ "x", position ],
        [ "acc", accelerating ],
        [ "idx", indexForX(curve, positionVisualAdjust)],
        [ "isHaz", isHazard ],
        [ "HazRes", hazardResult === undefined ? "n/a" : hazardResult.text ],
        [ "LastHazRes", 
          ((currHazRes=currentHazardResult(state, character)) => { 
            return currHazRes !== undefined ? currHazRes.text : "n/a" 
          })() ] ]
    });  
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
      Log({
        title: "EnemyHaz",
        valuesMap: [
          [ "T", newLastHazardEvent.time ], 
          [ "x", position ], 
          [ "Result", newLastHazardEvent.result.text ] ]
      });
      return {
        ...state,
        enemyPlayer: {
          ...enemyPlayer,
          accelerating: newAccelerating,
          lastHazardEvent: newLastHazardEvent,
        }
      }
    }
    else {
      return state;
    }
  }

  // No hazard result AND in hazard means smartly didn't boost in hazard.
  if (character === CHARACTER.ENEMY && isHazard) { 
    Log({
      title: "EnemyHaz",
      valuesMap: [ 
        [ "T", elapsedTime ],
        [ "x", position ], 
        [ "Result", "OK no boost." ] ]
      });
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
