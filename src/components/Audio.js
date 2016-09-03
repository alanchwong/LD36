import React, { Component } from 'react';
import fetch from 'whatwg-fetch';

export default class Audio extends Component {
  constructor() {
    super();
    this._context = null;
    this.loadContext = this.loadContext.bind(this);
  }

  componentWillReceiveProps(nextProps) {

  }

  loadContext(audioElement) {
    if (this._context) return;

    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this._context = new AudioContext();
      this._source = this._context.createMediaElementSource(audioElement);
      this._source.connect(this._context.destination);
    }
    catch(e) {
      console.error('Web Audio API is not supported in this browser');
    }
  }

  componentWillMount() {
    // const { source } = this.props;
    // try {
    //   window.AudioContext = window.AudioContext || window.webkitAudioContext;
    //   this._context = new AudioContext();
    //   fetch(resource)
    //     .then(resource => resource.blob())
    //     .then(blob => {
    //       this._context.
    //     })
    // }
    // catch(e) {
    //   console.error('Web Audio API is not supported in this browser');
    // }
  }

  componentWillUnmount() {

  }

  render() {
    const { source } = this.props;
    return <audio src={source} ref={audioElement => this.loadContext(audioElement)} />;
  }
}