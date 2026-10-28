import React, { useState } from 'react';
import { 
  Heart, 
  Info,
  Calendar,
  Clock,
  Sparkles,
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
      case 'plat_principal': return '🍛 Plat Chaud';
      case 'entree': return '🥗 Entrée / Accompagnement';
      case 'dessert': return '🍧 Dessert & Fruits';
      case 'boisson': return '🥤 Boisson Locale';
      default: return '🍛 Plat Chaud';
    }
  };

  const getTimeBadge = () => {
    if (dish.mealType === 'dejeuner') return '11:30 - 14:30';
    if (dish.mealType === 'diner') return '18:30 - 21:00';
    return '11:30 - 14:30';
  };

  const todayStr = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(new Date());

  const hasAdminPhoto = Boolean(
    dish.imageUrl && 
    dish.imageUrl.trim().length > 0 && 
    !dish.imageUrl.includes('placeholder') &&
    !dish.imageUrl.includes('unsplash.com')
  );

  return (
    <div 
      onClick={() => onSelectDetail && onSelectDetail(dish)}
      className={`group bg-white rounded-3xl border border-slate-200/90 hover:border-orange-400 p-3 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer select-none ${
        dish.isAvailable ? '' : 'opacity-65'
      }`}
    >
      {/* 1. Header: Date + Heure Service + Favori */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-500">
          <Calendar className="w-3 h-3 text-orange-500" />
          <span className="capitalize">{todayStr}</span>
          <span>•</span>
          <span className="text-slate-700 font-mono">{getTimeBadge()}</span>
        </div>
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
          title="Ajouter aux favoris"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      {/* 2. Photo si uploadée par l'Admin, sinon Présentation Typographique & Emblème CROU-K */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 shadow-xs flex items-center justify-center">
        {hasAdminPhoto ? (
          <ImageWithLoader
            src={dish.imageUrl}
            alt={dish.name}
            className="w-full h-full"
            imgClassName="group-hover:scale-106 transition-transform duration-500 object-cover"
            spiralLabel="Chargement..."
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900 p-4 flex flex-col justify-between text-white relative">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-orange-500 text-white shadow-xs">
                {dish.mealType === 'dejeuner' ? '☀️ Déjeuner' : '🌙 Dîner'}
              </span>
              <span className="text-[10px] font-bold text-amber-300">
                CROU-K
              </span>
            </div>

            <div className="my-auto text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 mx-auto flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                {dish.category === 'dessert' ? '🍧' : dish.category === 'entree' ? '🥗' : '🍲'}
              </div>
              <h5 className="font-extrabold text-xs text-white line-clamp-2 px-1">
                {dish.name}
              </h5>
            </div>

            <div className="text-[9px] text-center text-slate-300 flex items-center justify-center space-x-1">
              <UtensilsCrossed className="w-3 h-3 text-orange-400" />
              <span>Cuisine Centrale UPGC</span>
            </div>
          </div>
        )}

        {/* Badge catégorie flottant en bas */}
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[9px] font-medium text-white shadow-sm">
          {getCategoryBadge()}
        </span>
      </div>

      {/* 3. Titre du Plat & Ingrédients / Description */}
      <div className="mt-2.5 space-y-1">
        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1 font-cabinet">
          {dish.name}
        </h4>
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {dish.description || 'Plat cuisiné et servi par le restaurant universitaire du CROU Korhogo.'}
        </p>
      </div>

      {/* 4. Mention Subvention & Accessibilité Ticket (AUCUN bouton d'achat de plat individuel) */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-1 text-slate-700">
          <span className="font-black text-xs text-slate-900">200 FCFA</span>
          <span className="text-[10px] text-slate-400">/ ration</span>
        </div>

        <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-orange-50 text-orange-700 text-[10px] font-bold">
          <Info className="w-3 h-3" />
          <span>Ticket requis</span>
        </div>
      </div>
    </div>
  );
};
