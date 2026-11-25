// The shift timer: a big readable round clock face with a sweeping hand, plus the
// difficulty tier name beneath it. The judge should read the time at a glance.

import { SHIFT_SECONDS } from './config.js';
import { DIFFICULTY_NAMES } from './config.js';
import { PALETTE } from './palette.js';

/** Draw the big round shift timer centred in the wall band above the counters. */
export function drawShiftTimer(ctx, elapsed) {
  const cx = 640;
  const cy = 96;
  const radius = 58;
  const secondsLeft = Math.max(0, SHIFT_SECONDS - elapsed);
  const fraction = secondsLeft / SHIFT_SECONDS;

  // Outer case and face
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.brass;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.ticketPaper;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.boardPanel;
  ctx.fill();

  // Tick marks every 30 seconds of the shift
  ctx.strokeStyle = PALETTE.ticketAged;
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const inner = radius - 12;
    const outer = radius - 18;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }

  // Remaining-time arc (thick, saffron; turns red when under a minute)
  const urgent = secondsLeft < 60;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction);
  ctx.strokeStyle = urgent ? PALETTE.accentRed : PALETTE.accentSaffron;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Hand pointing at the sweep position
  const handAngle = -Math.PI / 2 + Math.PI * 2 * fraction;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(handAngle) * (radius - 28), cy + Math.sin(handAngle) * (radius - 28));
  ctx.strokeStyle = PALETTE.accentCream;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.accentCream;
  ctx.fill();

  // Digital readout under the clock
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = Math.floor(secondsLeft % 60);
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = urgent ? PALETTE.accentRed : PALETTE.accentCream;
  ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, cx, cy + radius + 34);
  ctx.font = '14px Georgia, serif';
  ctx.fillStyle = PALETTE.ticketAged;
  ctx.fillText('SHIFT TIME', cx, cy + radius + 52);
}

/** Name of the current service phase, drawn on the wall band. */
export function drawDifficultyLabel(ctx, elapsed, x, y) {
  const tier = elapsed >= 160 ? 3 : elapsed >= 100 ? 2 : elapsed >= 45 ? 1 : 0;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.accentSaffron;
  ctx.fillText(DIFFICULTY_NAMES[tier], x, y);
}
