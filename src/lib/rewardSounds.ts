// Clean Mechanical & Casino Audio Engine for Rewards
// Low frequency (65Hz - 196Hz), pleasant well-balanced volume, zero piercing or high frequencies.
// Safe and punchy on headphones.

let audioCtx: AudioContext | null = null;
const audioBuffers: Record<string, AudioBuffer | undefined> = {};
const bufferLoadingPromises: Record<string, Promise<AudioBuffer | null> | undefined> = {};

const SOUND_ASSETS = {
  wheelTick: "/sounds/wheel_tick.wav?v=7",
  caseOpen: "/sounds/case_open.wav?v=7",
  caseWin: "/sounds/case_win.wav?v=7",
  cardWin: "/sounds/card_win.wav?v=7",
};

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Preload acoustic WAV samples into Web Audio buffers for instant zero-latency playback
async function loadSoundBuffer(url: string): Promise<AudioBuffer | null> {
  const cached = audioBuffers[url];
  if (cached) return cached;
  const inFlight = bufferLoadingPromises[url];
  if (inFlight) return inFlight;

  bufferLoadingPromises[url] = (async () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return null;
      const res = await fetch(url);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      audioBuffers[url] = decoded;
      return decoded;
    } catch {
      return null;
    }
  })();

  return bufferLoadingPromises[url];
}

// Automatically initiate preload on client
if (typeof window !== "undefined") {
  setTimeout(() => {
    loadSoundBuffer(SOUND_ASSETS.wheelTick);
    loadSoundBuffer(SOUND_ASSETS.caseOpen);
    loadSoundBuffer(SOUND_ASSETS.caseWin);
    loadSoundBuffer(SOUND_ASSETS.cardWin);
  }, 100);
}

/**
 * Sound 1: Case start / wheel spin launch
 * Soft, low mechanical latch thud (deep sub ~85Hz, crisp latch)
 */
export async function playCaseUnlockSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const buffer = await loadSoundBuffer(SOUND_ASSETS.caseOpen);
  if (buffer) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.32; // Solid and clearly audible
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  } else {
    // Pure soft bass thump fallback
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(85, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }
}

/**
 * Sound 2: Roulette Tick (CS2 Crate Scroll / Casino Wheel)
 * Very short, tactile low-frequency "thock" (75-170Hz).
 * Non-piercing, zero high harmonics, balanced volume.
 */
let lastTickTime = 0;

export async function playRouletteTickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Ensure minimum 55ms between ticks to prevent audio stacking
  if (now - lastTickTime < 0.055) return;
  lastTickTime = now;

  const buffer = await loadSoundBuffer(SOUND_ASSETS.wheelTick);
  if (buffer) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.28; // Clear, tactile, pleasant presence
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
  } else {
    // Soft low-frequency tap fallback (no white noise!)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.018);
    gain.gain.setValueAtTime(0.20, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.018);
  }
}

/**
 * Sound 3: Casino Win Payout
 * Calm, low-mid gentle warm chord (C3 130Hz, G3 196Hz) + muffled bass thud.
 * Completely free of sharp highs.
 */
export async function playCaseWinSound(isRare = false) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const buffer = await loadSoundBuffer(SOUND_ASSETS.caseWin);
  if (buffer) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = isRare ? 0.42 : 0.32;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  } else {
    // Deep mechanical lock thud fallback
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }
}

/**
 * Sound 4: Scratch Friction Sound
 * Muffled low cardboard friction (300-450 Hz). Zero high hiss.
 */
let lastScratchSoundTime = 0;

export function playScratchFrictionSound(intensity = 1) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  if (now - lastScratchSoundTime < 0.05) return;
  lastScratchSoundTime = now;

  const bufferSize = Math.floor(ctx.sampleRate * 0.035);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);

  // Filtered brown noise generation (heavy low-pass)
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    data[i] = (b0 + b1 + b2) * 0.25;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  // Bandpass filter centered at 380 Hz (muffled low scrape, no hiss)
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  const centerFreq = 340 + Math.random() * 100;
  filter.frequency.setValueAtTime(centerFreq, now);
  filter.Q.setValueAtTime(2.2, now);

  const gain = ctx.createGain();
  const volume = Math.min(0.12, 0.05 * intensity);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
}

/**
 * Sound 5: Scratch card reveal fanfare
 * Warm low confirmation tone
 */
export async function playCardWinSound(hasDiscount = false) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (hasDiscount) {
    const buffer = await loadSoundBuffer(SOUND_ASSETS.cardWin);
    if (buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = 0.30;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(ctx.currentTime);
      return;
    }
  }

  // Soft low tone
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, now);
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.20);
  gain.gain.setValueAtTime(0.16, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.20);
}
