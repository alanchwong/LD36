import React, { Component, cloneElement } from 'react';
import { Surface } from 'react-art';

const containerStyle = {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#666361',
  WebkitTapHighlightColor: 'rgba(0,0,0,0)',
};

export default class FullWindowAspectFitSurface extends Component {
  constructor() {
    super();
    this._onResize = this.forceUpdate.bind(this, null);
  }

  static defaultProps = {
    aspect: { width: 16, height: 9 },
    maxWidth: Number.POSITIVE_INFINITY,
  }

  componentWillMount() {
    window.addEventListener('resize', this._onResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._onResize);
  }

  render() {
    const { aspect, maxWidth, children, domElements, ...rest } = this.props;

    const screenDimensions = aspectFill(
      aspect.width / aspect.height,
      Math.min(window.innerWidth, maxWidth),
      window.innerHeight
    );

    const unitLength = screenDimensions.width / aspect.width;
    
    return (
      <div
        style={containerStyle}
        tabIndex={0}
        ref={view => view && view.focus()}
        {...rest}
      >
        { domElements }
        <Surface {...screenDimensions}>
        { React.Children.map(children, (child, key) => cloneElement(child, { unitLength, key })) }
        </Surface>
      </div>
    );
  }
}

function aspectFill(ratio, width, height) {
  const availableRatio = width/height;
  return (availableRatio <= ratio)
    ? { width, height: width / ratio }
    : { width: height * ratio, height }
}