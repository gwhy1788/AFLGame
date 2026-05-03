(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx    = canvas.getContext('2d');

  Renderer.init(canvas);
  UI.init(canvas);

  // ─── Game state ────────────────────────────────────────────────────────────
  let gs = buildInitialState();

  function buildInitialState() {
    return {
      state:             STATE.INTRO,
      shotsTotal:        10,
      shotIndex:         0,
      shots:             shuffleArray([...SHOT_POOL]),
      currentShot:       null,
      selectedKickStyle: null,
      powerFraction:     0,
      currentPowerDisplay: 0,
      powerBarFilling:   false,
      powerBarStartTime: null,
      wind:              { speed: 0, direction: 0, x: 0, z: 0 },
      aimOffsetX:        0,
      flightPath:        [],
      flightIndex:       0,
      torpedoPhase:      0,
      goals:             0,
      behinds:           0,
      lastResult:        null,
      resultDisplayStart: null,
      positionDisplayStart: null,
      hoveredKick:       null,
    };
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ─── State transitions ────────────────────────────────────────────────────
  function transitionTo(newState) {
    gs.state = newState;

    if (newState === STATE.POSITION_SHOWN) {
      gs.currentShot        = gs.shots[gs.shotIndex];
      gs.wind               = Physics.generateWind();
      gs.positionDisplayStart = performance.now();
      gs.selectedKickStyle  = null;
      gs.powerFraction      = 0;
      gs.currentPowerDisplay = 0;
      gs.powerBarFilling    = false;
      gs.aimOffsetX         = 0;
      gs.flightPath         = [];
      gs.flightIndex        = 0;
      gs.torpedoPhase       = 0;
      gs.lastResult         = null;
    }

    if (newState === STATE.AIM_SELECTION) {
      gs.aimOffsetX = 0;
    }

    if (newState === STATE.BALL_IN_FLIGHT) {
      const { positions } = Physics.simulateFlight(
        gs.currentShot,
        gs.powerFraction,
        KICK_STYLES[gs.selectedKickStyle],
        gs.wind,
        gs.aimOffsetX
      );
      gs.flightPath  = positions;
      gs.flightIndex = 0;
      gs.torpedoPhase = 0;
    }

    if (newState === STATE.RESULT) {
      const lastPos = gs.flightPath[gs.flightPath.length - 1];
      gs.lastResult = Physics.scoreResult(lastPos);
      if (gs.lastResult.result === 'GOAL')   gs.goals++;
      if (gs.lastResult.result === 'BEHIND') gs.behinds++;
      gs.resultDisplayStart = performance.now();
    }
  }

  function advanceToNextShotOrGameOver() {
    gs.shotIndex++;
    if (gs.shotIndex >= gs.shotsTotal) {
      gs.state = STATE.GAME_OVER;
    } else {
      transitionTo(STATE.POSITION_SHOWN);
    }
  }

  // ─── Input ────────────────────────────────────────────────────────────────
  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }

  canvas.addEventListener('mousemove', e => {
    const p = getCanvasPos(e);
    if (gs.state === STATE.KICK_SELECTION) {
      gs.hoveredKick = UI.hoverTestKickButtons(p.x, p.y);
    }
    if (gs.state === STATE.AIM_SELECTION) {
      gs.aimOffsetX = Math.max(-AIM_X_MAX, Math.min(AIM_X_MAX,
        ((p.x / CANVAS_W) - 0.5) * 2 * AIM_X_MAX
      ));
    }
  });

  canvas.addEventListener('click', e => {
    const p = getCanvasPos(e);

    switch (gs.state) {
      case STATE.INTRO:
        transitionTo(STATE.POSITION_SHOWN);
        break;

      case STATE.POSITION_SHOWN:
        transitionTo(STATE.KICK_SELECTION);
        break;

      case STATE.KICK_SELECTION: {
        const style = UI.hitTestKickButtons(p.x, p.y);
        if (style) {
          gs.selectedKickStyle = style;
          transitionTo(STATE.AIM_SELECTION);
        }
        break;
      }

      case STATE.AIM_SELECTION:
        transitionTo(STATE.POWER_SELECTION);
        break;

      case STATE.POWER_SELECTION:
        if (!gs.powerBarFilling) {
          gs.powerBarFilling    = true;
          gs.powerBarStartTime  = performance.now();
        } else {
          gs.powerFraction      = Math.min(gs.currentPowerDisplay, 1);
          transitionTo(STATE.BALL_IN_FLIGHT);
        }
        break;

      case STATE.RESULT:
        advanceToNextShotOrGameOver();
        break;

      case STATE.GAME_OVER:
        if (UI.hitTestPlayAgain(p.x, p.y)) {
          gs = buildInitialState();
        }
        break;
    }
  });

  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (gs.state === STATE.AIM_SELECTION) {
        transitionTo(STATE.POWER_SELECTION);
      } else if (gs.state === STATE.POWER_SELECTION) {
        if (!gs.powerBarFilling) {
          gs.powerBarFilling   = true;
          gs.powerBarStartTime = performance.now();
        } else {
          gs.powerFraction     = Math.min(gs.currentPowerDisplay, 1);
          transitionTo(STATE.BALL_IN_FLIGHT);
        }
      } else if (gs.state === STATE.RESULT) {
        advanceToNextShotOrGameOver();
      } else if (gs.state === STATE.INTRO) {
        transitionTo(STATE.POSITION_SHOWN);
      } else if (gs.state === STATE.POSITION_SHOWN) {
        transitionTo(STATE.KICK_SELECTION);
      }
    }
  });

  // ─── Game loop ────────────────────────────────────────────────────────────
  let lastTimestamp = 0;

  function update(timestamp) {
    const dt = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    if (gs.state === STATE.POWER_SELECTION && gs.powerBarFilling) {
      const elapsed = timestamp - gs.powerBarStartTime;
      gs.currentPowerDisplay = Math.min(elapsed / POWER_BAR_FILL_TIME, 1);
      if (gs.currentPowerDisplay >= 1) {
        gs.powerFraction = 1;
        transitionTo(STATE.BALL_IN_FLIGHT);
      }
    }

    if (gs.state === STATE.BALL_IN_FLIGHT && gs.flightPath.length > 0) {
      for (let i = 0; i < FLIGHT_STEPS_PER_FRAME; i++) {
        gs.flightIndex++;
        gs.torpedoPhase += 0.08;
        if (gs.flightIndex >= gs.flightPath.length) {
          gs.flightIndex = gs.flightPath.length - 1;
          transitionTo(STATE.RESULT);
          break;
        }
      }
    }

    if (gs.state === STATE.RESULT && gs.resultDisplayStart !== null) {
      if (timestamp - gs.resultDisplayStart > RESULT_DISPLAY_MS) {
        advanceToNextShotOrGameOver();
      }
    }
  }

  function render() {
    if (gs.state === STATE.INTRO) {
      // Still draw the MCG scene behind intro overlay
      const fakeShotDist = 50;
      Renderer.drawScene({ state: STATE.KICK_SELECTION, currentShot: { distanceM: fakeShotDist }, flightPath: [], selectedKickStyle: null });
      UI.drawIntroScreen();
      return;
    }

    if (gs.state === STATE.GAME_OVER) {
      Renderer.drawScene({ state: STATE.RESULT, currentShot: gs.currentShot || { distanceM: 50 }, flightPath: [], selectedKickStyle: null });
      UI.drawGameOverScreen(gs);
      return;
    }

    Renderer.drawScene(gs);
    UI.drawScoreboard(gs);

    if (gs.state === STATE.POSITION_SHOWN) {
      UI.drawMiniMap(gs.currentShot);
      UI.drawPositionInfo(gs);
    }

    if (gs.state === STATE.KICK_SELECTION) {
      UI.drawMiniMap(gs.currentShot);
      UI.drawWindCompass(gs.wind);
      UI.drawKickButtons(gs);
    }

    if (gs.state === STATE.AIM_SELECTION) {
      UI.drawMiniMap(gs.currentShot);
      UI.drawWindCompass(gs.wind);
      UI.drawAimSelection(gs);
    }

    if (gs.state === STATE.POWER_SELECTION) {
      UI.drawWindCompass(gs.wind);
      UI.drawPowerBar(gs);
    }

    if (gs.state === STATE.RESULT) {
      // Fade-in alpha
      const elapsed = performance.now() - gs.resultDisplayStart;
      const alpha = Math.min(elapsed / 300, 1);
      UI.drawResultOverlay(gs.lastResult, alpha);
    }
  }

  function gameLoop(timestamp) {
    update(timestamp);
    render();
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);

  // ─── Test harness ─────────────────────────────────────────────────────────
  window.AFL_TEST = {
    setState: (s) => transitionTo(s),
    setWind:  (speed, dir) => {
      const rad = dir * Math.PI / 180;
      gs.wind = { speed, direction: dir, x: Math.sin(rad) * speed / 3.6, z: Math.cos(rad) * speed / 3.6 };
    },
    fillScore: () => { gs.goals = 8; gs.behinds = 3; },
    testScoring: () => {
      const cases = [
        { x:  0,    y: 2,    expected: 'GOAL'  },
        { x:  3.0,  y: 2,    expected: 'GOAL'  },
        { x:  3.2,  y: 2,    expected: 'BEHIND' },
        { x:  3.5,  y: 2,    expected: 'BEHIND' },
        { x:  9.5,  y: 2,    expected: 'BEHIND' },
        { x:  9.7,  y: 2,    expected: 'MISS'  },
        { x: -9.7,  y: 2,    expected: 'MISS'  },
        { x:  0,    y: -0.1, expected: 'MISS'  },
      ];
      cases.forEach(({ x, y, expected }) => {
        const r = Physics.scoreResult({ x, y, z: 50 });
        const pass = r.result === expected;
        console.log(`${pass ? '✅ PASS' : '❌ FAIL'} x=${x} y=${y}: got ${r.result}, expected ${expected}`);
      });
    },
    testFlight: (distM, powerFrac, styleId) => {
      styleId = styleId || 'DROP_PUNT';
      const shot = { distanceM: distM, angleDeg: 0, label: 'Test' };
      const wind = { speed: 0, direction: 0, x: 0, z: 0 };
      const result = Physics.simulateFlight(shot, powerFrac, KICK_STYLES[styleId], wind);
      console.log(`Flight: ${result.positions.length} steps`);
      console.log('Final position:', result.finalPos);
      console.log('Score:', Physics.scoreResult(result.finalPos));
    },
    getState: () => gs,
  };

})();
