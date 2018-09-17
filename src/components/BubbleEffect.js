import React, { Component } from 'react';
import { Group } from 'react-art';
import Circle from 'react-art/Circle';
import Color from 'color';

class Bubble extends Component {
  constructor(props) {
    super(props);
    const { maxSpawnDistance, unitLength, intensity } = props;
    this.state = {
      initialPosition: {
        x: (1/8 + 1/4 * maxSpawnDistance * Math.random()) * unitLength,
        y: (-1/3 + 2/3 * Math.random()) * maxSpawnDistance * unitLength
      },
      velocity: {
        x: -1/2 * intensity * Math.random() * unitLength,
        y: (-1/8 + 1/4 * Math.random()) * unitLength,
      },
    }
  }

  render() {
    const { initialPosition, velocity } = this.state;
    const { size, unitLength, t, color } = this.props;

    return (
      <Circle
        x={initialPosition.x + velocity.x * t}
        y={initialPosition.y + velocity.y * t}
        radius={(1/2 + 1/2*t) * size * unitLength}
        fill={Color(color).clearer(0.2 + 0.5 * t).rgbString()}
      />
    )
  }
}
Bubble.defaultProps = {
  size: 1/12,
  color: '#fff',
}

export default class BubbleEffect extends Component {
  constructor() {
    super();
    this.state = { bubbleTimes: [] }
  }

  componentWillReceiveProps(nextProps) {
    const { bubbleTimes } = this.state;
    const { elapsedTime } = nextProps;
    const {
      frequency: bubbleFrequency,
      duration: bubbleDuration
    } = this.bubblePropsForProps(nextProps);

    const lastBubbleTime = bubbleTimes[bubbleTimes.length - 1] || 0;
    const timeSinceLastBubble = (elapsedTime - lastBubbleTime) / 1000;
    const shouldSpawnBubble = Math.random() > (1 - (bubbleFrequency * timeSinceLastBubble));

    let updatedBubbleTimes = bubbleTimes.reduce((result, current, index) => (
      // Remove any expired bubbles from the list
      (((elapsedTime - current) / 1000) < bubbleDuration)
        ? [...result, current]
        : result
    ), []);

    if (shouldSpawnBubble) {
      updatedBubbleTimes = [...updatedBubbleTimes, elapsedTime];
    }

    this.setState({ bubbleTimes: updatedBubbleTimes });
  }

  bubblePropsForProps({ bubbleDuration, bubbleFrequency, intensity }) {
    return {
      duration: bubbleDuration * (1 / (2 * intensity) + 1/2),
      frequency: bubbleFrequency * intensity * intensity * intensity,
    }
  }

  render() {
    const { bubbleTimes } = this.state;
    const { duration:bubbleDuration } = this.bubblePropsForProps(this.props);
    const { x, y, maxSpawnDistance, elapsedTime, unitLength, intensity } = this.props;

    return (
      <Group x={x} y={y}>
      { bubbleTimes.map(spawnTime => (
        <Bubble
          key={spawnTime}
          t={(elapsedTime - spawnTime)/(1000 * bubbleDuration)}
          intensity={intensity}
          maxSpawnDistance={maxSpawnDistance}
          unitLength={unitLength}
        />
      ))}
      </Group>
    )
  }
}
BubbleEffect.defaultProps = {
  bubbleDuration: 0.5,
  bubbleFrequency: 2,
  intensity: 1,
};