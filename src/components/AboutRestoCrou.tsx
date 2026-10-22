import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Users, 
  UtensilsCrossed, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  Sparkles, 
  GraduationCap, 
  Info,
  Maximize2,
  X,
  MapPin,
  Clock
} from 'lucide-react';

interface CarouselImage {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
}

const RESTO_PHOTOS: CarouselImage[] = [
  {
    src: '/assets/aistudio/IMG_0902_17c9ab10.jpeg',
    alt: 'Restaurant CROU-K UPGC Korhogo',
    title: 'Façade officielle & Enseigne',
    subtitle: 'Restaurant CROU-K de l’Université Peleforo Gbon Coulibaly'
  },
  {
    src: '/assets/aistudio/IMG_0901_b483426a.jpeg',
    alt: 'Grande salle du réfectoire',
    title: 'Grande Salle de Restauration',
    subtitle: 'Capacité d’accueil de 480 places assises théoriques (240 actuelles)'
  },
  {
    src: '/assets/aistudio/IMG_0900_10bcfb40.jpeg',
    alt: 'Préau et file d’attente des étudiants',
    title: 'File d’Attente & Préau Extérieur',
    subtitle: 'Accès fluide et sécurisé pour les étudiants sous les coursives ombragées'
  },
  {
    src: '/assets/aistudio/IMG_0905_9e62b386.png',
    alt: 'Étudiants déjeunant au Restaurant CROU-K',
    title: 'Cadre de Restauration Universitaire',
    subtitle: 'Un espace convivial pour le déjeuner et le dîner des étudiants'
  },
  {
    src: '/assets/aistudio/IMG_0904_1f92c1a0.png',
    alt: 'Plateau repas équilibré CROU-K',
    title: 'Plateaux Repas Étudiants',
    subtitle: 'Repas complets subventionnés à 200 FCFA avec formule équilibrée'
  },
  {
    src: '/assets/aistudio/IMG_0903_04829811.jpeg',
    alt: 'Allées et éclairage de nuit du CROU-K',
    title: 'Allées & Ambiance Nocturne',
    subtitle: 'Éclairage et accès sécurisés pour le service dîner (18h30 - 21h30)'
  }
];

export const AboutRestoCrou: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoomImage, setZoomImage] = useState<CarouselImage | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance 1-by-1 every 3.8 seconds
  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % RESTO_PHOTOS.length);
    }, 3800);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % RESTO_PHOTOS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + RESTO_PHOTOS.length) % RESTO_PHOTOS.length);
  };

  return (
    <section className="mb-12 rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-5 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-orange-50">
              <Building2 className="w-3.5 h-3.5" />
              À Propos du Restaurant U
            </span>
            <span className="text-xs bg-orange-950/40 px-2.5 py-0.5 rounded-full font-bold text-amber-200">
              CROU-K • UPGC
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
            Restaurant Universitaire CROU-K
          </h2>
          <p className="text-xs sm:text-sm text-orange-100 font-medium mt-1">
            Centre Régional des Œuvres Universitaires de Korhogo
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* SECTION 1: CAPACITÉ & STATISTIQUES OFFICIELLES (User requirement #1) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Capacités d'accueil & Production
            </h3>
          </div>

          {/* Places assises */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/70 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block uppercase">
                  Capacité d'accueil
                </span>
                <span className="text-2xl font-black text-slate-900">
                  480
                </span>
                <span className="text-xs font-bold text-orange-700 ml-1.5">
                  places assises
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center font-black">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block uppercase">
                  Capacité actuelle d'accueil
                </span>
                <span className="text-2xl font-black text-amber-700">
                  240
                </span>
                <span className="text-xs font-bold text-amber-800 ml-1.5">
                  places
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Nombre de plats (Jour, Mois, Année) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-3">
              <UtensilsCrossed className="w-4 h-4 text-orange-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase">
                Nombres de plats servis
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Par Jour
                </span>
                <span className="text-base sm:text-xl font-black text-slate-900 block mt-0.5">
                  2.000
                </span>
                <span className="text-[10px] text-orange-600 font-bold">
                  plats / jour
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Par Mois
                </span>
                <span className="text-base sm:text-xl font-black text-slate-900 block mt-0.5">
                  60.000
                </span>
                <span className="text-[10px] text-orange-600 font-bold">
                  plats / mois
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Par Année
                </span>
                <span className="text-base sm:text-xl font-black text-slate-900 block mt-0.5">
                  540.000
                </span>
                <span className="text-[10px] text-orange-600 font-bold">
                  plats / an
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: HISTORIQUE UPGC & CROU-K (User requirement #2) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm border border-slate-700/60 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-amber-400">
            <GraduationCap className="w-5 h-5 shrink-0" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">
              Université Peleforo Gbon Coulibaly
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
            « La création du CROU-K en 2012, consécutive à l’érection de l’URES en université de plein exercice et la prise officielle de fonction de son premier directeur Général M. Mamadou SORO dit Koulibaly en 2014 va mettre fin à cet état de fait. »
          </p>

          <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              Campus Universitaire UPGC • Korhogo, Côte d'Ivoire
            </span>
            <span className="bg-white/10 text-slate-200 font-bold px-2 py-0.5 rounded-full text-[10px]">
              Service Public
            </span>
          </div>
        </div>

        {/* SECTION 3: AUTOMATED 1-BY-1 PHOTO CAROUSEL (User requirement #3) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Galerie Photos du Restaurant ({RESTO_PHOTOS.length} photos)
              </h3>
            </div>

            {/* Play / Pause Toggle & Controls */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-full">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? "Mettre en pause le défilement" : "Reprendre le défilement"}
                className="touch-press w-7 h-7 rounded-full bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs transition-all cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-orange-600 fill-orange-600" />}
              </button>
              <button
                onClick={handlePrev}
                title="Photo précédente"
                className="touch-press w-7 h-7 rounded-full bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNext}
                title="Photo suivante"
                className="touch-press w-7 h-7 rounded-full bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs transition-all cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Carousel Viewport (1 by 1 sliding smoothly) */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm aspect-16/10 sm:aspect-21/9 group">
            {RESTO_PHOTOS.map((photo, index) => {
              const isActive = index === currentIndex;
              return (
                <div
                  key={photo.src}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="w-full h-full object-cover select-none"
                    loading={index === 0 ? "eager" : "lazy"}
                  />

                  {/* Gradient Overlay for text clarity */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Bar with Counter & Fullscreen trigger */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                    <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full font-bold text-[11px] border border-white/10 shadow-xs">
                      Photo {index + 1} / {RESTO_PHOTOS.length}
                    </span>

                    <button
                      onClick={() => setZoomImage(photo)}
                      title="Agrandir la photo"
                      className="touch-press bg-black/60 backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center text-white border border-white/15 hover:bg-black/80 transition-all cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bottom Caption */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h4 className="font-black text-sm sm:text-base leading-tight drop-shadow-md">
                      {photo.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-200 line-clamp-1 drop-shadow-xs mt-0.5">
                      {photo.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Quick left/right overlay buttons */}
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dots Indicator & Auto-Play Status */}
          <div className="flex items-center justify-between mt-3 px-1">
            <div className="flex items-center gap-1.5">
              {RESTO_PHOTOS.map((_, dotIndex) => (
                <button
                  key={dotIndex}
                  onClick={() => setCurrentIndex(dotIndex)}
                  title={`Aller à la photo ${dotIndex + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    dotIndex === currentIndex
                      ? 'w-6 h-2 bg-orange-600'
                      : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>

            <span className="text-[11px] text-slate-400 font-medium">
              {isPlaying ? 'Défilement automatique 1 à 1 actif' : 'En pause'}
            </span>
          </div>
        </div>
      </div>

      {/* Lightbox Fullscreen Modal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <div className="w-full max-w-3xl flex justify-between items-center text-white mb-2">
            <div>
              <h4 className="font-bold text-sm sm:text-base">{zoomImage.title}</h4>
              <p className="text-xs text-slate-300">{zoomImage.subtitle}</p>
            </div>
            <button
              onClick={() => setZoomImage(null)}
              className="touch-press w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div 
            className="w-full max-w-3xl max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomImage.src}
              alt={zoomImage.alt}
              className="w-full h-full max-h-[80vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </section>
  );
};
