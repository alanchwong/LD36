import React from 'react';
import { Group, Shape, Transform } from 'react-art';
import Wedge from 'react-art/shapes/wedge';
import BubbleEffect from './BubbleEffect';
import SplashEffect from './SplashEffect';

import { trailingPathForX, tangentForX } from '../game/level';
import { playerCenter } from '../game/player';

function PlayerTrail ({
  position,
  level,
  unitLength,
  size,
  color,
  isHuman,
  xOffset,
}) {
  return (
    <Shape
      x={(xOffset - position) * unitLength}
      stroke={color}
      strokeWidth={size * unitLength}
      d={ trailingPathForX(level.curve, position, xOffset, unitLength) }
    />
  )
}

function PlayerHead ({ position, size, unitLength, color, elapsedTime, accelerating, level, xOffset }) {
  const radius = size/2 * unitLength;

  const center = playerCenter(position, level, unitLength, xOffset);
  const tangent = tangentForX(level.curve, position);
  const angle = Math.atan(tangent.y / tangent.x) * 180 / Math.PI;

  return (
    <Group transform={new Transform().rotate(angle, center.x, center.y)}>
      { accelerating &&
        <Wedge
          x={center.x - radius * 1.1}
          y={center.y - radius * 1.1}
          innerRadius={radius}
          outerRadius={radius * 1.1}
          startAngle={0}
          endAngle={180}
          fill='#fff'
        />
      }
      <BubbleEffect
        { ...center }
        maxSpawnDistance={size}
        unitLength={unitLength}
        elapsedTime={elapsedTime}
        intensity={accelerating ? 4 : 1}
      />
      <SplashEffect
        { ...center }
        streamWidth={size}
        elapsedTime={elapsedTime}
        unitLength={unitLength}
        active={accelerating}
      />
    </Group>
  );
}

export default function Player ({
  position,
  level,
  accelerating,
  unitLength,
  elapsedTime,
  size,
  color,
  xOffset,
}) {
  return (
    <Group>
      <PlayerTrail
        unitLength={unitLength}
        position={position}
        level={level}
        size={size}
        color={color}
        xOffset={xOffset}
      />
      <PlayerHead
        unitLength={unitLength}
        position={position}
        level={level}
        size={size}
        color={color}
        elapsedTime={elapsedTime}
        accelerating={accelerating}
        xOffset={xOffset}
      />
    </Group>
  );
}
Player.defaultProps = {
  accelerating: false,
  unitLength: 1,
  elapsedTime: 0,
  size: 0.5,
  color: '#79C9E5',
}