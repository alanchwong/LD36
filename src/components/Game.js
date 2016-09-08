import React, { Component } from 'react';

import { createInitialState,
          isPlayerAtEndOfTrack,
          isEnemyAtEndOfTrack,
          updateInput,
          updateTime } from '../game/core';

import { playerXOffset } from '../game/player'

import FullWindowAspectFitSurface from './FullWindowAspectFitSurface';
import Player from './Player';
import Level from './Level';
import Background from './Background';
import HazardFeedback from './HazardFeedback';

export default class Game extends Component {
  constructor({seed, onGameOver}) {
    super();

    this.state = createInitialState(seed);

    this.beginAcceleration = this.updateInput.bind(this, true);
    this.endAcceleration = this.updateInput.bind(this, false);

    const startTime = performance.now();
    this.updateTime = currentTime => {
      this.setState(updateTime(this.state, currentTime - startTime), () => {
        //
        // After the state updates, check to see if the game has ended.
        // If it has not, enqueue another rAF update.
        //
        // A tie is a loss!
        if (isPlayerAtEndOfTrack(this.state)) {
          onGameOver({
            time: this.state.elapsedTime,
            won: isEnemyAtEndOfTrack(this.state)
              ? false
              : true
          })
        } else {
          this.raf = requestAnimationFrame(this.updateTime);
        }
      });
    }
    this.raf = requestAnimationFrame(this.updateTime);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.raf);
  }

  updateInput(accelerating) {
    this.setState(updateInput(this.state, accelerating));
  }

  render() {
    const { player, level, enemyPlayer, enemyLevel, elapsedTime } = this.state;

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