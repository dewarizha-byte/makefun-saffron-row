// The renderer: composes the kitchen, stations, HUD, tickets, timer, cook and overlays
// onto the 1280x720 canvas for every screen — title, play, paused and game over.

import { CANVAS_HEIGHT, CANVAS_WIDTH, SHIFT_SECONDS } from './config.js';
import { comboLabel, comboMultiplier } from './assembly.js';
import { drawCabinets, drawIngredientIcon, drawKitchenRoom, drawOrderBoardFrame, drawPantryStrip, drawPlatedDish, drawRoundRect, drawSteam, drawFlames, drawSmoke } from './kitchen.js';
import { PALETTE } from './palette.js';
import { STATIONS, PANTRY_STRIP } from './stations.js';
import { burnerStatus } from './stove.js';
import { drawDifficultyLabel, drawShiftTimer } from './timer.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** Create the renderer bound to the game canvas. */
export function createRenderer(canvas) {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  return {
    /** Paint one full frame of the given screen. */
    draw(world, screen) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      if (screen === SCREEN_TITLE) {
        drawTitleScreen(ctx, world);
        return;
      }
      drawKitchenRoom(ctx, world.time);
      drawCabinets(ctx);
      drawOrderBoardFrame(ctx);
      drawTicketCards(ctx, world);
      drawPrepBoard(ctx, world);
      drawPantryStrip(ctx);
      drawStoves(ctx, world);
      drawPlatingPass(ctx, world);
      drawServiceWindow(ctx, world);
      drawShiftTimer(ctx, world.elapsed);
      drawScoreHud(ctx, world);
      drawCook(ctx, world);
      drawHintBubble(ctx, world);
      drawEffects(ctx, world);
      drawToast(ctx, world);
      if (screen === SCREEN_PAUSED) drawPauseOverlay(ctx, world);
      if (screen === SCREEN_OVER) drawGameOverScreen(ctx, world);
    },
  };
}

/** Ticket cards on the order board, one per live order, red when cold. */
function drawTicketCards(ctx, world) {
  const b = STATIONS.orderBoard;
  const visible = world.board.orders.slice(0, 3);
  visible.forEach((order, index) => {
    const x = b.x + 12;
    const y = b.y + 32 + index * 50;
    const ratio = Math.max(0, order.patience / order.maxPatience);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.02 + index * 0.015);
    ctx.fillStyle = order.cold ? PALETTE.ticketCold : ratio < 0.3 ? PALETTE.ticketAged : PALETTE.ticketPaper;
    drawRoundRect(ctx, 0, 0, 300, 42, 6);
    ctx.fill();
    // torn top edge
    ctx.fillStyle = order.cold ? '#c8553f' : '#e6d5b2';
    ctx.fillRect(0, 0, 300, 4);
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.ticketText;
    ctx.fillText(order.name, 12, 18);
    ctx.font = '12px Georgia, serif';
    ctx.fillText(order.parts.map((p) => p.replace(/(Chopped|Cooked)$/, (m) => ` ${m.toLowerCase()}`)).join(' + '), 12, 34);
    // patience bar
    ctx.fillStyle = ratio > 0.4 ? PALETTE.accentGreen : PALETTE.accentRed;
    ctx.fillRect(238, 12, 56 * ratio, 6);
    ctx.restore();
    // small food icon on the ticket
    drawIngredientIcon(ctx, order.parts[0]?.replace(/(Chopped|Cooked)$/, '') ?? 'tomato', x + 290, y + 21, 0.8);
  });
  if (world.board.orders.length > 3) {
    ctx.font = 'italic 13px Georgia, serif';
    ctx.fillStyle = PALETTE.ticketAged;
    ctx.fillText(`+${world.board.orders.length - 3} more waiting...`, b.x + 16, b.y + b.h - 10);
  }
}

/** Prep board: shows what the chopping block holds and its progress. */
function drawPrepBoard(ctx, world) {
  const p = STATIONS.prepBoard;
  const c = STATIONS.choppingBlock;
  ctx.fillStyle = PALETTE.counterWood;
  drawRoundRect(ctx, p.x, p.y, p.w, p.h, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterWoodDark;
  ctx.fillRect(p.x, p.y, p.w, 8);
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.accentCream;
  ctx.fillText('PREP BOARD', p.x + 10, p.y + 22);
  if (world.cutting.held) {
    drawIngredientIcon(ctx, world.cutting.held, p.x + 30, p.y + 58, 1.1);
    ctx.fillStyle = PALETTE.boardPanel;
    ctx.fillRect(p.x + 60, p.y + 48, 160, 10);
    ctx.fillStyle = PALETTE.accentSaffron;
    ctx.fillRect(p.x + 60, p.y + 48, 160 * world.cutting.progress, 10);
    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = PALETTE.accentCream;
    ctx.fillText('chopping...', p.x + 60, p.y + 76);
  } else if (world.cutting.ready) {
    drawIngredientIcon(ctx, world.cutting.ready, p.x + 30, p.y + 58, 1.2);
    ctx.font = 'bold 12px Georgia, serif';
    ctx.fillStyle = PALETTE.accentGreen;
    ctx.fillText('ready to take!', p.x + 60, p.y + 62);
  } else {
    ctx.font = 'italic 13px Georgia, serif';
    ctx.fillStyle = PALETTE.ticketAged;
    ctx.fillText('bring a raw item + hold E', p.x + 12, p.y + 60);
  }
  // The chopping block itself, right of the prep board
  ctx.fillStyle = PALETTE.counterWoodDark;
  drawRoundRect(ctx, c.x, c.y, c.w, c.h, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterWood;
  drawRoundRect(ctx, c.x + 6, c.y + 6, c.w - 12, c.h - 12, 8);
  ctx.fill();
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillStyle = PALETTE.inkDark;
  ctx.fillText('CHOPPING BLOCK', c.x + 14, c.y + 26);
  // Knife art
  ctx.save();
  ctx.translate(c.x + 60, c.y + 62);
  ctx.rotate(0.5);
  ctx.fillStyle = PALETTE.steelLight;
  ctx.fillRect(-4, -26, 8, 34);
  ctx.fillStyle = PALETTE.panBlack;
  ctx.fillRect(-5, 8, 10, 20);
  ctx.restore();
}

/** Two stoves with pans, flames, steam or smoke depending on burner state. */
function drawStoves(ctx, world) {
  [['stoveLeft', 0], ['stoveRight', 1]].forEach(([key, index]) => {
    const s = STATIONS[key];
    const burner = world.burners[index];
    const status = burnerStatus(burner);
    ctx.fillStyle = PALETTE.steelDark;
    drawRoundRect(ctx, s.x, s.y, s.w, s.h, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.steel;
    drawRoundRect(ctx, s.x + 5, s.y + 5, s.w - 10, s.h - 10, 10);
    ctx.fill();
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2 + 8;
    // burner ring
    ctx.strokeStyle = PALETTE.panBlack;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.stroke();
    if (status === 'cooking') drawFlames(ctx, cx, cy + 4, Math.min(0.8, burner.progress));
    // pan
    ctx.fillStyle = PALETTE.panBlack;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 6, 30, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.panInner;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    if (burner.occupant) {
      drawIngredientIcon(ctx, `${burner.occupant}${burner.burnt ? '' : burner.progress >= 1 ? 'Cooked' : ''}`, cx, cy - 10, 0.9);
      if (status === 'cooking') drawSteam(ctx, cx, cy - 18, world.time);
      if (status === 'burnt') drawSmoke(ctx, cx, cy - 16, world.time);
    }
    // status lamp
    ctx.fillStyle = status === 'burnt' ? PALETTE.accentRed : status === 'done' ? PALETTE.accentGreen : status === 'cooking' ? PALETTE.flameOuter : PALETTE.steelLight;
    ctx.beginPath();
    ctx.arc(s.x + 22, s.y + 22, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.inkDark;
    ctx.fillText(`STOVE ${index + 1}`, s.x + 36, s.y + 26);
    // cook progress bar
    if (burner.occupant) {
      ctx.fillStyle = PALETTE.boardPanel;
      ctx.fillRect(s.x + 14, s.y + s.h - 16, s.w - 28, 8);
      ctx.fillStyle = burner.burnt ? PALETTE.accentRed : burner.progress >= 1 ? PALETTE.accentGreen : PALETTE.accentSaffron;
      ctx.fillRect(s.x + 14, s.y + s.h - 16, (s.w - 28) * Math.min(1, burner.progress), 8);
    }
  });
}

/** Plating pass with the dish mid-assembly or complete. */
function drawPlatingPass(ctx, world) {
  const p = STATIONS.platingCounter;
  ctx.fillStyle = PALETTE.counterWood;
  drawRoundRect(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterWoodDark;
  ctx.fillRect(p.x, p.y, p.w, 10);
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.accentCream;
  ctx.fillText('PLATING PASS', p.x + 12, p.y + 24);
  drawPlatedDish(ctx, p.x + p.w / 2, p.y + 62, world.plate.parts);
  if (world.plate.parts.length > 0) {
    drawSteam(ctx, p.x + p.w / 2, p.y + 46, world.time * 0.7);
  }
}

/** Service window: brass framed hatch with a bell, glows when a plate is ready. */
function drawServiceWindow(ctx, world) {
  const s = STATIONS.servingWindow;
  ctx.fillStyle = PALETTE.brass;
  drawRoundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  ctx.fillStyle = world.plate.parts.length > 0 ? '#e6c05a' : PALETTE.boardPanel;
  drawRoundRect(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 12, 10);
  ctx.fill();
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.accentCream;
  ctx.fillText('SERVICE WINDOW', s.x + s.w / 2, s.y + 34);
  // Bell
  ctx.fillStyle = PALETTE.brass;
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + 66, 16, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(s.x + s.w / 2 - 18, s.y + 66, 36, 5);
  ctx.font = 'italic 12px Georgia, serif';
  ctx.fillStyle = PALETTE.ticketAged;
  ctx.fillText('ring when the plate is set', s.x + s.w / 2, s.y + 92);
}

/** Score, combo streak and mute state, top-right wall band (clear of the prep area). */
function drawScoreHud(ctx, world) {
  const x = 1020;
  const y = 328;
  ctx.textAlign = 'left';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillStyle = PALETTE.accentCream;
  ctx.fillText(`${world.score}`, x, y);
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = PALETTE.ticketAged;
  ctx.fillText('POINTS', x, y + 18);
  // combo streak flame
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillStyle = world.combo >= 3 ? PALETTE.accentSaffron : PALETTE.steelLight;
  ctx.fillText(`Combo x${world.combo} · ${comboLabel(world.combo)}`, x, y + 42);
  if (world.combo >= 1) {
    ctx.font = '13px Georgia, serif';
    ctx.fillStyle = PALETTE.accentGreen;
    ctx.fillText(`each serve x${comboMultiplier(world.combo).toFixed(1)}`, x, y + 60);
  }
}

/** The cook: a friendly chef with a hat, apron and the carried item overhead. */
function drawCook(ctx, world) {
  const p = world.player;
  const bob = Math.sin(p.walkPhase) * 2;
  const x = p.x;
  const y = p.y + bob;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 34, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // legs
  ctx.fillStyle = PALETTE.panBlack;
  ctx.fillRect(x - 9, y + 16, 7, 18);
  ctx.fillRect(x + 3, y + 16, 7, 18);
  // body (apron)
  ctx.fillStyle = PALETTE.accentCream;
  drawRoundRect(ctx, x - 14, y - 12, 28, 32, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.accentSaffron;
  drawRoundRect(ctx, x - 9, y - 6, 18, 18, 5);
  ctx.fill();
  // arms
  ctx.strokeStyle = PALETTE.accentCream;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 2);
  ctx.lineTo(x - 22, y + 8);
  ctx.moveTo(x + 14, y - 2);
  ctx.lineTo(x + 22, y + 8);
  ctx.stroke();
  // head
  ctx.fillStyle = '#e8b48c';
  ctx.beginPath();
  ctx.arc(x, y - 22, 11, 0, Math.PI * 2);
  ctx.fill();
  // chef hat
  ctx.fillStyle = '#fbf7ee';
  ctx.beginPath();
  ctx.arc(x, y - 34, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 10, y - 34, 20, 8);
  // eyes look where the cook faces
  ctx.fillStyle = PALETTE.inkDark;
  ctx.beginPath();
  ctx.arc(x + 3 + p.facing * 3, y - 23, 1.8, 0, Math.PI * 2);
  ctx.arc(x - 3 + p.facing * 3, y - 23, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // carried item overhead
  if (p.carry) {
    drawIngredientIcon(ctx, p.carry, x, y - 52, 1.15);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 40);
    ctx.quadraticCurveTo(x, y - 46, x + 8, y - 40);
    ctx.stroke();
  }
}

/** Floating hint above the cook ("E: cook it"). */
function drawHintBubble(ctx, world) {
  // imported lazily to avoid a cycle: hint text comes from actions.js via world
  if (!world.hint) return;
  const p = world.player;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  const width = ctx.measureText(world.hint).width + 18;
  ctx.fillStyle = 'rgba(34,28,46,0.9)';
  drawRoundRect(ctx, p.x - width / 2, p.y - 84, width, 24, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.accentCream;
  ctx.fillText(world.hint, p.x, p.y - 67);
}

/** Floating +points / -penalty effects. */
function drawEffects(ctx, world) {
  for (const effect of world.effects) {
    if (!effect.text) continue;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.max(0, effect.life);
    ctx.fillStyle = effect.text.startsWith('+') ? PALETTE.accentGreen : PALETTE.accentRed;
    ctx.fillText(effect.text, effect.x, effect.y);
    ctx.globalAlpha = 1;
  }
}

/** Toast banner at the bottom centre. */
function drawToast(ctx, world) {
  if (!world.toast) return;
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  const width = ctx.measureText(world.toast).width + 36;
  ctx.fillStyle = 'rgba(34,28,46,0.92)';
  drawRoundRect(ctx, CANVAS_WIDTH / 2 - width / 2, CANVAS_HEIGHT - 46, width, 32, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.brass;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.accentCream;
  ctx.fillText(world.toast, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 24);
}

/** Title screen: logo, kitchen glimpse, how-to-play card. */
function drawTitleScreen(ctx, world) {
  drawKitchenRoom(ctx, world.time);
  drawCabinets(ctx);
  ctx.fillStyle = 'rgba(34,20,40,0.72)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Logo
  ctx.textAlign = 'center';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillStyle = PALETTE.accentSaffron;
  ctx.fillText('SAFFRON ROW', CANVAS_WIDTH / 2, 200);
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillStyle = PALETTE.accentCream;
  ctx.fillText('a midnight kitchen rush', CANVAS_WIDTH / 2, 244);
  // How-to card
  ctx.fillStyle = 'rgba(249,234,210,0.96)';
  drawRoundRect(ctx, 330, 290, 620, 300, 16);
  ctx.fill();
  ctx.fillStyle = PALETTE.boardInk;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('HOW TO RUN THE ROW', CANVAS_WIDTH / 2, 326);
  ctx.font = '16px Georgia, serif';
  ctx.textAlign = 'left';
  const lines = [
    'Arrow keys / WASD — walk the kitchen floor',
    'E at the pantry strip — grab a raw ingredient',
    'E at the chopping block — place it, hold E to chop',
    'E at a stove — cook pasta or shrimp (watch for burns!)',
    'E at the plating pass — stack the plate in ticket order',
    'E at the service window — serve and score the combo',
    'P — pause the shift · M — mute · Enter — start',
  ];
  lines.forEach((line, index) => {
    ctx.fillText(line, 370, 366 + index * 30);
  });
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillStyle = PALETTE.accentSaffron;
  ctx.fillText('PRESS ENTER TO OPEN THE KITCHEN', CANVAS_WIDTH / 2, 626);
  if (world.best > 0) {
    ctx.font = '15px Georgia, serif';
    ctx.fillStyle = PALETTE.ticketAged;
    ctx.fillText(`best shift: ${world.best} points`, CANVAS_WIDTH / 2, 656);
  }
}

/** Pause overlay. */
function drawPauseOverlay(ctx, world) {
  ctx.fillStyle = 'rgba(20,14,30,0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.textAlign = 'center';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillStyle = PALETTE.accentCream;
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, 340);
  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = PALETTE.ticketAged;
  ctx.fillText('press P to get back on the line', CANVAS_WIDTH / 2, 384);
}

/** Game over screen with the shift report card. */
function drawGameOverScreen(ctx, world) {
  ctx.fillStyle = 'rgba(20,14,30,0.78)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = PALETTE.ticketPaper;
  drawRoundRect(ctx, 380, 160, 520, 400, 18);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.font = 'bold 46px Georgia, serif';
  ctx.fillStyle = PALETTE.boardInk;
  ctx.fillText('SHIFT CLOSED', CANVAS_WIDTH / 2, 226);
  ctx.font = 'italic 18px Georgia, serif';
  ctx.fillStyle = PALETTE.ticketText;
  ctx.fillText('the row goes quiet — here is your report', CANVAS_WIDTH / 2, 258);
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillStyle = PALETTE.accentSaffron;
  ctx.fillText(`${world.score} points`, CANVAS_WIDTH / 2, 330);
  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = PALETTE.ticketText;
  ctx.fillText(`orders served: ${world.board.servedCount}`, CANVAS_WIDTH / 2, 376);
  ctx.fillText(`best combo streak: ${world.bestCombo}`, CANVAS_WIDTH / 2, 406);
  ctx.fillText(`tickets gone cold: ${world.board.coldCount}`, CANVAS_WIDTH / 2, 436);
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillStyle = PALETTE.accentSaffron;
  ctx.fillText('PRESS ENTER FOR ANOTHER SHIFT', CANVAS_WIDTH / 2, 510);
  if (world.best > 0) {
    ctx.font = '15px Georgia, serif';
    ctx.fillStyle = PALETTE.ticketText;
    ctx.fillText(`best shift ever: ${world.best}`, CANVAS_WIDTH / 2, 544);
  }
}
