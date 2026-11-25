// All sound is synthesized with WebAudio oscillators — no audio files, fully offline.
// Named cues: chop, stove on, done ding, burn buzz, serve chime, cold thud, combo rise.

/** Build the audio context and master gain lazily (browsers require a user gesture). */
export function createAudio() {
  let context = null;
  let master = null;
  let enabled = true;

  function ensureContext() {
    if (!context) {
      const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioCtor) return null;
      context = new AudioCtor();
      master = context.createGain();
      master.gain.value = 0.16;
      master.connect(context.destination);
    }
    if (context.state === 'suspended') context.resume();
    return context;
  }

  /** One oscillator blip with a pitch contour and a decay envelope. */
  function blip({ type = 'sine', from = 440, to = null, duration = 0.15, gain = 1, delay = 0 }) {
    if (!enabled) return;
    const ctx = ensureContext();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), start + duration);
    env.gain.setValueAtTime(gain, start);
    env.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(env);
    env.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  /** Noise burst (chop thock, burn buzz) via a short buffer source. */
  function noiseBurst({ duration = 0.08, gain = 0.8, filterHz = 1200, delay = 0 }) {
    if (!enabled) return;
    const ctx = ensureContext();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const frames = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterHz;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, start);
    env.gain.exponentialRampToValueAtTime(0.001, start + duration);
    src.connect(filter);
    filter.connect(env);
    env.connect(master);
    src.start(start);
  }

  return {
    /** Knife thock while chopping. */
    playChop() {
      noiseBurst({ duration: 0.06, gain: 0.9, filterHz: 900 });
      blip({ type: 'triangle', from: 220, to: 140, duration: 0.07, gain: 0.5 });
    },
    /** Pan placed on the burner. */
    playStoveOn() {
      noiseBurst({ duration: 0.2, gain: 0.5, filterHz: 500 });
      blip({ type: 'sawtooth', from: 90, to: 70, duration: 0.3, gain: 0.4 });
    },
    /** Dish cooked to perfection. */
    playDone() {
      blip({ type: 'sine', from: 660, to: 660, duration: 0.12, gain: 0.7 });
      blip({ type: 'sine', from: 880, to: 880, duration: 0.18, gain: 0.7, delay: 0.1 });
    },
    /** Burned pan buzz. */
    playBurn() {
      blip({ type: 'sawtooth', from: 160, to: 60, duration: 0.5, gain: 0.8 });
      noiseBurst({ duration: 0.35, gain: 0.5, filterHz: 400 });
    },
    /** Order served — rising major arpeggio, higher with combo. */
    playServe(comboStep = 0) {
      const base = 520 + Math.min(8, comboStep) * 40;
      blip({ type: 'sine', from: base, duration: 0.12, gain: 0.8 });
      blip({ type: 'sine', from: base * 1.25, duration: 0.12, gain: 0.8, delay: 0.09 });
      blip({ type: 'sine', from: base * 1.5, duration: 0.2, gain: 0.9, delay: 0.18 });
    },
    /** Ticket went cold — low thud. */
    playCold() {
      blip({ type: 'sine', from: 180, to: 90, duration: 0.4, gain: 0.7 });
    },
    /** UI confirm (title → play, unpause). */
    playConfirm() {
      blip({ type: 'triangle', from: 440, to: 700, duration: 0.15, gain: 0.6 });
    },
    /** Shift over — descending farewell. */
    playGameOver() {
      blip({ type: 'sine', from: 520, duration: 0.2, gain: 0.7 });
      blip({ type: 'sine', from: 400, duration: 0.2, gain: 0.7, delay: 0.2 });
      blip({ type: 'sine', from: 280, duration: 0.4, gain: 0.8, delay: 0.4 });
    },
    /** Mute toggle for the M key. */
    toggleMute() {
      enabled = !enabled;
      return enabled;
    },
    isMuted() {
      return !enabled;
    },
  };
}
