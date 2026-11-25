// Stove rules: taking a cookable ingredient onto a burner, cooking it to done, and the
// burn risk when the cook leaves a pan unattended past done. Burnt food must be binned.

import { BURN_SECONDS, COOK_SECONDS } from './config.js';
import { EVENT_BURN, EVENT_DONE, pushToast } from './world.js';

/**
 * Tick both burners. Each holds at most one ingredient:
 *   progress < 1  → cooking, steam rises
 *   progress == 1 → perfectly cooked, short grace before the risk starts
 *   burnt         → smoke, penalty on binning, cannot be plated
 */
export function updateBurners(world, dt) {
  let events = 0;
  for (const burner of world.burners) {
    if (!burner.occupant) continue;
    if (!burner.burnt) {
      burner.progress += dt / COOK_SECONDS;
      if (burner.progress >= 1) {
        burner.progress = 1;
        burner.grace = (burner.grace ?? 0) + dt;
        if (burner.grace > 1.0) events |= EVENT_DONE;
        if ((burner.grace ?? 0) >= BURN_SECONDS / COOK_SECONDS) {
          burner.burnt = true;
          pushToast(world, 'Pan burned! Bin it and retry.');
          events |= EVENT_BURN;
        }
      }
    }
  }
  return events;
}

/** Place a raw cookable onto a free burner; returns true when it took. */
export function placeOnBurner(world, burnerIndex, ingredientKey) {
  const burner = world.burners[burnerIndex];
  if (!burner || burner.occupant) return false;
  burner.occupant = ingredientKey;
  burner.progress = 0;
  burner.burnt = false;
  burner.grace = 0;
  return true;
}

/** Lift the cooked result off a burner (only when done and not burnt). */
export function liftFromBurner(world, burnerIndex) {
  const burner = world.burners[burnerIndex];
  if (!burner || !burner.occupant) return null;
  if (burner.burnt || burner.progress < 1) return null;
  const key = `${burner.occupant}Cooked`;
  burner.occupant = null;
  burner.progress = 0;
  burner.burnt = false;
  burner.grace = 0;
  return key;
}

/** Bin a burnt pan (or abandon a cooking one) — clears the burner. */
export function clearBurner(world, burnerIndex) {
  const burner = world.burners[burnerIndex];
  if (!burner || !burner.occupant) return false;
  const wasBurnt = burner.burnt;
  burner.occupant = null;
  burner.progress = 0;
  burner.burnt = false;
  burner.grace = 0;
  return wasBurnt;
}

/** Display state of a burner for the renderer and HUD hints. */
export function burnerStatus(burner) {
  if (!burner.occupant) return 'empty';
  if (burner.burnt) return 'burnt';
  if (burner.progress >= 1) return 'done';
  return 'cooking';
}
