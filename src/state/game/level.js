import Bezier from 'bezier-js';
import makeRandomGenerator from 'seed-random';

export function createLevel(startingYOffset=4.5, seed)
{
  const MAX_X = 120;

  const MAX_Y = 6.5;
  const MIN_Y = 2.5;

  const MIN_ENDPT_TO_CP2_DELTA = 1;
  const MAX_ENDPT_TO_CP2_DELTA = 2;

  const MIN_ENDPT_TO_CP2_DELTA_HAZARD = 0.25;
  const MAX_ENDPT_TO_CP2_DELTA_HAZARD = 2;

  const MAX_2ND_CP_X_DELTA = 2;
  const MIN_2ND_CP_X_DELTA = 0.5;

  const MAX_2ND_CP_X_DELTA_HAZARD = 0.5;
  const MIN_2ND_CP_X_DELTA_HAZARD = 0.1;

  const HAZARD_PERCENTAGE = 0.49;

  const randoCalrissian = makeRandomGenerator(seed || Math.random());

  let curve = [];
  let hazards = [];

  // Generate first segments. Start straight line, follow with something gentle.
  curve.push(makeCubicBezier(0, startingYOffset, 2, startingYOffset, 5, startingYOffset));
  hazards.push(false);  // No hazard on first segment!
  curve.push(makeCubicBezier(5.5, startingYOffset, 7.5, startingYOffset, 9, randoCalrissian() * 2 + 3.5));
  hazards.push(false);  // No hazard on second segment!

  let lastIdx = 1;
  while (curve[lastIdx].endpoint.x <= MAX_X)
  {
    let isSegmentHazard = false;
    if (!hazards[lastIdx] && randoCalrissian() <= HAZARD_PERCENTAGE) { // No consecutive hazard zones?
      isSegmentHazard = true;
      hazards.push(true);
    }
    else
      hazards.push(false);

    // Generate the first control point, which will be a reflection of the
    // previous curve's second control point.
    let ctrlPt1X = 2 * curve[lastIdx].endpoint.x - curve[lastIdx].controlPoint2.x;
    let ctrlPt1Y = 2 * curve[lastIdx].endpoint.y - curve[lastIdx].controlPoint2.y;

    // Randomly generate the second control point. This should be to the
    // left of endpoint to generate a pleasing curve, and to the right
    // of this curve's first control point.
    const max2ndCpDelta = isSegmentHazard ? MAX_2ND_CP_X_DELTA_HAZARD : MAX_2ND_CP_X_DELTA;
    const min2ndCpDelta = isSegmentHazard ? MIN_2ND_CP_X_DELTA_HAZARD : MIN_2ND_CP_X_DELTA;
    let ctrlPt2X = randoCalrissian() * (max2ndCpDelta - min2ndCpDelta) + ctrlPt1X + min2ndCpDelta;
    let ctrlPt2Y = randoCalrissian() * (MAX_Y - MIN_Y) + MIN_Y;

    // Generate next endpoint. This should be to the right of this curve's
    // second control point.
    const maxEndPtToCP2Delta = isSegmentHazard ? MAX_ENDPT_TO_CP2_DELTA_HAZARD : MAX_ENDPT_TO_CP2_DELTA;
    const minEndPtToCP2Delta = isSegmentHazard ? MIN_ENDPT_TO_CP2_DELTA_HAZARD : MIN_ENDPT_TO_CP2_DELTA;
    let endPtX = randoCalrissian() *
      (maxEndPtToCP2Delta - minEndPtToCP2Delta) + ctrlPt2X + minEndPtToCP2Delta;

    let endPtY = randoCalrissian() * (MAX_Y - MIN_Y) + MIN_Y;

    curve.push(makeCubicBezier(ctrlPt1X, ctrlPt1Y, ctrlPt2X, ctrlPt2Y, endPtX, endPtY));

    lastIdx++;
  }

  // Generate last segments as straight line
  const lastX = curve[lastIdx].endpoint.x;
  let lastCtrlPt1X = 2 * curve[lastIdx].endpoint.x - curve[lastIdx].controlPoint2.x;
  let lastCtrlPt1Y = 2 * curve[lastIdx].endpoint.y - curve[lastIdx].controlPoint2.y;
  curve.push(makeCubicBezier(lastCtrlPt1X, lastCtrlPt1Y, lastX + 3, 4.5, lastX + 5, 4.5));
  hazards.push(false);
  curve.push(makeCubicBezier(2 * (lastX + 5) - (lastX + 3), 4.5, lastX + 7, 4.5, lastX + 10, 4.5));
  hazards.push(false);

  return { curve, hazards };
}

function makeCubicBezier(ctrlPt1X, ctrlPt1Y, ctrlPt2X, ctrlPt2Y, endPtX, endPtY) {
  return {
    controlPoint1: {x: ctrlPt1X, y: ctrlPt1Y},
    controlPoint2: {x: ctrlPt2X, y: ctrlPt2Y},
    endpoint: {x: endPtX, y: endPtY}
  }
}

export function indexForX(curve, x) {
  let idx = 0;
  
  while(idx < curve.length - 1 && curve[idx].endpoint.x < x) {
    idx++;
  }

  return idx;
}

export function segmentForIndex(curve, idx) {
  const startpoint = idx > 0
    ? curve[idx - 1].endpoint
    : {x: 0, y: curve[0].endpoint.y};

  const segment = curve[idx];
  return {
    startpoint,
    ...segment
  };
}

function bezierForIndex(curve, idx) {
  const segment = segmentForIndex(curve, idx);

  return new Bezier(
    segment.startpoint,
    segment.controlPoint1,
    segment.controlPoint2,
    segment.endpoint
  );
}

export function yForX(curve, x) {
  const idx = indexForX(curve, x);
  const bezier = bezierForIndex(curve, idx);
  const t = bezier.intersects({
    p1: {x, y: 0},
    p2: {x, y: 9}
  })[0];
  
  return t
    ? bezier.get(t).y
    : 4.5;
}

export function pathForBezier(bezier, unitLength=1) {
  const screenBezierPoints = bezier.points.map(point => ({
      x: point.x * unitLength,
      y: point.y * unitLength
    }));
  
  return screenBezierPoints
    ? new Bezier(screenBezierPoints).toSVG()
    : '';
}

export function trailingPathForX(curve, x, trailLength, unitLength=1) {
  let idx = indexForX(curve, x);
  let bezier = bezierForIndex(curve, idx);
  const t = bezier.intersects({
    p1: {x, y: 0},
    p2: {x, y: 9}
  })[0];

  if (t) {
    const segment = bezier.split(0, t);
    
    let previousSegments = '';
    let trailStart = segment.points[0].x;
    const minimumTrailStart = x - trailLength;
    while (idx > 0 && trailStart > minimumTrailStart) {
      bezier = bezierForIndex(curve, idx - 1);
      previousSegments += pathForBezier(bezier, unitLength) + ' ';
      idx--;
      trailStart = bezier.points[0].x;
    }

    return previousSegments + pathForBezier(segment, unitLength);
  }

  return '';
}

export function tangentForX(curve, x) {
  const idx = indexForX(curve, x);
  const bezier = bezierForIndex(curve, idx);
  const t = bezier.intersects({
    p1: {x, y: 0},
    p2: {x, y: 9}
  })[0];
  
  return t ? bezier.derivative(t) : {x:0, y:0};
}