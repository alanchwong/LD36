import React from 'react';
import Audio from './Audio';

import music from '../../resource/LimitedColor.wav';

export default function BackgroundMusic(props) {
  return <Audio source={music} {...props}/>;
}