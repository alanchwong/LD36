import React from 'react';
import Audio, { AudioContext } from './Audio';

import music from '../../resource/LimitedColor.wav';

export default function BackgroundMusic(props) {
  return(
    <AudioContext>
      <Audio source={music} {...props}/>
    </AudioContext>
  );
}