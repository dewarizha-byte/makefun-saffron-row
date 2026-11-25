// Kitchen state and the shift loop: the player, the cutting block, two stoves, the plate
// being assembled, and the shift clock. World holds state; the rules live in stations.js
// (interactions) and assembly.js (plate scoring), so each file has one clear job.

import { SHIFT_SECONDS } from './config.js';
import { createRandom } from './random.js';
import { createOrderBoard, difficultyTierFor, updateOrderBoard } from './orders.js';
import { PLAYER_START } from './stations.js';
import { updateBurners } from './stove.js';

/** The two stove burners start empty. */
function createBurner() {
  return { occupant: null, progress: 0, burnt: false };
}

/** One full fresh world. `seed` keeps screenshot scenes reproducible. */
export function createWorld(seed) {
  return {
    seed,
    screen: 'title',
    paused: false,
    time: 0,
    elapsed: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    board: createOrderBoard(createRandom(seed)),
    player: { x: PLAYER_START.x, y: PLAYER_START.y, carry: null, facing: 1, walkPhase: 0 },
    cutting: { held: null, progress: 0, ready: null },
    burners: [createBurner(), createBurner()],
    plate: { parts: [], ready: false },
    trashFlash: 0,
    toast: null,
    toastTimer: 0,
    effects: [],
  };
}

/** Reset everything for a brand new shift. */
export function resetWorld(world) {
  const fresh = createWorld(world.seed);
  Object.assign(world, fresh);
  world.screen = 'play';
}

/** Show a short HUD toast message ("Sun Tomato Bite served!"). */
export function pushToast(world, text) {
  world.toast = text;
  world.toastTimer = 2.4;
}

/** Spawn a floating effect particle (steam puff, spark, score pop). */
export function pushEffect(world, effect) {
  world.effects.push({ life: 1, ...effect });
}

/** Events the main loop turns into sounds and score changes. */
export const EVENT_SERVE = 1;
export const EVENT_BURN = 2;
export const EVENT_COLD = 4;
export const EVENT_CHOP = 8;
export const EVENT_DONE = 16;

/**
 * Advance the world one fixed step with the current input snapshot. Returns an event
 * bitmask (EVENT_* above) so audio.js can react without knowing the rules.
 */
export function stepWorld(world, dt, input, interactPressed) {
  let events = 0;
  world.time += dt;
  if (world.screen !== 'play' || world.paused) return events;

  world.elapsed += dt;
  if (world.elapsed >= SHIFT_SECONDS) {
    world.screen = 'over';
    return events;
  }

  events |= updateOrderBoard(world.board, world.elapsed, dt);
  events |= updatePlayer(world, dt, input);
  events |= updateChopping(world, dt, input, interactPressed);
  events |= updateBurners(world, dt);
  updateEffects(world, dt);
  updateToast(world, dt);
  return events;
}

/** Player movement and facing; carrying does not slow the cook down. */
function updatePlayer(world, dt, input) {
  const player = world.player;
  const speed = 260;
  let vx = 0;
  let vy = 0;
  if (input.left) vx -= 1;
  if (input.right) vx += 1;
  if (input.up) vy -= 1;
  if (input.down) vy += 1;
  if (vx !== 0 || vy !== 0) {
    const len = Math.hypot(vx, vy);
    player.x += (vx / len) * speed * dt;
    player.y += (vy / len) * speed * dt;
    player.walkPhase += dt * 10;
    if (vx !== 0) player.facing = vx > 0 ? 1 : -1;
  }
  player.x = Math.max(50, Math.min(1230, player.x));
  player.y = Math.max(420, Math.min(560, player.y));
  return 0;
}

/**
 * Chopping block: standing at the block with a raw choppable ingredient and holding
 * interact fills the chop progress; finishing flips it to the chopped state.
 */
function updateChopping(world, dt, input, interactPressed) {
  const cutting = world.cutting;
  const player = world.player;
  const atBlock = player.x > 980 && player.x < 1260 && player.y < 560;
  if (cutting.held && atBlock && input.interact) {
    cutting.progress = Math.min(1, cutting.progress + dt / 2.2);
    if (cutting.progress >= 1) {
      cutting.ready = `${cutting.held}Chopped`;
      cutting.held = null;
      cutting.progress = 0;
      pushToast(world, 'Chopped and ready!');
      pushEffect(world, { x: player.x, y: player.y - 40, text: '+chop', fade: 1.4 });
      return EVENT_CHOP;
    }
  } else if (!cutting.held && cutting.progress > 0) {
    cutting.progress = 0;
  }
  return 0;
}

/** Effects fade and drift upward. */
function updateEffects(world, dt) {
  for (const effect of world.effects) {
    effect.life -= dt * (effect.fade ?? 1);
    if (effect.rise) effect.y -= effect.rise * dt;
  }
  world.effects = world.effects.filter((effect) => effect.life > 0);
}

/** Toast timer. */
function updateToast(world, dt) {
  if (world.toastTimer > 0) {
    world.toastTimer -= dt;
    if (world.toastTimer <= 0) world.toast = null;
  }
}

/** Difficulty tier of the current moment, for HUD. */
export function currentDifficulty(world) {
  return difficultyTierFor(world.elapsed);
}

/** Seconds left in the shift. */
export function shiftSecondsLeft(world) {
  return Math.max(0, SHIFT_SECONDS - world.elapsed);
}
