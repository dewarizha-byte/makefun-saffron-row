// Core tuning constants for Saffron Row. Every module reads sizes and pacing from here
// so the whole kitchen stays one coherent 1280x720 canvas.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

/** Fixed simulation step; the loop runs several of these per real frame when catching up. */
export const STEP = 1 / 60;

/** How long one serving shift lasts, in seconds of play time. */
export const SHIFT_SECONDS = 240;

/** Starting and maximum simultaneous orders on the board. */
export const ORDERS_START = 2;
export const ORDERS_MAX = 5;

/** Order patience: base seconds before an order goes cold, minus per difficulty tier. */
export const ORDER_PATIENCE_BASE = 70;
export const ORDER_PATIENCE_TIER_DROP = 6;

/** Seconds of chopping to finish prepping an ingredient. */
export const CHOP_SECONDS = 2.2;

/** Stove cooking: seconds to done, then seconds from done to burnt. */
export const COOK_SECONDS = 4.0;
export const BURN_SECONDS = 5.0;

/** Player movement speed in pixels per second. */
export const PLAYER_SPEED = 260;

/** Scoring: per completed order, per combo step, and penalties for burned or cold plates. */
export const SCORE_PER_ORDER = 120;
export const SCORE_PER_COMBO = 40;
export const SCORE_BURN_PENALTY = 60;
export const SCORE_COLD_PENALTY = 40;

/** Combo streak: consecutive perfect servings needed for the next combo tier name. */
export const COMBO_TIERS = [
  { at: 0, label: 'Warm-up' },
  { at: 3, label: 'On a Roll' },
  { at: 5, label: 'Row Cook' },
  { at: 8, label: 'Saffron Star' },
  { at: 12, label: 'Midnight Legend' },
];

/** Difficulty ramp: the shift clock time (seconds elapsed) each tier begins. */
export const DIFFICULTY_TIERS = [0, 45, 100, 160];
export const DIFFICULTY_NAMES = ['Early Service', 'Dinner Rush', 'Peak Hour', 'Closing Time'];

/** localStorage key for the best shift score. */
export const BEST_KEY = 'saffron-row-best';

/** Keyboard bindings, named for what they trigger. */
export const KEY_INTERACT = 'KeyE';
export const KEY_PAUSE = 'KeyP';
export const KEY_START = 'Enter';
