// Kitchen scenery drawing: walls, tiled floor, cabinets, counters, stoves, the order
// board frame, the pantry strip and every piece of food art. Pure drawing — no rules here.

import { PALETTE } from './palette.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import { STATIONS, PANTRY_STRIP } from './stations.js';
import { INGREDIENT_KINDS } from './ingredients.js';

/** Round-rect helper (Canvas2D lacks one on older browsers we still support). */
export function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The warm room: wall band up top, honey tile floor below. */
export function drawKitchenRoom(ctx, time) {
  // Wall
  ctx.fillStyle = PALETTE.wallLower;
  ctx.fillRect(0, 0, CANVAS_WIDTH, 400);
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, 0, CANVAS_WIDTH, 150);

  // Wall tiles (subtle diamond pattern)
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 2;
  for (let x = 0; x < CANVAS_WIDTH; x += 64) {
    for (let y = 0; y < 400; y += 32) {
      const offset = (y / 32) % 2 === 0 ? 0 : 32;
      ctx.strokeRect(x + offset, y, 64, 32);
    }
  }

  // Floor with two-tone honey tiles and grout
  ctx.fillStyle = PALETTE.floorGrout;
  ctx.fillRect(0, 400, CANVAS_WIDTH, CANVAS_HEIGHT - 400);
  const tile = 74;
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 20; col += 1) {
      const x = col * tile - ((row % 2) * tile) / 2;
      const y = 400 + row * 64;
      ctx.fillStyle = (row + col) % 2 === 0 ? PALETTE.floorWarm : PALETTE.floorAlt;
      ctx.fillRect(x + 2, y + 2, tile - 4, 60);
      // slight sheen
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x + 2, y + 2, tile - 4, 14);
    }
  }
}

/** Terracotta cabinet run along the wall, with brass handles. */
export function drawCabinets(ctx) {
  const y = 150;
  const h = 92;
  for (let x = 20; x < CANVAS_WIDTH - 20; x += 156) {
    ctx.fillStyle = PALETTE.cabinetBody;
    ctx.fillRect(x, y, 148, h);
    ctx.fillStyle = PALETTE.cabinetFace;
    drawRoundRect(ctx, x + 8, y + 8, 132, h - 20, 8);
    ctx.fill();
    // handle
    ctx.fillStyle = PALETTE.brass;
    drawRoundRect(ctx, x + 62, y + h - 22, 24, 6, 3);
    ctx.fill();
  }
  // Wooden counter rail under the cabinets
  ctx.fillStyle = PALETTE.counterWood;
  ctx.fillRect(0, y + h, CANVAS_WIDTH, 14);
  ctx.fillStyle = PALETTE.counterWoodDark;
  ctx.fillRect(0, y + h + 14, CANVAS_WIDTH, 6);
}

/** The big midnight order board with brass frame. */
export function drawOrderBoardFrame(ctx) {
  const b = STATIONS.orderBoard;
  ctx.fillStyle = PALETTE.brass;
  drawRoundRect(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.boardPanel;
  drawRoundRect(ctx, b.x, b.y, b.w, b.h, 8);
  ctx.fill();
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.accentSaffron;
  ctx.fillText('ORDER BOARD', b.x + 14, b.y + 22);
}

/** The pantry strip: a steel counter with every raw ingredient on a shelf spot. */
export function drawPantryStrip(ctx) {
  const p = PANTRY_STRIP;
  ctx.fillStyle = PALETTE.steel;
  drawRoundRect(ctx, p.x - 10, p.y - 6, p.w + 20, p.h + 10, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.steelLight;
  ctx.fillRect(p.x - 10, p.y - 6, p.w + 20, 8);
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.inkDark;
  ctx.fillText('PANTRY', p.x + 4, p.y - 14);
  for (const [key, kind] of Object.entries(INGREDIENT_KINDS)) {
    drawIngredientCrate(ctx, key, kind, kind.shelf.x, kind.shelf.y);
  }
}

/** One labelled crate holding a raw ingredient. */
function drawIngredientCrate(ctx, key, kind, x, y) {
  ctx.fillStyle = PALETTE.counterWood;
  drawRoundRect(ctx, x - 12, y - 14, 96, 64, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterWoodDark;
  ctx.fillRect(x - 12, y - 14, 96, 12);
  ctx.font = '11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.accentCream;
  ctx.fillText(kind.name.toUpperCase().slice(0, 14), x + 36, y - 3);
  drawIngredientIcon(ctx, key, x + 36, y + 30, 1.1);
}

/**
 * Food art. Every ingredient has its own hand-drawn canvas icon; the `state` suffix
 * (Chopped / Cooked) changes the look — slices for chopped, seared for cooked.
 */
export function drawIngredientIcon(ctx, stateKey, x, y, scale = 1) {
  const base = stateKey.replace(/(Chopped|Cooked)$/, '');
  const state = stateKey.endsWith('Chopped') ? 'chopped' : stateKey.endsWith('Cooked') ? 'cooked' : 'raw';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  switch (base) {
    case 'tomato':
      if (state === 'chopped') drawTomatoSlices(ctx);
      else drawWholeTomato(ctx);
      break;
    case 'mushroom':
      if (state === 'chopped') drawMushroomPieces(ctx);
      else drawWholeMushroom(ctx);
      break;
    case 'pepper':
      if (state === 'chopped') drawPepperRings(ctx);
      else drawWholePepper(ctx);
      break;
    case 'onion':
      if (state === 'chopped') drawOnionRings(ctx);
      else drawWholeOnion(ctx);
      break;
    case 'pasta':
      if (state === 'cooked') drawPastaNest(ctx, true);
      else drawPastaNest(ctx, false);
      break;
    case 'shrimp':
      if (state === 'cooked') drawShrimp(ctx, PALETTE.flameCore);
      else drawShrimp(ctx, PALETTE.shrimpCoral);
      break;
    case 'cheese':
      drawCheeseWedge(ctx);
      break;
    case 'garlic':
      if (state === 'chopped') drawGarlicBits(ctx);
      else drawGarlicBulb(ctx);
      break;
    default:
      ctx.fillStyle = PALETTE.accentCream;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
  }
  ctx.restore();
}

function drawWholeTomato(ctx) {
  ctx.fillStyle = PALETTE.tomatoRed;
  ctx.beginPath();
  ctx.arc(0, 2, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(-4, -3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.tomatoLeaf;
  ctx.beginPath();
  ctx.ellipse(0, -11, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTomatoSlices(ctx) {
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = PALETTE.tomatoRed;
    ctx.beginPath();
    ctx.arc(-10 + i * 10, i % 2 === 0 ? -3 : 4, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.tomatoLeaf;
    ctx.beginPath();
    ctx.arc(-10 + i * 10, i % 2 === 0 ? -3 : 4, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWholeMushroom(ctx) {
  ctx.fillStyle = PALETTE.mushroomCap;
  ctx.beginPath();
  ctx.arc(0, -2, 12, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = PALETTE.mushroomTan;
  ctx.fillRect(-4, -2, 8, 12);
}

function drawMushroomPieces(ctx) {
  ctx.fillStyle = PALETTE.mushroomCap;
  ctx.beginPath();
  ctx.arc(-7, -2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.mushroomTan;
  ctx.fillRect(2, -4, 9, 5);
  ctx.fillRect(1, 4, 7, 5);
}

function drawWholePepper(ctx) {
  ctx.fillStyle = PALETTE.pepperGreen;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 13, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.tomatoLeaf;
  ctx.fillRect(-2, -15, 4, 6);
}

function drawPepperRings(ctx) {
  for (let i = 0; i < 3; i += 1) {
    ctx.strokeStyle = PALETTE.pepperGreen;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-9 + i * 9, i % 2 === 0 ? 0 : -4, 5.5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawWholeOnion(ctx) {
  ctx.fillStyle = PALETTE.onionCream;
  ctx.beginPath();
  ctx.arc(0, 2, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.onionRing;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 4, 7, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.herbGreen;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(3, -18);
  ctx.stroke();
}

function drawOnionRings(ctx) {
  for (let i = 0; i < 3; i += 1) {
    ctx.strokeStyle = PALETTE.onionCream;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(-8 + i * 8, i % 2 === 0 ? 0 : -4, 5.5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPastaNest(ctx, cooked) {
  const color = cooked ? PALETTE.pastaGold : '#d9a63e';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.arc(0, 0, 4 + i * 3, 0.4 + i, Math.PI * 1.6 + i * 0.4);
    ctx.stroke();
  }
  if (cooked) {
    ctx.fillStyle = PALETTE.pastaSauce;
    ctx.beginPath();
    ctx.arc(0, -2, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawShrimp(ctx, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0.6, Math.PI * 1.8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.shrimpTail;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(6, -7);
  ctx.lineTo(12, -10);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 1, Math.PI * 1.6);
  ctx.stroke();
}

function drawCheeseWedge(ctx) {
  ctx.fillStyle = PALETTE.cheeseYellow;
  ctx.beginPath();
  ctx.moveTo(-13, 8);
  ctx.lineTo(13, 8);
  ctx.lineTo(8, -8);
  ctx.lineTo(-13, -2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc(-4, 2, 2, 0, Math.PI * 2);
  ctx.arc(5, 0, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawGarlicBulb(ctx) {
  ctx.fillStyle = PALETTE.garlicWhite;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.onionRing;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-4, -10);
  ctx.quadraticCurveTo(0, -16, 4, -10);
  ctx.stroke();
}

function drawGarlicBits(ctx) {
  ctx.fillStyle = PALETTE.garlicWhite;
  for (const [bx, by] of [[-7, -2], [0, 3], [7, -3]]) {
    ctx.beginPath();
    ctx.arc(bx, by, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A blue-plate with stacked food parts (used for the plate pass and the serve shot). */
export function drawPlatedDish(ctx, x, y, parts) {
  ctx.fillStyle = PALETTE.plateRim;
  ctx.beginPath();
  ctx.ellipse(x, y + 6, 64, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.plateWhite;
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 56, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  parts.forEach((part, index) => {
    drawIngredientIcon(ctx, part, x - 24 + index * 22, y - 4 - (index % 2) * 6, 0.85);
  });
}

/** Steam puffs above a hot pan or plate. */
export function drawSteam(ctx, x, y, time) {
  ctx.fillStyle = PALETTE.steamWhite;
  for (let i = 0; i < 3; i += 1) {
    const phase = time * 1.6 + i * 2.1;
    const px = x + Math.sin(phase) * 8;
    const py = y - ((time * 22 + i * 16) % 42);
    const r = 5 + (i % 2) * 3;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Flames under a pan, intensity by cooking state. */
export function drawFlames(ctx, x, y, intensity) {
  if (intensity <= 0) return;
  const height = 14 + intensity * 16;
  ctx.fillStyle = PALETTE.flameOuter;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + i * 9 - 5, y);
    ctx.quadraticCurveTo(x + i * 9, y - height * (1 - Math.abs(i) * 0.22), x + i * 9 + 5, y);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.flameCore;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + i * 10 - 4, y);
    ctx.quadraticCurveTo(x + i * 10, y - height * 0.6, x + i * 10 + 4, y);
    ctx.fill();
  }
}

/** Smoke for a burnt pan. */
export function drawSmoke(ctx, x, y, time) {
  ctx.fillStyle = PALETTE.smokeGrey;
  for (let i = 0; i < 4; i += 1) {
    const phase = time * 1.2 + i * 1.7;
    ctx.beginPath();
    ctx.arc(x + Math.sin(phase) * 10, y - ((time * 26 + i * 18) % 60), 8 + i, 0, Math.PI * 2);
    ctx.fill();
  }
}
