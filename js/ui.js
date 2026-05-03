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
    const hasDiff = gs.difficulty != null;
    const isStreak = gs.gameMode === 'HOT_STREAK';
    const x = 10, y = 10, w = 210, h = hasDiff ? 96 : 80;
    ctx.save();
    roundRect(x, y, w, h, 8);
    ctx.fillStyle = isStreak ? 'rgba(30,8,0,0.92)' : 'rgba(10,5,0,0.88)';
    ctx.fill();
    ctx.strokeStyle = isStreak ? '#cc5500' : '#8B6914';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (isStreak) {
      ctx.fillStyle = '#ff8833';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('HOT STREAK', x + w / 2, y + 14);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px Arial';
      ctx.fillText(`${gs.streak}`, x + w / 2, y + 48);

      ctx.fillStyle = '#ffaa66';
      ctx.font = '11px Arial';
      ctx.fillText(`Goal${gs.streak !== 1 ? 's' : ''} in a row`, x + w / 2, y + 66);
    } else {
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
    }

    if (hasDiff) {
      const diffColors = { BEGINNER: '#44cc44', INTERMEDIATE: '#ccaa22', EXPERT: '#cc4422' };
      ctx.fillStyle = diffColors[gs.difficulty.id];
      ctx.font = 'bold 10px Arial';
      ctx.fillText(gs.difficulty.name.toUpperCase(), x + w / 2, y + 83);
    }
    ctx.restore();
  }

  // ─── Mode selection ───────────────────────────────────────────────────────
  const MODE_BUTTONS = [
    { id: 'CLASSIC',    x: 160, y: 195, w: 210, h: 215 },
    { id: 'HOT_STREAK', x: 430, y: 195, w: 210, h: 215 },
  ];

  function drawModeSelection(gs) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.shadowBlur  = 18;
    ctx.shadowColor = '#ffff00';
    ctx.fillStyle   = '#f0e040';
    ctx.font        = 'bold 36px Arial';
    ctx.fillText('CHOOSE YOUR MODE', CANVAS_W / 2, 98);
    ctx.shadowBlur  = 0;

    ctx.fillStyle = '#999999';
    ctx.font      = '13px Arial';
    ctx.fillText('How do you want to play today?', CANVAS_W / 2, 135);

    const styles = {
      CLASSIC: {
        bg: 'rgba(8,18,38,0.95)', bgH: 'rgba(12,26,54,0.95)',
        border: '#3366cc', borderH: '#6699ff',
        title: '#88aaff', sub: '#6688cc',
      },
      HOT_STREAK: {
        bg: 'rgba(38,10,0,0.95)', bgH: 'rgba(58,15,0,0.95)',
        border: '#cc4400', borderH: '#ff7733',
        title: '#ff8844', sub: '#cc6633',
      },
    };

    MODE_BUTTONS.forEach(btn => {
      const hovered = gs.hoveredMode === btn.id;
      const sty     = styles[btn.id];
      const cx      = btn.x + btn.w / 2;

      ctx.save();
      roundRect(btn.x, btn.y, btn.w, btn.h, 12);
      ctx.fillStyle   = hovered ? sty.bgH : sty.bg;
      ctx.fill();
      ctx.strokeStyle = hovered ? sty.borderH : sty.border;
      ctx.lineWidth   = hovered ? 2.5 : 1.5;
      ctx.stroke();

      ctx.textAlign = 'center';

      if (btn.id === 'CLASSIC') {
        ctx.fillStyle = sty.title;
        ctx.font      = 'bold 22px Arial';
        ctx.fillText('CLASSIC', cx, btn.y + 38);

        ctx.fillStyle = sty.sub;
        ctx.font      = 'italic 11px Arial';
        ctx.fillText('10-shot challenge', cx, btn.y + 57);

        ctx.fillStyle = '#aaaaaa';
        ctx.font      = '13px Arial';
        ctx.fillText('Score as many points', cx, btn.y + 90);
        ctx.fillText('as you can across', cx, btn.y + 108);
        ctx.fillText('10 shots', cx, btn.y + 126);

        ctx.strokeStyle = sty.border + '55';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(btn.x + 14, btn.y + 144);
        ctx.lineTo(btn.x + btn.w - 14, btn.y + 144);
        ctx.stroke();

        ctx.fillStyle = sty.title;
        ctx.font      = 'bold 28px Arial';
        ctx.fillText('10', cx, btn.y + 178);
        ctx.font      = '10px Arial';
        ctx.fillStyle = sty.sub;
        ctx.fillText('SHOTS', cx, btn.y + 197);
      } else {
        ctx.fillStyle = sty.title;
        ctx.font      = 'bold 22px Arial';
        ctx.fillText('HOT STREAK', cx, btn.y + 38);

        ctx.fillStyle = sty.sub;
        ctx.font      = 'italic 11px Arial';
        ctx.fillText('Goals in a row', cx, btn.y + 57);

        ctx.fillStyle = '#aaaaaa';
        ctx.font      = '13px Arial';
        ctx.fillText('Kick consecutive goals', cx, btn.y + 90);
        ctx.fillText('— one miss or behind', cx, btn.y + 108);
        ctx.fillText('ends your run!', cx, btn.y + 126);

        ctx.strokeStyle = sty.border + '55';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(btn.x + 14, btn.y + 144);
        ctx.lineTo(btn.x + btn.w - 14, btn.y + 144);
        ctx.stroke();

        ctx.fillStyle = sty.title;
        ctx.font      = 'bold 28px Arial';
        ctx.fillText('∞', cx, btn.y + 178);
        ctx.font      = '10px Arial';
        ctx.fillStyle = sty.sub;
        ctx.fillText('STREAK', cx, btn.y + 197);
      }

      ctx.restore();
    });

    ctx.fillStyle = '#777777';
    ctx.font      = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click a mode to continue', CANVAS_W / 2, 438);
    ctx.restore();
  }

  function hitTestModeButtons(mx, my) {
    for (const btn of MODE_BUTTONS) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) return btn.id;
    }
    return null;
  }

  function hoverTestModeButtons(mx, my) {
    return hitTestModeButtons(mx, my);
  }

  // ─── Difficulty selection ─────────────────────────────────────────────────
  const DIFFICULTY_BUTTONS = [
    { id: 'BEGINNER',     x: 55,  y: 188, w: 212, h: 230 },
    { id: 'INTERMEDIATE', x: 294, y: 188, w: 212, h: 230 },
    { id: 'EXPERT',       x: 533, y: 188, w: 212, h: 230 },
  ];

  const DIFF_STYLES = {
    BEGINNER:     { bg: 'rgba(10,40,10,0.95)',  bgH: 'rgba(15,58,15,0.95)',  border: '#44cc44', borderH: '#77ee77', title: '#88ff88', info: '#99cc99' },
    INTERMEDIATE: { bg: 'rgba(45,38,8,0.95)',   bgH: 'rgba(64,54,10,0.95)', border: '#ccaa22', borderH: '#eecc55', title: '#ffdd44', info: '#ccbb88' },
    EXPERT:       { bg: 'rgba(45,10,10,0.95)',  bgH: 'rgba(64,14,14,0.95)', border: '#cc4422', borderH: '#ee6644', title: '#ff7744', info: '#cc9988' },
  };

  function drawDifficultySelection(gs) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.shadowBlur  = 18;
    ctx.shadowColor = '#ffff00';
    ctx.fillStyle   = '#f0e040';
    ctx.font        = 'bold 36px Arial';
    ctx.fillText('SELECT DIFFICULTY', CANVAS_W / 2, 98);
    ctx.shadowBlur  = 0;

    ctx.fillStyle = '#999999';
    ctx.font      = '13px Arial';
    ctx.fillText('Affects wind, kick accuracy and power bar speed', CANVAS_W / 2, 130);
    const modeDesc = gs.gameMode === 'HOT_STREAK' ? 'Choose before your Hot Streak begins' : 'Choose before your 10-shot game begins';
    ctx.fillText(modeDesc, CANVAS_W / 2, 150);

    DIFFICULTY_BUTTONS.forEach(btn => {
      const diff    = DIFFICULTY[btn.id];
      const hovered = gs.hoveredDifficulty === btn.id;
      const sty     = DIFF_STYLES[btn.id];
      const cx      = btn.x + btn.w / 2;

      ctx.save();
      roundRect(btn.x, btn.y, btn.w, btn.h, 12);
      ctx.fillStyle   = hovered ? sty.bgH : sty.bg;
      ctx.fill();
      ctx.strokeStyle = hovered ? sty.borderH : sty.border;
      ctx.lineWidth   = hovered ? 2.5 : 1.5;
      ctx.stroke();

      // Name
      ctx.textAlign = 'center';
      ctx.fillStyle = sty.title;
      ctx.font      = 'bold 22px Arial';
      ctx.fillText(diff.name, cx, btn.y + 38);

      // Tagline
      ctx.fillStyle = sty.info;
      ctx.font      = 'italic 11px Arial';
      ctx.fillText(diff.tagline, cx, btn.y + 57);

      // Stars
      const starMap = { BEGINNER: '★ ☆ ☆', INTERMEDIATE: '★ ★ ☆', EXPERT: '★ ★ ★' };
      ctx.fillStyle = sty.title;
      ctx.font      = '20px Arial';
      ctx.fillText(starMap[btn.id], cx, btn.y + 80);

      // Divider
      ctx.strokeStyle = sty.border + '55';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(btn.x + 14, btn.y + 93);
      ctx.lineTo(btn.x + btn.w - 14, btn.y + 93);
      ctx.stroke();

      // Stats
      ctx.textAlign = 'left';
      ctx.fillStyle = '#bbbbbb';
      ctx.font      = '12px Arial';
      const sx = btn.x + 14;
      ctx.fillText(`Wind:     ${diff.windMin}–${diff.windMax} km/h`, sx, btn.y + 116);
      ctx.fillText(`Power:    ${(diff.powerBarTime / 1000).toFixed(2)}s fill`, sx, btn.y + 136);
      const accLabel = { BEGINNER: 'Standard', INTERMEDIATE: '+40% spread', EXPERT: '+100% spread' };
      ctx.fillText(`Accuracy: ${accLabel[btn.id]}`, sx, btn.y + 156);

      // Difficulty bar
      const barX = btn.x + 14, barY = btn.y + 172, barW = btn.w - 28, barH = 7;
      const fill  = { BEGINNER: 0.33, INTERMEDIATE: 0.66, EXPERT: 1.0 };
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = sty.title;
      ctx.fillRect(barX, barY, Math.round(barW * fill[btn.id]), barH);

      ctx.textAlign = 'center';
      ctx.fillStyle = sty.info;
      ctx.font      = '10px Arial';
      ctx.fillText('DIFFICULTY', cx, btn.y + 197);

      ctx.restore();
    });

    ctx.fillStyle = '#777777';
    ctx.font      = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click a difficulty to start your game', CANVAS_W / 2, 445);
    ctx.restore();
  }

  function hitTestDifficultyButtons(mx, my) {
    for (const btn of DIFFICULTY_BUTTONS) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) return btn.id;
    }
    return null;
  }

  function hoverTestDifficultyButtons(mx, my) {
    return hitTestDifficultyButtons(mx, my);
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

  // ─── Aim selection panel ──────────────────────────────────────────────────
  function drawAimSelection(gs) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 430, CANVAS_W, 170);
    ctx.restore();

    const aimX     = gs.aimOffsetX || 0;
    const inGoal   = Math.abs(aimX) < POSTS.CENTER_RIGHT;
    const inBehind = Math.abs(aimX) < POSTS.BEHIND_RIGHT;
    const zoneLabel = inGoal   ? 'GOAL ZONE'      : inBehind ? 'BEHIND ZONE' : 'WIDE — MISS';
    const zoneColor = inGoal   ? '#44ff88'         : inBehind ? '#ffee44'     : '#ff5544';
    const styleId   = gs.selectedKickStyle ? KICK_STYLES[gs.selectedKickStyle].name : '';

    ctx.save();
    ctx.textAlign = 'center';

    ctx.fillStyle = '#ddeeff';
    ctx.font      = 'bold 15px Arial';
    ctx.fillText(`${styleId} — CHOOSE YOUR AIM`, CANVAS_W / 2, 450);

    ctx.fillStyle = zoneColor;
    ctx.font      = 'bold 24px Arial';
    ctx.shadowBlur  = 8;
    ctx.shadowColor = zoneColor;
    ctx.fillText(zoneLabel, CANVAS_W / 2, 482);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#aaaaaa';
    ctx.font      = '13px Arial';
    ctx.fillText('Move mouse left / right to aim', CANVAS_W / 2, 507);

    ctx.fillStyle = '#88cc88';
    ctx.font      = '13px Arial';
    ctx.fillText('Click to confirm aim', CANVAS_W / 2, 526);
    ctx.restore();
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
    ctx.fillText('Classic 10-shot challenge or Hot Streak mode', CANVAS_W / 2, 225);

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

    if (gs.gameMode === 'HOT_STREAK') {
      ctx.fillStyle = '#ff6622';
      ctx.font = 'bold 44px Arial';
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#ff4400';
      ctx.fillText('STREAK OVER!', CANVAS_W / 2, 155);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px Arial';
      ctx.fillText(`${gs.streak}`, CANVAS_W / 2, 248);

      ctx.fillStyle = '#ffaa66';
      ctx.font = '20px Arial';
      ctx.fillText(`Goal${gs.streak !== 1 ? 's' : ''} in a row`, CANVAS_W / 2, 280);

      const streakRating = gs.streak >= 10 ? 'Unstoppable!' : gs.streak >= 7 ? 'On Fire!' : gs.streak >= 5 ? 'Hot Streak!' : gs.streak >= 3 ? 'Getting Warm' : gs.streak >= 1 ? 'Good Start' : 'Unlucky!';
      ctx.fillStyle = '#ffdd66';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(streakRating, CANVAS_W / 2, 320);

      if (gs.difficulty) {
        const diffColors = { BEGINNER: '#44cc44', INTERMEDIATE: '#ccaa22', EXPERT: '#cc4422' };
        ctx.fillStyle = diffColors[gs.difficulty.id];
        ctx.font = '14px Arial';
        ctx.fillText(gs.difficulty.name + ' difficulty', CANVAS_W / 2, 348);
      }
    } else {
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

      const rating = total >= 50 ? 'Legend' : total >= 36 ? 'Elite Foot' : total >= 24 ? 'Good Kick' : total >= 12 ? 'Average' : 'Keep Practising!';
      ctx.fillStyle = '#ffdd66';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(rating, CANVAS_W / 2, 320);
    }

    // Play again button
    const btnX = CANVAS_W / 2 - 100, btnY = 375, btnW = 200, btnH = 55;
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
    const btnX = CANVAS_W / 2 - 100, btnY = 375, btnW = 200, btnH = 55;
    return mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH;
  }

  return {
    init,
    drawScoreboard,
    drawWindCompass,
    drawMiniMap,
    drawModeSelection,
    drawDifficultySelection,
    drawKickButtons,
    drawAimSelection,
    drawPowerBar,
    drawPositionInfo,
    drawResultOverlay,
    drawIntroScreen,
    drawGameOverScreen,
    hitTestModeButtons,
    hoverTestModeButtons,
    hitTestDifficultyButtons,
    hoverTestDifficultyButtons,
    hitTestKickButtons,
    hoverTestKickButtons,
    hitTestPlayAgain,
  };
})();
