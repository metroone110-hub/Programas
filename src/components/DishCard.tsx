import React, { useState } from 'react';
import { 
  Heart, 
  Plus, 
  Check, 
  Star 
} from 'lucide-react';
import { Dish } from '../types';
import { ImageWithLoader } from './ImageWithLoader';

interface Props {
  dish: Dish;
  onOrder: (dish: Dish) => void;
  onAddToCart?: (dish: Dish) => void;
  onSelectDetail?: (dish: Dish) => void;
}

export const DishCard: React.FC<Props> = ({ 
  dish, 
  onOrder, 
  onAddToCart,
  onSelectDetail 
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(dish);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 900);
    } else {
      onOrder(dish);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const getCategoryBadge = () => {
    switch (dish.category) {
      case 'plat_principal': return 'Plat Chaud';
      case 'entree': return 'Spécialité Ivoirienne';
      case 'dessert': return 'Dessert & Fraîcheur';
      case 'boisson': return 'Boisson Locale';
      default: return 'Plat Chaud';
    }
  };

  const getTimeBadge = () => {
    if (dish.mealType === 'dejeuner') return '11:30 - 14:30';
    if (dish.mealType === 'diner') return '18:30 - 21:30';
    return 'Midi & Soir';
  };

  return (
    <div 
      onClick={() => onSelectDetail ? onSelectDetail(dish) : onOrder(dish)}
      className={`group bg-white rounded-3xl border border-slate-200/90 hover:border-orange-400 p-2.5 sm:p-3 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer select-none ${
        dish.isAvailable ? '' : 'opacity-60'
      }`}
    >
      {/* 1. Top Mini-Header: Category Label + Favorite Heart (matching IMG_1199) */}
      <div className="flex items-center justify-between gap-1 mb-1.5 px-0.5">
        <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate max-w-[110px]">
          {getCategoryBadge()}
        </span>
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
          title="Ajouter aux favoris"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      {/* 2. Square Photo with Rounded Corners & Time Badge (matching IMG_1199) */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 shadow-xs">
        <ImageWithLoader
          src={dish.imageUrl}
          alt={dish.name}
          className="w-full h-full"
          imgClassName="group-hover:scale-106 transition-transform duration-500 object-cover"
          spiralLabel="Chargement..."
        />
        
        {/* Time Badge at bottom of image */}
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-[9px] font-mono text-white font-bold">
          {getTimeBadge()}
        </span>
      </div>

      {/* 3. Title & Rating Line (matching IMG_1199) */}
      <div className="mt-2 space-y-0.5">
        <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-orange-600 transition-colors truncate">
          {dish.name}
        </h4>
        <div className="flex items-center space-x-1 text-[10px] sm:text-[11px] text-slate-500">
          <span className="text-amber-500 font-bold">★ {dish.rating || '4.9'}</span>
          <span>•</span>
          <span className="font-medium text-slate-600">CROU-K</span>
        </div>
      </div>

      {/* 4. Bottom Price & Orange Round + Button (matching IMG_1199) */}
      <div className="mt-2.5 pt-1.5 flex items-center justify-between">
        <div>
          <div className="font-black text-xs sm:text-sm text-slate-900 font-cabinet leading-none">
            200 FCFA
          </div>
          <div className="text-[10px] text-slate-400 line-through mt-0.5 leading-none">
            {dish.regularPrice || 500} F
          </div>
        </div>

        <button
          type="button"
          onClick={handlePlusClick}
          disabled={!dish.isAvailable}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm transition-all active:scale-90 cursor-pointer ${
            justAdded 
              ? 'bg-emerald-600' 
              : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'
          }`}
          title="Ajouter au panier (200 FCFA)"
        >
          {justAdded ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};
