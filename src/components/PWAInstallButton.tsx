import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone display mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Suppress when already installed as native standalone app
  if (isInstalled) return null;

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instruction
      alert("Pour installer l'application sur votre téléphone, appuyez sur les 3 points du navigateur puis sur 'Ajouter à l'écran d'accueil' ou 'Installer l'application'.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-medium border border-slate-200 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        title="Installer l'application sur votre écran d'accueil"
      >
        <Download className="w-3.5 h-3.5 text-slate-600" />
        <span className="hidden sm:inline">Installer l'application</span>
        <span className="sm:hidden">Installer</span>
      </button>

      {/* Guided Modal for iOS iPhone/iPad users */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-scaleUp text-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Installer sur iPhone
                </h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Pour ajouter Programas sur votre écran d'accueil :
            </p>

            <ol className="text-xs space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 font-normal text-slate-700">
              <li className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>
                  Appuyez sur le bouton <strong>Partager</strong> <Share2 className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> en bas au centre de Safari.
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>
                  Faites défiler et appuyez sur <strong>« Sur l'écran d'accueil »</strong> <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 mx-0.5" />.
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span>
                  Appuyez sur <strong>« Ajouter »</strong> en haut à droite.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-all cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
};
