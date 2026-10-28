import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  Star, 
  Flame, 
  ShieldCheck, 
  Utensils, 
  Check, 
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { Dish } from '../types';
import { ImageWithLoader } from './ImageWithLoader';

interface Props {
  dish: Dish | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (dish: Dish, quantity: number) => void;
  onInstantBuy: (dish: Dish, quantity: number) => void;
}

export const DishDetailModal: React.FC<Props> = ({
  dish,
  isOpen,
  onClose,
  onAddToCart,
  onInstantBuy
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);

  if (!isOpen || !dish) return null;

  const handleAdd = () => {
    onAddToCart(dish, quantity);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 700);
  };

  const handleBuy = () => {
    onInstantBuy(dish, quantity);
  };

  const totalMealPrice = quantity * 200; // Exact: 200 FCFA per meal!
  const normalPrice = quantity * (dish.regularPrice || 500);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-scaleUp">
        
        {/* Top Floating Controls */}
        <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
          <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-full pointer-events-auto">
            {dish.mealType === 'dejeuner' ? '☀️ Déjeuner (11h30 - 14h30)' : '🌙 Dîner (18h30 - 21h30)'}
          </span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors pointer-events-auto shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Image Presentation with Spiral Loader */}
        <div className="relative h-64 w-full bg-slate-900 overflow-hidden flex-shrink-0">
          <ImageWithLoader
            src={dish.imageUrl}
            alt={dish.name}
            className="w-full h-full"
            imgClassName="object-cover"
            spiralLabel="Chargement du plat..."
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
          
          {/* Subsidized badge on image */}
          <div className="absolute bottom-4 left-4 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white font-cabinet">
              200 FCFA
            </span>
            <span className="text-xs text-white/70 line-through">
              {dish.regularPrice || 500} FCFA
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
              -90% Subventionné
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-slate-900 font-cabinet">
                {dish.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {dish.description}
              </p>
            </div>

            {/* Stepper matching IMG_0875.webp */}
            <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200 flex-shrink-0">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-orange-600 hover:bg-white rounded-xl transition-colors font-bold"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-black text-sm text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-orange-600 hover:bg-white rounded-xl transition-colors font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {dish.tags.map((t, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-100 text-orange-800 text-xs font-semibold"
              >
                {t}
              </span>
            ))}
            {dish.calories && (
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>{dish.calories} kcal</span>
              </span>
            )}
          </div>

          {/* Details Guarantee */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center space-x-3 text-xs text-slate-600">
            <div className="p-2 bg-orange-100 text-orange-700 rounded-xl">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800 block">Formule Complète Étudiant UPGC</span>
              <span className="text-[11px] text-slate-500">Comprend le plat chaud, garniture et accompagnement au plateau.</span>
            </div>
          </div>
        </div>

        {/* Footer Actions matching IMG_0875.webp */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Total ({quantity} ticket{quantity > 1 ? 's' : ''})
            </span>
            <span className="text-xl font-black text-slate-900 font-cabinet">
              {totalMealPrice} <span className="text-xs font-bold text-orange-600">FCFA</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAdd}
              className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                addedAnimation
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white border-slate-300 hover:border-orange-500 text-slate-800 hover:text-orange-600'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Ajouté !</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ajouter</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBuy}
              className="px-5 py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95"
            >
              Acheter Direct
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
