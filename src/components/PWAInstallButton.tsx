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
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

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

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt && !isIOS) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="ios-btn-spring flex items-center gap-1.5 px-3 min-h-[40px] bg-[var(--ios-surface)] text-[var(--ios-fg)] rounded-full text-[13px] font-semibold border border-[var(--ios-border)] whitespace-nowrap"
        title="Installer l'application sur votre écran d'accueil"
      >
        <Download className="w-3.5 h-3.5 text-[#ea580c]" />
        <span>Installer</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-[var(--ios-surface)] text-[var(--ios-fg)] rounded-t-[30px] sm:rounded-[28px] p-6 max-w-sm w-full shadow-2xl border border-[var(--ios-border)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-[#ea580c]" />
                <h3 className="font-extrabold text-[18px]">
                  {isIOS ? 'Installer sur iPhone' : "Installer l'application"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Fermer"
                className="w-9 h-9 rounded-full bg-[var(--ios-bg)] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="text-[14px] space-y-3 bg-[var(--ios-bg)] p-4 rounded-[18px] border border-[var(--ios-border)] text-[var(--ios-fg-secondary)]">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#ea580c] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>
                    Appuyez sur <strong className="text-[var(--ios-fg)]">Partager</strong> <Share2 className="w-3.5 h-3.5 inline text-[#ea580c] mx-0.5" /> en bas de Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#ea580c] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>
                    Touchez <strong className="text-[var(--ios-fg)]">« Sur l'écran d'accueil »</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5" />.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#ea580c] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>
                    Touchez <strong className="text-[var(--ios-fg)]">« Ajouter »</strong> en haut à droite.
                  </span>
                </li>
              </ol>
            ) : (
              <p className="text-[15px] text-[var(--ios-fg-secondary)] leading-relaxed">
                Ouvrez le menu du navigateur (⋮) puis sélectionnez <strong className="text-[var(--ios-fg)]">« Installer l'application »</strong> ou <strong className="text-[var(--ios-fg)]">« Ajouter à l'écran d'accueil »</strong>.
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="ios-btn-spring w-full min-h-[52px] bg-[#ea580c] text-white font-bold text-[16px] rounded-[18px]"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};
