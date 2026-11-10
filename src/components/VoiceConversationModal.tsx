import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  MessageSquare, 
  PhoneOff, 
  Radio, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { GeminiLiveVoiceSession } from '../services/geminiLiveClient';
import { Dish } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToTextChat: () => void;
  dishes?: Dish[];
  studentName?: string;
}

export const VoiceConversationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSwitchToTextChat,
  dishes = [],
  studentName
}) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'interrupted' | 'error'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [userVolume, setUserVolume] = useState(0);
  const [modelVolume, setModelVolume] = useState(0);
  const [userTranscript, setUserTranscript] = useState('');
  const [modelTranscript, setModelTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);

  const sessionRef = useRef<GeminiLiveVoiceSession | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      if (sessionRef.current) {
        sessionRef.current.stop();
        sessionRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setDurationSec(0);
      setUserTranscript('');
      setModelTranscript('');
      setErrorMessage(null);
      return;
    }

    // Start voice session
    setErrorMessage(null);
    setUserTranscript('');
    setModelTranscript('Bonjour ! Je suis M. Kouassi du CROU Korhogo. Je vous écoute.');
    setDurationSec(0);

    const session = new GeminiLiveVoiceSession({
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'connected' || newStatus === 'listening') {
          setErrorMessage(null);
        }
      },
      onUserTranscript: (text) => {
        setUserTranscript(text);
      },
      onModelTranscript: (text) => {
        setModelTranscript(text);
      },
      onUserVolume: (vol) => {
        setUserVolume(vol);
      },
      onModelVolume: (vol) => {
        setModelVolume(vol);
      },
      onError: (err) => {
        setErrorMessage(err);
      }
    });

    sessionRef.current = session;
    session.start();

    timerRef.current = setInterval(() => {
      setDurationSec(prev => prev + 1);
    }, 1000);

    return () => {
      if (sessionRef.current) {
        sessionRef.current.stop();
        sessionRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleMute = () => {
    if (sessionRef.current) {
      const muted = sessionRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  const handleInterrupt = () => {
    if (sessionRef.current) {
      sessionRef.current.handleInterruption();
    }
  };

  const handleClose = () => {
    if (sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
    }
    onClose();
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Wave visualizer calculation
  const activeVolume = status === 'speaking' ? modelVolume : userVolume;
  const ringScale1 = 1 + activeVolume * 0.45;
  const ringScale2 = 1 + activeVolume * 0.85;
  const ringScale3 = 1 + activeVolume * 1.25;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full sm:max-w-md h-full sm:h-[680px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col justify-between sm:rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        {/* Ambient Glow Backdrop */}
        <div 
          className={`absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-30 ${
            status === 'speaking' 
              ? 'bg-amber-500' 
              : status === 'listening' 
              ? 'bg-emerald-500' 
              : 'bg-indigo-600'
          }`} 
        />
        <div 
          className={`absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-25 ${
            status === 'speaking' 
              ? 'bg-orange-600' 
              : status === 'listening' 
              ? 'bg-teal-500' 
              : 'bg-violet-600'
          }`} 
        />

        {/* Top Header Bar */}
        <div className="relative z-10 px-5 pt-6 pb-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">
                  M. Kouassi • CROU
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Live Voice
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>{formatTimer(durationSec)}</span>
                <span>•</span>
                <span>Gemini 3.8 Live</span>
              </div>
            </div>
          </div>

          {/* Prominent High-Contrast Close Button */}
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 shadow-md cursor-pointer flex-shrink-0"
            aria-label="Fermer la conversation vocale"
            title="Quitter l'appel"
          >
            <X className="w-5 h-5 text-white stroke-[2.5]" />
          </button>
        </div>

        {/* Center Visualizer & Interaction Stage */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-4">
          {/* Status Badge */}
          <div className="mb-6">
            {status === 'connecting' && (
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Connexion vocale en cours...</span>
              </div>
            )}
            {status === 'listening' && (
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-xs font-medium text-emerald-300 shadow-sm animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>À votre écoute... Parlez librement</span>
              </div>
            )}
            {status === 'speaking' && (
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-xs font-medium text-amber-300 shadow-sm">
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                <span>M. Kouassi répond de vive voix</span>
              </div>
            )}
            {status === 'interrupted' && (
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-500/40 text-xs font-medium text-indigo-300 shadow-sm">
                <span>Vous avez interrompu</span>
              </div>
            )}
            {status === 'error' && (
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-950/70 border border-rose-500/40 text-xs font-medium text-rose-300 shadow-sm">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Microphone non disponible</span>
              </div>
            )}
          </div>

          {/* Animated Pulsing Wave Sphere */}
          <div className="relative w-52 h-52 flex items-center justify-center my-2">
            {/* Outer expanding shockwave 3 */}
            <div 
              className={`absolute inset-0 rounded-full transition-transform duration-100 ease-out pointer-events-none opacity-20 ${
                status === 'speaking' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ transform: `scale(${ringScale3})` }}
            />
            {/* Middle shockwave 2 */}
            <div 
              className={`absolute inset-4 rounded-full transition-transform duration-100 ease-out pointer-events-none opacity-30 ${
                status === 'speaking' ? 'bg-orange-500' : 'bg-teal-400'
              }`}
              style={{ transform: `scale(${ringScale2})` }}
            />
            {/* Inner shockwave 1 */}
            <div 
              className={`absolute inset-8 rounded-full transition-transform duration-100 ease-out pointer-events-none opacity-40 ${
                status === 'speaking' ? 'bg-rose-500' : 'bg-emerald-400'
              }`}
              style={{ transform: `scale(${ringScale1})` }}
            />

            {/* Core Orb */}
            <div 
              className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 ${
                status === 'speaking'
                  ? 'bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-500 shadow-orange-500/50 scale-105'
                  : status === 'listening'
                  ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 shadow-emerald-500/40'
                  : 'bg-gradient-to-tr from-slate-700 via-slate-800 to-slate-900 shadow-black'
              }`}
            >
              {status === 'speaking' ? (
                <div className="flex items-center space-x-1.5 h-8">
                  <span className="w-1.5 bg-white rounded-full animate-wave1 h-7" />
                  <span className="w-1.5 bg-white rounded-full animate-wave2 h-5" />
                  <span className="w-1.5 bg-white rounded-full animate-wave3 h-8" />
                  <span className="w-1.5 bg-white rounded-full animate-wave2 h-4" />
                </div>
              ) : isMuted ? (
                <MicOff className="w-9 h-9 text-rose-300" />
              ) : (
                <Mic className="w-9 h-9 text-white animate-pulse" />
              )}
              <span className="text-[10px] font-bold text-white/90 mt-1 uppercase tracking-wider">
                {status === 'speaking' ? 'Voix Live' : isMuted ? 'Muet' : 'Micro Actif'}
              </span>
            </div>
          </div>

          {/* Real-time Dynamic Transcription Box */}
          <div className="w-full max-w-sm mt-4 bg-slate-800/60 backdrop-blur-md rounded-2xl p-3.5 border border-slate-700/60 shadow-inner flex flex-col gap-2 min-h-[92px] max-h-[120px] overflow-y-auto scrollbar-none text-left">
            {userTranscript ? (
              <div className="flex items-start space-x-2 text-xs">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex-shrink-0">
                  Vous
                </span>
                <p className="text-slate-200 italic line-clamp-2">
                  "{userTranscript}"
                </p>
              </div>
            ) : null}

            {modelTranscript ? (
              <div className="flex items-start space-x-2 text-xs">
                <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold text-[10px] flex-shrink-0">
                  CROU
                </span>
                <p className="text-slate-300 leading-snug">
                  {modelTranscript}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs italic">
                Posez votre question à voix haute : tickets, repas, Wave, horaires...
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="mt-3 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-[11px] text-rose-200 text-center">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Bottom Control Actions */}
        <div className="relative z-10 px-6 pt-3 pb-4 border-t border-white/5 bg-slate-900/60 flex flex-col gap-3">
          {/* Main Controls Row */}
          <div className="flex items-center justify-center space-x-4">
            {/* Mute/Unmute */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all active:scale-95 border ${
                isMuted
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title={isMuted ? 'Activer le micro' : 'Couper le micro'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span className="text-[10px] font-semibold mt-1">
                {isMuted ? 'Muet' : 'Micro'}
              </span>
            </button>

            {/* Interrupt / Speak Button */}
            {status === 'speaking' ? (
              <button
                type="button"
                onClick={handleInterrupt}
                className="flex items-center space-x-2 px-5 h-14 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 transition-all active:scale-95 shadow-md font-semibold text-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Interrompre</span>
              </button>
            ) : null}

            {/* End Call Button */}
            <button
              type="button"
              onClick={handleClose}
              className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white transition-all active:scale-95 shadow-lg shadow-rose-600/30"
              title="Terminer l'appel"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="text-[10px] font-semibold mt-1">Quitter</span>
            </button>
          </div>

          {/* Switch to Text Chat Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                handleClose();
                onSwitchToTextChat();
              }}
              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Préférer le clavardage texte</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
