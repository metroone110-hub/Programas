import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Share2, 
  CheckCircle2, 
  Sparkles, 
  Ticket, 
  QrCode, 
  Clock, 
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onActionClick?: () => void; // e.g. open buy ticket modal
}

interface Scene {
  id: number;
  duration: number; // in seconds
  title: string;
  badge: string;
  subtitle: string;
  voiceover: string;
  image: string;
  highlightColor: string;
  keyFeature: string;
}

const SCENES: Scene[] = [
  {
    id: 1,
    duration: 6.5,
    title: "Fini les longues files sous le soleil !",
    badge: "Resto U 1 • Campus UPGC",
    subtitle: "Avant, obtenir un ticket repas papier prenait des heures sous la chaleur de Korhogo...",
    voiceover: "Étudiant à l'UPGC ? Fini le calvaire des longues rangées sous le soleil pour manger au restaurant universitaire !",
    image: "/assets/crouk/photo_2_corridor_queue.jpg",
    highlightColor: "from-amber-600 via-orange-600 to-red-600",
    keyFeature: "⏰ Gain de temps garanti : 0 attente au guichet"
  },
  {
    id: 2,
    duration: 7,
    title: "Programas : La billetterie dans ta poche",
    badge: "Numérique • Officiel CROU-K",
    subtitle: "Connecte-toi en 3 secondes avec ton numéro de matricule étudiant UPGC.",
    voiceover: "Découvre Programas, l'application officielle du CROU Korhogo. Ton pass repas étudiant s'active instantanément avec ton matricule !",
    image: "/assets/crouk/photo_4_facade_resto_u.jpg",
    highlightColor: "from-orange-600 via-amber-600 to-yellow-500",
    keyFeature: "🎓 Connexion directe sans mot de passe complexe"
  },
  {
    id: 3,
    duration: 7,
    title: "Un repas complet à seulement 200 FCFA",
    badge: "Tarif Subventionné par l'État",
    subtitle: "Attiéké poisson, Sauce graine, Foutou, Riz au gras... préparés avec soin par le CROU.",
    voiceover: "Consulte le menu du jour affiché par la direction et profite de repas complets et équilibrés au tarif subventionné de 200 FCFA.",
    image: "/assets/aistudio/IMG_1105_38a8c9d0.jpeg",
    highlightColor: "from-emerald-600 via-teal-600 to-cyan-600",
    keyFeature: "🍽️ Tarif unique protégé : Strictement 200 FCFA"
  },
  {
    id: 4,
    duration: 6.5,
    title: "Paiement instantané Wave & Mobile Money",
    badge: "Paiement Sécurisé Jeko API",
    subtitle: "Règlement en 1 clic par Wave, Orange Money, MTN MoMo, Moov ou Djamo.",
    voiceover: "Règle tes tickets directement avec Wave ou ton compte Mobile Money. La confirmation est immédiate et sans tracas !",
    image: "/assets/aistudio/IMG_1213_589dc8ca.png",
    highlightColor: "from-sky-600 via-blue-600 to-indigo-600",
    keyFeature: "⚡ Validation en 3 secondes chrono sur mobile"
  },
  {
    id: 5,
    duration: 7.5,
    title: "Bip au tourniquet & Bon appétit !",
    badge: "Scanner Optique Instantané",
    subtitle: "Présente ton QR Code officiel devant le lecteur optique pour retirer ton plateau repas.",
    voiceover: "Ton ticket électronique avec QR code infalsifiable est prêt ! Présente-le au tourniquet, récupère ton plateau et régale-toi !",
    image: "/assets/crouk/photo_6_etudiant_repas.jpg",
    highlightColor: "from-emerald-500 via-green-600 to-teal-700",
    keyFeature: "✅ QR Code infalsifiable • Passage ultra-fluide"
  }
];

export const ProgramasPromoVideoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onActionClick
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0); // 0 to 100% of current scene
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  const currentScene = SCENES[currentSceneIndex];

  // Sound effects generator using Web Audio API (zero external audio dependency)
  const playSoundEffect = (type: 'beep' | 'success' | 'click' | 'transition') => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'beep') {
        // Tourniquet optical scanner chime (high pitch happy confirmation)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime); // D6
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'success') {
        // Chime for ticket completion
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'transition') {
        // Gentle scene transition swoop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
      }
    } catch {}
  };

  // Video loop ticker
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const intervalTimeMs = 50;
    const totalSceneMs = currentScene.duration * 1000;
    const stepIncrement = (intervalTimeMs / totalSceneMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next scene
          if (currentSceneIndex < SCENES.length - 1) {
            setCurrentSceneIndex((idx) => idx + 1);
            playSoundEffect('transition');
            return 0;
          } else {
            // Reached the end: pause and throw victory confetti
            setIsPlaying(false);
            playSoundEffect('success');
            try {
              confetti({
                particleCount: 70,
                spread: 60,
                origin: { y: 0.6 }
              });
            } catch {}
            return 100;
          }
        }
        return prev + stepIncrement;
      });
    }, intervalTimeMs);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, currentSceneIndex, currentScene.duration]);

  // Special sound effect on scene 5 (Tourniquet scan simulation)
  useEffect(() => {
    if (currentSceneIndex === 4 && isPlaying) {
      const scanTimer = setTimeout(() => {
        playSoundEffect('beep');
      }, 1800);
      return () => clearTimeout(scanTimer);
    }
  }, [currentSceneIndex, isPlaying]);

  if (!isOpen) return null;

  const handleNextScene = () => {
    if (currentSceneIndex < SCENES.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
      setProgress(0);
      playSoundEffect('transition');
    }
  };

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(prev => prev - 1);
      setProgress(0);
      playSoundEffect('transition');
    }
  };

  const handleSelectScene = (index: number) => {
    setCurrentSceneIndex(index);
    setProgress(0);
    playSoundEffect('transition');
  };

  const handleRestart = () => {
    setCurrentSceneIndex(0);
    setProgress(0);
    setIsPlaying(true);
    playSoundEffect('transition');
  };

  const handleShare = () => {
    const shareText = `🍽️ Découvrez "Programas" : L'application officielle du Restaurant Universitaire CROU Korhogo (UPGC). Billetterie rapide & tickets subventionnés à 200 FCFA !\n🔗 ${window.location.origin}`;
    if (navigator.share) {
      navigator.share({
        title: 'Programas • CROU Korhogo Resto U',
        text: shareText,
        url: window.location.origin
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn select-none font-sans">
      
      {/* Container simulating a vertical Smartphone (Reels/TikTok 9:16 aspect ratio) */}
      <div className="relative w-full max-w-[390px] h-[92vh] max-h-[820px] bg-black rounded-[42px] shadow-2xl border-4 border-slate-800 flex flex-col overflow-hidden text-white">
        
        {/* Dynamic Island Mockup */}
        <div className="absolute top-2.5 inset-x-0 z-40 flex justify-center pointer-events-none">
          <div className="w-28 h-6 bg-black rounded-full border border-white/10 flex items-center justify-between px-3">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            <span className="text-[9px] font-mono font-bold text-amber-300">CROU-K HD</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
          </div>
        </div>

        {/* Top Segmented Story Bars (Reels/Stories style) */}
        <div className="absolute top-10 inset-x-0 z-30 px-3 flex items-center space-x-1.5">
          {SCENES.map((s, idx) => (
            <div 
              key={s.id}
              onClick={() => handleSelectScene(idx)}
              className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden cursor-pointer"
            >
              <div 
                className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                style={{
                  width: idx < currentSceneIndex 
                    ? '100%' 
                    : idx === currentSceneIndex 
                      ? `${progress}%` 
                      : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Controls: Scene Badge, Mute, Close */}
        <div className="absolute top-14 inset-x-0 z-30 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/90 text-white shadow-md border border-amber-400/30">
              {currentScene.badge}
            </span>
            <span className="text-[10px] font-mono text-slate-300 bg-black/40 px-2 py-0.5 rounded-full">
              {currentSceneIndex + 1}/{SCENES.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors cursor-pointer"
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-300" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors cursor-pointer"
              title="Fermer la vidéo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAIN VIDEO CANVAS / BACKGROUND VISUAL */}
        <div className="relative flex-1 w-full overflow-hidden bg-slate-900">
          
          {/* Background Image with Slow Ambient Ken-Burns Zoom */}
          <div className="absolute inset-0">
            <img 
              src={currentScene.image} 
              alt={currentScene.title}
              className="w-full h-full object-cover animate-kenburns scale-105 transition-all duration-1000"
            />
            {/* Dark & Vibrant Ambient Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/30"></div>
            <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/80"></div>
          </div>

          {/* SCENE SPECIFIC DYNAMIC MOTION GRAPHICS */}
          
          {/* Scene 1: Corridor queue & Sun icon */}
          {currentSceneIndex === 0 && (
            <div className="absolute inset-x-4 top-28 flex flex-col items-center text-center space-y-3 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 backdrop-blur-md flex items-center justify-center shadow-2xl animate-bounce">
                <Clock className="w-8 h-8 text-amber-400" />
              </div>
              <div className="px-3 py-1 rounded-full bg-red-600/80 text-white text-[11px] font-black uppercase tracking-wider shadow-lg">
                Problème : Les longues files sous le soleil
              </div>
            </div>
          )}

          {/* Scene 2: Matricule Card Mockup */}
          {currentSceneIndex === 1 && (
            <div className="absolute inset-x-6 top-24 flex flex-col items-center animate-fadeIn">
              <div className="w-full bg-black/80 border border-white/20 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center space-x-2">
                    <img src="/icon.svg" alt="Programas" className="w-6 h-6 rounded-md" />
                    <span className="text-xs font-bold text-white font-cabinet">Pass Resto U</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Matricule Étudiant :</span>
                  <div className="px-3 py-2 bg-white/10 rounded-xl font-mono text-sm text-amber-300 font-bold tracking-widest flex items-center justify-between">
                    <span>UPGC-2026-0842</span>
                    <span className="text-[10px] text-emerald-400">Vérifié ✓</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scene 3: Subvention 200 FCFA Badge */}
          {currentSceneIndex === 2 && (
            <div className="absolute inset-x-4 top-24 flex flex-col items-center animate-fadeIn">
              <div className="px-5 py-3 rounded-3xl bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-2xl border-2 border-white/30 text-center animate-pulse">
                <span className="text-[10px] uppercase font-bold tracking-widest block opacity-90">Tarif Universitaire Protégé</span>
                <span className="text-3xl font-black font-cabinet tracking-tight">200 FCFA</span>
                <span className="text-[11px] font-semibold block mt-0.5">Déjeuner ou Dîner complet</span>
              </div>
            </div>
          )}

          {/* Scene 4: Wave Payment Animation */}
          {currentSceneIndex === 3 && (
            <div className="absolute inset-x-6 top-24 flex flex-col items-center space-y-3 animate-fadeIn">
              <div className="w-20 h-20 rounded-3xl bg-white p-2 shadow-2xl border-2 border-sky-400 flex items-center justify-center animate-scaleUp">
                <img src="/assets/aistudio/IMG_1213_589dc8ca.png" alt="Wave" className="w-full h-full object-contain rounded-2xl" />
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Paiement Sécurisé en 1 Clic</span>
              </div>
            </div>
          )}

          {/* Scene 5: Authentic Ticket QR Code & Laser Scanner */}
          {currentSceneIndex === 4 && (
            <div className="absolute inset-x-6 top-20 flex flex-col items-center animate-fadeIn">
              <div className="relative w-full max-w-[240px] bg-white text-slate-900 rounded-2xl p-3 shadow-2xl border-2 border-emerald-500 overflow-hidden">
                {/* Laser scan line animation */}
                <div 
                  className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse"
                  style={{
                    top: `${(progress * 1.5) % 95}%`,
                    transition: 'top 0.1s linear'
                  }}
                ></div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                  <span className="text-[10px] font-black text-orange-600 font-cabinet">CROU-KORHOGO</span>
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">VALIDE</span>
                </div>

                <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden border border-slate-200 p-1 bg-white flex items-center justify-center">
                  <img src="/assets/aistudio/IMG_1038_80198fc0.jpeg" alt="Ticket QR" className="w-full h-full object-cover rounded-lg" />
                </div>

                <div className="text-center mt-2">
                  <span className="text-[11px] font-mono font-black text-slate-900 block">CROUK-2026-016278</span>
                  <span className="text-[9px] text-emerald-600 font-bold">PASSAGE AUTORISÉ AU TOURNIQUET</span>
                </div>
              </div>
            </div>
          )}

          {/* Invisible Click Zones (Tap left = prev, tap right = next, tap center = pause/play) */}
          <div className="absolute inset-0 z-20 flex">
            <div 
              className="w-1/3 h-full cursor-pointer" 
              onClick={handlePrevScene}
              title="Scène précédente"
            />
            <div 
              className="w-1/3 h-full cursor-pointer flex items-center justify-center" 
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause' : 'Lecture'}
            >
              {!isPlaying && (
                <div className="w-16 h-16 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-2xl animate-scaleUp">
                  <Play className="w-8 h-8 fill-white ml-1" />
                </div>
              )}
            </div>
            <div 
              className="w-1/3 h-full cursor-pointer" 
              onClick={handleNextScene}
              title="Scène suivante"
            />
          </div>

          {/* BOTTOM OVERLAY: TITLE, SUBTITLES & CALL TO ACTION */}
          <div className="absolute inset-x-0 bottom-0 z-30 p-5 pt-8 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col justify-end space-y-3">
            
            {/* Key feature pill */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md self-start text-[11px] font-bold text-amber-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{currentScene.keyFeature}</span>
            </div>

            {/* Scene Headline */}
            <h3 className="text-lg sm:text-xl font-black font-cabinet leading-tight tracking-tight text-white">
              {currentScene.title}
            </h3>

            {/* Synchronized Voice-Over Karaoke Subtitle Card */}
            <div className="p-3 bg-white/10 border border-white/15 rounded-2xl backdrop-blur-md">
              <div className="flex items-start space-x-2">
                <span className="text-sm">🎙️</span>
                <p className="text-xs text-slate-100 font-medium leading-relaxed italic">
                  « {currentScene.voiceover} »
                </p>
              </div>
            </div>

            {/* Action Bar (Play/Pause, Prev/Next, Share, CTA) */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Reprendre'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>

                <button
                  type="button"
                  onClick={handleRestart}
                  className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
                  title="Recommencer depuis le début"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
                  title="Partager la vidéo sur WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Main CTA: Acheter un ticket ou tester */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onActionClick) onActionClick();
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>Prendre mon Ticket (200 F)</span>
              </button>
            </div>

            {/* Copied notification feedback */}
            {copiedLink && (
              <div className="text-center text-[10px] font-bold text-emerald-400 animate-fadeIn">
                ✓ Lien de la publicité copié dans le presse-papier !
              </div>
            )}

          </div>

        </div>

        {/* Home Bar Indicator (iPhone style) */}
        <div className="h-4 bg-black flex items-center justify-center">
          <div className="w-28 h-1 bg-white/30 rounded-full"></div>
        </div>

      </div>

    </div>
  );
};
