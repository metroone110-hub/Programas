import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pwaNotice, setPwaNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleDownloadApk = () => {
    triggerHaptic('medium');
    setIsDownloading(true);

    const link = document.createElement('a');
    link.href = '/downloads/Programas-CROU-Korhogo.apk';
    link.download = 'Programas-CROU-Korhogo.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
      triggerHaptic('success');
    }, 1000);
  };

  const handleInstallPwa = async () => {
    triggerHaptic('light');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        triggerHaptic('success');
      }
      setDeferredPrompt(null);
    } else {
      setPwaNotice(
        "Touchez le menu (⋮) en haut à droite de Chrome puis « Installer l'application » ou « Ajouter à l'écran d'accueil »."
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden select-none">
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
            className="relative z-10 w-full sm:max-w-md bg-[var(--ios-surface)] text-[var(--ios-fg)] rounded-t-[30px] sm:rounded-[30px] shadow-2xl border-t sm:border border-[var(--ios-border)] flex flex-col max-h-[90dvh] overflow-hidden"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
          >
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-[var(--ios-fg-tertiary)] opacity-45" />
            </div>

            <div className="px-5 py-4 border-b border-[var(--ios-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] bg-[#ea580c] text-white flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[18px]">Application Android</h3>
                  <p className="text-[13px] text-[var(--ios-fg-secondary)]">
                    Accès plein écran sur votre téléphone
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="ios-btn-spring w-10 h-10 rounded-full bg-[var(--ios-bg)] border border-[var(--ios-border)] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <ul className="space-y-2 p-4 rounded-[20px] bg-[var(--ios-bg)] border border-[var(--ios-border)] text-[14px] text-[var(--ios-fg-secondary)]">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Plein écran immersif sans barre d'adresse</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Tickets accessibles rapidement même à faible réseau</span>
                </li>
              </ul>

              <button
                type="button"
                onClick={handleDownloadApk}
                disabled={isDownloading}
                className="ios-btn-spring w-full min-h-[56px] px-4 rounded-[20px] bg-[#ea580c] hover:bg-[#d94d07] text-white font-bold text-[16px] flex items-center justify-center gap-2 shadow-md"
              >
                <Download className={`w-5 h-5 ${isDownloading ? 'animate-bounce' : ''}`} />
                <span>{isDownloading ? 'Téléchargement...' : 'Télécharger le fichier APK'}</span>
              </button>

              <div className="p-4 rounded-[20px] bg-[var(--ios-bg)] border border-[var(--ios-border)] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-[15px]">Installation rapide WebAPK</h4>
                    <p className="text-[13px] text-[var(--ios-fg-secondary)]">
                      Via Google Chrome sans fichier APK
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleInstallPwa}
                    className="ios-btn-spring min-h-[44px] px-4 rounded-[14px] bg-[var(--ios-surface)] border border-[var(--ios-border)] font-bold text-[14px] flex-shrink-0"
                  >
                    Installer
                  </button>
                </div>

                {pwaNotice && (
                  <p className="text-[13px] text-[#ea580c] font-medium leading-snug pt-1 border-t border-[var(--ios-border)]">
                    {pwaNotice}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 text-[12px] text-[var(--ios-fg-secondary)] pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Application officielle CROU Korhogo</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
