import React from 'react';
import { Group } from 'react-art';
import { easeElastic } from 'd3';

import ShadowText from './ShadowText';
import { playerCenter } from '../state/game/player';
import { HAZARD_RESULTS } from '../state/game';
import { HAZARD_ZONE_COLOR } from './Level';

export default function HazardFeedback ({ player, level, elapsedTime, unitLength, yOffset, effectDuration }) {
  const { position, lastHazardEvent } = player;
  const center = playerCenter(position, level, unitLength);
  const startTime = (lastHazardEvent && lastHazardEvent.time) || 0;
  const timeSinceEvent = (elapsedTime - startTime) / 1000;
  const showText = lastHazardEvent && timeSinceEvent <= effectDuration;
  
  const t = timeSinceEvent / effectDuration;

  const fontScale = lastHazardEvent
    ? 1 + (lastHazardEvent.result.velocity - 1) / 2
    : 1;

  const useFailureEffect = lastHazardEvent
    && lastHazardEvent.result.text === HAZARD_RESULTS.FAIL.text;

  const displayProps = useFailureEffect
  ? { // shake
    x: center.x + Math.sin(Math.PI * 10 * t) * unitLength / 8,
    y: center.y + yOffset * 0.75 * unitLength,
    shadowColor: HAZARD_ZONE_COLOR,
    font: { fontSize: 22/45 * unitLength }
  }
  : { // pop up
    x: center.x,
    y: center.y + (yOffset/3 - easeElastic(t, 0.5, 0.3) * 0.75) * unitLength,
    font: { fontSize: 22/45 * unitLength * fontScale }
  };

  return (
    <Group>
    { showText
      ? (
        <ShadowText {...displayProps} shadowOffsetRatio={1/8}>
          { lastHazardEvent.result.text }
        </ShadowText> 
      )
      : (
        <Group />
      )
    }
    </Group>
  );
}
HazardFeedback.defaultProps = {
  yOffset: -1.5,
  effectDuration: 0.67, 
}