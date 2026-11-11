import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    // Listen for Android PWA native WebAPK install prompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleDownloadApk = () => {
    triggerHaptic('medium');
    setIsDownloading(true);

    // Direct download trigger for the Android package
    const link = document.createElement('a');
    link.href = '/downloads/Programas-CROU-Korhogo.apk';
    link.download = 'Programas-CROU-Korhogo.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
      triggerHaptic('success');
    }, 1200);
  };

  const handleInstallPwa = async () => {
    triggerHaptic('light');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        triggerHaptic('success');
      }
      setDeferredPrompt(null);
    } else {
      // Manual instruction fallback for Android Chrome
      alert("Sur votre téléphone Android :\n1. Touchez les 3 petits points (⋮) en haut à droite de Google Chrome.\n2. Sélectionnez 'Installer l'application' ou 'Ajouter à l'écran d'accueil'.\n3. L'application s'installera avec son propre logo comme une vraie application native sans barre web !");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white relative text-left"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-white text-base">
                  Application Android
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  APK v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Installation directe hors-navigateur
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 shadow-md cursor-pointer flex-shrink-0"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-white stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="px-5 py-4 overflow-y-auto space-y-4 text-xs">
          
          {/* Native App Value Proposition */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-850 border border-slate-700/60 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Pourquoi installer l'application réelle ?</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 leading-relaxed text-[11px]">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span><strong>Zéro barre d'adresse web</strong> : plein écran immersif total.</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span><strong>Icône sur l'écran d'accueil</strong> : s'ouvre comme WhatsApp ou Wave.</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span><strong>Fonctionnement ultra-rapide</strong> : tickets disponibles même avec une connexion faible.</span>
              </li>
            </ul>
          </div>

          {/* Download APK Action Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDownloadApk}
              disabled={isDownloading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold text-sm flex items-center justify-center space-x-2.5 shadow-lg shadow-emerald-500/25 active:scale-98 transition-all cursor-pointer"
            >
              <Download className={`w-5 h-5 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>
                {isDownloading ? 'Téléchargement de l\'APK...' : 'Télécharger le fichier APK (.apk)'}
              </span>
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Fichier autonome direct : <span className="text-slate-300 font-mono">Programas-CROU-Korhogo.apk</span> (~2.4 Mo)
            </p>
          </div>

          {/* Quick PWA 1-Click Option */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="font-bold text-white text-xs">
                Option 2 : Installation immédiate (WebAPK)
              </h4>
              <p className="text-[10px] text-slate-400">
                Sans téléchargement de fichier : s'installe via Chrome en 2 secondes.
              </p>
            </div>
            <button
              type="button"
              onClick={handleInstallPwa}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex-shrink-0 active:scale-95 transition-all shadow-md"
            >
              Installer
            </button>
          </div>

          {/* Installation Steps Guide for Android */}
          <div className="space-y-2.5 pt-2">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider text-slate-400">
              Comment installer l'APK sur votre Android :
            </h4>

            <div className="space-y-2">
              <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                  1
                </span>
                <p className="text-[11px] text-slate-300">
                  Appuyez sur le bouton vert <strong>« Télécharger le fichier APK »</strong> ci-dessus.
                </p>
              </div>

              <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                  2
                </span>
                <p className="text-[11px] text-slate-300">
                  Si Android affiche <em>« Fichier potentiellement dangereux »</em> (message standard pour tout APK hors Play Store), appuyez sur <strong>« Télécharger quand même »</strong>.
                </p>
              </div>

              <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                  3
                </span>
                <p className="text-[11px] text-slate-300">
                  Ouvrez le fichier téléchargé dans vos notifications, puis appuyez sur <strong>« Installer »</strong>. L'application apparaît alors avec son icône sur votre écran !
                </p>
              </div>
            </div>
          </div>

          {/* Security Guarantee */}
          <div className="flex items-center space-x-2 text-[10px] text-slate-400 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Certifié et vérifié pour le CROU Korhogo • Sans publicité • 100% sécurisé</span>
          </div>

        </div>
      </div>
    </div>
  );
};
