// Kitchen geography: every station's rectangle in canvas space, plus hit-testing helpers.
// Layout (1280x720): order board top-left, prep board top-right, counters and pantry mid,
// stoves bottom-left, plate pass bottom-right. Player walks the floor between them.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';

/** Rectangles in canvas pixels. Named so the render layer and the rules share one map. */
export const STATIONS = {
  orderBoard: { x: 36, y: 40, w: 330, h: 190, label: 'Order Board' },
  prepBoard: { x: 760, y: 36, w: 240, h: 96, label: 'Prep Board' },
  choppingBlock: { x: 1030, y: 40, w: 210, h: 96, label: 'Chopping Block' },
  stoveLeft: { x: 60, y: 596, w: 200, h: 104, label: 'Stove 1' },
  stoveRight: { x: 300, y: 596, w: 200, h: 104, label: 'Stove 2' },
  platingCounter: { x: 980, y: 596, w: 260, h: 104, label: 'Plating Pass' },
  servingWindow: { x: 700, y: 596, w: 240, h: 104, label: 'Service Window' },
};

/** The pantry shelf strip along the middle counter where raw ingredients sit. */
export const PANTRY_STRIP = { x: 60, y: 480, w: CANVAS_WIDTH - 120, h: 90 };

/** Player spawn point, centre floor. */
export const PLAYER_START = { x: CANVAS_WIDTH / 2, y: 430 };

/** Walkable floor band (the player never leaves it). */
export const FLOOR_BAND = { top: 420, bottom: 560 };

/** Rectangle-vs-point hit test. */
export function pointInRect(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/** Which station a point stands on, or null. */
export function stationAt(x, y) {
  for (const [key, rect] of Object.entries(STATIONS)) {
    if (pointInRect(rect, x, y)) return key;
  }
  return null;
}

/** Nearest station within `radius` px of a point, or null (used by the interact key). */
export function nearestStation(x, y, radius = 70) {
  let best = null;
  let bestDist = radius;
  for (const [key, rect] of Object.entries(STATIONS)) {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const dist = Math.hypot(x - cx, y - cy);
    if (dist < bestDist) {
      best = key;
      bestDist = dist;
    }
  }
  return best;
}

/** Pantry shelf slot for an ingredient key (from ingredients.js shelf coords). */
export function pantrySlotFor(shelf) {
  return { x: shelf.x, y: shelf.y, w: 110, h: 84 };
}
