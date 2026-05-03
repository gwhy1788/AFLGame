const Renderer = (() => {

  let canvas, ctx;

  function init(c) {
    canvas = c;
    ctx = c.getContext('2d');
    // Pre-generate crowd dot positions once
    generateCrowdDots();
  }

  // Perspective projection: world (x, y, z) → screen (sx, sy)
  // Camera at (0, EYE_HEIGHT, 0) looking toward +Z
  function project(worldX, worldY, worldZ) {
    const depth = Math.max(worldZ, 0.5);
    const scale = FOV_SCALE / depth;
    const sx = VP_X + worldX * scale;
    const sy = HORIZON_Y - (worldY - EYE_HEIGHT) * scale;
    return { sx, sy, scale };
  }

  // ─── Crowd dots (generated once, drawn via clip each frame) ─────────────
  const crowdDotsLeft  = [];
  const crowdDotsRight = [];

  function generateCrowdDots() {
    const N = 350;
    // Left stand rough bounding box in screen space
    for (let i = 0; i < N; i++) {
      crowdDotsLeft.push({
        x: Math.random() * 280,
        y: 85 + Math.random() * 185,
        color: CROWD_COLORS[Math.floor(Math.random() * CROWD_COLORS.length)],
      });
      crowdDotsRight.push({
        x: 520 + Math.random() * 280,
        y: 85 + Math.random() * 185,
        color: CROWD_COLORS[Math.floor(Math.random() * CROWD_COLORS.length)],
      });
    }
  }

  // ─── Sky ─────────────────────────────────────────────────────────────────
  function drawSky() {
    const grad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
    grad.addColorStop(0,   '#0d2440');
    grad.addColorStop(0.6, '#1a6090');
    grad.addColorStop(1,   '#a8cce0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, HORIZON_Y);

    // Sun
    ctx.save();
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#ffffaa';
    const sunGrad = ctx.createRadialGradient(660, 55, 0, 660, 55, 28);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.4, '#ffffa0');
    sunGrad.addColorStop(1, 'rgba(255,255,160,0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(660, 55, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Two simple clouds
    drawCloud(120, 70, 70, 22);
    drawCloud(320, 45, 90, 18);
  }

  function drawCloud(cx, cy, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + w * 0.45, cy + h * 0.2, w * 0.65, h * 0.75, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - w * 0.4, cy + h * 0.25, w * 0.55, h * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ─── Stands ──────────────────────────────────────────────────────────────
  function drawStands() {
    // Left stand silhouette
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_H * 0.5);
    ctx.lineTo(0, 130);
    ctx.quadraticCurveTo(60, 75, 160, 85);
    ctx.quadraticCurveTo(260, 95, 310, 110);
    ctx.lineTo(310, CANVAS_H * 0.5);
    ctx.closePath();

    const lgLeft = ctx.createLinearGradient(0, 80, 310, 300);
    lgLeft.addColorStop(0, '#2a2a35');
    lgLeft.addColorStop(0.4, '#3a3a48');
    lgLeft.addColorStop(1, '#1a1a22');
    ctx.fillStyle = lgLeft;
    ctx.fill();

    // Clip and draw crowd dots inside left stand
    ctx.clip();
    crowdDotsLeft.forEach(d => {
      ctx.fillStyle = d.color;
      ctx.fillRect(d.x, d.y, 2, 2);
    });
    ctx.restore();

    // Right stand silhouette
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(CANVAS_W, CANVAS_H * 0.5);
    ctx.lineTo(CANVAS_W, 130);
    ctx.quadraticCurveTo(740, 75, 640, 85);
    ctx.quadraticCurveTo(540, 95, 490, 110);
    ctx.lineTo(490, CANVAS_H * 0.5);
    ctx.closePath();

    const lgRight = ctx.createLinearGradient(490, 80, CANVAS_W, 300);
    lgRight.addColorStop(0, '#2a2a35');
    lgRight.addColorStop(0.4, '#3a3a48');
    lgRight.addColorStop(1, '#1a1a22');
    ctx.fillStyle = lgRight;
    ctx.fill();

    ctx.clip();
    crowdDotsRight.forEach(d => {
      ctx.fillStyle = d.color;
      ctx.fillRect(d.x, d.y, 2, 2);
    });
    ctx.restore();

    // Roof lines on stands
    ctx.strokeStyle = '#555566';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 130); ctx.quadraticCurveTo(60, 75, 160, 85); ctx.quadraticCurveTo(260, 95, 310, 110);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CANVAS_W, 130); ctx.quadraticCurveTo(740, 75, 640, 85); ctx.quadraticCurveTo(540, 95, 490, 110);
    ctx.stroke();
  }

  // ─── Far oval (behind posts) ──────────────────────────────────────────────
  function drawFarOval() {
    ctx.save();
    const grad = ctx.createRadialGradient(VP_X, HORIZON_Y - 10, 10, VP_X, HORIZON_Y - 10, 160);
    grad.addColorStop(0, '#3a7a3a');
    grad.addColorStop(1, '#1a4a1a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(VP_X, HORIZON_Y - 8, 180, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ─── Field surface ────────────────────────────────────────────────────────
  function drawField(distanceM) {
    const d = distanceM || 50;
    // Ground trapezoid
    const grad = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_H);
    grad.addColorStop(0,   '#2a6a2a');
    grad.addColorStop(0.4, '#3a8a3a');
    grad.addColorStop(1,   '#2a7a2a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_H);
    ctx.lineTo(CANVAS_W, CANVAS_H);
    ctx.lineTo(VP_X + 200, HORIZON_Y);
    ctx.lineTo(VP_X - 200, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    // Mowing stripes (alternating light/dark bands)
    const stripeCount = 8;
    for (let i = 0; i < stripeCount; i++) {
      if (i % 2 === 0) continue;
      const t0 = i / stripeCount;
      const t1 = (i + 1) / stripeCount;
      // Perspective: map t (0=horizon, 1=bottom) to screen y
      const y0 = HORIZON_Y + t0 * (CANVAS_H - HORIZON_Y);
      const y1 = HORIZON_Y + t1 * (CANVAS_H - HORIZON_Y);
      // Width at each y
      const halfW0 = (y0 - HORIZON_Y) / (CANVAS_H - HORIZON_Y) * 200;
      const halfW1 = (y1 - HORIZON_Y) / (CANVAS_H - HORIZON_Y) * 200;
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.beginPath();
      ctx.moveTo(VP_X - halfW0, y0);
      ctx.lineTo(VP_X + halfW0, y0);
      ctx.lineTo(VP_X + halfW1, y1);
      ctx.lineTo(VP_X - halfW1, y1);
      ctx.closePath();
      ctx.fill();
    }

    // Centre line (dashed, perspective)
    const baseProj = project(0, 0.01, d);
    ctx.save();
    ctx.setLineDash([6, 10]);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(VP_X, CANVAS_H);
    ctx.lineTo(baseProj.sx, baseProj.sy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Goal square (9m deep, 6.4m wide in front of posts)
    drawGoalSquare(d);
  }

  function drawGoalSquare(distanceM) {
    const corners = [
      project(-3.2, 0, distanceM),
      project( 3.2, 0, distanceM),
      project( 3.2, 0, distanceM - 9),
      project(-3.2, 0, distanceM - 9),
    ];
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(corners[0].sx, corners[0].sy);
    corners.forEach(c => ctx.lineTo(c.sx, c.sy));
    ctx.closePath();
    ctx.stroke();
  }

  // ─── Lighting towers ──────────────────────────────────────────────────────
  function drawLightingTowers(distanceM) {
    const d = distanceM || 50;

    // Near towers (screen-space, always visible prominently)
    drawTower(55, 295, 62, 48, true);
    drawTower(745, 295, 738, 48, true);

    // Far towers (projected world positions)
    const farL = project(-45, 0, d + 25);
    const farLT = project(-45, 22, d + 25);
    drawTower(farL.sx, farL.sy, farLT.sx, farLT.sy, false);
    const farR = project(45, 0, d + 25);
    const farRT = project(45, 22, d + 25);
    drawTower(farR.sx, farR.sy, farRT.sx, farRT.sy, false);
  }

  function drawTower(bx, by, tx, ty, near) {
    const w = near ? 7 : 3;
    ctx.strokeStyle = '#888899';
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    // Guy wires
    ctx.save();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'rgba(150,150,170,0.4)';
    ctx.lineWidth = near ? 1 : 0.5;
    const spread = near ? 30 : 12;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(bx - spread, by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(bx + spread, by); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Light cluster
    const lCount = near ? 4 : 2;
    const lSize  = near ? 5 : 2;
    const lSpread = near ? 8 : 3;
    ctx.save();
    ctx.shadowBlur = near ? 18 : 8;
    ctx.shadowColor = '#ffffaa';
    ctx.fillStyle = '#ffffcc';
    for (let i = 0; i < lCount; i++) {
      const ox = (i % 2) * lSpread - lSpread / 2;
      const oy = Math.floor(i / 2) * (near ? -6 : -3);
      ctx.beginPath();
      ctx.arc(tx + ox, ty + oy, lSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ─── Goal posts ───────────────────────────────────────────────────────────
  function drawGoalPosts(distanceM) {
    const postDefs = [
      { x: POSTS.BEHIND_LEFT,  h: POST_HEIGHT_BEHIND, center: false },
      { x: POSTS.CENTER_LEFT,  h: POST_HEIGHT_CENTER, center: true  },
      { x: POSTS.CENTER_RIGHT, h: POST_HEIGHT_CENTER, center: true  },
      { x: POSTS.BEHIND_RIGHT, h: POST_HEIGHT_BEHIND, center: false },
    ];

    postDefs.forEach(({ x, h, center }) => {
      const base = project(x, 0, distanceM);
      const top  = project(x, h, distanceM);
      ctx.lineWidth  = center ? 3.5 : 2;
      ctx.strokeStyle = center ? '#f0e040' : '#c8c020';
      ctx.shadowBlur  = center ? 8 : 4;
      ctx.shadowColor = '#ffff00';
      ctx.beginPath();
      ctx.moveTo(base.sx, base.sy);
      ctx.lineTo(top.sx,  top.sy);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Decorative horizontal marker band on centre posts (not a crossbar — just visual)
    const markerH = 1.0;
    const lBase = project(POSTS.CENTER_LEFT,  markerH, distanceM);
    const rBase = project(POSTS.CENTER_RIGHT, markerH, distanceM);
    ctx.strokeStyle = 'rgba(240,224,64,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lBase.sx, lBase.sy);
    ctx.lineTo(rBase.sx, rBase.sy);
    ctx.stroke();
  }

  // ─── Ball ─────────────────────────────────────────────────────────────────
  function drawBall(pos, kickStyleId, velocityAngle, torpedoPhase) {
    if (!pos) return;
    const { sx, sy, scale } = project(pos.x, pos.y, pos.z);
    const baseScale = project(0, 0, 50).scale;
    const radius = Math.max(3, 9 * (scale / baseScale));

    // Ground shadow
    const groundProj = project(pos.x, 0, pos.z);
    const shadowOpacity = Math.max(0, 1 - pos.y / 15) * 0.4;
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${shadowOpacity})`;
    ctx.beginPath();
    ctx.ellipse(groundProj.sx, groundProj.sy, radius * 1.2, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ball body
    ctx.save();
    ctx.translate(sx, sy);

    let rotation = velocityAngle || 0;
    if (kickStyleId === 'TORPEDO') {
      rotation += Math.sin(torpedoPhase || 0) * 0.3;
    }
    ctx.rotate(rotation);

    const rx = radius * 1.4;
    const ry = radius * 0.85;

    // Ball gradient (leather)
    const ballGrad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, 0, 0, 0, rx);
    ballGrad.addColorStop(0, '#c8742a');
    ballGrad.addColorStop(0.6, '#8B4513');
    ballGrad.addColorStop(1, '#5a2a08');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lace
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(0.5, radius * 0.18);
    ctx.beginPath();
    ctx.moveTo(-rx * 0.35, 0);
    ctx.lineTo( rx * 0.35, 0);
    ctx.stroke();

    ctx.restore();
  }

  // ─── Aim indicator (AIM_SELECTION state) ─────────────────────────────────
  function drawAimIndicator(aimX, distanceM) {
    const groundPos = project(aimX, 0,   distanceM);
    const highPos   = project(aimX, 3.5, distanceM);

    const inGoal   = Math.abs(aimX) < POSTS.CENTER_RIGHT;
    const inBehind = Math.abs(aimX) < POSTS.BEHIND_RIGHT;
    const color    = inGoal ? '#44ff88' : inBehind ? '#ffee44' : '#ff5544';

    ctx.save();
    ctx.shadowBlur  = 16;
    ctx.shadowColor = color;

    // Dashed vertical guide from ground to target height
    ctx.globalAlpha = 0.6;
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(groundPos.sx, groundPos.sy);
    ctx.lineTo(highPos.sx,   highPos.sy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Outer crosshair ring
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(highPos.sx, highPos.sy, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair tick marks
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(highPos.sx - 16, highPos.sy); ctx.lineTo(highPos.sx - 11, highPos.sy);
    ctx.moveTo(highPos.sx + 11, highPos.sy); ctx.lineTo(highPos.sx + 16, highPos.sy);
    ctx.moveTo(highPos.sx, highPos.sy - 16); ctx.lineTo(highPos.sx, highPos.sy - 11);
    ctx.moveTo(highPos.sx, highPos.sy + 11); ctx.lineTo(highPos.sx, highPos.sy + 16);
    ctx.stroke();

    // Centre dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(highPos.sx, highPos.sy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ─── Scene entry point ────────────────────────────────────────────────────
  function drawScene(gameState) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    const d = gameState.currentShot ? gameState.currentShot.distanceM : 50;

    drawSky();
    drawStands();
    drawFarOval();
    drawField(d);
    drawLightingTowers(d);
    drawGoalPosts(d);

    if (gameState.state === STATE.AIM_SELECTION) {
      drawAimIndicator(gameState.aimOffsetX || 0, d);
    }

    if (gameState.state === STATE.BALL_IN_FLIGHT && gameState.flightPath.length > 0) {
      const idx = Math.min(gameState.flightIndex, gameState.flightPath.length - 1);
      const pos = gameState.flightPath[idx];
      const prevPos = idx > 0 ? gameState.flightPath[idx - 1] : pos;
      // Velocity direction angle (for ball rotation)
      const dx = pos.x - prevPos.x;
      const dy = pos.y - prevPos.y;
      const velAngle = Math.atan2(-dy, Math.sqrt(dx * dx + (pos.z - prevPos.z) ** 2));
      drawBall(pos, gameState.selectedKickStyle, velAngle, gameState.torpedoPhase || 0);
    }
  }

  return { init, drawScene, project };
})();
