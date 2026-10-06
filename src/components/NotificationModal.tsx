import React, { useState } from 'react';
import { 
  Bell, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  Volume2, 
  AlertCircle,
  X,
  Heart,
  Send
} from 'lucide-react';
import { 
  NotificationSettings, 
  saveNotificationSettings, 
  requestNotificationPermission, 
  sendLocalNotification, 
  isNotificationSupported 
} from '../utils/notifications';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onUpdateSettings: (newSettings: NotificationSettings) => void;
}

const QUICK_SUGGESTIONS = [
  'Sauce Graine',
  'Attiéké',
  'Poulet Braisé',
  'Poisson Frit',
  'Riz Gras',
  'Sauce Claire',
  'Foutou Banane',
  'Alloco',
  'Tchep'
];

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  const [newDishInput, setNewDishInput] = useState('');
  const [testSent, setTestSent] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  if (!isOpen) return null;

  const supported = isNotificationSupported();
  const hasBrowserPermission = supported && Notification.permission === 'granted';

  const handleToggleEnable = async () => {
    setPermissionError(null);
    if (!settings.enabled || !hasBrowserPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setPermissionError("Veuillez autoriser les notifications dans les paramètres de votre navigateur pour recevoir les alertes.");
        return;
      }
      const updated = { ...settings, enabled: true };
      onUpdateSettings(updated);
      saveNotificationSettings(updated);
      
      // Envoi d'une notification de confirmation
      sendLocalNotification(
        '🔔 Alertes Programas Activées !',
        'Vous serez notifié dès qu’un menu est publié ou si un plat favori est au menu.'
      );
    } else {
      const updated = { ...settings, enabled: false };
      onUpdateSettings(updated);
      saveNotificationSettings(updated);
    }
  };

  const handleToggleNewMenu = () => {
    const updated = { ...settings, alertOnNewMenu: !settings.alertOnNewMenu };
    onUpdateSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleToggleFavoriteDishes = () => {
    const updated = { ...settings, alertOnFavoriteDishes: !settings.alertOnFavoriteDishes };
    onUpdateSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleAddDish = (dish: string) => {
    const trimmed = dish.trim();
    if (!trimmed) return;
    if (settings.favoriteDishes.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      setNewDishInput('');
      return;
    }
    const updatedDishes = [...settings.favoriteDishes, trimmed];
    const updated = { ...settings, favoriteDishes: updatedDishes };
    onUpdateSettings(updated);
    saveNotificationSettings(updated);
    setNewDishInput('');
  };

  const handleRemoveDish = (dishToRemove: string) => {
    const updatedDishes = settings.favoriteDishes.filter(d => d !== dishToRemove);
    const updated = { ...settings, favoriteDishes: updatedDishes };
    onUpdateSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleSendTestNotification = async () => {
    setPermissionError(null);
    if (!hasBrowserPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setPermissionError("Autorisez les notifications du navigateur pour tester l'alerte.");
        return;
      }
    }

    const dishExample = settings.favoriteDishes[0] || 'Attiéké & Poulet';
    sendLocalNotification(
      '🔔 Test Alerte Repas Programas !',
      `Exemple : « ${dishExample} » est prévu au menu demain au Resto U UPGC (200 FCFA) !`
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#F5F0E8] rounded-[32px] max-w-md w-full p-6 shadow-2xl border border-black/5 space-y-5 my-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#F5B726] text-black font-black text-xl flex items-center justify-center shadow-xs">
              <Bell className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-[#FEF3C7] px-2.5 py-0.5 rounded-full">
                Notifications & Alertes
              </span>
              <h3 className="font-black text-slate-950 text-lg mt-0.5 leading-snug">
                Alertes Menus & Plats Favoris
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-slate-700 flex items-center justify-center font-bold shadow-xs hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Activation Switch Card */}
        <div className="bg-white p-4 rounded-[24px] border border-black/5 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-black text-slate-950 text-sm">
                Activer les alertes sur cet appareil
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Recevez les notifications push et alertes sonores directement sur votre téléphone.
              </p>
            </div>
            <button
              onClick={handleToggleEnable}
              className={`w-14 h-8 rounded-full p-1 transition-colors shrink-0 ${
                settings.enabled && hasBrowserPermission
                  ? 'bg-[#18181B]'
                  : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-[#F5B726] shadow-sm transform transition-transform ${
                  settings.enabled && hasBrowserPermission
                    ? 'translate-x-6'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {permissionError && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
              <span>{permissionError}</span>
            </div>
          )}

          {settings.enabled && hasBrowserPermission && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-[#DCFCE7] px-3 py-1.5 rounded-full w-fit">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Notifications actives sur ce téléphone</span>
            </div>
          )}
        </div>

        {/* Specific Alert Toggles */}
        <div className="space-y-2">
          {/* Toggle 1: Alerte Nouveau Menu Publié */}
          <div className="bg-white p-3.5 rounded-[22px] border border-black/5 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📢</span>
              <div>
                <h5 className="font-extrabold text-xs text-slate-900 leading-tight">
                  Alerte Nouveau Menu Publié
                </h5>
                <p className="text-[11px] text-slate-500 font-medium">
                  Avertir dès que le CROU-K distribue le menu du jour.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.alertOnNewMenu}
              onChange={handleToggleNewMenu}
              className="w-5 h-5 accent-[#18181B] rounded-md cursor-pointer"
            />
          </div>

          {/* Toggle 2: Alerte Plat Favori pour Demain ou Aujourd'hui */}
          <div className="bg-white p-3.5 rounded-[22px] border border-black/5 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🍲</span>
              <div>
                <h5 className="font-extrabold text-xs text-slate-900 leading-tight">
                  Alerte Plat Favori
                </h5>
                <p className="text-[11px] text-slate-500 font-medium">
                  Avertir si un plat spécifique est servi aujourd'hui ou demain.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.alertOnFavoriteDishes}
              onChange={handleToggleFavoriteDishes}
              className="w-5 h-5 accent-[#18181B] rounded-md cursor-pointer"
            />
          </div>
        </div>

        {/* Favorite Dishes Management */}
        <div className="bg-white p-4 sm:p-5 rounded-[26px] border border-black/5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-slate-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
              <span>Plats spécifiques sous surveillance</span>
            </h4>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[#FEF3C7] text-amber-900">
              {settings.favoriteDishes.length} plat(s)
            </span>
          </div>

          {/* Input to add custom dish */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddDish(newDishInput);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={newDishInput}
              onChange={(e) => setNewDishInput(e.target.value)}
              placeholder="Ajouter un plat (ex: Sauce Graine, Tchep...)"
              className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#F5B726]"
            />
            <button
              type="submit"
              disabled={!newDishInput.trim()}
              className="px-4 py-2.5 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-black shrink-0 transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Ajouter</span>
            </button>
          </form>

          {/* Quick Suggestions Chips */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Suggestions rapides :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SUGGESTIONS.map((sug) => {
                const isAlready = settings.favoriteDishes.some(d => d.toLowerCase() === sug.toLowerCase());
                return (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleAddDish(sug)}
                    disabled={isAlready}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
                      isAlready
                        ? 'bg-slate-100 text-slate-400 opacity-60 cursor-default'
                        : 'bg-[#F5F0E8] hover:bg-[#F5B726] text-slate-800 hover:text-black border border-black/5 active:scale-95'
                    }`}
                  >
                    <span>{isAlready ? '✓' : '+'}</span>
                    <span>{sug}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monitored List */}
          <div className="pt-2 border-t border-slate-100">
            {settings.favoriteDishes.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">
                Aucun plat sélectionné. Ajoutez vos plats favoris ci-dessus pour recevoir une alerte dès qu'ils sont prévus !
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                {settings.favoriteDishes.map((dish) => (
                  <span
                    key={dish}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] text-amber-950 text-xs font-extrabold border border-amber-200/60 shadow-2xs"
                  >
                    <span>🍲 {dish}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDish(dish)}
                      className="text-amber-800 hover:text-red-600 font-bold ml-0.5"
                      title="Supprimer cette alerte"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Test Notification Button & Close */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleSendTestNotification}
            className="w-full py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 border border-black/10 text-xs font-black flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-[0.99]"
          >
            <Send className="w-3.5 h-3.5 text-[#F5B726]" />
            <span>
              {testSent ? '✓ Notification envoyée sur votre écran !' : 'Tester une notification d\'alerte'}
            </span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-black transition-colors"
          >
            Enregistrer & Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
