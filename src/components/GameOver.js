import React from 'react';
import { Group, Text } from 'react-art';

import FullWindowAspectFitSurface from './FullWindowAspectFitSurface';
import Button from './Button';

import { isEnemyAtEndOfTrack } from '../state/game';

const baseText = {
  fill: '#fff',
  font: {
    fontFamily: 'sans-serif',
  },
  alignment: 'middle',
};

const ResultText = ({fontSize, ...rest}) => <Text
  {...baseText}
  font={{ ...baseText.font, fontSize, fontWeight: 'bold' }}
  {...rest}
/>;

const TimeText = ({fontSize, ...rest}) => <Text
  {...baseText}
  font={{ ...baseText.font, fontSize }}
  {...rest}
/>;

function GameOverLayout ({
  result = { won: true, time: 0 },
  onRematch,
  onNewGame,
  unitLength = 1,
}) {
  const screenify = x => x * unitLength;
  return (
    <Group>
      <ResultText x={screenify(8)} y={screenify(1.5)} fontSize={screenify(40/45)}>
        {`YOU ${result.won ? 'WIN' : 'LOSE'}!`}
      </ResultText>
      <TimeText x={screenify(8)} y={screenify(2.5)} fontSize={screenify(16/45)}>
        {`${(result.time/1000).toFixed(2)} seconds`}
      </TimeText>
      <Button
        x={screenify(5.5)} y={screenify(3.5)}
        width={screenify(5)} height={screenify(1.5)}
        onPress={onRematch}
      >
        Rematch
      </Button>
      <Button
        x={screenify(5.5)} y={screenify(5.5)}
        width={screenify(5)} height={screenify(1.5)}
        onPress={onNewGame}
      >
        New Game
      </Button>
    </Group>
  );
}

export default function GameOver ({game, ...rest}) {
  return (
    <FullWindowAspectFitSurface>
      <GameOverLayout result={{
        time: game.elapsedTime,
        won: !isEnemyAtEndOfTrack(game), // a tie is a loss!
      }} {...rest}/>
    </FullWindowAspectFitSurface>
  );
}