import React, { useState } from 'react';
import { Camera, MapPin, X, Eye } from 'lucide-react';

export interface CanteenPhotoItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  tag: string;
  highlight?: boolean;
}

export const CANTEEN_ATMOSPHERE_PHOTOS: CanteenPhotoItem[] = [
  {
    id: 'photo_crouk_1',
    title: 'Visite de la Direction & Accueil Étudiants',
    subtitle: 'La Direction du CROU Korhogo sur le terrain avec les étudiants au Resto U',
    imageUrl: '/assets/crouk/photo_1_directrice_queue.jpeg',
    tag: 'CROU-K UPGC Officiel',
    highlight: true
  },
  {
    id: 'photo_crouk_2',
    title: 'File d\'Attente sous les Arcades',
    subtitle: 'Étudiants en rang ordonné devant l\'entrée du restaurant universitaire',
    imageUrl: '/assets/crouk/photo_2_corridor_queue.jpg',
    tag: 'Accès Resto U'
  },
  {
    id: 'photo_crouk_3',
    title: 'Grande Salle de Restauration',
    subtitle: 'Service de midi au réfectoire et dégustation des repas subventionnés',
    imageUrl: '/assets/crouk/photo_3_refectoire_salle.jpg',
    tag: 'Salle & Réfectoire'
  },
  {
    id: 'photo_crouk_4',
    title: 'Restaurant Univ. Peleforo Gon Coulibaly',
    subtitle: 'Façade officielle et allées principales du campus universitaire de Korhogo',
    imageUrl: '/assets/crouk/photo_4_facade_resto_u.jpg',
    tag: 'Entrée Principale',
    highlight: true
  },
  {
    id: 'photo_crouk_5',
    title: 'Ambiance Nocturne & Dîner au Resto U',
    subtitle: 'Couloirs illuminés et dîner des étudiants après les cours du soir',
    imageUrl: '/assets/crouk/photo_5_campus_nuit.jpg',
    tag: 'Service du Soir'
  },
  {
    id: 'photo_crouk_6',
    title: 'Satisfaction & Convivialité au Repas',
    subtitle: 'Un étudiant savoure son plat chaud complet au Restaurant Universitaire',
    imageUrl: '/assets/crouk/photo_6_etudiant_repas.jpg',
    tag: 'Vie Étudiante'
  }
];

interface Props {
  onPhotoClick?: (photo: CanteenPhotoItem) => void;
}

export const DishesMarquee: React.FC<Props> = ({ onPhotoClick }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<CanteenPhotoItem | null>(null);

  // Duplicate for smooth seamless infinite scroll
  const duplicatedList = [...CANTEEN_ATMOSPHERE_PHOTOS, ...CANTEEN_ATMOSPHERE_PHOTOS];

  const handleCardClick = (photo: CanteenPhotoItem) => {
    setSelectedPhoto(photo);
    if (onPhotoClick) onPhotoClick(photo);
  };

  return (
    <section className="space-y-3 pt-6 pb-2 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-ping"></div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 font-cabinet">
            Ambiance & Vie au Resto U (UPGC)
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-900 border border-orange-200">
            6 Photos Officielles
          </span>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Défilement continu • Étudiants & Restaurant Universitaire
        </span>
      </div>

      {/* Marquee viewport with gradient mask on edges */}
      <div className="relative w-full overflow-hidden rounded-3xl py-1">
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-slate-100 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-slate-100 to-transparent z-10 pointer-events-none"></div>

        <div className="animate-marquee space-x-4 flex items-center">
          {duplicatedList.map((photo, idx) => (
            <div
              key={`${photo.id}-${idx}`}
              onClick={() => handleCardClick(photo)}
              className="group relative w-64 sm:w-72 h-44 sm:h-48 rounded-2xl overflow-hidden bg-slate-950 shadow-md border border-slate-200/90 cursor-pointer flex-shrink-0 transition-transform hover:scale-103 active:scale-98 gpu-layer"
            >
              <img
                src={photo.imageUrl}
                alt={photo.title}
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              
              {/* Dark Gradient Overlay for optimal readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10"></div>

              {/* Tag Badge */}
              <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
                <span className={`px-2 py-0.5 rounded-lg text-white font-extrabold text-[10px] shadow-sm backdrop-blur-xs font-mono flex items-center space-x-1 ${
                  photo.highlight ? 'bg-orange-600 border border-amber-300/40' : 'bg-black/60 border border-white/20'
                }`}>
                  <Camera className="w-3 h-3" />
                  <span>{photo.tag}</span>
                </span>
              </div>

              {/* Zoom Icon indicator */}
              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-7 h-7 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-sm">
                  <Eye className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Photo Title & Caption at Bottom */}
              <div className="absolute bottom-2.5 inset-x-3 space-y-0.5">
                <h4 className="font-black text-xs text-white leading-tight truncate group-hover:text-amber-300 transition-colors">
                  {photo.title}
                </h4>
                <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed">
                  {photo.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIGHTBOX MODAL TO VIEW FULL PHOTO */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-slate-100 space-y-0 animate-scaleUp flex flex-col"
          >
            <div className="relative aspect-4/3 w-full bg-slate-950 overflow-hidden">
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-xs cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-3">
                <span className="px-2.5 py-1 rounded-full bg-orange-600 text-white text-xs font-bold shadow-sm">
                  {selectedPhoto.tag}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-2">
              <h3 className="text-base font-black text-slate-900 font-cabinet">
                {selectedPhoto.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedPhoto.subtitle}
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  <span>Campus UPGC Korhogo (Côte d'Ivoire)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
