import React, { Component } from 'react';
import Game from './Game.js'
import TitleScreen from './TitleScreen.js'
import GameOver from './GameOver.js'

import { createInitialState } from '../state';
import { createInitialState as createGame } from '../state/game'

const VIEWS = {
  Title: Symbol('Title'),
  Playing: Symbol('Playing'),
  GameOver: Symbol('GameOver'),
};

function newLevelSeed() {
  return window.btoa((Math.random() * 10e2).toFixed(0))
}

export default class Aqueductulous extends Component {
  constructor() {
    super();

    this.state = {
      ...createInitialState(),
      view: VIEWS.Title,
    }

    this.newGame = this.newGame.bind(this);
    this.updateGame = (game, onComplete) => this.setState({ game }, onComplete);
    this.showGameOver = this.setState.bind(this, { view: VIEWS.GameOver });
    this.rematch = this.startGame.bind(this, null);
  }

  newGame() {
    const newSeed = newLevelSeed();
    window.history.replaceState({}, '', '#' + newSeed);
    this.startGame(newSeed);
  }

  startGame(seed) {
    this.setState({
      game: createGame(seed),
      view: VIEWS.Playing,
    });
  }

  render() {
    const { view, game } = this.state;
    const hasSeed = !!window.location.hash;

    switch (view) {
      case VIEWS.Title:
        return (
          <TitleScreen
            onStartGame={hasSeed ? this.rematch : this.newGame}
          />
        )
      case VIEWS.Playing:
        return (
          <Game
            state={game}
            updateState={this.updateGame}
            onGameOver={this.showGameOver} 
          />
        );
      case VIEWS.GameOver:
        return (
          <GameOver
            game={game}
            onRematch={this.rematch}
            onNewGame={this.newGame}
          />
        );
      default:
        return null;
    }
  }
}