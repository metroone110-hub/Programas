import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dish, UserProfile } from '../types';
import { ImageWithLoader } from './ImageWithLoader';
import { triggerHaptic } from '../utils/haptics';

export interface CartItem {
  dish: Dish;
  quantity: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (dishId: string, quantity: number) => void;
  onRemoveItem: (dishId: string) => void;
  onClearCart?: () => void;
  onCheckout: () => void;
  user: UserProfile | null;
  onOpenTransfer?: () => void;
}

export const CartDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  user,
  onOpenTransfer
}) => {
  const totalMealCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = totalMealCount * 200;
  const feesAmount = totalMealCount * 10;
  const grandTotal = totalAmount + feesAmount;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end overflow-hidden select-none">
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
            className="relative z-10 w-full sm:max-w-md bg-[var(--ios-surface)] text-[var(--ios-fg)] rounded-t-[30px] sm:rounded-none sm:rounded-l-[30px] shadow-2xl border-t sm:border-l border-[var(--ios-border)] flex flex-col max-h-[88dvh] sm:max-h-full"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--ios-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] bg-[#ea580c] text-white flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[18px]">Panier CROU</h3>
                  <p className="text-[13px] text-[var(--ios-fg-secondary)]">
                    {totalMealCount} ticket{totalMealCount > 1 ? 's' : ''} · 200 FCFA / unité
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer le panier"
                className="ios-btn-spring w-10 h-10 rounded-full bg-[var(--ios-bg)] border border-[var(--ios-border)] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {items.length === 0 ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-[20px] bg-[var(--ios-bg)] text-[#ea580c] flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-[20px]">Votre panier est vide</h4>
                  <p className="text-[15px] text-[var(--ios-fg-secondary)] max-w-xs mx-auto leading-snug">
                    Sélectionnez des plats au menu du jour pour commander vos tickets repas à 200 FCFA.
                  </p>
                  <div className="flex flex-col gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="ios-btn-spring w-full min-h-[56px] bg-[#ea580c] text-white text-[16px] font-bold rounded-[20px]"
                    >
                      Voir le menu du jour
                    </button>

                    {user && (user.savedTickets || []).some(t => t.status === 'valid') && onOpenTransfer && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenTransfer();
                        }}
                        className="ios-btn-spring w-full min-h-[52px] bg-[var(--ios-bg)] border border-[var(--ios-border)] text-[var(--ios-fg)] text-[15px] font-bold rounded-[18px] flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4 text-[#ea580c]" />
                        <span>Offrir un ticket</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.dish.id}
                    className="p-3.5 bg-[var(--ios-bg)] rounded-[20px] border border-[var(--ios-border)] flex items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-[14px] overflow-hidden bg-zinc-900 flex-shrink-0">
                      <ImageWithLoader
                        src={item.dish.imageUrl}
                        alt={item.dish.name}
                        className="w-full h-full"
                        imgClassName="object-cover"
                        showSpiralText={false}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-[#ea580c]">
                        {item.dish.mealType === 'dejeuner' ? 'Midi' : 'Soir'}
                      </span>
                      <h4 className="font-bold text-[15px] truncate">{item.dish.name}</h4>
                      <span className="text-[13px] font-bold text-[var(--ios-fg-secondary)] tabular-nums">
                        {item.quantity * 200} FCFA
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          onUpdateQuantity(item.dish.id, item.quantity - 1);
                        }}
                        aria-label="Diminuer"
                        className="ios-btn-spring w-9 h-9 rounded-[12px] bg-[var(--ios-surface)] border border-[var(--ios-border)] flex items-center justify-center"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-extrabold text-[15px] tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          onUpdateQuantity(item.dish.id, item.quantity + 1);
                        }}
                        aria-label="Augmenter"
                        className="ios-btn-spring w-9 h-9 rounded-[12px] bg-[#ea580c] text-white flex items-center justify-center"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.dish.id)}
                        aria-label={`Retirer ${item.dish.name}`}
                        className="w-9 h-9 flex items-center justify-center text-[var(--ios-fg-secondary)] hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-5 border-t border-[var(--ios-border)] space-y-4">
                <div className="space-y-1.5 text-[14px]">
                  <div className="flex justify-between text-[var(--ios-fg-secondary)]">
                    <span>Tickets ({totalMealCount} × 200 F)</span>
                    <span className="font-semibold text-[var(--ios-fg)] tabular-nums">
                      {totalAmount.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between text-[var(--ios-fg-secondary)]">
                    <span>Frais (1,5 % + 7 F)</span>
                    <span className="font-semibold text-[var(--ios-fg)] tabular-nums">
                      +{feesAmount.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[var(--ios-border)] font-extrabold text-[18px]">
                    <span>Total à payer</span>
                    <span className="text-[#ea580c] tabular-nums">
                      {grandTotal.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    onCheckout();
                  }}
                  className="ios-btn-spring w-full min-h-[56px] bg-[#ea580c] text-white font-bold text-[17px] rounded-[20px] shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Payer {grandTotal.toLocaleString('fr-FR')} FCFA</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[12px] text-[var(--ios-fg-secondary)]">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Paiement instantané sécurisé</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
