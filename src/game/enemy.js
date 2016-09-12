import { HAZARD_RESULTS, VELOCITY } from './core.js'

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

export function isEnemyAcclerating(state) {
  let {enemyLevel, enemyPlayer, enemyAI} = state;
  let {curve, hazards} = enemyLevel;
  let {position} = enemyPlayer;

  // How close enemy needs to be to next endpoint
  // to start making decisions about entering the next
  // curve.
  // This needs some tuning, maybe there's a reasoned way
  // to pick a threshold based on the velocity per second?
  // We update once in tens of milliseconds, so something like that?
  const ENTER_CURVE_THRESHOLD = 0.25;

  // How far an enemy needs to be from the last endpoint
  // to make decisions about what to do when exiting a curve.
  const EXIT_CURVE_THRESHOLD = HAZARD_RESULTS.GOOD.window;

  // "Enum" for indicating which section of the track a decision pertains to
  const Section = {
    PREVIOUS: 0,
    CURRENT: 1,
    NEXT: 2,
  }

  // Array of decisions and states for previous section, 
  // current section, and next section.
  let isHazard = [undefined, undefined, undefined];
  let shouldBoostDecision = [undefined, undefined, undefined];
  let isErroneousDecision = [undefined, undefined, undefined];
  
  let decisionForNextCurveMade = false;
  let decisionAfterPreviousCurveMade = false;

  // Enemy is finished traversing the track, return false.
  if (position >= curve[curve.length - 1].endpoint.x)
    return false;

  // Figure out where we are! We are either inside a curve,
  // or at the endpoint linking two curves.
  let occupiedCurveIdx = 0;
  for (occupiedCurveIdx = 0; occupiedCurveIdx < curve.length; occupiedCurveIdx++) {
    if (curve[occupiedCurveIdx].endpoint.x >= position)
      break;
  };

  // Okay we know where we are, how far are we from approaching the
  // endpoint of the curve?
  let distanceFromNextEndpoint = curve[occupiedCurveIdx].endpoint.x - position;

  // How far are we from the last curve?
  let distanceFromPreviousEndpoint = 
    occupiedCurveIdx > 0 ?
      position - curve[occupiedCurveIdx - 1].endpoint.x :
      NaN;

  // Are there hazards behind us, where we are, or in front?
  isHazard[Section.CURRENT] = hazards[occupiedCurveIdx];
  isHazard[Section.NEXT] = occupiedCurveIdx + 1 < hazards.length ? hazards[occupiedCurveIdx + 1] : false;
  isHazard[Section.PREVIOUS] = occupiedCurveIdx !== 0 ? hazards[occupiedCurveIdx - 1] : false;

  // Okay, we know where we are, let's do stuff! Decision making:
  //  - If about to enter new curve, decide if we want to boost
  //  - If just leaving a curve, do we need to start boosting?
  //  - If in middle of safe zone, do we keep/start boosting?

  if (distanceFromNextEndpoint <= ENTER_CURVE_THRESHOLD) {
    decisionForNextCurveMade = true;

    // Are we entering a hazard next and boosting?
    if (isHazard[Section.NEXT] && enemyPlayer.accelerating) {
    
      if (Random() < enemyAI.enterHazardBoostCancelPercent) {
        // Correctly cancel boost.
        shouldBoostDecision[Section.NEXT] = false;
        isErroneousDecision[Section.NEXT] = false;
      }
      else {
        // Erroneously continue boost.
        shouldBoostDecision[Section.NEXT] = true;
        isErroneousDecision[Section.NEXT] = true;
      }
    }
    // Are we entering a hazard next and NOT boosting?
    else if (isHazard[Section.NEXT] && !enemyPlayer.accelerating) {
      if (Random() < enemyAI.enterHazardBoostErrorPercent) {
        // Erroneously start boosting.
        shouldBoostDecision[Section.NEXT] = true;
        isErroneousDecision[Section.NEXT] = true;
      }
      else {
        // Correctly not boost.
        shouldBoostDecision[Section.NEXT] = false;
        isErroneousDecision[Section.NEXT] = false;
      }
    }
    else {
      // We're about to enter a safe zone!
      if (Random() < enemyAI.enterSafeStartBoostPercent) {
        // Correctly continue boosting for next safe curve.
        shouldBoostDecision[Section.NEXT] = true;
        isErroneousDecision[Section.NEXT] = false;
      }
      else {
        // Erroneously stop/not-start boosting for next safe curve.
        shouldBoostDecision[Section.NEXT] = false;
        isErroneousDecision[Section.NEXT] = true;
      }
    }
  }
 
  if (distanceFromPreviousEndpoint <= EXIT_CURVE_THRESHOLD) {
    if (isHazard[Section.PREVIOUS]) {
      // Only make a decision if we're exiting a hazard section.
      // If we're exiting a safe section, the previous section has
      // no bearing on decisions.
      decisionAfterPreviousCurveMade = true;

      if (Random() < enemyAI.exitHazardBoostPercent) {
        // Correctly boost just after exiting a hazard zone for mad boost gains
        shouldBoostDecision[Section.PREVIOUS] = true;
        isErroneousDecision[Section.PREVIOUS] = false;
      }
      else {
        // Erroneously stop/not-start boost just after exiting a hazard zone for no boost gains.
        shouldBoostDecision[Section.PREVIOUS] = false;
        isErroneousDecision[Section.PREVIOUS] = true;
      }
    }
  }

  // Decide what to do about the curve we're in.
  if (isHazard[Section.CURRENT]) {
    if (Random() < enemyAI.inHazardBoostErrorPercent) {
      // Erroneously boost inside a hazard curve
      shouldBoostDecision[Section.CURRENT] = true;
      isErroneousDecision[Section.CURRENT] = true;
    }
    else {
      // Correctly stop boosting inside a hazard curve.
      shouldBoostDecision[Section.CURRENT] = false;
      isErroneousDecision[Section.CURRENT] = false;
    }
  }
  else {
    // In safe section, but we may screw up!
    if (enemyPlayer.accelerating) {
      if (Random() < enemyAI.inSafeStopBoostPercent) {
        // Erroneously stop boosting inside a safe zone.
        shouldBoostDecision[Section.CURRENT] = false;
        isErroneousDecision[Section.CURRENT] = true;
      }
      else {
        // Correctly boost inside a safe zone.
        shouldBoostDecision[Section.CURRENT] = true;
        isErroneousDecision[Section.CURRENT] = false;
      }
    }
    else
      if (Random() < enemyAI.inSafeStartBoostPercent) {
        // Correctly boost inside a safe zone.
        shouldBoostDecision[Section.CURRENT] = true;
        isErroneousDecision[Section.CURRENT] = false;
      }
      else {
        // Errorneously stop boosting inside a safe zone.
        shouldBoostDecision[Section.CURRENT] = false;
        isErroneousDecision[Section.CURRENT] = true;
      }
  }

  // Decide what we should actually do! Uhhh...
  // So if everything agrees we should go for it.
  // What if I shouldn't boost not but should start boosting?

  let finalBoostDecision = {shouldBoost: undefined, decidedFrom: undefined};

  if (!decisionForNextCurveMade && !decisionAfterPreviousCurveMade) {
    // Decisions for CURR only
    finalBoostDecision.shouldBoost = shouldBoostDecision[Section.CURRENT];
    finalBoostDecision.decidedFrom = "Current";
  }
  else if (!decisionForNextCurveMade) { 
    // Decisions for PREV, CURR
    if (shouldBoostDecision[Section.PREVIOUS] === shouldBoostDecision[Section.CURRENT]) {
      finalBoostDecision.shouldBoost = shouldBoostDecision[Section.PREVIOUS];  // Both decisions agree.
      finalBoostDecision.decidedFrom = "Previous & Current (Agreed.)";
    }
    else {
      if ( isErroneousDecision[Section.CURRENT] && isErroneousDecision[Section.PREVIOUS]) {
        // Two error decisions, who cares, pick one at random
        const useCurrent = Random() < 0.5;
        finalBoostDecision.shouldBoost = useCurrent ? shouldBoostDecision[Section.CURRENT] : shouldBoostDecision[Section.PREVIOUS]
        finalBoostDecision.decidedFrom = useCurrent ? "Current" : "Previous";
      }
      else if ( isErroneousDecision[Section.CURRENT] || isErroneousDecision[Section.PREVIOUS]) {
        // Only one error decision, see how error prone the AI is      
        if (Random() < enemyAI.errorPronenessPercent) {
          // Choose the error decision.
          finalBoostDecision.shouldBoost = isErroneousDecision[Section.CURRENT] ? 
            shouldBoostDecision[Section.CURRENT] : shouldBoostDecision[Section.PREVIOUS];
          finalBoostDecision.decidedFrom = isErroneousDecision[Section.CURRENT] ? "Current" : "Previous";
        }
        else {
          // Choose the correct decision.
          finalBoostDecision.shouldBoost = isErroneousDecision[Section.CURRENT] ?
            shouldBoostDecision[Section.PREVIOUS] : shouldBoostDecision[Section.CURRENT];
          finalBoostDecision.decidedFrom = isErroneousDecision[Section.CURRENT] ? "Previous" : "Current";
        }
      }
      else {
        // No error decisions, pick one of the correct ones at random
        const useCurrent = Random() < 0.5;
        finalBoostDecision.shouldBoost = useCurrent ? shouldBoostDecision[Section.CURRENT] : shouldBoostDecision[Section.PREVIOUS];
        finalBoostDecision.decidedFrom = useCurrent ? "Current" : "Previous";
      }
    }
  }
  else if (!decisionAfterPreviousCurveMade) {
    // Decisions for CURR, NEXT
    if (shouldBoostDecision[Section.CURRENT] === shouldBoostDecision[Section.NEXT]) {
      finalBoostDecision.shouldBoost = shouldBoostDecision[Section.CURRENT]; // Both decisions agree
      finalBoostDecision.decidedFrom = "Current & Next (Agreed)";
    }
    else {
      if (isErroneousDecision[Section.CURRENT] && isErroneousDecision[Section.NEXT]) {
        // Two error decisions, pick one at random.
        const useCurrent = Random() < 0.5;
        finalBoostDecision.shouldBoost = useCurrent ? shouldBoostDecision[Section.CURRENT] : shouldBoostDecision[Section.NEXT];
        finalBoostDecision.decidedFrom = useCurrent ? "Current" : "Next";
      }
      else if (isErroneousDecision[Section.CURRENT] || isErroneousDecision[Section.NEXT]) {
        // Only one error decision, see how error prone AI is
        if (Random() < enemyAI.errorPronenessPercent) {
          // Choose the erroneous decision
          finalBoostDecision.shouldBoost = isErroneousDecision[Section.CURRENT] ?
            shouldBoostDecision[Section.CURRENT] :
            shouldBoostDecision[Section.NEXT];
          finalBoostDecision.decidedFrom = isErroneousDecision[Section.CURRENT] ? "Current" : "Next";
        }
        else{
          // Choose the correct decision.
          finalBoostDecision.shouldBoost = isErroneousDecision[Section.CURRENT] ?
            shouldBoostDecision[Section.NEXT] : shouldBoostDecision[Section.CURRENT];
          finalBoostDecision.decidedFrom = isErroneousDecision[Section.CURRENT] ? "Next" : "Current";
        }
      }
      else {
        // No error decisions, pick one at random.
        const useCurrent = Random() < 0.5;
        finalBoostDecision.shouldBoost = useCurrent ? 
          shouldBoostDecision[Section.CURRENT] : shouldBoostDecision[Section.NEXT];
        finalBoostDecision.decidedFrom = useCurrent ? "Current" : "Next";
      }
    }
  }
  else {
    // Decisions for PREV, CURR, NEXT
    if (shouldBoostDecision[Section.PREVIOUS] === 
        shouldBoostDecision[Section.CURRENT] ===
        shouldBoostDecision[Section.NEXT]) {
          // All decisions agree, prioritize this.
          finalBoostDecision.shouldBoost = shouldBoostDecision[Section.CURRENT];
          finalBoostDecision.decidedFrom = "Previous, Current, Next. (Agreed)";
    }
    else if (isErroneousDecision[Section.PREVIOUS] === isErroneousDecision[Section.NEXT] === isErroneousDecision[Section.CURRENT]) {
      // All decisions are errors or all are correct, pick one at random!
      const roulette = Random();
      if (roulette < (1/3)) {
        finalBoostDecision.shouldBoost = shouldBoostDecision[Section.PREVIOUS];
        finalBoostDecision.decidedFrom = "Previous";
      }
      else if (roulette < (2/3)) {
        finalBoostDecision.shouldBoost = shouldBoostDecision[Section.CURRENT];
        finalBoostDecision.decidedFrom = "Current";
      }
      else {
        finalBoostDecision.shouldBoost = shouldBoostDecision[Section.NEXT];
        finalBoostDecision.decidedFrom = "Next";
      }
    }
    else {
      // At least one error!
      const chooseError = Random() < enemyAI.errorPronenessPercent;

      // If we oopsies, only choose among the error decisions.
      if (chooseError) {
        let errorDecisions = [];

        if (isErroneousDecision[Section.PREVIOUS])
          errorDecisions.push(shouldBoostDecision[Section.PREVIOUS]);

        if (isErroneousDecision[Section.NEXT])
          errorDecisions.push(shouldBoostDecision[Section.NEXT]);

        if (isErroneousDecision[Section.CURRENT])
          errorDecisions.push(shouldBoostDecision[Section.CURRENT]);

        const errorIdx = Math.floor(Random() * errorDecisions.length);
        finalBoostDecision.shouldBoost = errorDecisions[errorIdx];

        if (errorIdx === 0)
          finalBoostDecision.decidedFrom = "Previous";
        else if (errorIdx === 1)
          finalBoostDecision.decidedFrom = "Next";
        else
          finalBoostDecision.decidedFrom = "Current";
      }
      else {
        // We choose the correct one, choose among the correct decisions.
        let correctDecisions = [];

        if (!isErroneousDecision[Section.PREVIOUS])
          correctDecisions.push(shouldBoostDecision[Section.PREVIOUS]);

        if (!isErroneousDecision[Section.NEXT])
          correctDecisions.push(shouldBoostDecision[Section.NEXT]);

        if (!isErroneousDecision[Section.CURRENT])
          correctDecisions.push(shouldBoostDecision[Section.CURRENT]);

        const correctIdx = Math.floor(Random() * correctDecisions.length);
        finalBoostDecision = correctDecisions[correctIdx];

        if (correctIdx === 0)
          finalBoostDecision.decidedFrom = "Previous";
        else if (correctIdx === 1)
          finalBoostDecision.decidedFrom = "Next";
        else
          finalBoostDecision.decidedFrom = "Current";      }
    }
  }

  console.log(String.prototype.concat(
    "*AI* ",
    "T: ", state.elapsedTime, 
    ", x: ", enemyPlayer.position,
    ", Boost? ", finalBoostDecision.shouldBoost, 
    ", Basis: ", finalBoostDecision.decidedFrom,
    ", Err: ", 
      isErroneousDecision[Section.PREVIOUS] === undefined ? "n/a" : isErroneousDecision[Section.PREVIOUS], 
      " ", isErroneousDecision[Section.CURRENT],
      " ", isErroneousDecision[Section.NEXT] === undefined ? "n/a" : isErroneousDecision[Section.NEXT],
    ", Haz: ", isHazard[Section.PREVIOUS], " ", isHazard[Section.CURRENT], " ", isHazard[Section.NEXT]
  ));

  return finalBoostDecision.shouldBoost;
}