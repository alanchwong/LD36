// How close enemy needs to be to next endpoint
// to start making decisions about entering the next
// curve.
const ENTER_CURVE_THRESHOLD = 0.25;

// How far an enemy needs to be from the last endpoint
// to make decisions about what to do when exiting a curve.
const EXIT_CURVE_THRESHOLD = 0.55 //HAZARD_RESULTS.GOOD.window;

const Random = Math.random;

// Enemy AI profiles:

// ** Lieutenant Commander Data **
// It is possible to commit no mistakes and still lose. That is 
// not a malfunction, that is life. Which is true when you're 
// playing against Data.
const enemyDifficultyLtCmdrData = {
  // % likelihood to cancel boost entering hazard
  enterHazardBoostCancelPercent: 1,

  // % likelihood of starting boost entering hazard
  enterHazardBoostErrorPercent: 0,

  // % likelihood of starting boost when safe
  exitHazardBoostPercent: 1,

  // % likelihood to erroneously boost when in the middle of hazard
  inHazardBoostErrorPercent: 0,

  // % likelihood to start boosting when safe but not exiting hazard
  inSafeStartBoostPercent: 1,

  // % likelihood to stop boosting when safe but not exiting hazard
  inSafeStopBoostPercent: 0,

  // % likelihood to start/continue boosting when entering a safe zone.
  enterSafeStartBoostPercent: 0,

  // Tie breaker when multiple decisions and some are errors
  // and some are not. Likelihood of choosing error decision.
  errorPronenessPercent: 0,
}

export function createEnemyProfile() {
  return enemyDifficultyLtCmdrData;
}

export function isEnemyAcclerating(enemyLevel, enemyPlayer, enemyAI) {
  // Three axes of decision making -- populate with default values.
  // Default is to not change action. Will need to have hierarchy
  // of decision weight.
  let shouldBoostForNextCurve = undefined;
  let shouldBoostInThisCurve = undefined;
  let shouldBoostAfterPreviousCurve = undefined;
  let isErrorForNextCurve = false;
  let isErrorInThisCurve = false;
  let isErrorAfterPreviousCurve = false;
  let decisionForNextCurveMade = false;
  let decisionAfterPreviousCurveMade = false;

  // Figure out where we are! We are either inside a curve,
  // or at the endpoint linking two curves.
  let occupiedCurve = undefined;
  let occupiedCurveIdx = 0;

  for (occupiedCurveIdx = 0; occupiedCurveIdx < enemyLevel.curve.length; occupiedCurveIdx++) {
    if (enemyLevel.curve[occupiedCurveIdx].endpoint.x >= enemyPlayer.position) {
      occupiedCurve = enemyLevel.curve[occupiedCurveIdx];
      break;
    }
  };

  // Enemy is done!
  if (enemyPlayer.position >= enemyLevel.curve[enemyLevel.curve.length - 1].endpoint.x)
    return false;

  // Okay we know where we are, how far are we from approaching the
  // endpoint of the curve?
  let distanceFromNextEndpoint = occupiedCurve.endpoint.x - enemyPlayer.position;

  // What kind of curve are we in?
  let isInHazard = enemyLevel.hazards[occupiedCurveIdx];

  // What kind of curve is ahead of us?
  let isHazardAhead = 
    occupiedCurveIdx + 1 < enemyLevel.hazards.length ?
      enemyLevel.hazards[occupiedCurveIdx + 1] :
      false;

  // What kind of curve is behind us?
  // In case we messed up boosting on hazard exit.
  let previousCurve =
    occupiedCurveIdx === 0 ?
      undefined :
      enemyLevel.curve[occupiedCurveIdx - 1];

  // How far are we from the last curve?
  let distanceFromPreviousEndpoint = 
    previousCurve !== undefined ?
      enemyPlayer.position - previousCurve.endpoint.x :
      NaN;

  // Was it a hazard behind us?
  let isHazardBehind =
    occupiedCurveIdx !== 0 ?
    enemyLevel.hazards[occupiedCurveIdx - 1] :
    false;

  // Okay, we know where we are, let's do stuff! Decision making:
  //  - If about to enter new curve, decide if we want to boost
  //  - If just leaving a curve, do we need to start boosting?
  //  - If in middle of safe zone, do we keep/start boosting?

  if (distanceFromNextEndpoint <= ENTER_CURVE_THRESHOLD) {
    decisionForNextCurveMade = true;

    // Are we entering a hazard next and boosting?
    if (isHazardAhead && enemyPlayer.accelerating) {
    
      // Hazard: We are going to successfully cancel boost.
      if (Random() < enemyAI.enterHazardBoostCancelPercent) {
        shouldBoostForNextCurve = false;
        isErrorForNextCurve = false;
      }
      else {
        shouldBoostForNextCurve = true;
        isErrorForNextCurve = true;
      }
    }
    // Are we entering a hazard next and NOT boosting?
    else if (isHazardAhead && !enemyPlayer.accelerating) {
      // Hazard: Stupid and start boosting?
      if (Random() < enemyAI.enterHazardBoostErrorPercent) {
        shouldBoostForNextCurve = true;
        isErrorForNextCurve = true;
      }
      else {
        shouldBoostForNextCurve = false;
        isErrorForNextCurve = false;
      }
    }
    else {
      // We're about to enter a safe zone!
      if (Random() < enemyAI.enterSafeStartBoostPercent) {
        shouldBoostForNextCurve = true;
        isErrorForNextCurve = false;
      }
      else {
        shouldBoostForNextCurve = false;
        isErrorForNextCurve = true;
      }
    }
  }
 
 if (distanceFromPreviousEndpoint <= EXIT_CURVE_THRESHOLD) {
   decisionAfterPreviousCurveMade = true;

    // Did we just leave a hazard?
    // Hazard: Are we going to trigger a boost?
    // Hazard: If we're triggering, how accurate are we?
   if (isHazardBehind) {
      if (Random() < enemyAI.exitHazardBoostPercent) {
        shouldBoostAfterPreviousCurve = true;
        isErrorAfterPreviousCurve = false;
      }
      else {
        shouldBoostAfterPreviousCurve = false;
        isErrorAfterPreviousCurve = true;
      }
    }
    else { // Leaving safe curve, keep on keepin on.
      shouldBoostAfterPreviousCurve = enemyPlayer.accelerating;
      isErrorAfterPreviousCurve = false;
    }
  }

  // Decide what to do about the curve we're in.
  if (isInHazard) {
    if (Random() < enemyAI.inHazardBoostErrorPercent) {
      shouldBoostInThisCurve = true;
      isErrorInThisCurve = true;
    }
    else {
      shouldBoostInThisCurve = false;
      isErrorInThisCurve = false;
    }
  }
  else {
    // In safe section, but we may screw up!
    if (enemyPlayer.accelerating) {
      if (Random() < enemyAI.inSafeStopBoostPercent) {
        shouldBoostInThisCurve = false;
        isErrorInThisCurve = true;
      }
      else {
        shouldBoostInThisCurve = true;
        isErrorInThisCurve = false;
      }
    }
    else
      if (Random() < enemyAI.inSafeStartBoostPercent) {
        shouldBoostInThisCurve = true;
        isErrorInThisCurve = false;
      }
      else {
        shouldBoostInThisCurve = true;
        isErrorInThisCurve = true;
      }
  }

  // Decide what we should actually do! Uhhh...
  // So if everything agrees we should go for it.
  // What if I shouldn't boost not but should start boosting?

  let shouldBoost = undefined;

  if (!decisionForNextCurveMade && !decisionAfterPreviousCurveMade) {
    // Decisions for CURR only
    shouldBoost = shouldBoostInThisCurve;
  }
  else if (!decisionForNextCurveMade) { 
    // Decisions for PREV, CURR
    if (shouldBoostAfterPreviousCurve === shouldBoostInThisCurve) {
      shouldBoost = shouldBoostAfterPreviousCurve;  // Both decisions agree.
    }
    else {
      if ( isErrorInThisCurve && isErrorAfterPreviousCurve) {
        // Two error decisions, who cares, pick one at random
        shouldBoost = Random() < 0.5 ? 
          shouldBoostInThisCurve : shouldBoostAfterPreviousCurve
      }
      else if ( isErrorInThisCurve || isErrorAfterPreviousCurve) {
        // Only one error decision, see how error prone the AI is      
        if (Random() < enemyAI.errorPronenessPercent) {
          shouldBoost = isErrorInThisCurve ? 
            shouldBoostInThisCurve : shouldBoostAfterPreviousCurve;
        }
        else {
          shouldBoost = isErrorInThisCurve ?
            shouldBoostAfterPreviousCurve : shouldBoostInThisCurve;
        }
      }
      else {
        // No error decisions, pick one at random
        shouldBoost = Random() < 0.5 ?
          shouldBoostInThisCurve : shouldBoostAfterPreviousCurve;
      }
    }
  }
  else if (!decisionAfterPreviousCurveMade) {
    // Decisions for CURR, NEXT
    if (shouldBoostInThisCurve === shouldBoostForNextCurve) {
      shouldBoost = shouldBoostInThisCurve; // Both decisions agree
    }
    else {
      if (isErrorInThisCurve && isErrorForNextCurve) {
        // Two error decisions, pick one at random.
        shouldBoost = Random() < 0.5 ?
          shouldBoostInThisCurve :
          shouldBoostForNextCurve;
      }
      else if (isErrorInThisCurve || isErrorForNextCurve) {
        // Only one error decision, see how error prone AI is
        if (Random() < enemyAI.errorPronenessPercent) {
          shouldBoost = isErrorInThisCurve ?
            shouldBoostInThisCurve :
            shouldBoostForNextCurve;
        }
        else{
          shouldBoost = isErrorInThisCurve ?
            shouldBoostForNextCurve : shouldBoostInThisCurve;
        }
      }
      else {
        // No error decisions, pick one at random.
        shouldBoost = Random() < 0.5 ? 
          shouldBoostInThisCurve : shouldBoostForNextCurve;
      }
    }
  }
  else {
    // Decisions for PREV, CURR, NEXT
    if (shouldBoostAfterPreviousCurve === 
        shouldBoostInThisCurve ===
        shouldBoostForNextCurve) {
          // All decisions agree, prioritize this.
          shouldBoost = shouldBoostInThisCurve;
    }
    else if (isErrorAfterPreviousCurve === isErrorForNextCurve === isErrorInThisCurve) {
      // All decisions are errors or all are correct, pick one at random!
      const roulette = Random();
      if (roulette < (1/3)) 
        shouldBoost = shouldBoostAfterPreviousCurve;
      else if (roulette < (2/3))
        shouldBoost = shouldBoostInThisCurve;
      else
        shouldBoost = shouldBoostForNextCurve;
    }
    else {
      // At least one error!
      const chooseError = Random() < enemyAI.errorPronenessPercent;

      // If we oopsies, only choose among the error decisions.
      if (chooseError) {
        let errorDecisions = [];

        if (isErrorAfterPreviousCurve)
          errorDecisions.push(shouldBoostAfterPreviousCurve);

        if (isErrorForNextCurve)
          errorDecisions.push(shouldBoostForNextCurve);

        if (isErrorInThisCurve)
          errorDecisions.push(shouldBoostInThisCurve);

        const errorIdx = Math.floor(Random() * errorDecisions.length);
        shouldBoost = errorDecisions[errorIdx];
      }
      else {
        // We choose the correct one, choose among the correct decisions.
        let correctDecisions = [];

        if (!isErrorAfterPreviousCurve)
          correctDecisions.push(shouldBoostAfterPreviousCurve);

        if (!isErrorForNextCurve)
          correctDecisions.push(shouldBoostForNextCurve);

        if (!isErrorInThisCurve)
          correctDecisions.push(shouldBoostInThisCurve);

        const correctIdx = Math.floor(Random() * correctDecisions.length);
        shouldBoost = correctDecisions[correctIdx];
      }
    }
  }

  return shouldBoost;
}