// The order board: generates ticket orders with escalating difficulty, tracks each
// ticket's patience, and flags cold orders. The board is the pressure engine of the game.

import { ORDERS_MAX, ORDERS_START, ORDER_PATIENCE_BASE, ORDER_PATIENCE_TIER_DROP } from './config.js';
import { EASY_RECIPE_KEYS, HARD_RECIPE_KEYS, MID_RECIPE_KEYS, RECIPES } from './recipes.js';

let ticketCounter = 0;

/** Difficulty tier for a shift-elapsed time: 0 Early Service through 3 Closing Time. */
export function difficultyTierFor(elapsed) {
  if (elapsed >= 160) return 3;
  if (elapsed >= 100) return 2;
  if (elapsed >= 45) return 1;
  return 0;
}

/** Recipe pool weighted by difficulty: harder dishes enter as the shift ages. */
export function recipePoolFor(tier) {
  if (tier === 0) return EASY_RECIPE_KEYS.slice();
  if (tier === 1) return EASY_RECIPE_KEYS.concat(MID_RECIPE_KEYS);
  return EASY_RECIPE_KEYS.concat(MID_RECIPE_KEYS, HARD_RECIPE_KEYS);
}

/** Draw one recipe key from the pool, respecting each recipe's weight. */
export function drawRecipeKey(pool, random) {
  const weighted = [];
  for (const key of pool) {
    const recipe = RECIPES[key];
    if (!recipe) continue;
    for (let i = 0; i < recipe.weight; i += 1) weighted.push(key);
  }
  return random.pick(weighted);
}

/** Create one live order ticket with its patience clock. */
export function createOrder(tier, random) {
  ticketCounter += 1;
  const pool = recipePoolFor(tier);
  const key = drawRecipeKey(pool, random);
  const recipe = RECIPES[key];
  return {
    id: ticketCounter,
    recipeKey: key,
    name: recipe.name,
    icon: recipe.icon,
    parts: recipe.parts.slice(),
    patience: Math.max(30, ORDER_PATIENCE_BASE - tier * ORDER_PATIENCE_TIER_DROP),
    maxPatience: Math.max(30, ORDER_PATIENCE_BASE - tier * ORDER_PATIENCE_TIER_DROP),
    cold: false,
    spawnElapsed: 0,
  };
}

/** Create the board state: the first tickets and the spawn timer. */
export function createOrderBoard(random) {
  return {
    orders: [],
    spawnTimer: 2,
    random,
    servedCount: 0,
    coldCount: 0,
  };
}

/** Tick the board: patience drains, cold flags flip, new tickets arrive. */
export function updateOrderBoard(board, elapsed, dt) {
  const tier = difficultyTierFor(elapsed);
  for (const order of board.orders) {
    order.patience -= dt;
    if (order.patience <= 0 && !order.cold) order.cold = true;
  }
  board.spawnTimer -= dt;
  const shouldSpawn = board.spawnTimer <= 0 && board.orders.length < Math.min(ORDERS_MAX, ORDERS_START + tier);
  if (shouldSpawn) {
    board.orders.push(createOrder(tier, board.random));
    board.spawnTimer = tier === 0 ? 16 : tier === 1 ? 12 : 9;
  }
  return board;
}

/** Remove a fulfilled or failed order from the board by id. */
export function removeOrder(board, orderId) {
  const index = board.orders.findIndex((order) => order.id === orderId);
  if (index >= 0) board.orders.splice(index, 1);
}

/** True when a plate's stacked parts exactly match a live order's recipe. */
export function findMatchingOrder(board, plateParts) {
  if (plateParts.length === 0) return null;
  const plateKey = plateParts.slice().sort().join('|');
  for (const order of board.orders) {
    const orderKey = order.parts.slice().sort().join('|');
    if (orderKey === plateKey) return order;
  }
  return null;
}

/** Most urgent ticket (lowest patience), for HUD highlighting. */
export function mostUrgentOrder(board) {
  let urgent = null;
  for (const order of board.orders) {
    if (!urgent || order.patience < urgent.patience) urgent = order;
  }
  return urgent;
}
