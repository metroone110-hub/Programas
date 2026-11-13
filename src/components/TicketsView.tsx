import React, { useState } from 'react';
import {
  QrCode,
  Ticket,
  Send,
  LogIn,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { MealTicket, UserProfile } from '../types';
import { deduplicateTickets } from '../services/studentAuth';
import { triggerHaptic } from '../utils/haptics';

interface Props {
  user: UserProfile | null;
  onSelectTicket: (ticket: MealTicket) => void;
  onOpenTransfer: (ticket?: MealTicket) => void;
  onOpenAuth: () => void;
  onGoToHomeBuy: () => void;
}

export const TicketsView: React.FC<Props> = ({
  user,
  onSelectTicket,
  onOpenTransfer,
  onOpenAuth,
  onGoToHomeBuy
}) => {
  const [filter, setFilter] = useState<'valid' | 'used' | 'all'>('valid');

  if (!user) {
    return (
      <section className="space-y-6 select-none">
        <div className="px-0.5">
          <h1 className="ios-large-title">Mes tickets</h1>
          <p className="text-[15px] text-[var(--ios-fg-secondary)] mt-1">
            Vos pass QR pour le tourniquet du Resto U
          </p>
        </div>

        <div className="ios-card p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-[20px] bg-[#ea580c]/12 text-[#ea580c] flex items-center justify-center mx-auto">
            <Ticket className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-[22px] font-extrabold">Connectez-vous à votre pass</h2>
            <p className="text-[16px] text-[var(--ios-fg-secondary)] max-w-sm mx-auto leading-snug">
              Accédez à vos tickets repas à 200 FCFA, affichez votre QR code et offrez des repas par matricule.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onOpenAuth();
            }}
            className="ios-btn-spring w-full sm:w-auto min-h-[56px] px-8 bg-[#ea580c] text-white font-bold text-[17px] rounded-[20px] inline-flex items-center justify-center gap-2 shadow-md"
          >
            <LogIn className="w-5 h-5" />
            <span>Se connecter</span>
          </button>
        </div>
      </section>
    );
  }

  const tickets = deduplicateTickets(user.savedTickets || []);
  const validTickets = tickets.filter(t => t.status === 'valid');
  const usedTickets = tickets.filter(t => t.status === 'used');

  const filteredTickets = tickets.filter(t => {
    if (filter === 'valid') return t.status === 'valid';
    if (filter === 'used') return t.status === 'used';
    return true;
  });

  return (
    <section className="space-y-5 select-none">
      {/* Large Header */}
      <div className="flex items-end justify-between gap-3 px-0.5">
        <div>
          <h1 className="ios-large-title">Mes tickets</h1>
          <p className="text-[15px] text-[var(--ios-fg-secondary)] mt-1">
            {validTickets.length} ticket{validTickets.length > 1 ? 's' : ''} valide{validTickets.length > 1 ? 's' : ''} · 200 FCFA
          </p>
        </div>

        {validTickets.length > 0 && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onOpenTransfer(validTickets[0]);
            }}
            className="ios-btn-spring min-h-[44px] px-4 rounded-full bg-[#ea580c] text-white font-bold text-[14px] inline-flex items-center gap-1.5 shadow-sm flex-shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Offrir</span>
          </button>
        )}
      </div>

      {/* iOS Segmented Filter Control */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--ios-surface)] border border-[var(--ios-border)] rounded-[18px]">
        {[
          { id: 'valid', label: `Valides (${validTickets.length})` },
          { id: 'used', label: `Historique (${usedTickets.length})` },
          { id: 'all', label: `Tous (${tickets.length})` }
        ].map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setFilter(tab.id as any);
              }}
              className={`ios-btn-spring min-h-[44px] px-2 rounded-[14px] text-[14px] font-bold transition-colors ${
                active
                  ? 'bg-[#ea580c] text-white shadow-xs'
                  : 'text-[var(--ios-fg-secondary)] hover:text-[var(--ios-fg)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Perforated Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="ios-card p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-[20px] bg-[var(--ios-bg)] text-[#ea580c] flex items-center justify-center mx-auto">
            <QrCode className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-[20px] font-extrabold">
              {filter === 'valid' ? 'Aucun ticket valide' : 'Aucun ticket dans cette section'}
            </h2>
            <p className="text-[15px] text-[var(--ios-fg-secondary)] max-w-xs mx-auto leading-snug">
              Commandez vos tickets repas subventionnés à 200 FCFA en quelques secondes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onGoToHomeBuy();
            }}
            className="ios-btn-spring w-full sm:w-auto min-h-[56px] px-7 bg-[#ea580c] text-white font-bold text-[16px] rounded-[20px]"
          >
            Acheter des tickets
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((t) => {
            const isValid = t.status === 'valid';
            return (
              <div
                key={t.id || t.ticketNumber}
                role="button"
                tabIndex={0}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectTicket(t);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTicket(t);
                  }
                }}
                className={`ios-btn-spring rounded-[26px] bg-white text-[#1d1d1f] border overflow-hidden shadow-[0_6px_22px_rgba(0,0,0,0.06)] cursor-pointer ${
                  isValid ? 'border-black/[0.08]' : 'border-2 border-red-500/70'
                }`}
              >
                {/* Gift Notice */}
                {t.transferredFrom && (
                  <div className="px-5 py-2 bg-orange-50 border-b border-orange-200/70 flex items-center justify-between text-[13px] font-bold text-[#9a3412]">
                    <span className="truncate">Offert par : {t.transferredFrom}</span>
                    <span>REÇU</span>
                  </div>
                )}

                {/* Top Stub */}
                <div className="p-5 pb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13px] font-bold">
                      <span className={isValid ? 'text-[#ea580c]' : 'text-red-600'}>
                        {t.mealType === 'dejeuner' ? 'Midi · 11h30–14h30' : 'Soir · 18h30–21h00'}
                      </span>
                      <span className="text-black/25">·</span>
                      <span className="text-[#6e6e73] font-medium">{t.date}</span>
                    </div>
                    <h3 className="text-[19px] font-extrabold text-[#1d1d1f] truncate mt-1">
                      {t.dishName || 'Ticket Repas CROU Korhogo'}
                    </h3>
                    <p className="text-[14px] text-[#6e6e73] truncate">
                      {t.canteenName || 'Restaurant Universitaire UPGC'}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[20px] font-extrabold text-[#1d1d1f] tabular-nums block">
                      {t.price || 200} F
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[12px] font-extrabold mt-0.5 ${
                        isValid ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {isValid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Valide</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Utilisé</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Perforated Tear Line with Circular Notches */}
                <div className="relative h-5 flex items-center px-5 ticket-notch-left ticket-notch-right">
                  <div className="w-full border-t-2 border-dashed border-black/15" />
                </div>

                {/* Bottom Stub */}
                <div className="px-5 pt-2.5 pb-5 flex items-center justify-between gap-3">
                  <span className="font-mono text-[13px] font-bold text-[#52525b]">
                    N° {t.ticketNumber}
                  </span>

                  <div className="flex items-center gap-2">
                    {isValid && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          onOpenTransfer(t);
                        }}
                        className="ios-btn-spring min-h-[40px] px-3.5 rounded-[14px] bg-[#f2f2f7] text-[#1d1d1f] text-[13px] font-bold inline-flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5 text-[#ea580c]" />
                        <span>Offrir</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('light');
                        onSelectTicket(t);
                      }}
                      className={`ios-btn-spring min-h-[40px] px-4 rounded-[14px] text-white text-[13px] font-bold inline-flex items-center gap-1.5 ${
                        isValid ? 'bg-[#ea580c]' : 'bg-red-600'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QR Code</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
