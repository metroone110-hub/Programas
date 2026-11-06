import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  AlertOctagon, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Scan, 
  Search, 
  Check,
  X,
  Zap,
  ZapOff,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Bell
} from 'lucide-react';
import jsQR from 'jsqr';
import { MealTicket } from '../types';
import { verifyTurnstileTicket } from '../services/studentAuth';
import { recordMealValidatedInLedger } from '../services/dailyLedger';
import { soundSynthesizer } from '../utils/audioFeedback';
import { scanTicketWithGeminiAI } from '../utils/aiTicketScanner';

interface Props {
  onTicketValidated?: (ticket: MealTicket) => void;
  onRefreshStats?: () => void;
}

export const TurnstileWaveScanner: React.FC<Props> = ({ 
  onTicketValidated,
  onRefreshStats 
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Modal / Fullscreen Wave scanner open state
  const [isWaveModalOpen, setIsWaveModalOpen] = useState<boolean>(false);
  const [waveTab, setWaveTab] = useState<'scan' | 'manual'>('scan');

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [lastScannedText, setLastScannedText] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

  // Manual code input
  const [manualCode, setManualCode] = useState<string>('');

  // Result state
  const [verdict, setVerdict] = useState<{
    status: 'idle' | 'valid' | 'used' | 'invalid' | 'fraud_detected';
    message: string;
    ticket?: MealTicket;
    time?: string;
  }>({
    status: 'idle',
    message: ''
  });

  // Stop Camera Stream safely
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        try {
          t.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {}
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsVideoPlaying(false);
    setTorchOn(false);
  }, []);

  // Reliable iOS Safari / WebKit video stream attacher
  const attachStreamToVideo = useCallback((videoEl: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (!videoEl || !stream) return;
    try {
      videoEl.muted = true;
      videoEl.defaultMuted = true;
      videoEl.playsInline = true;
      videoEl.autoplay = true;
      videoEl.setAttribute('playsinline', 'true');
      videoEl.setAttribute('webkit-playsinline', 'true');
      videoEl.setAttribute('muted', 'true');
      videoEl.setAttribute('autoplay', 'true');

      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }

      const tryPlay = () => {
        videoEl.play()
          .then(() => {
            setIsVideoPlaying(true);
          })
          .catch((pErr) => {
            if (pErr.name !== 'AbortError') {
              console.warn('iOS video play notice:', pErr);
            }
          });
      };

      videoEl.onloadedmetadata = tryPlay;
      videoEl.oncanplay = tryPlay;
      tryPlay();
    } catch (e) {
      console.warn('attachStreamToVideo error:', e);
    }
  }, []);

  // Start Camera Stream with iOS Safari full compatibility
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setVerdict({ status: 'idle', message: '' });

    // Prime audio context on user gesture for instant iPhone "Cline" chime
    soundSynthesizer.unlockAudio();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La caméra n\'est pas supportée par ce navigateur.');
      }

      // Safely stop previous tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => {
          try { t.stop(); } catch {}
        });
        streamRef.current = null;
      }

      // Universal constraints tested for iPhone Safari, Chrome iOS and Android
      // Note: Never use { facingMode: { exact: 'environment' } } as it throws OverconstrainedError on iPhone
      const constraintsToTry = [
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        },
        {
          video: {
            facingMode: 'environment'
          },
          audio: false
        },
        {
          video: true,
          audio: false
        }
      ];

      let stream: MediaStream | null = null;
      let lastErr: any = null;

      for (const c of constraintsToTry) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(c);
          if (stream) break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (!stream) {
        throw lastErr || new Error('Impossible d\'accéder à la caméra.');
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setIsWaveModalOpen(true);
      setWaveTab('scan');

      // Bind to video ref when ready
      if (videoRef.current) {
        attachStreamToVideo(videoRef.current, stream);
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setIsCameraActive(false);
      setIsVideoPlaying(false);
      if (err.name === 'NotAllowedError') {
        setCameraError('Accès à la caméra refusé. Autorisez la caméra dans Safari (Réglages iPhone > Safari > Appareil photo > Autoriser).');
      } else {
        setCameraError(err.message || 'Impossible d\'activer la caméra en direct.');
      }
    }
  }, [attachStreamToVideo]);

  // Synchronize stream with video element when modal mounts
  useEffect(() => {
    if (isWaveModalOpen && isCameraActive && streamRef.current && videoRef.current) {
      attachStreamToVideo(videoRef.current, streamRef.current);
    }
  }, [isWaveModalOpen, isCameraActive, attachStreamToVideo]);

  // Toggle Torch / Flash
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const caps: any = track.getCapabilities ? track.getCapabilities() : {};
      if (caps && caps.torch) {
        const next = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: next } as any]
        });
        setTorchOn(next);
      }
    } catch (e) {
      console.warn('Torch not supported:', e);
    }
  };

  // Close the entire Wave scanner overlay
  const handleCloseWaveScanner = () => {
    stopCamera();
    setIsWaveModalOpen(false);
  };

  // Process and verify a decoded ticket text
  const processDecodedTicket = useCallback(async (rawText: string) => {
    if (!rawText) return;

    // 1. ARRÊTER LA CAMÉRA IMMÉDIATEMENT dès détection pour éviter tout re-scan involontaire
    stopCamera();

    // 2. Extraire les données du ticket
    let ticketNum = rawText.trim();
    let mat = '';

    if (ticketNum.startsWith('{') || ticketNum.includes('"tkt"') || ticketNum.includes('"app"')) {
      try {
        const parsed = JSON.parse(ticketNum);
        if (parsed.tkt || parsed.ticketNumber) ticketNum = parsed.tkt || parsed.ticketNumber;
        if (parsed.mat || parsed.studentMatricule) mat = parsed.mat || parsed.studentMatricule;
      } catch {
        const match = ticketNum.match(/"tkt"\s*:\s*"([^"]+)"/);
        if (match) ticketNum = match[1];
        const matchMat = ticketNum.match(/"mat"\s*:\s*"([^"]+)"/);
        if (matchMat) mat = matchMat[1];
      }
    } else if (ticketNum.includes('tkt=')) {
      try {
        const url = new URL(ticketNum.startsWith('http') ? ticketNum : `https://${ticketNum}`);
        ticketNum = url.searchParams.get('tkt') || ticketNum;
        mat = url.searchParams.get('mat') || '';
      } catch {
        const match = ticketNum.match(/tkt=([A-Za-z0-9-_]+)/);
        if (match) ticketNum = match[1];
      }
    } else if (/^\d{6}$/.test(ticketNum)) {
      ticketNum = `CROUK-2026-${ticketNum}`;
    }

    setLastScannedText(ticketNum);

    // Call validation against database & fraud check
    const res = await verifyTurnstileTicket(rawText, mat);

    const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (res.status === 'valid' && res.ticket) {
      if (soundEnabled) {
        soundSynthesizer.playSuccessBeep();
      }

      await recordMealValidatedInLedger(res.ticket);
      if (onTicketValidated) onTicketValidated(res.ticket);
      if (onRefreshStats) onRefreshStats();

      setVerdict({
        status: 'valid',
        message: res.message,
        ticket: res.ticket,
        time: nowStr
      });
    } else {
      if (soundEnabled) {
        soundSynthesizer.playFraudBeep();
        if (res.status === 'used') {
          soundSynthesizer.speak("Attention ! Ticket déjà consommé !");
        } else {
          soundSynthesizer.speak("Alerte ! Ticket frauduleux ou non reconnu !");
        }
      }

      setVerdict({
        status: res.status,
        message: res.message,
        ticket: res.ticket,
        time: nowStr
      });
    }
  }, [soundEnabled, onTicketValidated, onRefreshStats, stopCamera]);

  // Continuous Video Scan Loop with jsQR
  useEffect(() => {
    if (!isCameraActive || !isWaveModalOpen || waveTab !== 'scan') return;

    let isScanning = true;

    const scanFrame = () => {
      if (!isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= video.HAVE_CURRENT_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Focus scan on central square viewfinder for maximum speed
          const size = Math.min(canvas.width, canvas.height) * 0.85;
          const startX = (canvas.width - size) / 2;
          const startY = (canvas.height - size) / 2;

          const imageData = ctx.getImageData(startX, startY, size, size);
          let qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          // Fallback to full canvas with inversion if slightly off-center
          if (!qrCode || !qrCode.data) {
            const fullImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
            qrCode = jsQR(fullImg.data, fullImg.width, fullImg.height, {
              inversionAttempts: 'attemptBoth'
            });
          }

          if (qrCode && qrCode.data) {
            isScanning = false;
            stopCamera();
            processDecodedTicket(qrCode.data);
            return;
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(scanFrame);
    };

    animationFrameId.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraActive, isWaveModalOpen, waveTab, processDecodedTicket, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // AI Photo Scanner Fallback
  const handlePhotoCaptureAI = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiAnalyzing(true);
    setVerdict({ status: 'idle', message: 'Analyse IA Google en cours...' });

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        // 1. Try decoding QR directly from canvas first
        const img = new Image();
        img.onload = async () => {
          const testCanvas = document.createElement('canvas');
          testCanvas.width = img.width;
          testCanvas.height = img.height;
          const tCtx = testCanvas.getContext('2d');
          if (tCtx) {
            tCtx.drawImage(img, 0, 0);
            const imgData = tCtx.getImageData(0, 0, img.width, img.height);
            const qr = jsQR(imgData.data, imgData.width, imgData.height);
            if (qr && qr.data) {
              await processDecodedTicket(qr.data);
              setIsAiAnalyzing(false);
              return;
            }
          }

          // 2. Fallback to Google Gemini Vision AI
          const aiResult = await scanTicketWithGeminiAI(base64);
          if (aiResult.detected && aiResult.ticketNumber) {
            await processDecodedTicket(aiResult.ticketNumber);
          } else {
            if (soundEnabled) soundSynthesizer.playFraudBeep();
            setVerdict({
              status: 'invalid',
              message: 'Le lecteur optique n\'a pas détecté de ticket CROU lisible sur cette photo. Rapprochez bien l\'objectif du QR code.'
            });
          }
          setIsAiAnalyzing(false);
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    } catch {
      setIsAiAnalyzing(false);
    }
  };

  // Manual code submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processDecodedTicket(manualCode.trim());
    setManualCode('');
  };

  return (
    <>
      {/* Hidden processing canvas & file input for AI */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCaptureAI}
        className="hidden"
      />

      {/* DASHBOARD CARD (Launchpad for Wave Scanner) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5 font-sans">
        
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-slate-900 font-cabinet">
                  Scanner Borne Tourniquet CROU
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Style Wave
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Caméra plein écran instantanée, bip sonore Wave et détection automatique.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border transition-colors flex items-center space-x-1.5 text-xs font-bold ${
                soundEnabled
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'Son activé (Bip Wave)' : 'Son désactivé'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-600" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Bip Activé' : 'Muet'}</span>
            </button>
          </div>
        </div>

        {/* Error notice if camera blocked */}
        {cameraError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start space-x-3">
            <AlertOctagon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Problème d'accès à la caméra</p>
              <p className="mt-0.5 text-red-700">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Main Prominent Button to open the Wave Scanner */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white text-center space-y-4 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-sm mx-auto space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Scan className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white">
                Prêt pour le contrôle des tickets
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Ouvrez la caméra plein écran au format Wave pour valider le passage des étudiants en une fraction de seconde.
              </p>
            </div>

            <button
              type="button"
              onClick={startCamera}
              className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-orange-500/25 transition-all active:scale-95 flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              <Camera className="w-5 h-5 text-slate-950" />
              <span>Ouvrir le Scanner (Style Wave)</span>
            </button>
          </div>
        </div>

        {/* Alternative Modes: Photo IA Google & Saisie Manuelle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Photo Mode with Google Gemini AI */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAiAnalyzing}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/40 text-slate-800 transition-all flex items-center justify-center space-x-2 text-xs font-bold shadow-xs cursor-pointer active:scale-98"
          >
            {isAiAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                <span>Lecture optique du ticket...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 text-amber-500" />
                <span>Prendre Photo & Scanner le Ticket</span>
              </>
            )}
          </button>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Code ticket (ex: 984917)..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition-all shadow-xs active:scale-95 flex-shrink-0 cursor-pointer"
            >
              Valider
            </button>
          </form>
        </div>

      </div>

      {/* ======================================================== */}
      {/* IMMERSIVE WAVE FULLSCREEN SCANNER (EXACT WAVE DESIGN)     */}
      {/* ======================================================== */}
      {isWaveModalOpen && (
        <div 
          onClick={() => {
            const v = videoRef.current;
            if (v && v.paused) {
              v.play().then(() => setIsVideoPlaying(true)).catch(() => {});
            }
          }}
          className="fixed inset-0 z-[100] bg-black flex flex-col justify-between overflow-hidden select-none animate-fadeIn font-sans"
        >
          
          {/* Background Live Camera Video */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover absolute inset-0 z-0 ${
              isCameraActive && waveTab === 'scan' ? 'opacity-100' : 'opacity-0'
            }`}
            autoPlay
            playsInline
            muted
            // @ts-ignore
            webkit-playsinline="true"
            x5-playsinline="true"
          />

          {/* iOS-friendly Viewfinder Dark Overlay Mask (prevents WebKit 9999px box-shadow GPU crash) */}
          {waveTab === 'scan' && verdict.status === 'idle' && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
              <defs>
                <mask id="wave-cutout-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x="50%"
                    y="50%"
                    width="288"
                    height="288"
                    rx="44"
                    ry="44"
                    transform="translate(-144, -144)"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.65)" mask="url(#wave-cutout-mask)" />
            </svg>
          )}

          {/* TOP BAR: Close 'X' button, iPhone Cline Bell Test & Torch */}
          <div className="relative z-30 pt-10 sm:pt-8 px-6 flex items-center justify-between">
            {/* Top-Left Close Button (exact Wave style) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseWaveScanner();
              }}
              className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/60 transition-colors active:scale-90 cursor-pointer"
              title="Fermer le scanner"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Top-Right Controls: Cline Bell test & Torch */}
            <div className="flex items-center space-x-2">
              {/* iPhone Bell Cline Chime Test */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundSynthesizer.playSuccessBeep();
                }}
                className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-amber-300 flex items-center justify-center hover:bg-black/60 transition-colors active:scale-90 cursor-pointer"
                title="Tester le son cloche Cline iPhone 🔔"
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* Torch Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTorch();
                }}
                className={`w-11 h-11 rounded-full backdrop-blur-md border transition-colors flex items-center justify-center active:scale-90 cursor-pointer ${
                  torchOn
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/30'
                    : 'bg-black/40 text-white border-white/20 hover:bg-black/60'
                }`}
                title={torchOn ? 'Éteindre la torche' : 'Allumer la torche'}
              >
                {torchOn ? <Zap className="w-5 h-5 fill-slate-950" /> : <ZapOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* CENTER VIEWPORT: Viewfinder cutout or Verdict Screen */}
          <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 my-auto">
            
            {/* A. If Verdict is Active (Ticket Scanned!) */}
            {verdict.status !== 'idle' ? (
              <div className={`w-full max-w-sm rounded-[36px] p-7 border text-center flex flex-col items-center justify-center space-y-4 shadow-2xl animate-scaleUp ${
                verdict.status === 'valid'
                  ? 'bg-white/95 backdrop-blur-xl border-emerald-300 text-slate-900'
                  : 'bg-white/95 backdrop-blur-xl border-red-300 text-slate-900'
              }`}>
                {/* Big Circular Status Icon */}
                {verdict.status === 'valid' ? (
                  <div className="relative my-1">
                    <div className="w-24 h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/35">
                      <Check className="w-14 h-14 text-white stroke-[3.5]" />
                    </div>
                    <div className="absolute -inset-2 rounded-full border-4 border-emerald-400/40 animate-ping pointer-events-none" />
                  </div>
                ) : (
                  <div className="relative my-1">
                    <div className="w-24 h-24 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/35">
                      <AlertOctagon className="w-14 h-14 text-white stroke-[2.5]" />
                    </div>
                    <div className="absolute -inset-2 rounded-full border-4 border-red-400/40 animate-ping pointer-events-none" />
                  </div>
                )}

                {/* iPhone Cline Bell confirmation badge */}
                {verdict.status === 'valid' && (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black">
                    <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                    <span>Cloche Cline iPhone Confirmée 🔔</span>
                  </div>
                )}

                {/* Title & Message */}
                <div className="space-y-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    verdict.status === 'valid'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-red-100 text-red-900 border border-red-300'
                  }`}>
                    {verdict.status === 'valid' ? '✅ Passage Validé' : (verdict.status === 'used' ? '🚨 Ticket Déjà Consommé' : '⚠️ Refus')}
                  </span>

                  <h3 className={`text-2xl font-black ${
                    verdict.status === 'valid' ? 'text-emerald-950 font-cabinet' : 'text-red-950 font-cabinet'
                  }`}>
                    {verdict.status === 'valid' ? 'TICKET VALIDE' : (verdict.status === 'used' ? 'DÉJÀ CONSOMMÉ' : 'NON RECONNU')}
                  </h3>

                  <p className={`text-xs font-semibold ${
                    verdict.status === 'valid' ? 'text-emerald-800' : 'text-red-700'
                  }`}>
                    {verdict.message}
                  </p>
                </div>

                {/* Ticket Details */}
                {verdict.ticket && (
                  <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Étudiant</span>
                      <span className="font-bold text-slate-900">
                        {verdict.ticket.studentName} ({verdict.ticket.studentMatricule})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Plat Servi</span>
                      <span className="font-extrabold text-orange-600">
                        {verdict.ticket.dishName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Numéro de Ticket</span>
                      <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                        {verdict.ticket.ticketNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Heure</span>
                      <span className="font-mono text-slate-700">
                        {verdict.time || new Date().toLocaleTimeString('fr-FR')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Next Student Button */}
                <button
                  type="button"
                  onClick={() => {
                    setVerdict({ status: 'idle', message: '' });
                    startCamera();
                  }}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer ${
                    verdict.status === 'valid'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-orange-500/30'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>
                    {verdict.status === 'valid'
                      ? 'Scanner le ticket suivant'
                      : 'Scanner un autre ticket'}
                  </span>
                </button>
              </div>
            ) : waveTab === 'scan' ? (
              /* B. Live Viewfinder with Rounded Square Window (Exact Wave UI) */
              <div className="flex flex-col items-center">
                {/* Central Rounded Square Cutout with corner brackets and laser */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    const v = videoRef.current;
                    if (v && v.paused) {
                      v.play().then(() => setIsVideoPlaying(true)).catch(() => {});
                    } else if (!isCameraActive || !streamRef.current) {
                      startCamera();
                    }
                  }}
                  className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-[44px] border border-white/25 overflow-hidden flex items-center justify-center cursor-pointer pointer-events-auto"
                >
                  
                  {/* Sweeping Green Laser Line matching Wave scanner */}
                  <div className="absolute inset-x-3 h-1 bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400 rounded-full shadow-[0_0_14px_#10b981] animate-scanLaser pointer-events-none"></div>

                  {/* Corner indicator accents */}
                  <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-white/80 rounded-tl-xl pointer-events-none"></div>
                  <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-white/80 rounded-tr-xl pointer-events-none"></div>
                  <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-white/80 rounded-bl-xl pointer-events-none"></div>
                  <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-white/80 rounded-br-xl pointer-events-none"></div>
                </div>

                {/* Subtitle text matching Wave screenshot */}
                <p className="text-white text-sm sm:text-base font-medium text-center mt-7 drop-shadow-md px-4">
                  Scanner le code QR pour valider le ticket
                </p>

                {/* iOS Fallback Helper: If video stream paused by Safari, user can tap directly */}
                {!isVideoPlaying && isCameraActive && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const v = videoRef.current;
                      if (v) {
                        v.play().then(() => setIsVideoPlaying(true)).catch(() => {});
                      }
                    }}
                    className="mt-3 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold animate-pulse"
                  >
                    Touchez l'écran si l'image est noire 📷
                  </button>
                )}
              </div>
            ) : (
              /* C. Manual Input Tab in Wave Interface */
              <div className="w-full max-w-sm bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 text-white text-center space-y-4 shadow-2xl animate-scaleUp">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Saisie Manuelle</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Entrez le numéro du ticket (ex: 984917) ou le matricule étudiant.
                  </p>
                </div>
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Numéro de ticket..."
                    className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-2xl text-center font-mono text-base text-white tracking-widest focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Valider le passage
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* BOTTOM BAR: Wave Pill Switcher [ Scanner un code | Saisie manuelle ] */}
          <div className="relative z-30 pb-12 sm:pb-8 flex justify-center px-4">
            <div className="bg-black/80 backdrop-blur-xl border border-white/20 p-1.5 rounded-full flex items-center shadow-2xl">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setWaveTab('scan');
                  if (!isCameraActive || !streamRef.current || (videoRef.current && videoRef.current.paused)) {
                    startCamera();
                  }
                }}
                className={`px-5 py-2.5 rounded-full font-black text-xs transition-all cursor-pointer ${
                  waveTab === 'scan'
                    ? 'bg-white text-slate-950 shadow-md scale-100'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Scanner un code
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setWaveTab('manual');
                }}
                className={`px-5 py-2.5 rounded-full font-black text-xs transition-all cursor-pointer ${
                  waveTab === 'manual'
                    ? 'bg-white text-slate-950 shadow-md scale-100'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Saisie manuelle
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
};
