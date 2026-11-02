import React, { useState } from 'react';
import { 
  Heart, 
  Info,
  Calendar,
  Clock,
  UtensilsCrossed
} from 'lucide-react';
import { Dish } from '../types';
import { ImageWithLoader } from './ImageWithLoader';

interface Props {
  dish: Dish;
  onSelectDetail?: (dish: Dish) => void;
}

export const DishCard: React.FC<Props> = ({ 
  dish, 
  onSelectDetail 
}) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const getCategoryBadge = () => {
    switch (dish.category) {
      case 'plat_principal': return 'Plat chaud';
      case 'entree': return 'Entrée';
      case 'dessert': return 'Dessert';
      case 'boisson': return 'Boisson';
      default: return 'Plat chaud';
    }
  };

  const getTimeBadge = () => {
    if (dish.mealType === 'dejeuner') return '11h30 – 14h30';
    if (dish.mealType === 'diner') return '18h30 – 21h00';
    return '11h30 – 14h30';
  };

  const hasAdminPhoto = Boolean(
    dish.imageUrl && 
    dish.imageUrl.trim().length > 0 && 
    !dish.imageUrl.includes('placeholder') &&
    !dish.imageUrl.includes('unsplash.com')
  );

  return (
    <div 
      onClick={() => onSelectDetail && onSelectDetail(dish)}
      className={`group bg-white rounded-2xl border border-slate-200 hover:border-orange-500/60 p-3.5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer select-none ${
        dish.isAvailable ? '' : 'opacity-65'
      }`}
    >
      {/* 1. Header: Heure Service + Favori */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
          <span className="text-slate-800 font-semibold">{dish.mealType === 'dejeuner' ? 'Midi' : 'Soir'}</span>
          <span>·</span>
          <span>{getTimeBadge()}</span>
        </div>
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
          title="Ajouter aux favoris"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      {/* 2. Photo si uploadée par l'Admin, sinon Présentation Typographique & Emblème CROU-K */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-900 shadow-xs flex items-center justify-center">
        {hasAdminPhoto ? (
          <ImageWithLoader
            src={dish.imageUrl}
            alt={dish.name}
            className="w-full h-full"
            imgClassName="group-hover:scale-105 transition-transform duration-500 object-cover"
            spiralLabel="Chargement..."
          />
        ) : (
          <div className="w-full h-full bg-slate-900 p-4 flex flex-col justify-between text-white relative">
            <div className="flex items-center justify-between">
              <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-600 text-white">
                {dish.mealType === 'dejeuner' ? 'Midi' : 'Soir'}
              </span>
              <span className="text-xs font-medium text-slate-400">
                CROU-K
              </span>
            </div>

            <div className="my-auto text-center space-y-1.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 mx-auto flex items-center justify-center text-white">
                <UtensilsCrossed className="w-6 h-6 text-orange-400" />
              </div>
              <h5 className="font-bold text-sm text-white line-clamp-2 px-1">
                {dish.name}
              </h5>
            </div>

            <div className="text-xs text-center text-slate-400">
              Restaurant Universitaire
            </div>
          </div>
        )}

        {/* Badge catégorie flottant en bas */}
        <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-xs text-xs font-medium text-white shadow-xs">
          {getCategoryBadge()}
        </span>
      </div>

      {/* 3. Titre du Plat & Description */}
      <div className="mt-3 space-y-1">
        <h4 className="font-bold text-base text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
          {dish.name}
        </h4>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {dish.description || 'Plat cuisiné et servi par le restaurant universitaire du CROU Korhogo.'}
        </p>
      </div>

      {/* 4. Mention Subvention & Accessibilité Ticket */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-baseline space-x-1">
          <span className="font-bold text-base text-slate-900">200 FCFA</span>
          <span className="text-xs text-slate-500">/ repas</span>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          1 ticket repas
        </span>
      </div>
    </div>
  );
};
