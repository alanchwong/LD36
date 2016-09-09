import React, { Component, PropTypes } from 'react';

export class AudioContext extends Component {
  constructor() {
    super();

    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this._context = new window.AudioContext();
    }
    catch(e) {
      console.error('Error initializing Web Audio context: ' + e);
    }
  }

  getChildContext() {
    return { audio: this._context };
  }

  render() {
    const { tag:Tag, children } = this.props;
    return <Tag>{ children }</Tag>;
  }
}
AudioContext.defaultProps = {
  tag: 'div',
}
AudioContext.childContextTypes = {
  audio: PropTypes.object,
}

export default class Audio extends Component {
  componentWillMount() {
    this.fetchSource(
      source => {
        this._source = source;
        source.start();
      },
      error => console.error(error)
    );
  }

  componentWillReceiveProps(nextProps) {
    if (this._source) {
      this._source.playbackRate.value = nextProps.playbackRate;
    }
  }

  componentWillUnmount() {
    this._source.stop();
    delete this._source;
  }

  render() {
    // Does not render any visual elements
    return null;
  }

  fetchSource(onSuccess, onFailure) {
    const { source } = this.props;
    const { audio } = this.context;

    return fetch(source)
      .then(response => response.arrayBuffer())
      .then(buffer => audio.decodeAudioData(buffer,
        audioBuffer => {
          const audioSource = audio.createBufferSource();
          audioSource.buffer = audioBuffer;
          audioSource.connect(audio.destination);
          onSuccess(audioSource);
        },
        onFailure
      ))
      .catch(onFailure);
  }
}
Audio.defaultProps = {
  source: undefined,
  playbackRate: 1,
}
Audio.PropTypes = {
  source: PropTypes.string,
  playbackRate: PropTypes.number,
}
Audio.contextTypes = {
  audio: PropTypes.object.isRequired,
};