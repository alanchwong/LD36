import React from 'react';
import { Group, Shape } from 'react-art';
import { playerXOffset as playerGameXGap } from '../state/game/player';

const LIGHT_AQUADUCT_COLOR = 0xAAA;
const DARK_AQUADUCT_COLOR = 0x999;
export const HAZARD_ZONE_COLOR = 0xAD4C23;

export default function Level ({curve, hazards, xOffset, unitLength}) {
  const trackGameWindowLeft = xOffset - playerGameXGap; // The left most visible part of the track in game units -- uhh handle the < 0 case.

  // Find the element in the curve array that is closest to 
  // trackGameWindowLeft without going past it.
  // Doing a stupid linear search for now
  // Also there's probably a smarter more concise ES2015 way to do this FML
  let curveLeftIndex;
  for (curveLeftIndex = 0; curveLeftIndex < curve.length - 1; curveLeftIndex++) {
    if (curve[curveLeftIndex + 1].endpoint.x > trackGameWindowLeft)
      break;
  }

  let curveRightIndex = 0;
  for (curveRightIndex = curveLeftIndex; curveRightIndex < curve.length; curveRightIndex++) {
    if (curve[curveRightIndex].endpoint.x >= trackGameWindowLeft + 16)
      break;
  }

  // Move cursor to curveLeftIndex's left origin point, which is
  // inferred from the endpoint of curve[curveLeftIndex - 1]. So in the
  // curveLeftIndex == 0 case, the origin is 0, 4.5, the player start point.
  // DrawingOriginPoint fakes a bezier curve description to simplify the loop
  let drawingOriginPoint = {
    controlPoint1: {x: NaN, y: NaN},  // not used
    controlPoint2: {x: NaN, y: NaN},  // not used
    endpoint: {
      x: curveLeftIndex === 0 ? 0 : curve[curveLeftIndex - 1].endpoint.x,
      y: curveLeftIndex === 0 ? curve[curveLeftIndex].endpoint.y : curve[curveLeftIndex - 1].endpoint.y
    }
  }

  let visibleCurve = [drawingOriginPoint];
  Array.prototype.push.apply(visibleCurve, curve.slice(curveLeftIndex, curveRightIndex + 1));
  
  let visibleHazards = [false];
  Array.prototype.push.apply(visibleHazards, hazards.slice(curveLeftIndex, curveRightIndex + 1)); // first element faked to match the fake drawing origin point

  // This draws non-hazard sections first, then draws hazard sections after.
  // This is a pretty naive double loop but our visibleCurve arrays should 
  // be small enough that this isn't too bad.
  return (
    <Group>
      { visibleCurve.map((value,index,array) => {
        return (index !== 0 && !visibleHazards[index])
          ? (
            <AquaductSegment
              key={index}
              originPoint={ {x: array[index - 1].endpoint.x, y: array[index - 1].endpoint.y} }
              bezierCurve={ array[index] }
              isHazard={ visibleHazards[index] }
              windowLeft={ trackGameWindowLeft }
              unitLength={ unitLength }
            />
          )
          : undefined;
        }
      )}
      { visibleCurve.map((value,index,array) => {
        return (index !== 0 && visibleHazards[index])
          ? (
            <AquaductSegment
              key={index}
              originPoint={ {x: array[index - 1].endpoint.x, y: array[index - 1].endpoint.y} }
              bezierCurve={ array[index] }
              isHazard={ visibleHazards[index] }
              windowLeft={ trackGameWindowLeft }
              unitLength={ unitLength }
            />
          )
          : undefined;
        }
      )}
    </Group>
  )
}

function AquaductSegment({originPoint, bezierCurve, isHazard, windowLeft, unitLength}) {
  return (
    <Group>
      <WideAquaductSegment
        originPoint={originPoint}
        bezierCurve={bezierCurve}
        isHazard={isHazard}
        windowLeft={windowLeft}
        unitLength={unitLength}
      />
      <NarrowAquaductSegment
        originPoint={originPoint}
        bezierCurve={bezierCurve}
        isHazard={isHazard}
        windowLeft={windowLeft}
        unitLength={unitLength}
      />
    </Group>
  );
}

function WideAquaductSegment({originPoint, bezierCurve, isHazard, windowLeft, unitLength}) {
  return (
    <GenericAquaduct
      originPoint={originPoint}
      bezierCurve={bezierCurve}
      isHazard={isHazard}
      windowLeft={windowLeft}
      unitLength={unitLength}
      strokeWidth={0.75 * unitLength}
      strokeColor={DARK_AQUADUCT_COLOR}
    />
  );
}

function NarrowAquaductSegment({originPoint, bezierCurve, isHazard, windowLeft, unitLength}) {
  const strokeColor = isHazard ? HAZARD_ZONE_COLOR : LIGHT_AQUADUCT_COLOR;
  return (
    <GenericAquaduct
      originPoint={originPoint}
      bezierCurve={bezierCurve}
      isHazard={isHazard}
      windowLeft={windowLeft}
      unitLength={unitLength}
      strokeWidth={0.5 * unitLength}
      strokeColor={strokeColor}
    />  
  );
}

function GenericAquaduct({originPoint, bezierCurve, isHazard, windowLeft, unitLength, strokeWidth, strokeColor}) {
  // Cuz typing this repeatedly sucks.
  function screenifyX(x) { return (x - windowLeft) * unitLength; }
  function screenifyY(y) { return y * unitLength; }

  return (
    <Shape
      d={`
        M ${ screenifyX(originPoint.x) } ${ screenifyY(originPoint.y) }
        C ${ screenifyX(bezierCurve.controlPoint1.x) } ${ screenifyY(bezierCurve.controlPoint1.y) }
          ${ screenifyX(bezierCurve.controlPoint2.x) } ${ screenifyY(bezierCurve.controlPoint2.y) }
          ${ screenifyX(bezierCurve.endpoint.x) } ${ screenifyY(bezierCurve.endpoint.y) }
      `}
      stroke={ strokeColor }
      strokeWidth={ strokeWidth }
      strokeCap={ "butt" }
      strokeJoin={ "butt" }
    />
  );
}