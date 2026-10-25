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
   * Crisp high-frequency ascending beep (880Hz -> 1320Hz) matching Wave scanner
   */
  public playSuccessBeep(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      const now = ctx.currentTime;

      // Tone 1: 880Hz
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1174, now + 0.08);

      // Tone 2: 1320Hz
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now + 0.07);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.16);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.09);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.22);

      // Haptic vibration
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([60, 40, 80]);
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
