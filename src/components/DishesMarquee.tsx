import React from 'react';
import { Sparkles, Utensils, Eye, Plus } from 'lucide-react';
import { Dish } from '../types';

interface Props {
  dishes: Dish[];
  onSelectDish: (dish: Dish) => void;
  onAddToCart?: (dish: Dish) => void;
}

export const DishesMarquee: React.FC<Props> = ({ dishes, onSelectDish, onAddToCart }) => {
  // Use first 6 dishes for the 6 photos carousel
  const marqueeDishes = dishes.slice(0, 6);
  
  if (marqueeDishes.length === 0) return null;

  // Duplicate for smooth infinite loop
  const duplicatedList = [...marqueeDishes, ...marqueeDishes];

  return (
    <section className="space-y-3 pt-4 pb-2 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 font-cabinet">
            Galerie & Spécialités du Restau. U
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
            6 Plats du Jour
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          Défilement automatique • Cliquez pour commander
        </span>
      </div>

      {/* Marquee viewport with gradient mask on edges */}
      <div className="relative w-full overflow-hidden rounded-2xl py-1">
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>

        <div className="animate-marquee space-x-3.5 flex items-center">
          {duplicatedList.map((dish, idx) => (
            <div
              key={`${dish.id}-${idx}`}
              onClick={() => onSelectDish(dish)}
              className="group relative w-48 sm:w-56 h-36 sm:h-40 rounded-2xl overflow-hidden bg-slate-900 shadow-md border border-slate-200/80 cursor-pointer flex-shrink-0 transition-transform hover:scale-103 active:scale-98"
            >
              <img
                src={dish.imageUrl}
                alt={dish.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

              {/* Price Badge */}
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2 py-0.5 rounded-lg bg-orange-600/90 text-white font-black text-[10px] shadow-sm backdrop-blur-xs font-mono">
                  {dish.price} FCFA
                </span>
              </div>

              {/* Meal Tag */}
              <div className="absolute top-2.5 right-2.5">
                <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-white font-semibold text-[9px] backdrop-blur-xs">
                  {dish.mealType === 'dejeuner' ? '☀️ Midi' : '🌙 Soir'}
                </span>
              </div>

              {/* Dish Info at Bottom */}
              <div className="absolute bottom-2.5 inset-x-2.5 flex items-end justify-between">
                <div className="min-w-0 pr-2">
                  <h4 className="font-extrabold text-xs text-white leading-snug truncate group-hover:text-amber-300 transition-colors">
                    {dish.name}
                  </h4>
                  <p className="text-[10px] text-slate-300 truncate">
                    {dish.tags[0] || 'Spécialité UPGC'}
                  </p>
                </div>

                {onAddToCart && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(dish);
                    }}
                    className="p-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-sm flex items-center justify-center transition-transform active:scale-90 flex-shrink-0"
                    title="Ajouter au panier"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
