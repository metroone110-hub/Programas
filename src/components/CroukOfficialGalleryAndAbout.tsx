import React, { useState } from 'react';
import {
  Users,
  Utensils,
  Calendar,
  Maximize2,
  X,
  GraduationCap,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export interface OfficialPhoto {
  url: string;
  title: string;
  description: string;
}

export const CROUK_OFFICIAL_PHOTOS: OfficialPhoto[] = [
  {
    url: 'https://www.croukorhogo.edu.ci/assets/images/restau/imagerestau3.jpg',
    title: 'Salle de Restauration Universitaire',
    description: "Espace repas aménagé pour les étudiants de l'UPGC"
  },
  {
    url: 'https://www.croukorhogo.edu.ci/assets/images/restau/img_3938-1-1024x683.jpg',
    title: 'Guichet de Distribution & Service',
    description: 'Comptoirs de service chaud et contrôle des tickets'
  },
  {
    url: 'https://www.croukorhogo.edu.ci/assets/images/restau/img_3955-1024x683.jpg',
    title: "Vue d'Ensemble du Réfectoire",
    description: 'Réfectoire principal du Campus 1 · UPGC Korhogo'
  }
];

export const CroukOfficialGalleryAndAbout: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<OfficialPhoto | null>(null);

  return (
    <section className="space-y-5 pt-2 w-full max-w-full">
      <div className="space-y-3">
        <div className="px-0.5">
          <h3 className="text-[20px] font-extrabold text-[var(--ios-fg)] tracking-tight">
            Restaurant Universitaire CROU-K
          </h3>
          <p className="text-[14px] text-[var(--ios-fg-secondary)]">
            Installations officielles du Campus UPGC
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {CROUK_OFFICIAL_PHOTOS.map((photo, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSelectedImage(photo);
              }}
              aria-label={`Agrandir ${photo.title}`}
              className="ios-btn-spring group relative rounded-[24px] overflow-hidden bg-zinc-900 aspect-[4/3] shadow-sm border border-[var(--ios-border)] text-left"
            >
              <img
                src={photo.url}
                alt={photo.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-between p-4">
                <div className="flex justify-end">
                  <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-80">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-white">
                  <h4 className="font-bold text-[15px] leading-snug line-clamp-1">{photo.title}</h4>
                  <p className="text-[12px] text-white/75 line-clamp-1 mt-0.5">{photo.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Campus UPGC Key Facts Card */}
      <div className="ios-card p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--ios-border)]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[14px] bg-[#ea580c]/12 text-[#ea580c] flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[18px] font-extrabold text-[var(--ios-fg)] leading-tight">
                Université Peleforo Gbon Coulibaly
              </h3>
              <p className="text-[13px] text-[var(--ios-fg-secondary)] flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>CROU Korhogo Officiel</span>
              </p>
            </div>
          </div>
        </div>

        <p className="text-[15px] text-[var(--ios-fg-secondary)] leading-relaxed">
          « La création du CROU-K en 2012, consécutive à l’érection de l’URES en université de plein exercice et la prise officielle de fonction de son premier directeur Général M. Mamadou SORO dit Koulibaly en 2014 va mettre fin à cet état de fait. »
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Capacité', val: '480', sub: 'places assises', icon: Users },
            { label: 'Par Jour', val: '2 000', sub: 'plats servis', icon: Utensils },
            { label: 'Par Mois', val: '60 000', sub: 'plats servis', icon: Calendar },
            { label: 'Par An', val: '540 000', sub: 'plats servis', icon: TrendingUp }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="p-3.5 rounded-[18px] bg-[var(--ios-bg)] border border-[var(--ios-border)] space-y-1">
                <div className="flex items-center justify-between text-[var(--ios-fg-secondary)] text-[12px] font-semibold">
                  <span>{stat.label}</span>
                  <Icon className="w-3.5 h-3.5 text-[#ea580c]" />
                </div>
                <div className="text-[22px] font-extrabold text-[var(--ios-fg)] tabular-nums">
                  {stat.val}
                </div>
                <div className="text-[12px] text-[var(--ios-fg-secondary)]">{stat.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-zinc-900 rounded-[28px] overflow-hidden border border-white/15 shadow-2xl flex flex-col"
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              aria-label="Fermer l'image"
              className="ios-btn-spring absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full max-h-[72vh] bg-black flex items-center justify-center overflow-hidden">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[72vh] object-contain"
              />
            </div>

            <div className="p-5 text-white">
              <h4 className="text-[18px] font-extrabold">{selectedImage.title}</h4>
              <p className="text-[14px] text-zinc-300 mt-1">{selectedImage.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
