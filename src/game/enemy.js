import { HAZARD_RESULTS } from './core.js'

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
  const ENTER_CURVE_THRESHOLD = 0.75;

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
 
  if (distanceFromPreviousEndpoint <= EXIT_CURVE_THRESHOLD && isHazard[Section.PREVIOUS]) {
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
    else {
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
  }

  /*
    At this point the enemy player has perceived the previous curve section,
    the current curve section, and the next curve section, assuming it's close
    enough to the previous and next sections to require decision making. 
    The enemy player now has up to three possible decisions it can choose from,
    each of which is either a correct choice or an incorrect choice.
    
    The final decision logic flow is as follows:
      - If there is only one decision, a decision made for the current curve, 
        then the enemy player goes with that.
      - Otherwise, there are at least two decisions: choices for previous and 
        current curves, current and next curves, or previous, current, and next
        curves. In these cases, the decision needs to be made by "hazard priority."
      - Hazard priority means that the right or wrong choice is determined by the
        most pressing hazard. Hazard sections take priority over safe sections
        because the wrong choice in a safe section only gives normal speed, while 
        wrong choices for hazard sections penalize the enemy player with much lower 
        speed. Most pressing means which hazard is most immediately affected by the 
        decision made at this point. In order of decreasing priority:

          1. Hazard in current section.
          2. Hazard in next section.
          3. Hazard in previous section.
          4. No hazards in any sections. The previous section is irrelevant because
            it only matters if it were a hazard. The correct action for current and
            next sections are the same -- since they're both safe, should boost.
  */

  let finalBoostDecision = {shouldBoost: undefined, decidedFrom: undefined};

  if (!decisionForNextCurveMade && !decisionAfterPreviousCurveMade) {
    // Only one decision made, just go with that.
    finalBoostDecision.shouldBoost = shouldBoostDecision[Section.CURRENT];
    finalBoostDecision.decidedFrom = "Current";
  }
  else {
    // At least two decisions made. Use hazard priority.

    // 1. Hazard in current section?
    if (isHazard[Section.CURRENT]) {
      finalBoostDecision.shouldBoost = shouldBoostDecision[Section.CURRENT];
      finalBoostDecision.decidedFrom = "Current (HazPri)";
    }
    // 2. Hazard in next section?
    else if (isHazard[Section.NEXT] && decisionForNextCurveMade) {
      finalBoostDecision.shouldBoost = shouldBoostDecision[Section.NEXT];
      finalBoostDecision.decidedFrom = "Next (HazPri)";
    }
    // 3. Hazard in previous section?
    else if (isHazard[Section.PREVIOUS] && decisionAfterPreviousCurveMade) {
      finalBoostDecision.shouldBoost = shouldBoostDecision[Section.PREVIOUS];
      finalBoostDecision.decidedFrom = "Previous (HazPri)";
    }
    // 4. No hazards in any section.
    else {
      // Push error decisions in to an array, push correct decisions into an array.
      // Then choose a correct or incorrect decision based on AI errorproneness.
      let errorDecisions = [];
      let correctDecisions = [];

      if (decisionAfterPreviousCurveMade) {
        if (isErroneousDecision[Section.PREVIOUS])
          errorDecisions.push({ 
            shouldBoost: shouldBoostDecision[Section.PREVIOUS], 
            decidedFrom: "Previous (Err)"});
        else
          correctDecisions.push({
            shouldBoost: shouldBoostDecision[Section.PREVIOUS],
            decidedFrom: "Previous" });
      }

      if (isErroneousDecision[Section.CURRENT])
        errorDecisions.push({
          shouldBoost: shouldBoostDecision[Section.CURRENT],
          decidedFrom: "Current (Err)" });
      else
        correctDecisions.push({
          shouldBoost:shouldBoostDecision[Section.CURRENT],
          decidedFrom: "Current" });

      if (decisionForNextCurveMade) {
        if (isErroneousDecision[Section.NEXT])
          errorDecisions.push({
            shouldBoost: shouldBoostDecision[Section.NEXT],
            decidedFrom: "Next (Err)" });
        else
          correctDecisions.push({
            shouldBoost: shouldBoostDecision[Section.NEXT],
            decidedFrom: "Next" });
      }

      if (errorDecisions.length > 0 && 
        (correctDecisions.length === 0 || Random() < enemyAI.errorProneessPercent)) {
        const index = Math.floor(Random() * errorDecisions.length);
        finalBoostDecision = errorDecisions[index];
      }
      else {
        const index = Math.floor(Random() * correctDecisions.length);
        finalBoostDecision = correctDecisions[index];
      }
      
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