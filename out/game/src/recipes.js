// Recipes of Saffron Row — our own dishes and names. Each recipe lists the exact plated
// states it needs, in the order the plate stacks them. Difficulty weights steer the
// order generator toward harder recipes as the shift heats up.

export const RECIPES = {
  sunTomatoBite: {
    name: 'Sun Tomato Bite',
    icon: 'tomato',
    weight: 1,
    parts: ['tomatoChopped', 'cheese'],
  },
  mushroomRowPlate: {
    name: 'Mushroom Row Plate',
    icon: 'mushroom',
    weight: 1,
    parts: ['mushroomChopped', 'pepperChopped'],
  },
  harborSkillet: {
    name: 'Harbor Skillet',
    icon: 'shrimp',
    weight: 2,
    parts: ['shrimpCooked', 'garlicChopped'],
  },
  midnightPastaRow: {
    name: 'Midnight Pasta Row',
    icon: 'pasta',
    weight: 2,
    parts: ['pastaCooked', 'tomatoChopped', 'cheese'],
  },
  rowOnionMelt: {
    name: 'Row Onion Melt',
    icon: 'onion',
    weight: 2,
    parts: ['onionChopped', 'cheese', 'mushroomChopped'],
  },
  saffronFeastPlate: {
    name: 'Saffron Feast Plate',
    icon: 'star',
    weight: 3,
    parts: ['shrimpCooked', 'pastaCooked', 'pepperChopped', 'garlicChopped'],
  },
};

/** Simple two-part dishes to open the shift with. */
export const EASY_RECIPE_KEYS = ['sunTomatoBite', 'mushroomRowPlate'];
/** Mid dishes once the rush starts. */
export const MID_RECIPE_KEYS = ['harborSkillet', 'midnightPastaRow', 'rowOnionMelt'];
/** The showcase dish for peak hour. */
export const HARD_RECIPE_KEYS = ['saffronFeastPlate'];

/** Human-readable list of parts for a ticket card. */
export function recipePartsLabel(recipe) {
  return recipe.parts.map((part) => part.replace(/(Chopped|Cooked)$/, (m) => ` ${m.toLowerCase()}`)).join(' + ');
}
