// Plate assembly and serving: stacking prepped parts on the plate, matching against the
// order board, and scoring with the combo streak. One job — turning prepared food into points.

import { SCORE_BURN_PENALTY, SCORE_COLD_PENALTY, SCORE_PER_COMBO, SCORE_PER_ORDER } from './config.js';
import { EVENT_COLD, EVENT_SERVE, pushEffect, pushToast } from './world.js';
import { findMatchingOrder, removeOrder } from './orders.js';
import { COMBO_TIERS } from './config.js';

/** Add a prepped part to the plate (order of stacking is the plate's look). */
export function addPartToPlate(world, partKey) {
  world.plate.parts.push(partKey);
  world.plate.ready = world.plate.parts.length > 0;
}

/** Clear the plate completely (after serving or a wrong plate). */
export function clearPlate(world) {
  world.plate.parts = [];
  world.plate.ready = false;
}

/** Current combo tier label for the HUD. */
export function comboLabel(combo) {
  let label = COMBO_TIERS[0].label;
  for (const tier of COMBO_TIERS) {
    if (combo >= tier.at) label = tier.label;
  }
  return label;
}

/** Multiplier the combo earns on each serve (1 + 0.1 per streak step, capped at 2). */
export function comboMultiplier(combo) {
  return Math.min(2, 1 + combo * 0.1);
}

/**
 * Try to serve the current plate at the service window. Returns an event bitmask.
 * A perfect match scores with the combo multiplier; a wrong plate just bounces.
 */
export function servePlate(world) {
  const match = findMatchingOrder(world.board, world.plate.parts);
  if (!match) {
    pushToast(world, 'That is not on any ticket!');
    return 0;
  }
  const events = EVENT_SERVE;
  if (match.cold) {
    world.score = Math.max(0, world.score - SCORE_COLD_PENALTY);
    world.combo = 0;
    pushToast(world, `${match.name} went cold...`);
    pushEffect(world, { x: world.player.x, y: world.player.y - 50, text: `-${SCORE_COLD_PENALTY}`, fade: 1 });
    world.board.coldCount += 1;
  } else {
    const points = Math.round((SCORE_PER_ORDER + SCORE_PER_COMBO * match.parts.length) * comboMultiplier(world.combo));
    world.score += points;
    world.combo += 1;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    pushToast(world, `${match.name} served! +${points}`);
    pushEffect(world, { x: world.player.x, y: world.player.y - 50, text: `+${points}`, fade: 0.9 });
  }
  world.board.servedCount += 1;
  removeOrder(world.board, match.id);
  clearPlate(world);
  return events;
}

/** Penalize throwing away a burnt pan. */
export function penalizeBurn(world) {
  world.score = Math.max(0, world.score - SCORE_BURN_PENALTY);
  world.combo = 0;
  pushToast(world, `Burned pan binned. -${SCORE_BURN_PENALTY}`);
  pushEffect(world, { x: world.player.x, y: world.player.y - 50, text: `-${SCORE_BURN_PENALTY}`, fade: 1 });
}

/** A ticket that fully expired was removed by the board; account for it here. */
export function noteColdTicket(world) {
  world.combo = 0;
  pushEffect(world, { x: 200, y: 230, text: 'ticket cold!', fade: 1 });
  return EVENT_COLD;
}
