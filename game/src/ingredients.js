// The pantry of Saffron Row: every ingredient the kitchen stocks, its pantry shelf spot,
// whether it must be chopped, and whether it goes to the stove. Names are our own.

import { PALETTE } from './palette.js';

export const INGREDIENT_KINDS = {
  tomato: {
    name: 'Tomato',
    chop: true,
    cook: false,
    color: PALETTE.tomatoRed,
    shelf: { x: 92, y: 512 },
  },
  mushroom: {
    name: 'Mushroom',
    chop: true,
    cook: false,
    color: PALETTE.mushroomCap,
    shelf: { x: 232, y: 512 },
  },
  pepper: {
    name: 'Green Peppercorn',
    chop: true,
    cook: false,
    color: PALETTE.pepperGreen,
    shelf: { x: 372, y: 512 },
  },
  onion: {
    name: 'Row Onion',
    chop: true,
    cook: false,
    color: PALETTE.onionCream,
    shelf: { x: 512, y: 512 },
  },
  pasta: {
    name: 'Golden Pasta',
    chop: false,
    cook: true,
    color: PALETTE.pastaGold,
    shelf: { x: 652, y: 512 },
  },
  shrimp: {
    name: 'Harbor Shrimp',
    chop: false,
    cook: true,
    color: PALETTE.shrimpCoral,
    shelf: { x: 792, y: 512 },
  },
  cheese: {
    name: 'Old Row Cheese',
    chop: false,
    cook: false,
    color: PALETTE.cheeseYellow,
    shelf: { x: 932, y: 512 },
  },
  garlic: {
    name: 'Smoked Garlic',
    chop: true,
    cook: false,
    color: PALETTE.garlicWhite,
    shelf: { x: 1072, y: 512 },
  },
};

/** Pantry order, used when a recipe asks for any ingredient list. */
export const INGREDIENT_LIST = Object.keys(INGREDIENT_KINDS);

/** Everything that can ride a stove pan. */
export const COOKABLE = INGREDIENT_LIST.filter((key) => INGREDIENT_KINDS[key].cook);
/** Everything a knife can prep. */
export const CHOPPABLE = INGREDIENT_LIST.filter((key) => INGREDIENT_KINDS[key].chop);

/** The ingredient an ingredient becomes after its prep step (visual + identity). */
export function preppedName(key) {
  return `${key}Chopped`;
}

/** Full display name of an ingredient state, prepped or raw. */
export function ingredientDisplayName(stateKey) {
  if (stateKey.endsWith('Chopped')) {
    const base = stateKey.slice(0, -'Chopped'.length);
    return `${INGREDIENT_KINDS[base]?.name ?? base}, chopped`;
  }
  if (stateKey.endsWith('Cooked')) {
    const base = stateKey.slice(0, -'Cooked'.length);
    return `${INGREDIENT_KINDS[base]?.name ?? base}, cooked`;
  }
  return INGREDIENT_KINDS[stateKey]?.name ?? stateKey;
}

/** Short label drawn on HUD chips and tickets. */
export function ingredientShortLabel(stateKey) {
  const base = stateKey.replace(/(Chopped|Cooked)$/, '');
  const kind = INGREDIENT_KINDS[base];
  const mark = stateKey.endsWith('Chopped') ? ' (chopped)' : stateKey.endsWith('Cooked') ? ' (cooked)' : '';
  return `${kind?.name ?? base}${mark}`;
}

/** The color used to draw an ingredient state (prepped foods keep their base color). */
export function ingredientColor(stateKey) {
  return INGREDIENT_KINDS[stateKey.replace(/(Chopped|Cooked)$/, '')]?.color ?? PALETTE.accentCream;
}
