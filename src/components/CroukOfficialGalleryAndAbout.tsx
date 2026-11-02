import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Utensils, 
  Calendar, 
  Award, 
  Maximize2, 
  X,
  GraduationCap,
  Clock,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export interface OfficialPhoto {
  url: string;
  title: string;
  description: string;
}

export const CROUK_OFFICIAL_PHOTOS: OfficialPhoto[] = [
  {
    url: 'https://www.croukorhogo.edu.ci/assets/images/restau/imagerestau3.jpg',
    title: 'Salle de Restauration Universitaire',
    description: 'Espace repas convivial et aménagé pour les étudiants de l\'UPGC'
  },
  {
    url: 'https://www.croukorhogo.edu.ci/assets/images/restau/img_3938-1-1024x683.jpg',
    title: 'Guichet de Distribution & Service',
    description: 'Comptoirs de service chaud et contrôle informatisé des tickets repas'
  },
  {
    url: 'https://www.croukorhogo.edu.ci/assets/images/restau/img_3955-1024x683.jpg',
    title: 'Vue d\'Ensemble du Réfectoire',
    description: 'Réfectoire principal du Campus 1 - UPGC Korhogo'
  }
];

export const CroukOfficialGalleryAndAbout: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<OfficialPhoto | null>(null);

  return (
    <section className="space-y-6 pt-4 pb-2 w-full max-w-full">
      
      {/* 1. GALERIE OFFICIELLE DES 3 PHOTOS DU RESTAU U CROU-K */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse"></span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 font-cabinet tracking-tight">
              Restaurant Universitaire • Photos Officielles CROU-K
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Installations officielles du Restaurant Universitaire UPGC
          </span>
        </div>

        {/* 3 Photos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {CROUK_OFFICIAL_PHOTOS.map((photo, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedImage(photo)}
              className="group relative rounded-3xl overflow-hidden bg-slate-900 aspect-[4/3] shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200/90 cursor-pointer"
            >
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                <div className="flex justify-end">
                  <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </div>

                <div className="space-y-0.5 text-white">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-orange-600/90 text-white mb-1 shadow-xs">
                    Photo {idx + 1}/3
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base leading-snug line-clamp-1 font-cabinet">
                    {photo.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 line-clamp-1 font-medium">
                    {photo.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. SECTION À PROPOS : UNIVERSITÉ PELEFORO GBON COULIBALY & CROU-K */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10 relative overflow-hidden space-y-6">
        
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Section Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center flex-shrink-0 shadow-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/30 uppercase tracking-wider">
                Histoire & Présentation
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white font-cabinet tracking-tight mt-1">
                À propos de l'Université Peleforo Gbon Coulibaly
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-amber-300 font-bold bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>CROU Korhogo Officiel</span>
          </div>
        </div>

        {/* Text Historique officiel demandé */}
        <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 text-slate-200 leading-relaxed text-sm sm:text-base font-normal">
          <p className="italic">
            « La création du CROU-K en 2012, consécutive à l’érection de l’URES en université de plein exercice et la prise officielle de fonction de son premier directeur Général M. Mamadou SORO dit Koulibaly en 2014 va mettre fin à cet état de fait. »
          </p>
        </div>

        {/* Informations sur le CROU-K (Capacité & Plats) */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-amber-400">
            <TrendingUp className="w-4 h-4" />
            <span>Chiffres Clés & Capacités du CROU-K</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Capacité d'accueil */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-2 hover:border-orange-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Capacité d'accueil</span>
                <Users className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  480
                </span>
                <span className="block text-xs text-slate-400 font-medium mt-0.5">
                  places assises
                </span>
              </div>
            </div>

            {/* Capacité actuelle d'accueil */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-2 hover:border-orange-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Capacité actuelle</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                  240
                </span>
                <span className="block text-xs text-slate-400 font-medium mt-0.5">
                  places disponibles
                </span>
              </div>
            </div>

            {/* Plats par Jour */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-2 hover:border-orange-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Par Jour</span>
                <Utensils className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  2.000
                </span>
                <span className="block text-xs text-emerald-400 font-medium mt-0.5">
                  plats servis / jour
                </span>
              </div>
            </div>

            {/* Plats par Mois */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-2 hover:border-orange-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Par Mois</span>
                <Calendar className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  60.000
                </span>
                <span className="block text-xs text-sky-300 font-medium mt-0.5">
                  plats servis / mois
                </span>
              </div>
            </div>

            {/* Plats par Année */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-2 hover:border-orange-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Par Année</span>
                <TrendingUp className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-orange-400 font-mono">
                  540.000
                </span>
                <span className="block text-xs text-slate-300 font-medium mt-0.5">
                  plats servis / an
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Lightbox Modal for Photo Preview */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col animate-scaleUp"
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full max-h-[75vh] bg-black flex items-center justify-center overflow-hidden">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="w-full h-auto max-h-[75vh] object-contain"
              />
            </div>

            <div className="p-4 sm:p-5 bg-slate-900 text-white">
              <h4 className="text-lg font-black font-cabinet">{selectedImage.title}</h4>
              <p className="text-xs text-slate-300 mt-1">{selectedImage.description}</p>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
