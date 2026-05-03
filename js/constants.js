// Canvas dimensions
const CANVAS_W = 800;
const CANVAS_H = 600;
const HORIZON_Y = 280;
const VP_X = 400;
const VP_Y = 200;
const FOV_SCALE = 300;
const EYE_HEIGHT = 1.7;

// AFL goal post positions (metres from centre)
const POSTS = {
  BEHIND_LEFT:  -9.6,
  CENTER_LEFT:  -3.2,
  CENTER_RIGHT:  3.2,
  BEHIND_RIGHT:  9.6,
};
const POST_HEIGHT_CENTER = 6.0;
const POST_HEIGHT_BEHIND = 4.0;
const POST_HIT_RADIUS = 0.15;

// Gravity
const GRAVITY = 9.8;

// Power bar
const POWER_BAR_FILL_TIME = 1800; // ms to fill 0→100%

// State names
const STATE = {
  INTRO:          'INTRO',
  POSITION_SHOWN: 'POSITION_SHOWN',
  KICK_SELECTION: 'KICK_SELECTION',
  AIM_SELECTION:  'AIM_SELECTION',
  POWER_SELECTION:'POWER_SELECTION',
  BALL_IN_FLIGHT: 'BALL_IN_FLIGHT',
  RESULT:         'RESULT',
  GAME_OVER:      'GAME_OVER',
};

// Max lateral aim offset in world metres (covers beyond the behind posts)
const AIM_X_MAX = 12;

// Shot pool (distance in metres, angle in degrees from centre)
const SHOT_POOL = [
  { distanceM: 20, angleDeg:   0, label: 'Straight 20m' },
  { distanceM: 30, angleDeg:   0, label: 'Straight 30m' },
  { distanceM: 40, angleDeg:   0, label: 'Straight 40m' },
  { distanceM: 50, angleDeg:  15, label: 'Right of Centre 50m' },
  { distanceM: 50, angleDeg: -20, label: 'Left of Centre 50m' },
  { distanceM: 60, angleDeg:   0, label: 'Straight 60m' },
  { distanceM: 60, angleDeg:  25, label: 'Wide Right 60m' },
  { distanceM: 65, angleDeg: -30, label: 'Tight Left 65m' },
  { distanceM: 70, angleDeg:  10, label: 'Near-straight 70m' },
  { distanceM: 45, angleDeg:  40, label: 'Acute Angle 45m' },
];

// Kick styles
const KICK_STYLES = {
  DROP_PUNT: {
    id: 'DROP_PUNT',
    name: 'Drop Punt',
    desc: 'Accurate & reliable',
    accuracySpreadDeg: 2.0,
    launchAngleDeg: 38,
    windCoeffX: 0.12,
    windCoeffZ: 0.04,
    rangeRatio: 1.0,
    snapCurve: false,
    torpedoWobble: false,
  },
  SNAP: {
    id: 'SNAP',
    name: 'Snap',
    desc: 'Good from tight angles',
    accuracySpreadDeg: 6.0,
    launchAngleDeg: 30,
    windCoeffX: 0.10,
    windCoeffZ: 0.05,
    rangeRatio: 0.9,
    snapCurve: true,
    snapCurveAmount: 0.08,
    torpedoWobble: false,
  },
  TORPEDO: {
    id: 'TORPEDO',
    name: 'Torpedo',
    desc: 'Maximum range, wind-affected',
    accuracySpreadDeg: 4.0,
    launchAngleDeg: 42,
    windCoeffX: 0.22,
    windCoeffZ: 0.08,
    rangeRatio: 1.15,
    snapCurve: false,
    torpedoWobble: true,
    wobbleFrequency: 0.8,
    wobbleAmplitudeMax: 0.4,
  },
};

// Crowd colour palette for stands
const CROWD_COLORS = [
  '#cc2222','#2244cc','#22aa22','#eeee22','#ffffff',
  '#ee6622','#aa22aa','#22aaaa','#884422','#cccccc',
  '#ff4444','#4488ff','#44cc44','#ffff44','#ffaaaa',
];

// Result display duration (ms)
const RESULT_DISPLAY_MS = 1800;
const POSITION_DISPLAY_MS = 2200;

// Simulation timestep
const SIM_DT = 0.016;
const FLIGHT_STEPS_PER_FRAME = 3;
