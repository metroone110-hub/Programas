import React from 'react';
import { 
  X, 
  Flame, 
  Utensils, 
  Ticket,
  Calendar,
  Clock,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Dish } from '../types';
import { ImageWithLoader } from './ImageWithLoader';

interface Props {
  dish: Dish | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (dish: Dish, quantity: number) => void;
  onInstantBuy?: (dish: Dish, quantity: number) => void;
}

export const DishDetailModal: React.FC<Props> = ({
  dish,
  isOpen,
  onClose,
  onInstantBuy
}) => {
  if (!isOpen || !dish) return null;

  const handleBuyTicket = () => {
    if (onInstantBuy) {
      onInstantBuy(dish, 1);
    }
  };

  const todayStr = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  const serviceTime = dish.mealType === 'dejeuner' ? '11h30 - 14h30' : '18h30 - 21h00';

  const hasAdminPhoto = Boolean(
    dish.imageUrl && 
    dish.imageUrl.trim().length > 0 && 
    !dish.imageUrl.includes('placeholder') &&
    !dish.imageUrl.includes('unsplash.com')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-scaleUp">
        
        {/* Top Floating Controls */}
        <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
          <span className="px-3 py-1 bg-black/70 backdrop-blur-md text-white text-xs font-bold rounded-full pointer-events-auto">
            {dish.mealType === 'dejeuner' ? '☀️ Déjeuner (11h30 - 14h30)' : '🌙 Dîner (18h30 - 21h00)'}
          </span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-colors pointer-events-auto shadow-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Presentation */}
        <div className="relative h-60 w-full bg-slate-900 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {hasAdminPhoto ? (
            <ImageWithLoader
              src={dish.imageUrl}
              alt={dish.name}
              className="w-full h-full"
              imgClassName="object-cover"
              spiralLabel="Chargement du plat..."
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-950 via-orange-950 to-slate-900 p-6 flex flex-col justify-between text-white">
              <span className="text-xs font-black text-amber-400">
                CROU Korhogo • Cuisine Officielle
              </span>
              <div className="text-center space-y-2">
                <span className="text-4xl block">
                  {dish.category === 'dessert' ? '🍧' : dish.category === 'entree' ? '🥗' : '🍲'}
                </span>
                <h4 className="text-lg font-black font-cabinet text-white line-clamp-2">
                  {dish.name}
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 text-center">
                Photo facultative • Menu publié par l'Administration
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20 pointer-events-none"></div>
          
          {/* Subsidized badge on image */}
          <div className="absolute bottom-4 left-4 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white font-cabinet">
              200 FCFA
            </span>
            <span className="text-xs text-white/70 line-through">
              500 FCFA
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
              Subventionné État CI
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-orange-600 font-bold mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span className="capitalize">{todayStr}</span>
              <span>•</span>
              <Clock className="w-3.5 h-3.5 ml-1" />
              <span>{serviceTime}</span>
            </div>

            <h3 className="text-xl font-black text-slate-900 font-cabinet">
              {dish.name}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {dish.description || 'Plat cuisiné selon les normes sanitaires et nutritionnelles du CROU Korhogo.'}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-100 text-orange-800 text-xs font-semibold">
              {dish.category === 'plat_principal' ? '🍛 Plat Chaud' : dish.category === 'dessert' ? '🍧 Dessert' : '🥗 Entrée'}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
              Distribution Restaurant Universitaire UPGC
            </span>
            {dish.calories && (
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>{dish.calories} kcal</span>
              </span>
            )}
          </div>

          {/* Consultation Note */}
          <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-950 block">Modalité de service :</span>
              <span className="text-[11px] leading-relaxed">
                Les plats ne s'achètent pas individuellement. Vous devez simplement posséder un <strong>Ticket Repas CROU (200 FCFA)</strong> à faire scanner à la borne ou au tourniquet du réfectoire.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={handleBuyTicket}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Ticket className="w-4 h-4" />
            <span>Acheter un Ticket Repas (200 FCFA)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
