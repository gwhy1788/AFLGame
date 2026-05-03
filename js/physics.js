const Physics = (() => {

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function idealPower(distanceM) {
    return clamp(0.4 + (distanceM - 20) / 100, 0.4, 0.95);
  }

  function generateWind(difficulty) {
    const diff  = difficulty || DIFFICULTY.BEGINNER;
    const speed = diff.windMin + Math.random() * (diff.windMax - diff.windMin);
    const dir   = Math.random() * 360;
    const rad   = dir * Math.PI / 180;
    return {
      speed,
      direction: dir,
      x: Math.sin(rad) * speed / 3.6,
      z: Math.cos(rad) * speed / 3.6,
    };
  }

  function simulateFlight(shot, powerFraction, kickStyle, wind, aimOffsetX, spreadMult) {
    const dt     = SIM_DT;
    const g      = GRAVITY;
    const theta  = kickStyle.launchAngleDeg * Math.PI / 180;

    // Compute initial speed from ideal-power calibration
    const idealP   = idealPower(shot.distanceM);
    const v0Ideal  = Math.sqrt(shot.distanceM * g / Math.sin(2 * theta));
    const v0Full   = v0Ideal / idealP;
    const v0       = v0Full * powerFraction * kickStyle.rangeRatio;

    // Kicker is laterally offset from centre due to shot angle
    const shotAngleRad = shot.angleDeg * Math.PI / 180;
    const startX = Math.sin(shotAngleRad) * shot.distanceM;

    // Aim angle: deterministic direction toward the player's chosen target X
    const aimX = (aimOffsetX !== undefined) ? aimOffsetX : 0;
    const aimAngle = Math.atan2(aimX - startX, shot.distanceM);

    // Random accuracy spread + power error spread applied on top of aim
    const mult   = spreadMult !== undefined ? spreadMult : 1.0;
    const spread = ((Math.random() * 2 - 1) * kickStyle.accuracySpreadDeg * mult) * Math.PI / 180;
    const powerErr = (powerFraction - idealP) * 2.5 * Math.PI / 180;
    const lateralAngle = aimAngle + spread + powerErr;

    // Initial velocities (kicker at Z=0, posts at Z=distanceM)
    let x  = startX;
    let y  = 0.5;    // boot contact height
    let z  = 0;

    let vx = v0 * Math.sin(lateralAngle);
    let vy = v0 * Math.sin(theta);
    let vz = v0 * Math.cos(lateralAngle);

    let t  = 0;
    let snapPhase    = 0;
    let torpedoPhase = 0;

    const positions = [];

    while (z < shot.distanceM && y >= 0 && t < 8) {
      positions.push({ x, y, z, t });

      // Wind forces
      vx += wind.x * kickStyle.windCoeffX * dt;
      vz += wind.z * kickStyle.windCoeffZ * dt;

      // Snap hook: lateral build-up proportional to time
      if (kickStyle.snapCurve) {
        snapPhase += dt;
        vx += kickStyle.snapCurveAmount * snapPhase * dt;
      }

      // Torpedo wobble: sinusoidal lateral force, stronger with wind
      if (kickStyle.torpedoWobble) {
        torpedoPhase += kickStyle.wobbleFrequency * 2 * Math.PI * dt;
        const wobble = Math.sin(torpedoPhase) * kickStyle.wobbleAmplitudeMax
                       * (wind.speed / 30 + 0.2);
        vx += wobble * dt;
      }

      vy -= g * dt;

      x += vx * dt;
      y += vy * dt;
      z += vz * dt;
      t += dt;
    }

    // Add final clamped position
    positions.push({ x, y: Math.max(y, -0.1), z, t });

    // Interpolate exact crossing at z = distanceM
    const finalPos = interpolateAtDistance(positions, shot.distanceM);
    return { positions, finalPos };
  }

  function interpolateAtDistance(positions, targetZ) {
    // Walk backward to find the last two straddle points
    for (let i = positions.length - 1; i > 0; i--) {
      const a = positions[i - 1];
      const b = positions[i];
      if (a.z <= targetZ && b.z >= targetZ) {
        const t = (targetZ - a.z) / (b.z - a.z + 1e-9);
        return {
          x: a.x + t * (b.x - a.x),
          y: a.y + t * (b.y - a.y),
          z: targetZ,
        };
      }
    }
    // Fell short or overshot — return last position
    const last = positions[positions.length - 1];
    return { x: last.x, y: last.y, z: last.z };
  }

  function scoreResult(finalPos) {
    const { x, y } = finalPos;

    if (y < 0) {
      return { result: 'MISS', reason: 'Ball hit ground short', points: 0 };
    }

    const bl = POSTS.BEHIND_LEFT;
    const cl = POSTS.CENTER_LEFT;
    const cr = POSTS.CENTER_RIGHT;
    const br = POSTS.BEHIND_RIGHT;

    // Hit centre post?
    if (Math.abs(x - cl) < POST_HIT_RADIUS || Math.abs(x - cr) < POST_HIT_RADIUS) {
      return { result: 'BEHIND', reason: 'Hit the post!', points: 1 };
    }

    // Through centre posts?
    if (x > cl && x < cr) {
      return { result: 'GOAL', reason: 'GOAL!', points: 6 };
    }

    // Through a behind?
    if ((x >= bl && x <= cl) || (x >= cr && x <= br)) {
      return { result: 'BEHIND', reason: 'Behind', points: 1 };
    }

    return { result: 'MISS', reason: 'Missed outside', points: 0 };
  }

  // Exposed for AFL_TEST
  return { simulateFlight, scoreResult, generateWind, idealPower };
})();
