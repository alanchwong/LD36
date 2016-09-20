import React, { Component } from 'react';

import * as game from '../state/game';
import { playerXOffset } from '../state/game/player'

import FullWindowAspectFitSurface from './FullWindowAspectFitSurface';
import Player from './Player';
import Level from './Level';
import Background from './Background';
import HazardFeedback from './HazardFeedback';

export default class Game extends Component {
  constructor() {
    super();

    this.beginAcceleration = this.updateInput.bind(this, true);
    this.endAcceleration = this.updateInput.bind(this, false);

    // Start the time loop
    const startTime = performance.now();
    this.updateTime = this.updateTime.bind(this, startTime);
    this.gameOverOrScheduleTimeUpdate = this.gameOverOrScheduleTimeUpdate.bind(this);
    this.raf = requestAnimationFrame(this.updateTime);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.raf);
  }

  updateInput(accelerating) {
    const { state, updateState } = this.props;
    // ignore key repeats that don't change the state
    if (accelerating === state.player.accelerating) return;
    
    updateState(game.updateInput(state, accelerating));
  }

  updateTime(startTime, currentTime) {
    const { state, updateState } = this.props;
    updateState(
      game.updateTime(state, currentTime - startTime),
      this.gameOverOrScheduleTimeUpdate
    );
  }

  gameOverOrScheduleTimeUpdate() {
    const { state, onGameOver } = this.props;
    // After the state updates, check to see if the game has ended.
    // If it has not, enqueue another rAF update.
    if (game.isPlayerAtEndOfTrack(state)) {
      onGameOver();
    } else {
      this.raf = requestAnimationFrame(this.updateTime);
    }
  }

  render() {
    const { player, level, enemyPlayer, enemyLevel, elapsedTime } = this.props.state;

    return (
      <FullWindowAspectFitSurface
        onMouseDown={this.beginAcceleration}
        onMouseUp={this.endAcceleration}
        onKeyDown={this.beginAcceleration}
        onKeyUp={this.endAcceleration}
        onTouchStart={e => { e.preventDefault(); this.beginAcceleration(); }}
        onTouchEnd={e => { e.preventDefault(); this.endAcceleration(); }}
        onTouchCancel={e => { e.preventDefault(); this.endAcceleration(); }}
      >
        <Background xOffset={-player.position}/>
        <Level key={"vitrviusLevel"} {...enemyLevel} xOffset={player.position}/>
        <Player
          key={"vitrvius"}
          {...enemyPlayer}
          level={enemyLevel}
          elapsedTime={elapsedTime}
          xOffset={enemyPlayer.xOffset}
        />
        <Level key={"level"} {...level} xOffset={player.position}/>
        <Player
          key={"player"}
          {...player}
          level={level}
          elapsedTime={elapsedTime}
          xOffset={playerXOffset}
        />
        <HazardFeedback
          player={player}
          level={level}
          elapsedTime={elapsedTime}
        />
      </FullWindowAspectFitSurface>
    );
  }
}