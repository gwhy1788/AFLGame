const UI = (() => {

  let canvas, ctx;

  function init(c) {
    canvas = c;
    ctx = c.getContext('2d');
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ─── Scoreboard ───────────────────────────────────────────────────────────
  function drawScoreboard(gs) {
    const x = 10, y = 10, w = 210, h = 80;
    ctx.save();
    roundRect(x, y, w, h, 8);
    ctx.fillStyle = 'rgba(10,5,0,0.88)';
    ctx.fill();
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#c8a020';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MCG SCOREBOARD', x + w / 2, y + 14);

    const total = gs.goals * 6 + gs.behinds;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Arial';
    ctx.fillText(`${gs.goals}.${gs.behinds}  (${total})`, x + w / 2, y + 48);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '11px Arial';
    ctx.fillText(`Shot ${Math.min(gs.shotIndex + 1, gs.shotsTotal)} of ${gs.shotsTotal}`, x + w / 2, y + 66);
    ctx.restore();
  }

  // ─── Wind compass ─────────────────────────────────────────────────────────
  function drawWindCompass(wind) {
    const cx = 680, cy = 80, r = 44;
    ctx.save();

    // Background circle
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10,10,20,0.82)';
    ctx.fill();
    ctx.strokeStyle = '#445566';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cardinal labels
    ctx.fillStyle = '#aabbcc';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↑ Goals', cx, cy - r + 7);
    ctx.fillText('S', cx, cy + r - 5);
    ctx.fillText('W', cx - r + 6, cy);
    ctx.fillText('E', cx + r - 6, cy);

    // Wind arrow
    if (wind.speed > 0.5) {
      const dirRad = wind.direction * Math.PI / 180;
      const arrowLen = (wind.speed / 30) * (r - 8);
      const ax = cx + Math.sin(dirRad) * arrowLen;
      const ay = cy - Math.cos(dirRad) * arrowLen;

      ctx.strokeStyle = '#66ccff';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ax, ay);
      ctx.stroke();

      // Arrowhead
      const headAngle = Math.atan2(ay - cy, ax - cx);
      ctx.fillStyle = '#66ccff';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - 7 * Math.cos(headAngle - 0.4), ay - 7 * Math.sin(headAngle - 0.4));
      ctx.lineTo(ax - 7 * Math.cos(headAngle + 0.4), ay - 7 * Math.sin(headAngle + 0.4));
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#667788';
      ctx.font = '10px Arial';
      ctx.fillText('CALM', cx, cy);
    }

    // Speed label
    ctx.fillStyle = '#eeeeff';
    ctx.font = 'bold 11px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${Math.round(wind.speed)} km/h`, cx, cy + r + 18);

    ctx.fillStyle = '#aabbcc';
    ctx.font = '10px Arial';
    ctx.fillText('WIND', cx, cy + r + 30);

    ctx.restore();
  }

  // ─── Mini-map ─────────────────────────────────────────────────────────────
  function drawMiniMap(shot) {
    if (!shot) return;
    const mx = 630, my = 10, mw = 155, mh = 155;
    const cx = mx + mw / 2, cy = my + mh * 0.62;

    ctx.save();
    // Background
    roundRect(mx, my, mw, mh, 8);
    ctx.fillStyle = 'rgba(10,10,20,0.88)';
    ctx.fill();
    ctx.strokeStyle = '#334455';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Oval
    ctx.strokeStyle = '#55aa55';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, my + mh * 0.5, mw * 0.38, mh * 0.44, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(30,80,30,0.5)';
    ctx.fill();

    // Goal posts (top of oval)
    const goalY = my + mh * 0.08;
    ctx.strokeStyle = '#f0e040';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 6, goalY); ctx.lineTo(cx - 6, goalY + 8);
    ctx.moveTo(cx + 6, goalY); ctx.lineTo(cx + 6, goalY + 8);
    ctx.stroke();
    ctx.strokeStyle = '#c8c020';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 14, goalY + 2); ctx.lineTo(cx - 14, goalY + 7);
    ctx.moveTo(cx + 14, goalY + 2); ctx.lineTo(cx + 14, goalY + 7);
    ctx.stroke();

    // Shot position marker
    const scale = mh * 0.44 / 70; // max 70m maps to oval radius
    const angleDeg = shot.angleDeg || 0;
    const angleRad = angleDeg * Math.PI / 180;
    const px = cx + Math.sin(angleRad) * shot.distanceM * scale;
    const py = my + mh * 0.08 + shot.distanceM * scale;

    // Line from posts to player
    ctx.strokeStyle = 'rgba(255,255,100,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, goalY + 8);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Player dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#ccddee';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(shot.label, mx + mw / 2, my + mh - 6);

    ctx.restore();
  }

  // ─── Kick style buttons ───────────────────────────────────────────────────
  const KICK_BUTTONS = [
    { id: 'DROP_PUNT', x: 65,  y: 450, w: 200, h: 70 },
    { id: 'SNAP',      x: 300, y: 450, w: 200, h: 70 },
    { id: 'TORPEDO',   x: 535, y: 450, w: 200, h: 70 },
  ];

  function drawKickButtons(gs) {
    // Instruction text
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 430, CANVAS_W, 160);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#ddeeff';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT YOUR KICK STYLE', CANVAS_W / 2, 444);
    ctx.restore();

    KICK_BUTTONS.forEach(btn => {
      const style = KICK_STYLES[btn.id];
      const hovered = gs.hoveredKick === btn.id;

      ctx.save();
      roundRect(btn.x, btn.y, btn.w, btn.h, 10);
      ctx.fillStyle = hovered ? 'rgba(60,100,60,0.95)' : 'rgba(20,40,20,0.9)';
      ctx.fill();
      ctx.strokeStyle = hovered ? '#88cc88' : '#3a6a3a';
      ctx.lineWidth = hovered ? 2 : 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(style.name, btn.x + btn.w / 2, btn.y + 26);

      ctx.fillStyle = '#aaccaa';
      ctx.font = '12px Arial';
      ctx.fillText(style.desc, btn.x + btn.w / 2, btn.y + 44);

      // Accuracy bar
      const barW = btn.w - 30, barH = 6;
      const barX = btn.x + 15, barY = btn.y + 56;
      ctx.fillStyle = '#223322';
      ctx.fillRect(barX, barY, barW, barH);
      const acc = style.id === 'DROP_PUNT' ? 0.9 : style.id === 'TORPEDO' ? 0.65 : 0.45;
      const range = style.id === 'TORPEDO' ? 0.92 : style.id === 'DROP_PUNT' ? 0.78 : 0.62;
      ctx.fillStyle = '#55cc55';
      ctx.fillRect(barX, barY, barW * acc * 0.5, barH);
      ctx.fillStyle = '#5588ff';
      ctx.fillRect(barX + barW * 0.5 + 2, barY, barW * range * 0.5 - 2, barH);

      ctx.fillStyle = '#667766';
      ctx.font = '9px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('ACC', barX, barY - 2);
      ctx.textAlign = 'right';
      ctx.fillText('RANGE', barX + barW, barY - 2);
      ctx.restore();
    });
  }

  function hitTestKickButtons(mx, my) {
    for (const btn of KICK_BUTTONS) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        return btn.id;
      }
    }
    return null;
  }

  function hoverTestKickButtons(mx, my) {
    for (const btn of KICK_BUTTONS) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        return btn.id;
      }
    }
    return null;
  }

  // ─── Power bar ────────────────────────────────────────────────────────────
  function drawPowerBar(gs) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 440, CANVAS_W, 160);
    ctx.restore();

    const style = KICK_STYLES[gs.selectedKickStyle];
    ctx.save();
    ctx.fillStyle = '#ddeeff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${style.name} — ${gs.currentShot.label}`, CANVAS_W / 2, 460);
    ctx.restore();

    const bx = 100, by = 490, bw = 600, bh = 32;

    // Bar background
    ctx.save();
    roundRect(bx, by, bw, bh, 6);
    ctx.fillStyle = '#111a11';
    ctx.fill();
    ctx.strokeStyle = '#336633';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fill gradient
    const power = gs.currentPowerDisplay || 0;
    if (power > 0) {
      const fillW = bw * power;
      const fillGrad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      fillGrad.addColorStop(0,   '#22cc22');
      fillGrad.addColorStop(0.5, '#cccc22');
      fillGrad.addColorStop(0.8, '#cc6622');
      fillGrad.addColorStop(1,   '#cc2222');
      ctx.fillStyle = fillGrad;
      ctx.fillRect(bx + 2, by + 2, Math.min(fillW - 4, bw - 4), bh - 4);
    }

    // Ideal power marker
    const ideal = Physics.idealPower(gs.currentShot.distanceM);
    const markerX = bx + bw * ideal;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(markerX, by - 5);
    ctx.lineTo(markerX, by + bh + 5);
    ctx.stroke();

    // Marker label
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('IDEAL', markerX, by - 8);

    // Power % text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`${Math.round(power * 100)}%`, CANVAS_W / 2, by + bh + 24);

    // Instruction
    ctx.fillStyle = gs.powerBarFilling ? '#ffcc44' : '#aaccaa';
    ctx.font = '13px Arial';
    ctx.fillText(
      gs.powerBarFilling ? 'Click again to kick!' : 'Click to start filling power bar',
      CANVAS_W / 2, by + bh + 42
    );
    ctx.restore();
  }

  // ─── Position shown overlay ───────────────────────────────────────────────
  function drawPositionInfo(gs) {
    if (!gs.currentShot) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 440, CANVAS_W, 160);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Arial';
    ctx.fillText(gs.currentShot.label, CANVAS_W / 2, 480);

    const windDesc = gs.wind.speed < 1
      ? 'No wind — perfect conditions'
      : `Wind: ${Math.round(gs.wind.speed)} km/h ${windDirectionLabel(gs.wind.direction)}`;
    ctx.fillStyle = '#aaccff';
    ctx.font = '15px Arial';
    ctx.fillText(windDesc, CANVAS_W / 2, 508);

    ctx.fillStyle = '#88aa88';
    ctx.font = '13px Arial';
    ctx.fillText('Click to select kick style', CANVAS_W / 2, 536);
    ctx.restore();
  }

  function windDirectionLabel(deg) {
    // 0=toward goals (tailwind), 180=away (headwind), 90=right, 270=left
    if (deg < 22.5 || deg >= 337.5) return '(tailwind ↑)';
    if (deg < 67.5)  return '(from left →)';
    if (deg < 112.5) return '(left crosswind →)';
    if (deg < 157.5) return '(from behind-left)';
    if (deg < 202.5) return '(headwind ↓)';
    if (deg < 247.5) return '(from behind-right)';
    if (deg < 292.5) return '(right crosswind ←)';
    return '(from right ←)';
  }

  // ─── Result overlay ───────────────────────────────────────────────────────
  function drawResultOverlay(result, alpha) {
    if (!result) return;
    const a = alpha !== undefined ? alpha : 1;
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${0.5 * a})`;
    ctx.fillRect(0, 220, CANVAS_W, 140);

    const colors = {
      GOAL:   '#ffd700',
      BEHIND: '#ffffff',
      MISS:   '#ff4444',
    };
    const sizes = { GOAL: 72, BEHIND: 52, MISS: 52 };

    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.shadowBlur = result.result === 'GOAL' ? 30 : 10;
    ctx.shadowColor = colors[result.result];
    ctx.fillStyle = colors[result.result];
    ctx.font = `bold ${sizes[result.result]}px Arial`;
    const label = result.result === 'GOAL' ? 'GOAL!' : result.result === 'BEHIND' ? 'BEHIND' : 'MISS';
    ctx.fillText(label, CANVAS_W / 2, 295);

    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(255,255,255,${0.8 * a})`;
    ctx.font = '20px Arial';
    ctx.fillText(`+${result.points} point${result.points !== 1 ? 's' : ''}`, CANVAS_W / 2, 328);

    if (result.reason && result.reason !== result.result) {
      ctx.fillStyle = `rgba(180,180,180,${0.7 * a})`;
      ctx.font = '14px Arial';
      ctx.fillText(result.reason, CANVAS_W / 2, 350);
    }
    ctx.restore();
  }

  // ─── Intro screen ─────────────────────────────────────────────────────────
  function drawIntroScreen() {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0e040';
    ctx.font = 'bold 48px Arial';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffff00';
    ctx.fillText('AFL GOAL KICKER', CANVAS_W / 2, 180);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#aaddaa';
    ctx.font = '18px Arial';
    ctx.fillText('10 shots at the MCG', CANVAS_W / 2, 225);

    const lines = [
      'Choose from Drop Punt, Snap, or Torpedo',
      'Time your power bar near the ideal marker',
      'Adjust for wind speed and direction',
      '',
      'GOAL = 6 pts  |  BEHIND = 1 pt',
    ];
    ctx.fillStyle = '#cccccc';
    ctx.font = '15px Arial';
    lines.forEach((l, i) => ctx.fillText(l, CANVAS_W / 2, 270 + i * 26));

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 400);
    ctx.globalAlpha = pulse;
    ctx.fillText('Click anywhere to start', CANVAS_W / 2, 430);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ─── Game over screen ─────────────────────────────────────────────────────
  function drawGameOverScreen(gs) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0e040';
    ctx.font = 'bold 44px Arial';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffff00';
    ctx.fillText('FULL TIME', CANVAS_W / 2, 160);
    ctx.shadowBlur = 0;

    const total = gs.goals * 6 + gs.behinds;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px Arial';
    ctx.fillText(`${gs.goals}.${gs.behinds}  (${total})`, CANVAS_W / 2, 240);

    ctx.fillStyle = '#aaccaa';
    ctx.font = '18px Arial';
    ctx.fillText(`${gs.goals} Goal${gs.goals !== 1 ? 's' : ''}  —  ${gs.behinds} Behind${gs.behinds !== 1 ? 's' : ''}`, CANVAS_W / 2, 280);

    // Rating
    const rating = total >= 50 ? '⭐ Legend' : total >= 36 ? 'Elite Foot' : total >= 24 ? 'Good Kick' : total >= 12 ? 'Average' : 'Keep Practising!';
    ctx.fillStyle = '#ffdd66';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(rating, CANVAS_W / 2, 320);

    // Play again button
    const btnX = CANVAS_W / 2 - 100, btnY = 370, btnW = 200, btnH = 55;
    roundRect(btnX, btnY, btnW, btnH, 12);
    ctx.fillStyle = '#1a4a1a';
    ctx.fill();
    ctx.strokeStyle = '#66cc66';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#aaffaa';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Play Again', CANVAS_W / 2, btnY + 34);

    ctx.restore();
  }

  function hitTestPlayAgain(mx, my) {
    const btnX = CANVAS_W / 2 - 100, btnY = 370, btnW = 200, btnH = 55;
    return mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH;
  }

  return {
    init,
    drawScoreboard,
    drawWindCompass,
    drawMiniMap,
    drawKickButtons,
    drawPowerBar,
    drawPositionInfo,
    drawResultOverlay,
    drawIntroScreen,
    drawGameOverScreen,
    hitTestKickButtons,
    hoverTestKickButtons,
    hitTestPlayAgain,
  };
})();
