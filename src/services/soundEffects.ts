/**
 * Anusandhan Audio Synthesizer: Mechanical Pull-Chain Switch
 * Uses standard Web Audio API to synthesize a tactile brass pull-chain rotary switch click.
 * No external sound files or network requests needed.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Play authentic vintage pull-chain mechanical switch sound
   * Simulates the bead friction, the rotary ratchet detent snap, and the contact closure.
   */
  public playPullChainSwitch(lightOn: boolean = true): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 1. Pre-snap bead friction / metal chain click
      const beadOsc = ctx.createOscillator();
      const beadGain = ctx.createGain();
      beadOsc.type = 'triangle';
      beadOsc.frequency.setValueAtTime(3200, now);
      beadOsc.frequency.exponentialRampToValueAtTime(1400, now + 0.015);
      beadGain.gain.setValueAtTime(0.08, now);
      beadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      beadOsc.connect(beadGain);
      beadGain.connect(ctx.destination);
      beadOsc.start(now);
      beadOsc.stop(now + 0.025);

      // 2. Main mechanical spring-loaded ratchet snap (filtered noise burst)
      const bufferSize = ctx.sampleRate * 0.04; // 40ms burst
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      // Slightly sharper frequency for light on vs light off
      filter.frequency.setValueAtTime(lightOn ? 2800 : 2200, now + 0.012);
      filter.Q.setValueAtTime(3.5, now + 0.012);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.setValueAtTime(0.35, now + 0.012);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      whiteNoise.start(now + 0.012);
      whiteNoise.stop(now + 0.06);

      // 3. Resonant contact thud (rotary housing strike)
      const thudOsc = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(lightOn ? 420 : 360, now + 0.015);
      thudOsc.frequency.exponentialRampToValueAtTime(90, now + 0.06);

      thudGain.gain.setValueAtTime(0.28, now + 0.015);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      thudOsc.connect(thudGain);
      thudGain.connect(ctx.destination);

      thudOsc.start(now + 0.015);
      thudOsc.stop(now + 0.08);

      // 4. Subtle brass bead settling resonance
      const ringOsc = ctx.createOscillator();
      const ringGain = ctx.createGain();
      ringOsc.type = 'sine';
      ringOsc.frequency.setValueAtTime(lightOn ? 5200 : 4800, now + 0.035);
      ringGain.gain.setValueAtTime(0.05, now + 0.035);
      ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      ringOsc.connect(ringGain);
      ringGain.connect(ctx.destination);

      ringOsc.start(now + 0.035);
      ringOsc.stop(now + 0.1);
    } catch {
      // AudioContext may be restricted by autoplay policy prior to user interaction
    }
  }
}

export const soundSynthesizer = new SoundSynthesizer();
