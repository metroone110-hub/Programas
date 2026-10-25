import React, { useState } from 'react';
import { Copy, Check, ExternalLink, X, ShieldAlert, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { DEV_DOMAIN, SHARED_DOMAIN, FIREBASE_PROJECT_ID } from '../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onContinueDirect?: () => void;
}

export const FirebaseDomainHelpModal: React.FC<Props> = ({ isOpen, onClose, onContinueDirect }) => {
  const [copiedDev, setCopiedDev] = useState(false);
  const [copiedShared, setCopiedShared] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'dev' | 'shared') => {
    navigator.clipboard.writeText(text);
    if (type === 'dev') {
      setCopiedDev(true);
      setTimeout(() => setCopiedDev(false), 2500);
    } else {
      setCopiedShared(true);
      setTimeout(() => setCopiedShared(false), 2500);
    }
  };

  const settingsUrl = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/settings`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Autorisation du domaine Firebase</h3>
                <p className="text-xs text-amber-100 font-medium">Guide pas à pas pour activer la connexion Google</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700">
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-amber-900 text-xs leading-relaxed">
            <div className="flex items-center font-bold text-amber-950 mb-1 space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Pourquoi voyez-vous ce message ?</span>
            </div>
            Pour des raisons de sécurité, Google Firebase demande d'enregistrer l'adresse de votre application une seule fois dans la liste des <strong>« Domaines autorisés »</strong>.
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs">
                1
              </div>
              <div>
                <p className="font-semibold text-slate-900">Enregistrer la fenêtre Google</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sur l'écran Firebase de votre capture, faites défiler vers le bas et cliquez sur le bouton bleu <strong>« Enregistrer »</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs">
                2
              </div>
              <div className="w-full">
                <p className="font-semibold text-slate-900">Aller dans l'onglet « Paramètres »</p>
                <p className="text-xs text-slate-500 mt-0.5 mb-2">
                  Cliquez sur l'onglet <strong>Paramètres</strong> (Settings) en haut dans Firebase Authentication, ou cliquez sur ce bouton direct :
                </p>
                <a
                  href={settingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                >
                  <span>Ouvrir les Paramètres Firebase</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs">
                3
              </div>
              <div className="w-full">
                <p className="font-semibold text-slate-900">Copier & Coller le domaine</p>
                <p className="text-xs text-slate-500 mt-0.5 mb-2">
                  Dans la section <strong>« Domaines autorisés »</strong>, cliquez sur <em>Ajouter un domaine</em> et collez :
                </p>
                
                {/* Dev domain card */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between mb-2">
                  <div className="truncate text-xs font-mono text-slate-800 select-all pr-2">
                    {DEV_DOMAIN}
                  </div>
                  <button
                    onClick={() => handleCopy(DEV_DOMAIN, 'dev')}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all ${
                      copiedDev ? 'bg-emerald-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    {copiedDev ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
          {onContinueDirect && (
            <button
              onClick={() => {
                onClose();
                onContinueDirect();
              }}
              className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-1.5"
            >
              <span>Continuer sans Google pour l'instant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
