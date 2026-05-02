# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the game

No build step, no server required. Open `index.html` directly in a browser (`file://` protocol works fine). Scripts are loaded as classic globals in this order, which is also the dependency order:

```
constants.js → physics.js → renderer.js → ui.js → game.js
```

## In-browser test harness

Open the browser console after loading `index.html`. `window.AFL_TEST` is always available:

```js
AFL_TEST.testScoring()               // run scoring boundary assertions (logs PASS/FAIL)
AFL_TEST.testFlight(50, 0.7, 'DROP_PUNT')  // simulate a shot and log trajectory + score
AFL_TEST.setState('KICK_SELECTION')  // jump to any STATE.* value
AFL_TEST.setWind(20, 90)             // force wind: 20 km/h from the right
AFL_TEST.getState()                  // inspect full gs object
AFL_TEST.fillScore()                 // set goals=8 behinds=3 for UI testing
```

## Architecture

### Coordinate system

The physics world uses three axes with the kicker at the origin:
- **X** — lateral (positive = right of centre)
- **Y** — height in metres (camera eye at Y = 1.7 m)
- **Z** — forward distance toward the goal posts

The kicker is at `Z = 0`; goal posts sit at `Z = shot.distanceM`. The perspective projection in `renderer.js` maps world coordinates to canvas pixels using `FOV_SCALE / worldZ`.

### Data flow for a single shot

1. `transitionTo(POSITION_SHOWN)` — picks `currentShot` from the shuffled `SHOT_POOL` and generates `wind` via `Physics.generateWind()`
2. Player selects kick style → `selectedKickStyle` stored on `gs`
3. Power bar fills over `POWER_BAR_FILL_TIME` ms; player locks `powerFraction` (0–1)
4. `transitionTo(BALL_IN_FLIGHT)` — calls `Physics.simulateFlight()` which pre-computes the entire `flightPath[]` array at `SIM_DT = 0.016 s` steps. The game loop then replays it at `FLIGHT_STEPS_PER_FRAME` steps per animation frame.
5. `transitionTo(RESULT)` — calls `Physics.scoreResult()` on the last position in `flightPath`

### Module responsibilities

| File | Responsibility |
|------|---------------|
| `constants.js` | All magic numbers and config: canvas dims, post positions, `STATE`, `KICK_STYLES`, `SHOT_POOL`, timing values |
| `physics.js` | `simulateFlight()`, `scoreResult()`, `generateWind()`, `idealPower()` — pure functions, no DOM |
| `renderer.js` | Canvas drawing only: `drawScene(gs)` calls sky → stands → field → towers → posts → ball in painter's order |
| `ui.js` | Overlay drawing and hit-testing: scoreboard, wind compass, mini-map, kick buttons, power bar, result/intro/game-over screens |
| `game.js` | IIFE that owns the `gs` state object, the `requestAnimationFrame` loop, and all input listeners |

### State machine (`STATE.*`)

```
INTRO → POSITION_SHOWN → KICK_SELECTION → POWER_SELECTION → BALL_IN_FLIGHT → RESULT
                ↑______________________________________________________________↓  (loop ×10)
                                                                         GAME_OVER
```

All transitions go through `transitionTo(newState)` in `game.js`, which handles per-state side effects (shot setup, flight pre-compute, scoring).

### Kick style physics

Each entry in `KICK_STYLES` (constants.js) carries:
- `accuracySpreadDeg` — random lateral spread cone applied at launch
- `launchAngleDeg` — initial velocity elevation angle
- `windCoeffX / windCoeffZ` — per-frame wind force multipliers
- `rangeRatio` — scales the computed ideal `v0` up/down relative to Drop Punt
- `snapCurve` / `torpedoWobble` — boolean flags that enable special per-frame lateral forces in `simulateFlight()`

`idealPower(distanceM)` returns the power fraction (0.4–0.95) at which the ball travels exactly `distanceM`. The green "IDEAL" marker on the power bar is drawn at this fraction.

### Rendering perspective

`Renderer.project(worldX, worldY, worldZ)` returns `{ sx, sy, scale }`. The `scale` value is reused by `drawBall()` to size the ball correctly at any distance. The crowd dots in the stands are generated once at init and replayed each frame inside a `ctx.clip()` region — avoid regenerating them on every frame.

## AFL scoring rules (implemented in `Physics.scoreResult`)

- **GOAL (6 pts)**: ball crosses `Z = distanceM` with `Y ≥ 0` and `−3.2 < X < 3.2`
- **BEHIND (1 pt)**: between a centre and behind post (`±3.2` to `±9.6`), or within `POST_HIT_RADIUS` of a centre post
- **MISS (0 pts)**: outside `±9.6 m` laterally, or `Y < 0` (hit ground before goal line)

No crossbar exists in AFL — height is irrelevant as long as `Y ≥ 0`.

## Git workflow

Commits are pushed to `https://github.com/gwhy1788/AFLGame` (main branch). Stage specific files rather than `git add -A`, and write commit messages that explain *why* the change was made, not just what changed.
