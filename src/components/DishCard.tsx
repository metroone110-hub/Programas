import React, { useState } from 'react';
import { 
  Star, 
  Plus, 
  Heart, 
  Check, 
  Sparkles,
  Ticket,
  Maximize2
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

  return (
    <div 
      onClick={() => onSelectDetail ? onSelectDetail(dish) : onOrder(dish)}
      className={`group bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer ${
        dish.isAvailable
          ? 'border-slate-200/90 hover:border-orange-400 hover:shadow-2xl hover:shadow-orange-500/10'
          : 'border-slate-200 opacity-60'
      }`}
    >
      {/* Top Image with Spiral Loader & Favorite Heart matching IMG_0875.webp */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
        <ImageWithLoader
          src={dish.imageUrl}
          alt={dish.name}
          className="w-full h-full"
          imgClassName="group-hover:scale-108 transition-transform duration-700 object-cover"
          spiralLabel="Chargement..."
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-white/95 backdrop-blur-md text-slate-800 shadow-xs">
            {dish.mealType === 'dejeuner' ? '☀️ Déjeuner' : '🌙 Dîner'}
          </span>
          {dish.category === 'plat_principal' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white shadow-xs">
              Plat Chaud
            </span>
          )}
        </div>

        {/* Favorite Heart Button matching IMG_0875.webp */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-red-500 flex items-center justify-center backdrop-blur-md transition-all shadow-xs"
          title="Ajouter aux favoris"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Price tag on image */}
        <div className="absolute bottom-3 left-3 flex items-baseline space-x-1.5">
          <span className="text-xl font-black text-white font-cabinet drop-shadow-md">
            200 FCFA
          </span>
          <span className="text-xs text-white/70 line-through">
            {dish.regularPrice || 2000} FCFA
          </span>
        </div>

        {/* Star Rating */}
        {dish.rating && (
          <div className="absolute bottom-3 right-3 flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-amber-300 text-[11px] font-bold">
            <Star className="w-3 h-3 fill-amber-300" />
            <span>{dish.rating}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1 font-cabinet">
            {dish.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {dish.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2.5">
            {dish.tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action footer with + button matching IMG_0875.webp */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-semibold">
            Ticket Repas CROU
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Quick Add to Cart button matching the orange + in IMG_0875.webp */}
            <button
              type="button"
              onClick={handlePlusClick}
              disabled={!dish.isAvailable}
              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold transition-all shadow-sm active:scale-90 ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30'
              }`}
              title="Ajouter au panier (200 FCFA)"
            >
              {justAdded ? (
                <Check className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
