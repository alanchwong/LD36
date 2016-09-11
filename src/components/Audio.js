import { createElement, Component, PropTypes } from 'react';
import Tone from 'tone';

//
// Higher order component that manages the imperitve/object-oriented audio
// resources and passes an `audio` prop to its wrapped component.
//
// Wrap the common parent of all of your Audio components with this, and
// then use the `audio` object to control playback.
//
export function WithAudio (BaseComponent) {
  class WrappedComponent extends Component {
    static displayName = `WithAudio(${BaseComponent.displayName})`

    //
    // These audioControls represent the imperative interface that is sent
    // as a prop to a component wrapped with WithAudio, below.
    //
    static audioControls = {
      start: () => Tone.Transport.start(),
      stop: () => Tone.Transport.stop(),
      log: () => console.log(Tone.Transport.state, Tone.Transport.position),
    }

    render() {
      const { children, ...rest } = this.props;
      return createElement(
        BaseComponent,
        { audio: WrappedComponent.audioControls, ...rest },
        children
      );
    }
  }

  return WrappedComponent;
}

//
// This React component represents an individual audio clip.
//
// Currently wrapping Tone.GrainPlayer, allowing time-stretched playback.
// See: https://tonejs.github.io/docs/#GrainPlayer
//
export default class Audio extends Component {
  static propTypes = {
    source: PropTypes.string.isRequired,  // URL
    speed: PropTypes.number,              // normalized value (i.e. 1: normal)
    startFrom: PropTypes.number,          // seconds from beginning of track
    grainSize: PropTypes.number,          // seconds, param for GrainPlayer
    overlap: PropTypes.number,            // seconds, param for GrainPlayer
  }

  static defaultProps = {
    speed: 1,
    startFrom: 0,
    grainSize: 0.1,
    overlap: 0.05,
  }

  componentWillMount() {
    const { source, startFrom } = this.props;
    this._player = new Tone.GrainPlayer(
      {
        url: source,
        onload: () => {
          console.log('loaded ' + source);
          this.renderAudio(this.props);
          this._event = new Tone.Event(time => {
            this._player.start(Tone.now(), startFrom);
          });
          this._event.start();
        },
      }
    ).toMaster();
  }

  //
  // "renders" updated audio props to the underlying object states.
  //
  // `source` is not updated
  // `startFrom` is not updated (does it make sense to even update this?)
  //
  renderAudio(props) {
    if (!this._player) return;

    const { speed, grainSize, overlap } = props;
    
    this._player.playbackRate = speed;
    this._player.grainSize = grainSize;
    this._player.overlap =  overlap;
  }

  componentWillReceiveProps(nextProps) {
    this.renderAudio(nextProps);
  }

  componentWillUnmount() {
    if (this._event) {
      this._event.dispose();
      delete this._event;
    }
    if (this._player) {
      this._player.dispose();
      delete this._player;
    }
  }

  // Does not render any visual elements
  render() { return null; }
}