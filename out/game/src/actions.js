// Interactions: the E-key action at whichever station the cook stands near. This module
// owns pickup/place logic for pantry, chopping block, stoves, plate pass and window.

import { KEY_INTERACT } from './config.js';
import { addPartToPlate, clearPlate, penalizeBurn, servePlate } from './assembly.js';
import { INGREDIENT_KINDS, CHOPPABLE, COOKABLE } from './ingredients.js';
import { nearestStation } from './stations.js';
import { clearBurner, liftFromBurner, placeOnBurner } from './stove.js';
import { pushToast } from './world.js';

/** Everything the cook can do with E, dispatched by the station they stand at. */
export function interactAtStation(world) {
  const player = world.player;
  const station = nearestStation(player.x, player.y, 90);
  if (!station) return 0;
  switch (station) {
    case 'orderBoard':
      return 0; // board is read-only; tickets are picked up by matching, not by hand
    case 'prepBoard':
      return 0;
    case 'choppingBlock':
      return interactChoppingBlock(world);
    case 'stoveLeft':
      return interactStove(world, 0);
    case 'stoveRight':
      return interactStove(world, 1);
    case 'platingCounter':
      return interactPlating(world);
    case 'servingWindow':
      return servePlate(world);
    default:
      return 0;
  }
}

/** E at the pantry strip: pick up the nearest raw ingredient (unless hands are full). */
export function pickFromPantry(world, ingredientKey) {
  if (world.player.carry) {
    pushToast(world, 'Hands full!');
    return 0;
  }
  if (!INGREDIENT_KINDS[ingredientKey]) return 0;
  world.player.carry = ingredientKey;
  return 0;
}

/** E at the chopping block: place carry, or pick up the finished chop. */
function interactChoppingBlock(world) {
  const cutting = world.cutting;
  const carry = world.player.carry;
  if (cutting.ready) {
    if (world.player.carry) {
      pushToast(world, 'Hands full!');
      return 0;
    }
    world.player.carry = cutting.ready;
    cutting.ready = null;
    return 0;
  }
  if (cutting.held) {
    pushToast(world, 'Still chopping — hold E!');
    return 0;
  }
  if (carry && CHOPPABLE.includes(carry)) {
    cutting.held = carry;
    cutting.progress = 0.0001;
    world.player.carry = null;
    return 0;
  }
  if (carry) pushToast(world, 'That needs no chopping.');
  return 0;
}

/** E at a stove: put a cookable on, lift a done dish, or bin a burnt pan. */
function interactStove(world, burnerIndex) {
  const burner = world.burners[burnerIndex];
  const carry = world.player.carry;
  if (burner.occupant && burner.burnt) {
    clearBurner(world, burnerIndex);
    penalizeBurn(world);
    return 0;
  }
  if (burner.occupant && burner.progress >= 1) {
    const cooked = liftFromBurner(world, burnerIndex);
    if (cooked) {
      if (world.player.carry) {
        pushToast(world, 'Hands full!');
        placeOnBurner(world, burnerIndex, cooked.slice(0, -'Cooked'.length));
        // Restore done state instantly (rare hands-full case).
        const b = world.burners[burnerIndex];
        b.progress = 1;
        b.grace = 99;
        return 0;
      }
      world.player.carry = cooked;
      pushToast(world, 'Picked up the pan.');
      return 0;
    }
    return 0;
  }
  if (!burner.occupant && carry && COOKABLE.includes(carry)) {
    world.player.carry = null;
    placeOnBurner(world, burnerIndex, carry);
    pushToast(world, 'On the stove!');
    return 0;
  }
  if (!burner.occupant && carry) pushToast(world, 'That cannot be cooked.');
  if (burner.occupant && burner.progress < 1) pushToast(world, 'Still cooking...');
  return 0;
}

/** E at the plating pass: stack the carried part, or wipe the plate with trash. */
function interactPlating(world) {
  const carry = world.player.carry;
  if (carry && carry.endsWith('Chopped') || carry && carry.endsWith('Cooked') || carry === 'cheese') {
    addPartToPlate(world, carry);
    world.player.carry = null;
    pushToast(world, 'Plated.');
    return 0;
  }
  if (carry) {
    pushToast(world, 'Prep it first (chop or cook).');
    return 0;
  }
  if (world.plate.parts.length > 0) {
    clearPlate(world);
    pushToast(world, 'Plate wiped clean.');
    return 0;
  }
  return 0;
}

/** Human-readable hint of what E would do right now (shown above the cook). */
export function currentHint(world) {
  const player = world.player;
  const station = nearestStation(player.x, player.y, 90);
  const carry = player.carry;
  if (!station) return carry ? `carrying ${carry}` : null;
  switch (station) {
    case 'choppingBlock':
      if (world.cutting.ready) return 'E: take chopped';
      if (world.cutting.held) return 'hold E: chop';
      if (carry && CHOPPABLE.includes(carry)) return 'E: place to chop';
      return 'chopping block';
    case 'stoveLeft':
    case 'stoveRight': {
      const burner = world.burners[station === 'stoveLeft' ? 0 : 1];
      if (burner.burnt) return 'E: bin burnt pan';
      if (burner.occupant && burner.progress >= 1) return 'E: take pan';
      if (burner.occupant) return 'cooking...';
      if (carry && COOKABLE.includes(carry)) return 'E: cook it';
      return 'stove';
    }
    case 'platingCounter':
      if (carry) return 'E: plate it';
      if (world.plate.parts.length) return 'E: wipe plate';
      return 'plating pass';
    case 'servingWindow':
      if (world.plate.parts.length) return 'E: serve!';
      return 'service window';
    default:
      return null;
  }
}
