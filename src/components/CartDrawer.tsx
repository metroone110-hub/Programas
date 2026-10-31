import React from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Ticket
} from 'lucide-react';
import { Dish, UserProfile } from '../types';
import { ImageWithLoader } from './ImageWithLoader';

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
  onClearCart: () => void;
  onCheckout: () => void;
  user: UserProfile | null;
}

export const CartDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  user
}) => {
  if (!isOpen) return null;

  const totalMealCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = totalMealCount * 200; // Strict: 200 FCFA per ticket!
  const totalSubsidizedValue = totalMealCount * 500; // Val. standard repas
  const totalSavings = totalSubsidizedValue - totalAmount;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn font-sans">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200">
          
          {/* Header */}
          <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base font-cabinet text-white">
                  Panier de Repas CROU
                </h3>
                <p className="text-xs text-slate-400">
                  {totalMealCount} ticket{totalMealCount > 1 ? 's' : ''} sélectionné{totalMealCount > 1 ? 's' : ''} (200 FCFA / unité)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto shadow-inner">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">Votre panier est vide</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Sélectionnez vos plats au menu officiel du CROU Korhogo pour commander vos tickets subventionnés à 200 FCFA.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
                >
                  Voir les plats du jour
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.dish.id}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3.5 hover:border-orange-200 transition-all group"
                >
                  {/* Dish Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 relative">
                    <ImageWithLoader
                      src={item.dish.imageUrl}
                      alt={item.dish.name}
                      className="w-full h-full"
                      imgClassName="object-cover"
                      showSpiralText={false}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                        {item.dish.mealType === 'dejeuner' ? '☀️ Déjeuner' : '🌙 Dîner'}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate mt-0.5">
                      {item.dish.name}
                    </h4>

                    {/* Unit Price */}
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="font-extrabold text-xs text-slate-900">
                        200 FCFA
                      </span>
                      <span className="text-[10px] text-slate-400 line-through">
                        {item.dish.regularPrice || 500} FCFA
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-xs">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.dish.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-bold text-sm"
                      title="Diminuer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-5 text-center text-xs font-black text-slate-900">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.dish.id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-bold text-sm"
                      title="Augmenter"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Total Line Item Price & Delete */}
                  <div className="text-right flex-shrink-0">
                    <span className="block font-black text-xs sm:text-sm text-orange-600 font-cabinet">
                      {item.quantity * 200} FCFA
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.dish.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Supprimer du panier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Order Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              
              {/* Price Breakdown */}
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-700">Tickets ({totalMealCount} repas)</span>
                  <span className="font-bold text-slate-900 font-mono">{totalAmount.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Frais de service (1,5%)</span>
                  <span className="font-semibold text-slate-700 font-mono">+{Math.round(totalAmount * 0.015).toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span className="text-sm font-black">Total à payer</span>
                  <span className="text-xl text-slate-950 font-black font-mono">
                    {(totalAmount + Math.round(totalAmount * 0.015)).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              {/* Action Checkout Button */}
              <button
                type="button"
                onClick={onCheckout}
                className="w-full py-4 bg-slate-950 hover:bg-black text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
              >
                <span>Payer {(totalAmount + Math.round(totalAmount * 0.015)).toLocaleString('fr-FR')} FCFA</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Paiement sécurisé et instantané</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
