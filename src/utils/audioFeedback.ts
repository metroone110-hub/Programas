/**
 * Real-time audio and speech synthesizer for the CROU Wave-style turnstile scanner.
 * Uses Web Audio API (zero external audio file dependency) and SpeechSynthesis.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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
   * Prime and unlock Web Audio on iOS Safari user gesture
   */
  public unlockAudio(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      // Ignore
    }
  }

  /**
   * Authentic iPhone crystal "Cline" chime 🔔 (Apple Pay / iOS confirmation style)
   * High-definition multi-harmonic glass bell chime with exponential crystal decay.
   */
  public playSuccessBeep(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Note 1: Initiation soft glass chime (E6 ~ 1318.5 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.5, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.40, now + 0.006);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2: Main bright crystal chime ("Cline! 🔔" - C7 ~ 2093.0 Hz)
      const tMain = now + 0.065;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2093.0, tMain);
      gain2.gain.setValueAtTime(0, tMain);
      gain2.gain.linearRampToValueAtTime(0.55, tMain + 0.005);
      gain2.gain.exponentialRampToValueAtTime(0.0001, tMain + 0.75);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(tMain);
      osc2.stop(tMain + 0.78);

      // Note 3: Shimmer crystal harmonic overtone (C8 ~ 4186.0 Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(4186.0, tMain);
      gain3.gain.setValueAtTime(0, tMain);
      gain3.gain.linearRampToValueAtTime(0.18, tMain + 0.004);
      gain3.gain.exponentialRampToValueAtTime(0.0001, tMain + 0.48);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(tMain);
      osc3.stop(tMain + 0.50);

      // Note 4: Warm mid bell resonance (G6 ~ 1567.98 Hz)
      const osc4 = ctx.createOscillator();
      const gain4 = ctx.createGain();
      osc4.type = 'sine';
      osc4.frequency.setValueAtTime(1567.98, tMain);
      gain4.gain.setValueAtTime(0, tMain);
      gain4.gain.linearRampToValueAtTime(0.22, tMain + 0.005);
      gain4.gain.exponentialRampToValueAtTime(0.0001, tMain + 0.58);
      osc4.connect(gain4);
      gain4.connect(ctx.destination);
      osc4.start(tMain);
      osc4.stop(tMain + 0.60);

      // Note 5: High sparkle harmonic (E8 ~ 5274.0 Hz)
      const osc5 = ctx.createOscillator();
      const gain5 = ctx.createGain();
      osc5.type = 'sine';
      osc5.frequency.setValueAtTime(5274.0, tMain);
      gain5.gain.setValueAtTime(0, tMain);
      gain5.gain.linearRampToValueAtTime(0.09, tMain + 0.004);
      gain5.gain.exponentialRampToValueAtTime(0.0001, tMain + 0.35);
      osc5.connect(gain5);
      gain5.connect(ctx.destination);
      osc5.start(tMain);
      osc5.stop(tMain + 0.38);

      // Apple Taptic style haptic feedback
      if (typeof window !== 'undefined' && typeof (window as any).haptic === 'function') {
        (window as any).haptic(35);
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 25, 50]);
      }
    } catch {
      // Audio fallback silent
    }
  }

  /**
   * Low discordant buzzer (220Hz -> 140Hz) for fraud or invalid ticket
   */
  public playFraudBeep(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(160, now + 0.12);
      osc.frequency.setValueAtTime(130, now + 0.24);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);

      // Heavy haptic vibration for alert
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([150, 80, 150, 80, 200]);
      }
    } catch {
      // Audio fallback silent
    }
  }

  /**
   * French voice announcement using browser speech synthesis
   */
  public speak(text: string): void {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel(); // Stop ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.1; // energetic and brisk
      utterance.pitch = 1.05;

      // Prefer French voice if available
      const voices = window.speechSynthesis.getVoices();
      const frVoice = voices.find(v => v.lang.startsWith('fr'));
      if (frVoice) {
        utterance.voice = frVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech errors
    }
  }
}

export const soundSynthesizer = new SoundSynthesizer();

// Automatically prime and unlock audio on first user touch anywhere in iOS / Android
if (typeof window !== 'undefined') {
  const unlock = () => {
    soundSynthesizer.unlockAudio();
  };
  window.addEventListener('touchstart', unlock, { passive: true, once: true });
  window.addEventListener('pointerdown', unlock, { passive: true, once: true });
  window.addEventListener('click', unlock, { passive: true, once: true });
}
