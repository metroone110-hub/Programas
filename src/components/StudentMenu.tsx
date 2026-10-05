import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CreditCard, 
  Share2, 
  ChefHat, 
  RefreshCw, 
  Check, 
  Info,
  ShieldAlert,
  Table as TableIcon
} from 'lucide-react';
import type { RestaurantData, MealCategory, MenuItem } from '../types';
import { DietaryBadge } from './Badge';
import { PWAInstallButton } from './PWAInstallButton';

interface StudentMenuProps {
  data: RestaurantData;
  onOpenAdmin: () => void;
  onOpenGuide: () => void;
}

const CATEGORY_NAMES: Record<MealCategory, { name: string; icon: string; badgeClass: string }> = {
  plat: {
    name: 'Plat de Résistance',
    icon: '🍗',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-200'
  },
  accompagnement: {
    name: 'Féculent / Accompagnement',
    icon: '🍚',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200'
  },
  entree: {
    name: 'Entrée / Crudités',
    icon: '🥗',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200'
  },
  dessert: {
    name: 'Dessert / Fruit',
    icon: '🥭',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-200'
  },
  vegetarien: {
    name: 'Végétarien',
    icon: '🌱',
    badgeClass: 'bg-green-100 text-green-900 border-green-200'
  }
};

export const StudentMenu: React.FC<StudentMenuProps> = ({ data, onOpenAdmin, onOpenGuide }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAllergensFor, setShowAllergensFor] = useState<MenuItem | null>(null);

  const menu = data.currentMenu;

  // Format date in French
  const formattedDate = useMemo(() => {
    try {
      const d = new Date(menu.date);
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d);
    } catch {
      return menu.date;
    }
  }, [menu.date]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Programas - Tableau de Bord Resto U UPGC Korhogo`,
        text: `Consultez le menu du jour sur le tableau de bord officiel du Resto U UPGC Korhogo (Ticket à 200 FCFA).`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* 1. Tricolor Côte d'Ivoire Top Stripe */}
      <div>
        <div className="h-1.5 w-full grid grid-cols-3">
          <div className="bg-orange-500"></div>
          <div className="bg-white"></div>
          <div className="bg-green-600"></div>
        </div>

        {/* 2. Top Header Navigation */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
                P
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-slate-900 tracking-tight text-lg leading-none">
                    Programas
                  </h1>
                  <span className="bg-orange-50 text-orange-900 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-orange-200">
                    🇨🇮 CROU-K
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-orange-600 shrink-0" />
                  <span>Resto U • Université Peleforo Gon Coulibaly (Korhogo)</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <PWAInstallButton variant="header" />
              
              <button
                onClick={handleShare}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Partager le tableau de bord"
              >
                <Share2 className="w-3.5 h-3.5 text-orange-600" />
                <span className="hidden sm:inline">{copiedLink ? 'Copié !' : 'Partager'}</span>
              </button>

              <button
                onClick={onOpenAdmin}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
              >
                <ChefHat className="w-4 h-4 text-orange-400" />
                <span>Espace Gestionnaire</span>
              </button>
            </div>
          </div>
        </header>

        {/* 3. Announcement Banner (if any) */}
        {data.announcement && (
          <aside aria-label="Annonce officielle" className="bg-slate-900 text-white px-4 py-2 text-xs font-medium border-b border-slate-800">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                {data.announcement}
              </span>
            </div>
          </aside>
        )}

        {/* 4. MAIN CONTAINER: LE TABLEAU DE BORD DES MENUS */}
        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          
          {/* Dashboard Header Card */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-extrabold text-xs uppercase tracking-wider">
                  <TableIcon className="w-3.5 h-3.5 text-orange-600" />
                  Tableau de Bord Officiel
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-900 border border-orange-200 font-extrabold text-xs">
                  <Calendar className="w-3 h-3 text-orange-600" />
                  <span className="capitalize">{formattedDate}</span>
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-bold text-xs">
                  {menu.service === 'dejeuner' ? 'Service Déjeuner (Midi)' : 'Service Dîner (Soir)'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {menu.theme || 'Menu du Jour - Resto U UPGC Korhogo'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Affichage direct des repas publiés par la direction du restaurant universitaire (CROU-K).
              </p>
            </div>

            {/* Ticket Price Badge */}
            <div className="p-3 sm:p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-lg shadow-xs">
                🎟️
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-orange-800 block">
                  Ticket Repas Unique
                </span>
                <span className="text-xl font-black text-slate-900">
                  200 FCFA
                </span>
              </div>
            </div>
          </section>

          {/* LE TABLEAU DE BORD (VIDE PAR DÉFAUT, SE REMPLIT QUAND L'ADMIN PUBLIE) */}
          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
                  Affichage du Menu sur le Tableau de Bord
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {menu.items.length === 0 ? '0 plat affiché' : `${menu.items.length} plat(s) au menu`}
              </span>
            </div>

            {menu.items.length === 0 ? (
              /* ÉTAT INITIAL VIDE (RIEN D'AFFICHÉ TANT QUE L'ADMIN N'A PAS PUBLIÉ) */
              <div className="p-10 sm:p-14 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-4 text-3xl">
                  📋
                </div>
                <h4 className="text-lg font-black text-slate-900 tracking-tight">
                  Aucun menu publié pour le moment
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                  Le tableau de bord est actuellement vide. Seuls les administrateurs du CROU-K peuvent se connecter pour publier le menu du jour qui s'affichera directement ici.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Actualiser</span>
                  </button>
                  <button
                    onClick={onOpenAdmin}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <ChefHat className="w-4 h-4 text-amber-200" />
                    <span>Espace Gestionnaire (Publier un menu)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* TABLEAU DE BORD REMPLI DES PLATS PUBLIÉS PAR L'ADMIN */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                      <th className="py-3.5 px-5">Rayon / Catégorie</th>
                      <th className="py-3.5 px-5">Plat & Ingrédients</th>
                      <th className="py-3.5 px-5">Spécificités</th>
                      <th className="py-3.5 px-5">Disponibilité</th>
                      <th className="py-3.5 px-5 text-right">Tarif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {menu.items.map((item) => {
                      const catInfo = CATEGORY_NAMES[item.category] || CATEGORY_NAMES.plat;

                      return (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-slate-50 transition-colors ${
                            !item.isAvailable ? 'opacity-50 bg-slate-50/50' : ''
                          }`}
                        >
                          {/* 1. Category */}
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${catInfo.badgeClass}`}>
                              <span>{catInfo.icon}</span>
                              <span>{catInfo.name}</span>
                            </span>
                          </td>

                          {/* 2. Title & Description */}
                          <td className="py-3.5 px-5">
                            <div className="font-extrabold text-slate-900 text-sm">
                              {item.title}
                            </div>
                            {item.description && (
                              <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                            {item.allergens && item.allergens.length > 0 && (
                              <button
                                onClick={() => setShowAllergensFor(item)}
                                className="text-[10px] text-orange-700 hover:text-orange-900 underline font-semibold mt-1 flex items-center gap-1"
                              >
                                <Info className="w-3 h-3" />
                                Allergènes : {item.allergens.join(', ')}
                              </button>
                            )}
                          </td>

                          {/* 3. Tags */}
                          <td className="py-3.5 px-5">
                            <div className="flex flex-wrap gap-1">
                              {item.tags && item.tags.length > 0 ? (
                                item.tags.map((tag) => (
                                  <DietaryBadge key={tag} tag={tag} size="sm" />
                                ))
                              ) : (
                                <span className="text-[11px] text-slate-400">Classique</span>
                              )}
                            </div>
                          </td>

                          {/* 4. Availability */}
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            {item.isAvailable ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                En Cuisine
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Épuisé
                              </span>
                            )}
                          </td>

                          {/* 5. Price */}
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            <span className="font-black text-slate-900 text-sm">
                              {item.priceExtra ? item.priceExtra : 'Compris (200 F)'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 5. Practical Info & Hours */}
          <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              <span>Horaires du Service & Règlement CROU-K</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Service du Midi</span>
                <span className="font-black text-slate-900 text-sm">{data.hours.midi}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Service du Soir</span>
                <span className="font-black text-slate-900 text-sm">{data.hours.soir}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Paiement Accepté</span>
                <span className="font-black text-slate-900 text-sm">Tickets CROU-K & Mobile Money</span>
              </div>
            </div>
          </section>

          {/* PWA Install Banner */}
          <PWAInstallButton variant="banner" />
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          Programas • {data.name} — Université Peleforo Gon Coulibaly (Korhogo, Côte d'Ivoire)
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Réservé à l'affichage officiel des repas de la cantine et du restaurant universitaire CROU-K.
        </p>
      </footer>

      {/* Allergens Modal */}
      {showAllergensFor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  Information Nutritionnelle
                </span>
                <h4 className="font-black text-slate-900 text-base mt-1 leading-snug">
                  {showAllergensFor.title}
                </h4>
              </div>
              <button
                onClick={() => setShowAllergensFor(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <div className="text-xs font-bold text-slate-700 mb-2">
                Allergènes ou ingrédients signalés par la cuisine :
              </div>
              <div className="flex flex-wrap gap-1.5">
                {showAllergensFor.allergens?.map((a) => (
                  <span
                    key={a}
                    className="px-2.5 py-1 rounded-xl bg-orange-50 text-orange-900 border border-orange-200 text-xs font-bold"
                  >
                    ⚠️ {a}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowAllergensFor(null)}
              className="mt-5 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
