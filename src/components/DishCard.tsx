import React, { useState } from 'react';
import { Heart, UtensilsCrossed } from 'lucide-react';
import { Dish } from '../types';
import { ImageWithLoader } from './ImageWithLoader';
import { triggerHaptic } from '../utils/haptics';

interface Props {
  dish: Dish;
  onSelectDetail?: (dish: Dish) => void;
}

export const DishCard: React.FC<Props> = ({ dish, onSelectDetail }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setIsFavorite(!isFavorite);
  };

  const getCategoryBadge = () => {
    switch (dish.category) {
      case 'plat_principal':
        return 'Plat chaud';
      case 'entree':
        return 'Entrée';
      case 'dessert':
        return 'Dessert';
      case 'boisson':
        return 'Boisson';
      default:
        return 'Plat chaud';
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
      role="button"
      tabIndex={0}
      onClick={() => {
        triggerHaptic('light');
        onSelectDetail?.(dish);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectDetail?.(dish);
        }
      }}
      className={`ios-btn-spring group ios-card rounded-[24px] p-3.5 flex flex-col justify-between cursor-pointer select-none shadow-xs hover:border-[#ea580c]/50 transition-colors ${
        dish.isAvailable ? '' : 'opacity-65'
      }`}
    >
      {/* Top Meta + Favorite */}
      <div className="flex items-center justify-between gap-1 mb-2.5">
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--ios-fg-secondary)] font-medium truncate">
          <span className="text-[var(--ios-fg)] font-bold">
            {dish.mealType === 'dejeuner' ? 'Midi' : 'Soir'}
          </span>
          <span>·</span>
          <span className="truncate">{getTimeBadge()}</span>
        </div>
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? `Retirer ${dish.name} des favoris` : `Ajouter ${dish.name} aux favoris`}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ios-fg-secondary)] hover:text-red-500 flex-shrink-0"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      {/* Dish Artwork */}
      <div className="relative w-full aspect-square rounded-[18px] overflow-hidden bg-zinc-900 flex items-center justify-center">
        {hasAdminPhoto ? (
          <ImageWithLoader
            src={dish.imageUrl}
            alt={dish.name}
            className="w-full h-full"
            imgClassName="group-hover:scale-105 transition-transform duration-500 object-cover"
            spiralLabel="Chargement..."
          />
        ) : (
          <div className="w-full h-full bg-zinc-900 p-3.5 flex flex-col justify-between text-white">
            <div className="flex items-center justify-between text-[11px]">
              <span className="px-2 py-0.5 rounded-md font-bold bg-[#ea580c] text-white">
                {dish.mealType === 'dejeuner' ? 'Midi' : 'Soir'}
              </span>
              <span className="text-zinc-400 font-medium">CROU-K</span>
            </div>

            <div className="my-auto text-center space-y-2">
              <div className="w-11 h-11 rounded-[14px] bg-white/10 mx-auto flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-[#ea580c]" />
              </div>
              <h5 className="font-bold text-[14px] text-white line-clamp-2 px-1 leading-snug">
                {dish.name}
              </h5>
            </div>

            <span className="text-[11px] text-center text-zinc-400">Resto U UPGC</span>
          </div>
        )}

        <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-[10px] bg-black/75 backdrop-blur-xs text-[11px] font-semibold text-white">
          {getCategoryBadge()}
        </span>
      </div>

      {/* Dish Title */}
      <div className="mt-3 space-y-1">
        <h4 className="font-bold text-[16px] text-[var(--ios-fg)] group-hover:text-[#ea580c] transition-colors line-clamp-1">
          {dish.name}
        </h4>
        <p className="text-[13px] text-[var(--ios-fg-secondary)] line-clamp-2 leading-snug">
          {dish.description || 'Plat cuisiné et servi au restaurant universitaire du CROU Korhogo.'}
        </p>
      </div>

      {/* Price */}
      <div className="mt-3 pt-2.5 border-t border-[var(--ios-border)] flex items-baseline justify-between">
        <span className="font-extrabold text-[16px] text-[#ea580c] tabular-nums">
          200 FCFA
        </span>
        <span className="text-[12px] text-[var(--ios-fg-secondary)] font-medium">
          1 ticket
        </span>
      </div>
    </div>
  );
};
