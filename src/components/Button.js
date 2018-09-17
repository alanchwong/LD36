import React, { Component } from 'react';
import { Group, Text } from 'react-art';
import Rectangle from 'react-art/Rectangle';

export default class Button extends Component {
  constructor() {
    super();
    this.state = { depressed: false }
    this.handlePress = this.handlePress.bind(this);
  }

  handlePress() {
    if (!this.state.depressed || this._pressTimeout) return;

    // delay `onPress` so that the user sees the button pop back up.
    this._pressTimeout = setTimeout(() => {
      this.setState({depressed: false});
      setTimeout(() => {
        this.props.onPress();
        this._pressTimeout = undefined;
      }, 50);
    }, 50)
  }

  render() {
    const { depressed } = this.state;
    const { x, y, width, height, children, color, textColor, shadowColor } = this.props;
    const fontSize = height / 3;
    const thickness = height / 10;
    return (
      <Group
        x={x} y={y}
        onMouseDown={() => this.setState({depressed: true})}
        onMouseOut={() => this.setState({depressed: false})}
        onMouseUp={this.handlePress}
      >
        { !depressed && <Rectangle y={thickness} fill={shadowColor} width={width} height={height} radius={10} /> }
        <Group y={depressed ? thickness : 0}>
          <Rectangle fill={color} width={width} height={height} radius={10} />
          <Text
            x={width/2}
            y={(height - fontSize)/2}
            font={{fontFamily: 'sans-serif', fontWeight: 'bold', fontSize}}
            fill={textColor}
            alignment='center'
          >
            {children}
          </Text>
        </Group>
      </Group>
    )
  }
}
Button.defaultProps = {
  x: 0,
  y: 0,
  width: 200,
  height: 100,
  textColor: '#fff',
  color: '#79C9E5',
  shadowColor: '#5891AF',
};