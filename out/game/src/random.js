// Deterministic seeded random, so a screenshot seed always stages the identical frame.
// Mulberry32: tiny, fast, good enough for order and spawn sequences.

/** Create a seeded pseudo-random source with named helpers. */
export function createRandom(seed) {
  let state = seed >>> 0;
  function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  }
  function nextInt(maxExclusive) {
    return Math.floor(next() * maxExclusive);
  }
  function pick(list) {
    return list[nextInt(list.length)];
  }
  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = nextInt(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  return { next, nextInt, pick, shuffle };
}
