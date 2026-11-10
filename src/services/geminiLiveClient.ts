/**
 * Client-Side Gemini Live API & Voice Conversation Manager
 * Supports:
 * - Real-time full-duplex voice streaming via WebSocket (`gemini-3.8-live`)
 * - 16kHz PCM audio mic capture
 * - 24kHz gapless PCM audio playback
 * - Sound wave level analysis for interactive audio visualizer
 * - Intelligent HTTP Voice fallback with TTS (`gemini-3.8-flash-lite-tts`)
 */

export interface LiveVoiceCallbacks {
  onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'interrupted' | 'error') => void;
  onUserTranscript?: (text: string) => void;
  onModelTranscript?: (text: string) => void;
  onUserVolume?: (volume: number) => void; // 0 to 1
  onModelVolume?: (volume: number) => void; // 0 to 1
  onError?: (errorMessage: string) => void;
}

export class GeminiLiveVoiceSession {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micProcessor: ScriptProcessorNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private activeSourceNodes: AudioBufferSourceNode[] = [];
  private nextPlayTime = 0;
  private isMuted = false;
  private isDestroyed = false;
  private isUsingHttpFallback = false;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedAudioChunks: Blob[] = [];
  private animFrameId: number | null = null;

  public callbacks: LiveVoiceCallbacks = {};

  constructor(callbacks: LiveVoiceCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /**
   * Start live voice conversation
   */
  public async start(): Promise<boolean> {
    this.isDestroyed = false;
    this.updateStatus('connecting');

    // 1. Initialize Audio Contexts
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioCtx = new AudioCtxClass({ sampleRate: 16000 });
      this.outputAudioCtx = new AudioCtxClass({ sampleRate: 24000 });

      if (this.inputAudioCtx.state === 'suspended') {
        await this.inputAudioCtx.resume();
      }
      if (this.outputAudioCtx.state === 'suspended') {
        await this.outputAudioCtx.resume();
      }

      // Output analyser for Gemini voice visualizer
      this.outputAnalyser = this.outputAudioCtx.createAnalyser();
      this.outputAnalyser.fftSize = 64;
      this.outputAnalyser.connect(this.outputAudioCtx.destination);
    } catch (err: any) {
      console.warn('AudioContext init notice:', err);
    }

    // 2. Request Microphone Access
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      this.updateStatus('error');
      if (this.callbacks.onError) {
        this.callbacks.onError('Accès au microphone requis pour la conversation vocale.');
      }
      return false;
    }

    // 3. Setup Mic Stream Processing and Volume Meter
    this.setupMicProcessing();

    // 4. Connect WebSocket to Gemini Live API
    const connected = await this.connectWebSocket();
    if (!connected) {
      console.warn('WebSocket connection failed, enabling HTTP voice conversation mode');
      this.isUsingHttpFallback = true;
      this.updateStatus('listening');
      this.startHttpVoiceRecording();
    }

    // Start volume meter animation loop
    this.startVolumeMonitoring();

    return true;
  }

  /**
   * Set up microphone processing (Float32 to 16kHz Int16 PCM)
   */
  private setupMicProcessing() {
    if (!this.inputAudioCtx || !this.micStream) return;

    try {
      const source = this.inputAudioCtx.createMediaStreamSource(this.micStream);
      this.micAnalyser = this.inputAudioCtx.createAnalyser();
      this.micAnalyser.fftSize = 64;

      // 4096 samples at 16kHz is ~256ms of audio
      const bufferSize = 4096;
      this.micProcessor = this.inputAudioCtx.createScriptProcessor(bufferSize, 1, 1);

      source.connect(this.micAnalyser);
      this.micAnalyser.connect(this.micProcessor);
      this.micProcessor.connect(this.inputAudioCtx.destination);

      this.micProcessor.onaudioprocess = (e) => {
        if (this.isMuted || this.isDestroyed) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Only stream over WebSocket if actively connected
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const pcmBase64 = this.float32ToPCM16Base64(inputData);
          if (pcmBase64) {
            this.ws.send(JSON.stringify({
              type: 'audio',
              audio: pcmBase64
            }));
          }
        }
      };
    } catch (err) {
      console.error('Error setting up mic processor:', err);
    }
  }

  /**
   * Connect WebSocket to server Gemini Live bridge
   */
  private async connectWebSocket(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/api/live`;

        this.ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            try { this.ws.close(); } catch {}
            resolve(false);
          }
        }, 3500);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('[Gemini Live Client] Connected');
          this.updateStatus('listening');
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'ready') {
              this.updateStatus('listening');
            } else if (data.type === 'audio' && data.audio) {
              this.updateStatus('speaking');
              this.playPCMChunk24k(data.audio);
            } else if (data.type === 'inputTranscription' && data.text) {
              if (this.callbacks.onUserTranscript) {
                this.callbacks.onUserTranscript(data.text);
              }
            } else if (data.type === 'outputTranscription' && data.text) {
              this.updateStatus('speaking');
              if (this.callbacks.onModelTranscript) {
                this.callbacks.onModelTranscript(data.text);
              }
            } else if (data.type === 'interrupted') {
              this.handleInterruption();
            } else if (data.type === 'turnComplete') {
              setTimeout(() => {
                if (this.activeSourceNodes.length === 0) {
                  this.updateStatus('listening');
                }
              }, 400);
            } else if (data.type === 'error') {
              console.warn('[Gemini Live Client] Server reported:', data.message);
              if (this.callbacks.onError) {
                this.callbacks.onError(data.message);
              }
            }
          } catch (err) {
            console.error('Failed to parse WS message:', err);
          }
        };

        this.ws.onerror = (err) => {
          clearTimeout(timeout);
          console.warn('[Gemini Live Client] WebSocket error:', err);
          resolve(false);
        };

        this.ws.onclose = () => {
          clearTimeout(timeout);
          console.log('[Gemini Live Client] Closed');
          if (!this.isDestroyed && !this.isUsingHttpFallback) {
            this.updateStatus('idle');
          }
        };
      } catch (e) {
        console.warn('WebSocket connection exception:', e);
        resolve(false);
      }
    });
  }

  /**
   * Schedule gapless 24kHz PCM audio chunk playback
   */
  private playPCMChunk24k(base64PCM: string) {
    if (!this.outputAudioCtx || !this.outputAnalyser || this.isDestroyed) return;

    try {
      const binaryStr = atob(base64PCM);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      // Convert 16-bit signed PCM little-endian to Float32
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAnalyser);

      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.activeSourceNodes.push(source);

      source.onended = () => {
        const idx = this.activeSourceNodes.indexOf(source);
        if (idx !== -1) {
          this.activeSourceNodes.splice(idx, 1);
        }
        if (this.activeSourceNodes.length === 0) {
          this.updateStatus('listening');
        }
      };
    } catch (err) {
      console.error('Error playing 24kHz PCM chunk:', err);
    }
  }

  /**
   * User interrupted model: stop all audio playback immediately
   */
  public handleInterruption() {
    this.updateStatus('interrupted');
    try {
      for (const node of this.activeSourceNodes) {
        try { node.stop(); } catch {}
      }
      this.activeSourceNodes = [];
      if (this.outputAudioCtx) {
        this.nextPlayTime = this.outputAudioCtx.currentTime;
      }
    } catch {}
    setTimeout(() => {
      if (!this.isDestroyed) this.updateStatus('listening');
    }, 200);
  }

  /**
   * Send text prompt through the live voice channel
   */
  public sendText(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'text', text }));
    } else if (this.isUsingHttpFallback) {
      this.submitHttpVoicePrompt(text);
    }
  }

  /**
   * Toggle microphone mute
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.micStream) {
      this.micStream.getAudioTracks().forEach(t => {
        t.enabled = !this.isMuted;
      });
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Monitor speaking volumes for real-time waveform UI
   */
  private startVolumeMonitoring() {
    const dataArray = new Uint8Array(32);

    const checkVolume = () => {
      if (this.isDestroyed) return;

      // User Volume
      if (this.micAnalyser && !this.isMuted) {
        this.micAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 128);
        if (this.callbacks.onUserVolume) {
          this.callbacks.onUserVolume(normalized);
        }
      } else if (this.callbacks.onUserVolume) {
        this.callbacks.onUserVolume(0);
      }

      // Model Volume
      if (this.outputAnalyser && this.activeSourceNodes.length > 0) {
        this.outputAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 128);
        if (this.callbacks.onModelVolume) {
          this.callbacks.onModelVolume(normalized);
        }
      } else if (this.callbacks.onModelVolume) {
        this.callbacks.onModelVolume(0);
      }

      this.animFrameId = requestAnimationFrame(checkVolume);
    };

    this.animFrameId = requestAnimationFrame(checkVolume);
  }

  /**
   * HTTP Voice Fallback: uses MediaRecorder + /api/gemini/voice-conversation
   */
  private startHttpVoiceRecording() {
    if (!this.micStream) return;
    try {
      this.recordedAudioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.micStream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedAudioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        if (this.recordedAudioChunks.length === 0 || this.isDestroyed) return;
        const audioBlob = new Blob(this.recordedAudioChunks, { type: 'audio/webm' });
        this.recordedAudioChunks = [];
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await this.submitHttpVoicePrompt('', base64Audio);
        };
        reader.readAsDataURL(audioBlob);
      };

      this.mediaRecorder.start(1000);
    } catch (e) {
      console.warn('HTTP voice fallback recording error:', e);
    }
  }

  /**
   * Send HTTP audio/text prompt to fallback endpoint
   */
  public async submitHttpVoicePrompt(textPrompt = '', audioBase64 = '') {
    this.updateStatus('speaking');
    try {
      const res = await fetch('/api/gemini/voice-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textPrompt, audioBase64 })
      });

      if (!res.ok) throw new Error('Erreur HTTP conversation vocale');
      const data = await res.json();

      if (data.userText && this.callbacks.onUserTranscript) {
        this.callbacks.onUserTranscript(data.userText);
      }
      if (data.replyText && this.callbacks.onModelTranscript) {
        this.callbacks.onModelTranscript(data.replyText);
      }

      if (data.audioWavBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioWavBase64}`);
        audio.onended = () => {
          this.updateStatus('listening');
        };
        await audio.play();
      } else {
        this.updateStatus('listening');
      }
    } catch (err: any) {
      console.error('HTTP voice submit error:', err);
      this.updateStatus('listening');
    }
  }

  /**
   * Convert Float32Array to 16-bit signed PCM little-endian Base64
   */
  private float32ToPCM16Base64(input: Float32Array): string {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      let s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
    }
    return btoa(binary);
  }

  private updateStatus(status: 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'interrupted' | 'error') {
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(status);
    }
  }

  /**
   * Stop session and release audio tracks & sockets
   */
  public stop() {
    this.isDestroyed = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    } catch {}

    try {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    } catch {}

    try {
      for (const node of this.activeSourceNodes) {
        try { node.stop(); } catch {}
      }
      this.activeSourceNodes = [];
    } catch {}

    if (this.micProcessor) {
      try { this.micProcessor.disconnect(); } catch {}
      this.micProcessor = null;
    }
    if (this.micAnalyser) {
      try { this.micAnalyser.disconnect(); } catch {}
      this.micAnalyser = null;
    }
    if (this.outputAnalyser) {
      try { this.outputAnalyser.disconnect(); } catch {}
      this.outputAnalyser = null;
    }
    if (this.micStream) {
      try {
        this.micStream.getTracks().forEach(t => t.stop());
      } catch {}
      this.micStream = null;
    }
    if (this.inputAudioCtx) {
      try { this.inputAudioCtx.close(); } catch {}
      this.inputAudioCtx = null;
    }
    if (this.outputAudioCtx) {
      try { this.outputAudioCtx.close(); } catch {}
      this.outputAudioCtx = null;
    }

    this.updateStatus('idle');
  }
}
