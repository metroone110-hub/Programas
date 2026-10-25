import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  AlertOctagon, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  RefreshCw, 
  Scan, 
  Upload, 
  ArrowRight,
  ShieldCheck,
  Search,
  Check
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [lastScannedText, setLastScannedText] = useState<string | null>(null);
  const [scanCooldown, setScanCooldown] = useState<boolean>(false);

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

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setVerdict({ status: 'idle', message: '' });

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La caméra n\'est pas supportée par ce navigateur.');
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iPhone Safari
        await videoRef.current.play();
      }

      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError') {
        setCameraError('Accès à la caméra refusé. Autorisez la caméra dans les réglages de votre navigateur ou utilisez le mode Photo IA.');
      } else {
        setCameraError(err.message || 'Impossible d\'activer la caméra en direct.');
      }
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Process and verify a decoded ticket text
  const processDecodedTicket = useCallback(async (rawText: string) => {
    if (!rawText || scanCooldown) return;

    setScanCooldown(true);
    setLastScannedText(rawText);

    // Extract ticket number & matricule from URL or raw text
    // Examples: https://crou.ci/verify?tkt=CROUK-2026-016278&mat=UPGC-2026-0842 or CROUK-2026-016278
    let ticketNum = rawText.trim();
    let mat = '';

    if (rawText.includes('tkt=')) {
      try {
        const url = new URL(rawText.startsWith('http') ? rawText : `https://${rawText}`);
        ticketNum = url.searchParams.get('tkt') || ticketNum;
        mat = url.searchParams.get('mat') || '';
      } catch {
        const match = rawText.match(/tkt=([A-Za-z0-9-_]+)/);
        if (match) ticketNum = match[1];
      }
    }

    // Call validation against database & fraud check
    const res = await verifyTurnstileTicket(ticketNum, mat);

    const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (res.status === 'valid' && res.ticket) {
      // 1. Play Wave scanner beep
      if (soundEnabled) {
        soundSynthesizer.playSuccessBeep();
        soundSynthesizer.speak(`Ticket validé ! ${res.ticket.dishName}`);
      }

      // 2. Record validation in daily ledger (repas validé + 1)
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
      // Fraud or already consumed!
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

    // Cooldown 2.5s before next scan
    setTimeout(() => {
      setScanCooldown(false);
    }, 2500);

  }, [scanCooldown, soundEnabled, onTicketValidated, onRefreshStats]);

  // Continuous Video Scan Loop with jsQR
  useEffect(() => {
    if (!isCameraActive) return;

    let isScanning = true;

    const scanFrame = () => {
      if (!isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && !scanCooldown) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Focus scan on central square viewfinder for maximum speed
          const size = Math.min(canvas.width, canvas.height) * 0.7;
          const startX = (canvas.width - size) / 2;
          const startY = (canvas.height - size) / 2;

          const imageData = ctx.getImageData(startX, startY, size, size);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (qrCode && qrCode.data) {
            processDecodedTicket(qrCode.data);
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
  }, [isCameraActive, scanCooldown, processDecodedTicket]);

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
              message: 'L\'IA n\'a pas pu identifier de ticket CROU valide sur cette photo. Essayez de rapprocher l\'objectif.'
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
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5 font-sans">
      
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCaptureAI}
        className="hidden"
      />

      {/* Header with Wave Scanner Title & Audio Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
            <Scan className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-base text-slate-900 font-cabinet">
                Scanner Borne Tourniquet CROU
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                Style Wave
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Détection automatique en temps réel avec bip sonore et validation IA.
            </p>
          </div>
        </div>

        {/* Controls */}
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

          {!isCameraActive ? (
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Activer Caméra Vidéo</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-2 cursor-pointer"
            >
              <CameraOff className="w-4 h-4" />
              <span>Arrêter Caméra</span>
            </button>
          )}
        </div>
      </div>

      {/* Camera Live Viewfinder Box */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-[4/3] sm:aspect-[16/9] max-h-[380px] flex items-center justify-center border-2 border-slate-900 shadow-inner">
        {/* Live Video Feed */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isCameraActive ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay
          playsInline
          muted
        />

        {/* Inactive State Overlay */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-md">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-300">Caméra vidéo en veille</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
                Cliquez sur « Activer Caméra Vidéo » pour scanner en direct comme sur l'application Wave.
              </p>
            </div>
            <button
              type="button"
              onClick={startCamera}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              Activer Caméra en Direct
            </button>
          </div>
        )}

        {/* Error message */}
        {cameraError && (
          <div className="absolute inset-x-4 top-4 p-3 bg-red-950/90 border border-red-500/50 rounded-2xl text-xs text-red-200 text-center backdrop-blur-md">
            {cameraError}
          </div>
        )}

        {/* Wave Scanner Viewfinder Overlay when Camera is Active */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Viewfinder Target Box */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-amber-400/40 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-amber-400 rounded-tl-2xl"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-amber-400 rounded-tr-2xl"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-amber-400 rounded-bl-2xl"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-amber-400 rounded-br-2xl"></div>

              {/* Sweeping Green Laser Line matching Wave scanner */}
              <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400 rounded-full shadow-[0_0_12px_#10b981] animate-scanLaser pointer-events-none"></div>

              {/* Central Aim Dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-amber-400/60 animate-ping"></span>
              </div>
            </div>

            {/* Hint label */}
            <div className="absolute bottom-4 px-4 py-1.5 bg-black/70 backdrop-blur-md rounded-full text-[11px] font-bold text-amber-300 border border-white/10 shadow-lg">
              Placez le QR Code de l'étudiant dans le cadre
            </div>
          </div>
        )}

      </div>

      {/* Real-time Verdict Announcement Card */}
      {verdict.status !== 'idle' && (
        <div className={`p-4 sm:p-5 rounded-3xl border text-xs animate-scaleUp flex items-start space-x-3.5 shadow-lg ${
          verdict.status === 'valid'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : 'bg-red-50 border-red-300 text-red-950 animate-bounce'
        }`}>
          {verdict.status === 'valid' ? (
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Check className="w-6 h-6 text-white stroke-[3]" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                verdict.status === 'valid'
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-red-200 text-red-900'
              }`}>
                {verdict.status === 'valid' ? '✅ Passage Validé' : '🚨 Alerte Tourniquet'}
              </span>
              {verdict.time && (
                <span className="text-[11px] text-slate-500 font-mono">
                  {verdict.time}
                </span>
              )}
            </div>

            <h4 className="text-sm sm:text-base font-extrabold mt-1 text-slate-900">
              {verdict.message}
            </h4>

            {verdict.ticket && (
              <div className="mt-2 pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-800">
                  Étudiant : <strong>{verdict.ticket.studentName}</strong> ({verdict.ticket.studentMatricule})
                </span>
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700">
                  {verdict.ticket.ticketNumber}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alternative Modes: Photo IA Google & Saisie Manuelle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
              <span>Analyse IA Google en cours...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Prendre Photo & Analyser avec l'IA Google</span>
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
              placeholder="Code ticket (ex: 016278)..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition-all shadow-xs active:scale-95 flex-shrink-0"
          >
            Valider
          </button>
        </form>
      </div>

    </div>
  );
};
