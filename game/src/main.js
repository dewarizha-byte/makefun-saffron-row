// Boot and the one loop: input polled every frame, the world advances in fixed 1/60 s
// steps, the renderer paints, audio reacts to world events. Screens: title → play →
// paused/over → play. ?shot=cover|orders|assembly|serve stages a screenshot scene.

import { BEST_KEY, STEP } from './config.js';
import { currentHint, interactAtStation, pickFromPantry } from './actions.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { createWorld, EVENT_BURN, EVENT_COLD, EVENT_DONE, EVENT_SERVE, resetWorld, stepWorld } from './world.js';
import { PANTRY_STRIP } from './stations.js';
import { INGREDIENT_KINDS } from './ingredients.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 20261125;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(seed);
world.best = readBest();
const renderer = createRenderer(canvas);
const input = createInput();
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Private windows: the best then lasts this visit only.
  }
}

/** Pantry strip proximity: which raw ingredient the cook stands behind (for E grabs). */
function pantryIngredientNear(world) {
  const p = world.player;
  if (p.y >= 440 && p.y <= 590) {
    let best = null;
    let bestDist = 70;
    for (const [key, kind] of Object.entries(INGREDIENT_KINDS)) {
      const dist = Math.abs(p.x - (kind.shelf.x + 36));
      if (dist < bestDist) {
        best = key;
        bestDist = dist;
      }
    }
    return best;
  }
  return null;
}

/** React to a step's event bitmask with sound. */
function playEvents(events) {
  if (events & EVENT_SERVE) audio.playServe(world.combo);
  if (events & EVENT_BURN) audio.playBurn();
  if (events & EVENT_COLD) audio.playCold();
  if (events & EVENT_DONE) audio.playDone();
}

/** One fixed step of play: world rules, interact edge, hints, sounds. */
function tickPlay() {
  const events = stepWorld(world, STEP, input, input.interactPressed);
  // E at the pantry strip grabs an ingredient when the cook stands behind the shelf.
  if (input.interactPressed) {
    const pantryKey = pantryIngredientNear(world);
    if (pantryKey && !world.player.carry) {
      pickFromPantry(world, pantryKey);
      audio.playChop();
    } else {
      const actionEvents = interactAtStation(world);
      playEvents(actionEvents);
    }
  }
  playEvents(events);
  world.hint = currentHint(world);
  if (world.screen === SCREEN_OVER) saveBest(Math.max(world.best, world.score));
}

/** The main loop: catch up in fixed steps, then paint once. */
function frame() {
  if (world.screen === SCREEN_TITLE) {
    if (input.startPressed) {
      resetWorld(world);
      audio.playConfirm();
    }
  } else if (input.pausePressed && (world.screen === SCREEN_PLAY || world.screen === SCREEN_PAUSED)) {
    world.paused = !world.paused;
    world.screen = world.paused ? SCREEN_PAUSED : SCREEN_PLAY;
    audio.playConfirm();
  } else if (world.screen === SCREEN_OVER && input.startPressed) {
    world.best = Math.max(world.best, world.score);
    saveBest(world.best);
    resetWorld(world);
    audio.playConfirm();
  } else if (world.screen === SCREEN_PLAY) {
    tickPlay();
  }
  input.poll();
  input.consume();
  renderer.draw(world, world.screen);
  status.textContent = world.screen === SCREEN_PLAY
    ? `Saffron Row: score ${world.score}, combo ${world.combo}, ${Math.max(0, Math.round(240 - world.elapsed))} seconds left`
    : `Saffron Row: ${world.screen}`;
  requestAnimationFrame(frame);
}

/**
 * Screenshot mode: stage the scene, paint twice (fonts and lamps settle), set __shotReady.
 * The headless capturer on serve.ts's page waits for that flag, then saves the JPEG.
 */
function runShot(name) {
  world.screen = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, world.screen);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

if (shot) {
  runShot(shot);
} else {
  requestAnimationFrame(frame);
}
