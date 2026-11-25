// The screenshot scenes: each named shot stages a believable mid-shift frame using the
// game's own state functions (order generator, burners, plate, scoring) plus a short
// live simulation so steam, flames and lamps are the real render. ?shot=cover|orders|
// assembly|serve (&seed=N) paints twice and sets window.__shotReady for the capturer.

import { createOrder } from './orders.js';
import { createRandom } from './random.js';
import { SCREEN_PLAY } from './render.js';
import { resetWorld } from './world.js';
import { placeOnBurner } from './stove.js';

/** Draw a "served!" toast and floating points, as a real serve would. */
function flashServeToast(world, text, points) {
  world.toast = text;
  world.toastTimer = 2.4;
  world.effects.push({ x: world.player.x, y: world.player.y - 50, text: `+${points}`, life: 0.9, fade: 0.9, rise: 30 });
}

/** Give a live order a specific patience (for legible, varied tickets). */
function withPatience(order, seconds) {
  order.patience = seconds;
  order.maxPatience = Math.max(order.maxPatience, seconds);
  return order;
}

/**
 * COVER — busy kitchen wide shot: three varied tickets, pasta done on stove 1 (steam),
 * shrimp partway on stove 2 (flames), mushrooms half-chopped, a two-part dish mid-assembly
 * on the plate, cook centre-floor carrying garlic, real score and combo on the HUD.
 */
export function stageCoverShot(world) {
  resetWorld(world);
  world.screen = SCREEN_PLAY;
  world.elapsed = 95;
  world.score = 480;
  world.combo = 3;
  world.bestCombo = 5;
  const random = createRandom(world.seed);
  world.board.orders = [
    withPatience(createOrder(1, random), 54),
    withPatience(createOrder(1, random), 33),
    withPatience(createOrder(1, random), 21),
  ];
  placeOnBurner(world, 0, 'pasta');
  world.burners[0].progress = 1;
  world.burners[0].grace = 0.4;
  placeOnBurner(world, 1, 'shrimp');
  world.burners[1].progress = 0.55;
  world.cutting.held = 'mushroom';
  world.cutting.progress = 0.5;
  world.plate.parts = ['tomatoChopped', 'cheese'];
  world.player.x = 640;
  world.player.y = 452;
  world.player.carry = 'garlic';
  world.player.facing = 1;
  return SCREEN_PLAY;
}

/**
 * ORDERS — the board at full pressure: five live tickets of mixed dishes, both stoves
 * running, a plate half built, the score climbing, combo streak active.
 */
export function stageOrdersShot(world) {
  resetWorld(world);
  world.screen = SCREEN_PLAY;
  world.elapsed = 130;
  world.score = 940;
  world.combo = 4;
  world.bestCombo = 6;
  const random = createRandom(world.seed + 7);
  world.board.orders = [
    withPatience(createOrder(2, random), 48),
    withPatience(createOrder(2, random), 36),
    withPatience(createOrder(2, random), 27),
    withPatience(createOrder(2, random), 17),
    withPatience(createOrder(2, random), 9),
  ];
  world.board.orders[4].cold = true;
  placeOnBurner(world, 0, 'pasta');
  world.burners[0].progress = 0.7;
  placeOnBurner(world, 1, 'shrimp');
  world.burners[1].progress = 0.25;
  world.plate.parts = ['onionChopped'];
  world.player.x = 400;
  world.player.y = 540;
  world.player.carry = 'pepper';
  world.player.facing = -1;
  return SCREEN_PLAY;
}

/**
 * ASSEMBLY — attention on the plating pass: a chopped-and-ready prep board, the dish
 * mid-assembly (tomato + cheese stacked), the cook beside the pass holding mushrooms.
 */
export function stageAssemblyShot(world) {
  resetWorld(world);
  world.screen = SCREEN_PLAY;
  world.elapsed = 62;
  world.score = 360;
  world.combo = 2;
  world.bestCombo = 3;
  const random = createRandom(world.seed + 13);
  world.board.orders = [
    withPatience(createOrder(1, random), 44),
    withPatience(createOrder(1, random), 29),
  ];
  // Make the top ticket the dish being built so the match reads at a glance.
  world.board.orders[0].name = 'Row Onion Melt';
  world.board.orders[0].parts = ['onionChopped', 'cheese', 'mushroomChopped'];
  placeOnBurner(world, 0, 'shrimp');
  world.burners[0].progress = 0.9;
  world.cutting.ready = 'mushroomChopped';
  world.plate.parts = ['tomatoChopped', 'cheese'];
  world.player.x = 1044;
  world.player.y = 545;
  world.player.carry = null;
  world.player.facing = -1;
  world.hint = 'plating pass';
  return SCREEN_PLAY;
}

/**
 * SERVE — the payoff frame: a completed Sun Tomato Bite steaming at the service window,
 * the bell glowing, a fresh "+240" flourish and the toast announcing the serve.
 */
export function stageServeShot(world) {
  resetWorld(world);
  world.screen = SCREEN_PLAY;
  world.elapsed = 48;
  world.score = 720;
  world.combo = 5;
  world.bestCombo = 5;
  const random = createRandom(world.seed + 21);
  world.board.orders = [
    withPatience(createOrder(1, random), 51),
    withPatience(createOrder(1, random), 34),
  ];
  placeOnBurner(world, 1, 'pasta');
  world.burners[1].progress = 0.35;
  world.plate.parts = ['tomatoChopped', 'cheese'];
  world.player.x = 820;
  world.player.y = 620;
  world.player.carry = null;
  world.player.facing = 1;
  world.hint = 'E: serve!';
  flashServeToast(world, 'Sun Tomato Bite served!', 240);
  return SCREEN_PLAY;
}

/** Dispatch used by main.js: stage the named scene (cover is the default). */
export function stageShot(name, world) {
  switch (name) {
    case 'orders':
      return stageOrdersShot(world);
    case 'assembly':
      return stageAssemblyShot(world);
    case 'serve':
      return stageServeShot(world);
    case 'cover':
    default:
      return stageCoverShot(world);
  }
}
