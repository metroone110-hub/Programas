import React from 'react';
import { X, Flame, Ticket, Calendar, Clock, Info, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dish } from '../types';
import { ImageWithLoader } from './ImageWithLoader';
import { triggerHaptic } from '../utils/haptics';

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
  onAddToCart,
  onInstantBuy
}) => {
  const todayStr = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  const hasAdminPhoto = Boolean(
    dish?.imageUrl &&
      dish.imageUrl.trim().length > 0 &&
      !dish.imageUrl.includes('placeholder') &&
      !dish.imageUrl.includes('unsplash.com')
  );

  return (
    <AnimatePresence>
      {isOpen && dish && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-hidden select-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 360, mass: 0.9 }}
            className="relative z-10 w-full sm:max-w-md bg-[var(--ios-surface)] text-[var(--ios-fg)] rounded-t-[30px] sm:rounded-[30px] shadow-2xl border-t sm:border border-[var(--ios-border)] overflow-hidden flex flex-col max-h-[90dvh]"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
          >
            {/* Hero Image */}
            <div className="relative h-60 w-full bg-zinc-900 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {hasAdminPhoto ? (
                <ImageWithLoader
                  src={dish.imageUrl}
                  alt={dish.name}
                  className="w-full h-full"
                  imgClassName="object-cover"
                  spiralLabel="Chargement du plat..."
                />
              ) : (
                <div className="w-full h-full bg-zinc-900 p-6 flex flex-col justify-between text-white">
                  <span className="text-[12px] font-bold text-[#ea580c] uppercase tracking-wider">
                    CROU Korhogo · Cuisine Officielle
                  </span>
                  <div className="text-center space-y-2">
                    <h4 className="text-[20px] font-extrabold text-white line-clamp-2">
                      {dish.name}
                    </h4>
                  </div>
                  <span className="text-[12px] text-zinc-400 text-center">
                    Restaurant Universitaire UPGC
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

              {/* Close button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                aria-label="Fermer les détails du plat"
                className="ios-btn-spring absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center backdrop-blur-md border border-white/20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Price on image */}
              <div className="absolute bottom-4 left-5 flex items-baseline gap-2.5 text-white">
                <span className="text-[28px] font-extrabold tracking-tight tabular-nums">
                  200 FCFA
                </span>
                <span className="text-[14px] text-white/70 line-through tabular-nums">
                  500 FCFA
                </span>
                <span className="text-[12px] font-bold text-emerald-400">
                  Subventionné
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <div className="flex items-center gap-2 text-[13px] text-[#ea580c] font-bold mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="capitalize">{todayStr}</span>
                  <span>·</span>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{dish.mealType === 'dejeuner' ? '11h30 – 14h30' : '18h30 – 21h00'}</span>
                </div>

                <h3 className="text-[24px] font-extrabold tracking-tight leading-tight">
                  {dish.name}
                </h3>
                <p className="text-[16px] text-[var(--ios-fg-secondary)] mt-1.5 leading-relaxed">
                  {dish.description || 'Plat cuisiné selon les normes sanitaires et nutritionnelles du CROU Korhogo.'}
                </p>
              </div>

              {dish.calories && (
                <div className="flex items-center gap-2 text-[14px] text-[var(--ios-fg-secondary)] font-semibold">
                  <Flame className="w-4 h-4 text-[#ea580c]" />
                  <span>{dish.calories} kcal estimées</span>
                </div>
              )}

              <div className="p-4 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[20px] flex items-start gap-3">
                <Info className="w-5 h-5 text-[#ea580c] flex-shrink-0 mt-0.5" />
                <p className="text-[14px] text-[var(--ios-fg-secondary)] leading-snug">
                  Les plats sont servis sur présentation d'un <strong className="text-[var(--ios-fg)]">Ticket Repas CROU (200 FCFA)</strong> au tourniquet.
                </p>
              </div>
            </div>

            {/* Bottom Sheet Actions */}
            <div className="px-5 pt-3 flex items-center gap-2.5 border-t border-[var(--ios-border)]">
              {onAddToCart && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onAddToCart(dish, 1);
                    onClose();
                  }}
                  aria-label="Ajouter au panier"
                  className="ios-btn-spring w-14 min-h-[56px] rounded-[20px] bg-[var(--ios-bg)] border border-[var(--ios-border)] text-[var(--ios-fg)] flex items-center justify-center flex-shrink-0"
                >
                  <ShoppingBag className="w-5 h-5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onInstantBuy?.(dish, 1);
                }}
                className="ios-btn-spring flex-1 min-h-[56px] px-5 bg-[#ea580c] hover:bg-[#d94d07] text-white font-bold text-[17px] rounded-[20px] shadow-md flex items-center justify-center gap-2"
              >
                <Ticket className="w-5 h-5" />
                <span>Acheter un ticket (200 F)</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
