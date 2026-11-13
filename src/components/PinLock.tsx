// src/components/PinLock.tsx
// Verrouillage par code PIN à 4 chiffres rattaché directement au compte Firestore de l'étudiant.
// - Empreinte PBKDF2 + sel stockés dans le document Firestore du compte étudiant (multi-appareils & anti-réinitialisation).
// - Le compteur d'échecs est également persisté dans Firestore : recharger ou vider le cache ne remet pas les essais à zéro.
// - Après 5 erreurs consécutives : le compte est bloqué dans Firestore, les identifiants mémorisés sont effacés,
//   et AUCUN bouton "Code oublié" ne permet à l'étudiant de contourner ou choisir un nouveau PIN.
//   Seul un administrateur CROU peut débloquer le compte et réinitialiser le PIN après vérification d'identité.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Delete, ShieldAlert, Lock } from 'lucide-react';
import {
  blockStudentAccount,
  saveStudentPinToAccount,
  updateStudentPinFails,
  sanitizeMatriculeId
} from '../services/studentAuth';

const ITERATIONS = 150_000;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const haptic = (ms: number) => (window as unknown as { haptic?: (n: number) => void }).haptic?.(ms);
const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], (h) => parseInt(h, 16));

async function hashPin(pin: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(saltHex), iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return toHex(new Uint8Array(bits));
}

type StoredPin = { salt: string; hash: string };

type Mode = 'checking' | 'setup' | 'confirm' | 'locked' | 'open';

interface Props {
  children: React.ReactNode;
  enabled?: boolean;
  userMatricule?: string;
  userName?: string;
  userRole?: 'student' | 'admin' | 'staff';
  accountPinSalt?: string;
  accountPinHash?: string;
  accountPinFails?: number;
  accountIsBlocked?: boolean;
  onPinUpdated?: (salt: string, hash: string) => void;
  onForgot?: () => void;
  onAccountBlocked?: (matricule: string, reason: string) => void;
  lockAfterMs?: number;
  maxAttempts?: number;
}

const TEXT: Record<'setup' | 'confirm' | 'locked', { title: string; hint: string }> = {
  setup: { title: 'Crée ton code PIN', hint: '4 chiffres rattachés à ton compte CROU' },
  confirm: { title: 'Confirme ton code PIN', hint: 'Saisis-le une deuxième fois' },
  locked: { title: 'Saisis ton code PIN', hint: 'Compte protégé par code de sécurité' },
};

export const PinLock: React.FC<Props> = ({
  children,
  enabled = true,
  userMatricule,
  userName,
  userRole = 'student',
  accountPinSalt,
  accountPinHash,
  accountPinFails = 0,
  accountIsBlocked = false,
  onPinUpdated,
  onForgot,
  onAccountBlocked,
  lockAfterMs = 30_000,
  maxAttempts = 5
}) => {
  const isStudent = userRole !== 'admin';
  const scopeId = sanitizeMatriculeId(userMatricule || (userRole === 'admin' ? 'ADMIN_CROUK' : 'GUEST'));
  const pinStorageKey = `programas_pin_${scopeId}`;
  const failStorageKey = `programas_pin_fails_${scopeId}`;

  const [mode, setMode] = useState<Mode>('checking');
  const [pin, setPin] = useState('');
  const [first, setFirst] = useState('');
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  const hiddenAt = useRef<number | null>(null);
  const content = useRef<HTMLDivElement>(null);

  // Résoudre le PIN effectif (priorité absolue aux données du compte Firestore)
  const getEffectivePin = useCallback((): StoredPin | null => {
    if (accountPinSalt && accountPinHash) {
      return { salt: accountPinSalt, hash: accountPinHash };
    }
    try {
      const scoped = localStorage.getItem(pinStorageKey);
      if (scoped) return JSON.parse(scoped);
    } catch {}
    return null;
  }, [accountPinSalt, accountPinHash, pinStorageKey]);

  const getEffectiveFails = useCallback((): number => {
    let localFails = 0;
    try {
      localFails = Number(localStorage.getItem(failStorageKey) ?? 0) || 0;
    } catch {}
    if (isStudent) {
      return Math.max(accountPinFails || 0, localFails);
    }
    return localFails;
  }, [isStudent, accountPinFails, failStorageKey]);

  // Au changement d'utilisateur ou au chargement : compte bloqué -> expulsion immédiate ; PIN existant -> verrouillé
  useEffect(() => {
    if (!enabled) {
      setMode('open');
      return;
    }

    if (isStudent && accountIsBlocked && userMatricule) {
      onAccountBlocked?.(
        userMatricule,
        'Ce compte est actuellement bloqué par mesure de sécurité. Seul un administrateur CROU peut le débloquer.'
      );
      return;
    }

    const effective = getEffectivePin();
    // Si l'admin a réinitialisé le PIN sur Firestore (accountPinHash devient null/undefined), nettoyer le cache local
    if (isStudent && accountPinHash === undefined && accountPinSalt === undefined) {
      // Ne rien supprimer si le profil vient tout juste d'être chargé sans champ PIN, mais si on a déverrouillé en DB
    }

    setPin('');
    setMessage('');
    setMode(effective ? 'locked' : 'setup');
  }, [enabled, scopeId, accountPinHash, accountPinSalt, accountIsBlocked]);

  // Si un étudiant est déjà sur 'setup' sur un autre appareil mais reçoit son PIN cloud en temps réel
  useEffect(() => {
    if (enabled && accountPinSalt && accountPinHash && mode === 'setup') {
      setPin('');
      setFirst('');
      setMessage('');
      setMode('locked');
    }
  }, [enabled, accountPinSalt, accountPinHash, mode]);

  // Verrouillage automatique après un temps en arrière-plan
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now();
        return;
      }
      const away = hiddenAt.current ? Date.now() - hiddenAt.current : 0;
      hiddenAt.current = null;
      if (mode === 'open' && away >= lockAfterMs && getEffectivePin()) {
        setPin('');
        setMessage('');
        setMode('locked');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [mode, lockAfterMs, getEffectivePin]);

  // Verrouillage manuel à la demande
  useEffect(() => {
    const handleManualLock = () => {
      if (enabled && getEffectivePin()) {
        setPin('');
        setMessage('');
        setMode('locked');
      }
    };
    window.addEventListener('programas:lock', handleManualLock);
    return () => window.removeEventListener('programas:lock', handleManualLock);
  }, [enabled, getEffectivePin]);

  // Le contenu de l'app est inactif tant qu'elle est verrouillée
  useEffect(() => {
    if (content.current) (content.current as HTMLElement & { inert: boolean }).inert = mode !== 'open';
  }, [mode]);

  const fail = async (text: string) => {
    haptic(40);
    setMessage(text);
    setShake(true);
    await wait(450);
    setShake(false);
    setPin('');
  };

  const submit = async (value: string) => {
    busy.current = true;
    try {
      if (mode === 'setup') {
        setFirst(value);
        await wait(160);
        setPin('');
        setMessage('');
        setMode('confirm');
      } else if (mode === 'confirm') {
        if (value === first) {
          const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
          const hash = await hashPin(value, salt);

          try {
            localStorage.setItem(pinStorageKey, JSON.stringify({ salt, hash }));
            localStorage.removeItem(failStorageKey);
          } catch {}

          // Rattacher le PIN au compte Firestore de l'étudiant (impossible de recréer un autre PIN en changeant d'appareil)
          if (isStudent && userMatricule) {
            await saveStudentPinToAccount(userMatricule, salt, hash);
            onPinUpdated?.(salt, hash);
          }

          haptic(20);
          await wait(140);
          setPin('');
          setMessage('');
          setMode('open');
        } else {
          await fail('Les deux codes sont différents. Recommence.');
          setFirst('');
          setMode('setup');
        }
      } else if (mode === 'locked') {
        const stored = getEffectivePin();
        if (stored && (await hashPin(value, stored.salt)) === stored.hash) {
          try {
            localStorage.removeItem(failStorageKey);
          } catch {}
          if (isStudent && userMatricule && getEffectiveFails() > 0) {
            updateStudentPinFails(userMatricule, 0).catch(() => {});
          }
          haptic(15);
          await wait(120);
          setPin('');
          setMessage('');
          setMode('open');
        } else {
          const fails = getEffectiveFails() + 1;
          try {
            localStorage.setItem(failStorageKey, String(fails));
          } catch {}

          if (isStudent && userMatricule) {
            updateStudentPinFails(userMatricule, fails).catch(() => {});
          }

          if (fails >= maxAttempts) {
            if (isStudent && userMatricule) {
              const blockReason = 'Compte verrouillé suite à 5 tentatives consécutives de code PIN erronées.';
              try {
                await blockStudentAccount(userMatricule, blockReason);
              } catch (bErr) {
                console.error('Error blocking student account on PinLock:', bErr);
              }

              await fail('5 erreurs ! Compte bloqué. Contactez l\'Admin CROU.');
              await wait(1300);

              // NE PAS supprimer pinHash du compte Firestore ! Seul l'Admin peut débloquer/réinitialiser.
              // Effacer uniquement les identifiants mémorisés sur cet appareil.
              try {
                localStorage.removeItem('crou_remembered_matricule');
                localStorage.removeItem('crou_remembered_password');
                localStorage.removeItem(failStorageKey);
              } catch {}

              onAccountBlocked?.(userMatricule, blockReason);
            } else {
              // Pour le compte admin uniquement : retour à l'écran de connexion admin sans bloquer d'étudiant
              await fail('5 erreurs ! Reconnexion administrateur requise.');
              await wait(1000);
              try {
                localStorage.removeItem(pinStorageKey);
                localStorage.removeItem(failStorageKey);
              } catch {}
              onForgot?.();
            }
          } else {
            const left = maxAttempts - fails;
            await fail(`Code incorrect. ${left} essai${left > 1 ? 's' : ''} restant${left > 1 ? 's' : ''}.`);
          }
        }
      }
    } catch {
      await fail('Une erreur est survenue. Réessaie.');
    } finally {
      busy.current = false;
    }
  };

  const press = useCallback(
    (digit: string) => {
      if (busy.current || pin.length >= 4) return;
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) void submit(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pin, mode, first, accountPinHash, accountPinSalt, accountPinFails]
  );
  const erase = () => !busy.current && setPin((p) => p.slice(0, -1));

  // Clavier physique
  useEffect(() => {
    if (mode === 'open' || mode === 'checking') return;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') erase();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, press]);

  const showLock = mode === 'setup' || mode === 'confirm' || mode === 'locked';
  const copy = showLock ? TEXT[mode] : null;
  const remainingAttempts = Math.max(0, maxAttempts - getEffectiveFails());

  return (
    <>
      <div ref={content} aria-hidden={mode !== 'open'}>
        {mode !== 'checking' && children}
      </div>

      {(mode === 'checking' || showLock) && (
        <div
          className="fixed inset-0 z-[90] flex flex-col items-center bg-white px-6 text-[#1d1d1f] dark:bg-black dark:text-white"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
        >
          {copy && (
            <>
              <div className="mt-[8vh] h-14 w-14 rounded-2xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/25" aria-hidden="true">
                <Lock className="w-7 h-7 text-white" />
              </div>

              {userMatricule && (
                <div className="mt-3 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[11px] font-mono font-bold tracking-wider">
                  {userName ? `${userName} · ` : ''}{userMatricule}
                </div>
              )}

              <h1 className="mt-4 text-2xl font-semibold text-center">{copy.title}</h1>
              <p
                className={`mt-1 min-h-5 text-center text-[14px] ${
                  message ? 'text-red-600 font-semibold dark:text-red-400' : 'text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)]'
                }`}
                role="status"
              >
                {message || (mode === 'locked' && remainingAttempts < maxAttempts ? `${remainingAttempts} essai${remainingAttempts > 1 ? 's' : ''} restant${remainingAttempts > 1 ? 's' : ''} avant blocage` : copy.hint)}
              </p>

              <div className={`mt-7 flex gap-5 ${shake ? 'shake' : ''}`} aria-label={`${pin.length} chiffres saisis sur 4`}>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-[14px] w-[14px] rounded-full border-[1.5px] border-[#1d1d1f] transition-colors duration-100 dark:border-white ${
                      i < pin.length ? 'bg-[#1d1d1f] dark:bg-white' : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>

              <div className="mt-auto grid w-full max-w-[300px] grid-cols-3 justify-items-center gap-x-6 gap-y-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <Key key={d} label={d} onPress={() => press(d)} />
                ))}
                <span />
                <Key label="0" onPress={() => press('0')} />
                <button
                  type="button"
                  onClick={erase}
                  aria-label="Effacer"
                  className={`flex h-[76px] w-[76px] items-center justify-center text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)] ${
                    pin.length ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                >
                  <Delete className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>

              <div className="mt-5 min-h-12 flex items-center justify-center text-center max-w-xs">
                {mode === 'locked' && (
                  isStudent ? (
                    <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-900 dark:bg-amber-950/50 dark:border-amber-500/30 dark:text-amber-200">
                      <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>
                        Code oublié ou compte bloqué ? Déblocage exclusivement par l'Admin au guichet CROU.
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.removeItem(pinStorageKey);
                          localStorage.removeItem(failStorageKey);
                        } catch {}
                        onForgot?.();
                      }}
                      className="h-10 px-4 text-sm font-semibold text-orange-600 hover:underline cursor-pointer"
                    >
                      Déconnexion Administrateur
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

const Key: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <button
    type="button"
    onClick={onPress}
    className="flex h-[76px] w-[76px] select-none items-center justify-center rounded-full bg-black/5 text-[32px] font-light tabular-nums transition-colors duration-100 active:bg-black/15 dark:bg-white/10 dark:active:bg-white/25"
  >
    {label}
  </button>
);

/** Déclenche le verrouillage immédiat de l'application depuis n'importe quel composant */
export const lockAppNow = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('programas:lock'));
  }
};
