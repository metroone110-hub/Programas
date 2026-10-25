import React from 'react';
import { Utensils, Star, Clock, AlertCircle, CheckCircle2, Ticket } from 'lucide-react';
import { Dish } from '../types';

interface Props {
  dish: Dish;
  onOrder: (dish: Dish) => void;
}

export const DishCard: React.FC<Props> = ({ dish, onOrder }) => {
  return (
    <div className={`group bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
      dish.isAvailable
        ? 'border-slate-200/80 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/5'
        : 'border-slate-200 opacity-60'
    }`}>
      {/* Top Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={dish.imageUrl}
          alt={dish.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-xs">
            {dish.mealType === 'dejeuner' ? '☀️ Déjeuner (Midi)' : '🌙 Dîner (Soir)'}
          </span>
          {dish.category === 'plat_principal' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-500 text-white shadow-xs">
              Plat Chaud
            </span>
          )}
        </div>

        {/* Availability badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md ${
            dish.isAvailable
              ? 'bg-emerald-500/90 text-white'
              : 'bg-red-500/90 text-white'
          }`}>
            {dish.isAvailable ? 'En stock' : 'Rupture'}
          </span>
        </div>

        {/* Price tag on image */}
        <div className="absolute bottom-3 left-3 flex items-baseline space-x-2">
          <span className="text-xl font-black text-white font-cabinet drop-shadow-md">
            {dish.price} FCFA
          </span>
          {dish.regularPrice && (
            <span className="text-xs text-white/70 line-through">
              {dish.regularPrice} FCFA
            </span>
          )}
        </div>

        {/* Rating if available */}
        {dish.rating && (
          <div className="absolute bottom-3 right-3 flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-md text-amber-300 text-[11px] font-bold">
            <Star className="w-3 h-3 fill-amber-300" />
            <span>{dish.rating}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1 font-cabinet">
            {dish.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {dish.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-3">
            {dish.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-medium">
            Tarif subventionné CROU
          </div>

          <button
            onClick={() => onOrder(dish)}
            disabled={!dish.isAvailable}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 shadow-sm ${
              dish.isAvailable
                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Prendre ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
};
