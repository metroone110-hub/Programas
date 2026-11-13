import React, { useState } from 'react';
import {
  Plus,
  Minus,
  QrCode,
  ChevronRight,
  Send,
  Ticket,
  LogIn
} from 'lucide-react';
import { UserProfile } from '../types';
import { AsyncButton } from './AsyncButton';
import { PaymentLogoBadge } from './PaymentLogoBadge';
import { triggerHaptic } from '../utils/haptics';

export type QuickPaymentMethod = 'wave' | 'orange' | 'mtn' | 'moov' | 'djamo';

interface Props {
  user: UserProfile | null;
  onBuyTickets: (quantity: number, totalAmount: number, method?: QuickPaymentMethod) => void;
  onOpenAuth: () => void;
  onOpenMyTickets: () => void;
  onOpenTransfer?: () => void;
  canteenName?: string;
}

const QUICK_METHODS: Array<{ id: QuickPaymentMethod; label: string }> = [
  { id: 'wave', label: 'Wave' },
  { id: 'orange', label: 'Orange' },
  { id: 'mtn', label: 'MTN' },
  { id: 'moov', label: 'Moov' },
  { id: 'djamo', label: 'Djamo' },
];

export const TicketCounterBox: React.FC<Props> = ({
  user,
  onBuyTickets,
  onOpenAuth,
  onOpenMyTickets,
  onOpenTransfer,
  canteenName
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedMethod, setSelectedMethod] = useState<QuickPaymentMethod>('wave');

  const TICKET_UNIT_PRICE = 200;
  const totalAmount = quantity * TICKET_UNIT_PRICE;
  const feesAmount = quantity * 10; // 1,5 % + 7 F = 10 F par ticket
  const grandTotal = totalAmount + feesAmount;

  const validTicketsCount = user?.savedTickets?.filter(t => t.status === 'valid').length || 0;

  const quickPacks = [
    { qty: 1 },
    { qty: 2 },
    { qty: 5 },
    { qty: 10 },
    { qty: 20 }
  ];

  const activeMethodLabel =
    QUICK_METHODS.find(m => m.id === selectedMethod)?.label || 'Wave';

  const handleBuy = () => {
    triggerHaptic('medium');
    if (!user) {
      onOpenAuth();
      return;
    }
    onBuyTickets(quantity, totalAmount, selectedMethod);
  };

  return (
    <section className="space-y-5 select-none">
      {/* Apple Large Title Header */}
      <div className="px-0.5">
        <h1 className="ios-large-title">Accueil</h1>
        {canteenName && (
          <p className="text-[15px] text-[var(--ios-fg-secondary)] font-medium mt-1 truncate">
            {canteenName}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* 1. CARTE TICKET SOLDE — BLANCHE, PERFORÉE, SANS ICÔNE TICKET EN HAUT À DROITE */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white text-[#1d1d1f] rounded-[28px] border border-black/[0.08] shadow-[0_10px_32px_rgba(0,0,0,0.08)] overflow-hidden flex-1 flex flex-col justify-between">
            {/* Upper Perforated Ticket Body */}
            <div className="p-6 pb-5 space-y-2.5">
              <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.04em] text-[#ea580c] whitespace-nowrap overflow-hidden text-ellipsis">
                CROU KORHOGO · PASS RESTAU U
              </p>

              {user ? (
                <>
                  <div className="text-[38px] leading-[1.08] font-extrabold tracking-tight text-[#1d1d1f] tabular-nums">
                    {validTicketsCount} ticket{validTicketsCount > 1 ? 's' : ''}
                  </div>
                  <p className="text-[16px] text-[#52525b] font-medium leading-snug">
                    Valeur repas : 200 FCFA · {validTicketsCount > 0 ? 'Prêt au tourniquet' : 'Aucun ticket actif'}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-[34px] leading-[1.1] font-extrabold tracking-tight text-[#1d1d1f]">
                    Pass Restau U
                  </div>
                  <p className="text-[16px] text-[#52525b] font-medium leading-snug">
                    Repas subventionné à 200 FCFA · Connectez-vous pour gérer vos tickets.
                  </p>
                </>
              )}
            </div>

            {/* Perforation Notch Divider */}
            <div className="relative h-6 flex items-center px-5 ticket-notch-left ticket-notch-right">
              <div className="w-full border-t-2 border-dashed border-black/15" />
            </div>

            {/* Lower Ticket Stub */}
            <div className="px-6 pt-3 pb-6 space-y-4">
              {user ? (
                <>
                  <div>
                    <span className="block text-[13px] font-medium text-[#6e6e73] tabular-nums">
                      Matricule · {user.matricule}
                    </span>
                    <span className="block text-[18px] font-bold text-[#1d1d1f] truncate mt-0.5">
                      {user.displayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        onOpenMyTickets();
                      }}
                      className="ios-btn-spring flex-1 min-h-[48px] px-4 rounded-[16px] bg-[#ea580c] hover:bg-[#d94d07] text-white font-bold text-[15px] inline-flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                    >
                      <QrCode className="w-4 h-4 flex-shrink-0" />
                      <span>Ouvrir QR</span>
                    </button>

                    {onOpenTransfer && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          onOpenTransfer();
                        }}
                        className="ios-btn-spring min-h-[48px] px-4 rounded-[16px] bg-[#f2f2f7] hover:bg-[#e5e5ea] text-[#1d1d1f] font-bold text-[15px] inline-flex items-center justify-center gap-2 border border-black/5 whitespace-nowrap"
                      >
                        <Send className="w-4 h-4 text-[#ea580c] flex-shrink-0" />
                        <span>Offrir</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onOpenAuth();
                  }}
                  className="ios-btn-spring w-full min-h-[56px] px-5 rounded-[18px] bg-[#ea580c] hover:bg-[#d94d07] text-white font-bold text-[16px] inline-flex items-center justify-center gap-2 shadow-sm"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Se connecter avec mon matricule</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. CARTE COMMANDER DES TICKETS + VRAIS LOGOS DE PAIEMENT */}
        <div className="lg:col-span-7 ios-card p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
          {/* Header & Stepper */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[22px] sm:text-[24px] font-extrabold tracking-tight text-[var(--ios-fg)] leading-tight">
                Commander des tickets
              </h2>
              <p className="text-[14px] sm:text-[15px] text-[var(--ios-fg-secondary)] mt-1 leading-snug">
                Choisissez une formule rapide ou ajustez la quantité
              </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-1 p-1 rounded-[16px] bg-[var(--ios-bg)] border border-[var(--ios-border)] flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setQuantity(q => Math.max(1, q - 1));
                }}
                aria-label="Diminuer la quantité"
                className="ios-btn-spring w-10 h-10 rounded-[12px] bg-[var(--ios-surface)] text-[var(--ios-fg)] flex items-center justify-center font-bold border border-[var(--ios-border)]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center font-extrabold text-[18px] text-[var(--ios-fg)] tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setQuantity(q => q + 1);
                }}
                aria-label="Augmenter la quantité"
                className="ios-btn-spring w-10 h-10 rounded-[12px] bg-[#ea580c] text-white flex items-center justify-center font-bold shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Formules rapides : 1 / 2 / 5 / 10 / 20 repas (prix sur une seule ligne) */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {quickPacks.map((pack) => {
              const active = quantity === pack.qty;
              return (
                <button
                  key={pack.qty}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setQuantity(pack.qty);
                  }}
                  className={`ios-btn-spring py-2.5 px-1 rounded-[18px] border text-center flex flex-col items-center justify-center min-h-[78px] ${
                    active
                      ? 'border-[#ea580c] bg-[#ea580c]/12 ring-1 ring-[#ea580c]'
                      : 'border-[var(--ios-border)] bg-[var(--ios-bg)]/60 hover:border-[#ea580c]/40'
                  }`}
                >
                  <span className={`text-[18px] font-extrabold leading-none tabular-nums ${active ? 'text-[#ea580c]' : 'text-[var(--ios-fg)]'}`}>
                    {pack.qty}
                  </span>
                  <span className="text-[11px] text-[var(--ios-fg-secondary)] font-medium mt-1 leading-none">
                    repas
                  </span>
                  <span className={`text-[11px] font-bold mt-1.5 leading-none whitespace-nowrap tabular-nums ${active ? 'text-[#ea580c]' : 'text-[var(--ios-fg)]'}`}>
                    {(pack.qty * 200).toLocaleString('fr-FR')} F
                  </span>
                </button>
              );
            })}
          </div>

          {/* Récapitulatif Total avec Frais (1,5 % + 7 F) */}
          <div className="p-4 rounded-[20px] bg-[var(--ios-bg)] border border-[var(--ios-border)] space-y-2">
            <div className="flex items-center justify-between text-[14px] text-[var(--ios-fg-secondary)]">
              <span>{quantity} ticket{quantity > 1 ? 's' : ''} × 200 F</span>
              <span className="font-semibold text-[var(--ios-fg)] tabular-nums whitespace-nowrap">
                {totalAmount.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="flex items-center justify-between text-[14px] text-[var(--ios-fg-secondary)]">
              <span>Frais opérateur (1,5 % + 7 F)</span>
              <span className="font-semibold text-[var(--ios-fg)] tabular-nums whitespace-nowrap">
                +{feesAmount.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="pt-2.5 border-t border-[var(--ios-border)] flex items-center justify-between gap-2">
              <div>
                <span className="block text-[16px] font-bold text-[var(--ios-fg)]">
                  Total à payer
                </span>
                <span className="block text-[12px] text-[var(--ios-fg-secondary)]">
                  Soit 210 FCFA / repas
                </span>
              </div>
              <span className="text-[24px] font-extrabold text-[#ea580c] tracking-tight tabular-nums whitespace-nowrap">
                {grandTotal.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* Choix du moyen de paiement — VRAIS LOGOS OFFICIELS */}
          <div className="space-y-2.5">
            <span className="block text-[15px] font-bold text-[var(--ios-fg)]">
              Moyen de paiement
            </span>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {QUICK_METHODS.map((method) => {
                const active = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedMethod(method.id);
                    }}
                    className={`ios-btn-spring py-2.5 px-0.5 rounded-[18px] border flex flex-col items-center justify-center gap-1.5 min-h-[76px] ${
                      active
                        ? 'border-[#ea580c] bg-[#ea580c]/10 ring-1 ring-[#ea580c]'
                        : 'border-[var(--ios-border)] bg-[var(--ios-bg)]/60 hover:border-[#ea580c]/40'
                    }`}
                  >
                    <PaymentLogoBadge brand={method.id} size="sm" />
                    <span
                      className={`text-[11px] font-bold tracking-tight whitespace-nowrap leading-none ${
                        active ? 'text-[#ea580c]' : 'text-[var(--ios-fg)]'
                      }`}
                    >
                      {method.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA Principal 56 px */}
          <AsyncButton
            onAction={handleBuy}
            successLabel="Ouverture..."
            className="ios-btn-spring w-full min-h-[56px] px-5 bg-[#ea580c] hover:bg-[#d94d07] text-white font-bold text-[17px] rounded-[20px] shadow-md shadow-orange-600/20 flex items-center justify-center gap-2.5"
          >
            <Ticket className="w-5 h-5 flex-shrink-0" />
            <span className="truncate tabular-nums">
              Payer {grandTotal.toLocaleString('fr-FR')} FCFA ({activeMethodLabel})
            </span>
            <ChevronRight className="w-5 h-5 text-white/85 flex-shrink-0" />
          </AsyncButton>
        </div>
      </div>
    </section>
  );
};
