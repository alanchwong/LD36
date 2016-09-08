import React, { Component } from 'react';
import fetch from 'whatwg-fetch';

export default class Audio extends Component {
  constructor() {
    super();
    this.loadContextFromAudioElement = this.loadContextFromAudioElement.bind(this);
  }

  componentWillReceiveProps(nextProps) {

  }

  loadContextFromAudioElement(audioElement) {
    if (!audioElement || this._context) return;

    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this._context = new AudioContext();
      this._source = this._context.createMediaElementSource(audioElement);
      this._source.connect(this._context.destination);
      audioElement.play();
    }
    catch(e) {
      console.error('Error initializing Web Audio API: ' + e);
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
    //   console.error('Error initializing Web Audio API: ' + e);
    // }
  }

  componentWillUnmount() {

  }

  render() {
    const { source } = this.props;
    return <audio src={source} ref={audioElement => this.loadContextFromAudioElement(audioElement)} />;
  }
}