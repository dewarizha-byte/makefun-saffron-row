// Keyboard state: arrow/WASD movement, E to interact, P to pause, Enter to start or restart.
// Input is polled every frame; the interact press is edge-detected so one tap does one action.

import { KEY_INTERACT, KEY_PAUSE, KEY_START } from './config.js';

/** Build the live input snapshot holder. */
export function createInput() {
  const held = new Set();
  const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    interact: false,
    interactPressed: false,
    pausePressed: false,
    startPressed: false,
  };

  const MOVE_KEYS = {
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
  };

  window.addEventListener('keydown', (event) => {
    if (event.code in MOVE_KEYS) {
      held.add(MOVE_KEYS[event.code]);
      event.preventDefault();
    }
    if (event.code === KEY_INTERACT) {
      input.interact = true;
      event.preventDefault();
    }
    if (event.code === KEY_PAUSE || event.code === KEY_START) event.preventDefault();
  });

  window.addEventListener('keyup', (event) => {
    if (event.code in MOVE_KEYS) held.delete(MOVE_KEYS[event.code]);
    if (event.code === KEY_INTERACT) input.interact = false;
  });

  /** Track keydown edges for one-shot actions (interact tap, pause, start). */
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (event.code === KEY_INTERACT) input.interactPressed = true;
    if (event.code === KEY_PAUSE) input.pausePressed = true;
    if (event.code === KEY_START) input.startPressed = true;
  });

  /** Refresh the per-frame derived booleans from the held set. */
  input.poll = function poll() {
    input.left = held.has('left');
    input.right = held.has('right');
    input.up = held.has('up');
    input.down = held.has('down');
  };

  /** Consume the one-shot presses (edge events) after the world used them. */
  input.consume = function consume() {
    input.interactPressed = false;
    input.pausePressed = false;
    input.startPressed = false;
  };

  return input;
}

/** Drive the input from code — used by the screenshot autopilot, not by human play. */
export function setVirtualInput(input, partial) {
  input.left = partial.left ?? false;
  input.right = partial.right ?? false;
  input.up = partial.up ?? false;
  input.down = partial.down ?? false;
  input.interact = partial.interact ?? false;
}
