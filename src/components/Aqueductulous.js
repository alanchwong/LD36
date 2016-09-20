import React, { Component } from 'react';
import Game from './Game.js'
import TitleScreen from './TitleScreen.js'
import GameOver from './GameOver.js'
import { fromJS } from 'immutable';

import { createInitialState, newGame } from '../state';

const VIEWS = {
  Title: 'Title',
  Playing: 'Playing',
  GameOver: 'GameOver',
};

function newLevelSeed() {
  return window.btoa((Math.random() * 10e2).toFixed(0))
}

export default class Aqueductulous extends Component {
  constructor() {
    super();

    this.showTitle = this.updateView.bind(this, VIEWS.Title);
    this.newGame = () => {
      const newSeed = newLevelSeed();
      window.history.replaceState({}, '', '#' + newSeed);
      this.startGame(newSeed);
    };
    this.rematch = this.startGame.bind(this, null);
    this.showGameOver = this.updateView.bind(this, VIEWS.GameOver);
    this.updateGame = this.updateGame.bind(this);

    this.state = {
      data: fromJS({
        ...createInitialState(),
        view: VIEWS.Title,
      })
    }
  }

  startGame(seed) {
    this.setState({ data: fromJS(newGame(this.state.data.toJS(), seed)) });
    this.updateView(VIEWS.Playing);
  }

  updateView(view) {
    this.setState(({data}) => ({
      data: data.set('view', view)
    }))
  }

  updateGame(game, onComplete) {
    this.setState(({data}) => ({
      data: data.set('game', fromJS(game))
    }), onComplete);
  }

  render() {
    const view = this.state.data.get('view');
    const game = this.state.data.get('game');
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
            state={game.toJS()}
            updateState={this.updateGame}
            onGameOver={this.showGameOver} 
          />
        );
      case VIEWS.GameOver:
        return (
          <GameOver
            game={game.toJS()}
            onRematch={this.rematch}
            onNewGame={this.newGame}
          />
        );
      default:
        return null;
    }
  }
}