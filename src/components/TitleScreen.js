import React from 'react';
import { Group, Text } from 'react-art';

import FullWindowAspectFitSurface from './FullWindowAspectFitSurface';
import ShadowText from './ShadowText';
import Background from './Background'
import Button from './Button';

function TitleScreenLayout ({
  onStartGame,
  unitLength = 1
}) {
  const screenify = x => x * unitLength;

  const titleProps = {
    font: { fontSize: screenify(66/45) },
  };

  const descriptionProps = {
    font: {
      fontSize: screenify(18/45),
      fontStyle: 'italic',
    },
    fill: '#fff',
    alignment: 'center',
  };

  const creditsProps = {
    font: {
      fontSize: screenify(14/45),
    },
    fill: 'rgba(255,255,255,0.5)',
    alignment: 'center',
  };

  const title = "AQUEDUCTULOUS!!";
  const description = [
    "Friends! Romans! Countrymen!",
    "Defeat Vitruvius in Caesar's game to become top engineer.",
    "Control the flow rate of your aqueduct by pressing any button.",
    "Watch out though: your builders made mistakes, and some",
    "sections of the track can't handle high speeds. Good luck!"
  ].join('\n');

  return (
    <Group>
      <Background unitLength={unitLength} />
      <ShadowText 
        x={screenify(8)}
        y={screenify(1.1)}
        {...titleProps}
      >
        {title}
      </ShadowText>
      <Text x={screenify(8)} y={screenify(3.25)} {...descriptionProps}>
        {description}
      </Text>
      <Button 
        x={screenify(5.5)}
        y={screenify(6)}
        width={screenify(5)}
        height={screenify(1.6)}
        onPress={onStartGame}
      >
        Play
      </Button>
      <Text x={screenify(8)} y={screenify(8.33)} {...creditsProps}>a Ludum Dare 36 Jam game by Alan Wong and Greg Fagan</Text>
    </Group>
  );
}

export default function TitleScreen (props) {
  return (
    <FullWindowAspectFitSurface>
      <TitleScreenLayout {...props} />
    </FullWindowAspectFitSurface>
  )
}