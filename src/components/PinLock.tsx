// src/components/PinLock.tsx
// Verrouillage par code PIN à 4 chiffres rattaché directement au compte Firestore de l'étudiant.
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
const haptic = (ms: number) => {
  try {
    (window as unknown as { haptic?: (n: number) => void }).haptic?.(ms);
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms);
    }
  } catch {
    // Ignore haptic fallback errors
  }
};
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
  setup: { title: 'Créez votre code PIN', hint: '4 chiffres rattachés à votre compte CROU' },
  confirm: { title: 'Confirmez le code PIN', hint: 'Saisissez-le une deuxième fois' },
  locked: { title: 'Code PIN requis', hint: 'Compte protégé par code de sécurité' },
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
    setPin('');
    setMessage('');
    setMode(effective ? 'locked' : 'setup');
  }, [enabled, scopeId, accountPinHash, accountPinSalt, accountIsBlocked]);

  useEffect(() => {
    if (enabled && accountPinSalt && accountPinHash && mode === 'setup') {
      setPin('');
      setFirst('');
      setMessage('');
      setMode('locked');
    }
  }, [enabled, accountPinSalt, accountPinHash, mode]);

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
        await wait(140);
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

          if (isStudent && userMatricule) {
            await saveStudentPinToAccount(userMatricule, salt, hash);
            onPinUpdated?.(salt, hash);
          }

          haptic(20);
          await wait(120);
          setPin('');
          setMessage('');
          setMode('open');
        } else {
          await fail('Les deux codes sont différents. Recommencez.');
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
          await wait(100);
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

              await fail("5 erreurs. Compte bloqué, contactez l'Admin CROU.");
              await wait(1300);

              try {
                localStorage.removeItem('crou_remembered_matricule');
                localStorage.removeItem('crou_remembered_password');
                localStorage.removeItem(failStorageKey);
              } catch {}

              onAccountBlocked?.(userMatricule, blockReason);
            } else {
              await fail('5 erreurs. Reconnexion administrateur requise.');
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
      await fail('Une erreur est survenue. Réessayez.');
    } finally {
      busy.current = false;
    }
  };

  const press = useCallback(
    (digit: string) => {
      if (busy.current || pin.length >= 4) return;
      haptic(8);
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) void submit(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pin, mode, first, accountPinHash, accountPinSalt, accountPinFails]
  );

  const erase = () => {
    if (busy.current) return;
    haptic(6);
    setPin((p) => p.slice(0, -1));
  };

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
          className="fixed inset-0 z-[90] flex flex-col items-center justify-between bg-[var(--ios-bg)] text-[var(--ios-fg)] px-6 select-none"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 28px)', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
        >
          {copy && (
            <>
              <div className="flex flex-col items-center mt-4 sm:mt-8">
                <div className="w-16 h-16 rounded-[20px] bg-[#ea580c] flex items-center justify-center shadow-lg shadow-orange-600/25" aria-hidden="true">
                  <Lock className="w-7 h-7 text-white" />
                </div>

                {userMatricule && (
                  <p className="mt-3 text-[13px] font-bold tracking-wide text-[var(--ios-fg-secondary)] tabular-nums">
                    {userName ? `${userName} · ` : ''}{userMatricule}
                  </p>
                )}

                <h1 className="mt-3 text-[28px] sm:text-[32px] font-extrabold tracking-tight text-center leading-tight">
                  {copy.title}
                </h1>
                <p
                  className={`mt-1.5 min-h-[24px] text-center text-[15px] ${
                    message ? 'text-red-500 font-semibold' : 'text-[var(--ios-fg-secondary)]'
                  }`}
                  role="status"
                >
                  {message ||
                    (mode === 'locked' && remainingAttempts < maxAttempts
                      ? `${remainingAttempts} essai${remainingAttempts > 1 ? 's' : ''} restant${remainingAttempts > 1 ? 's' : ''} avant blocage`
                      : copy.hint)}
                </p>

                {/* 4 PIN Dots */}
                <div className={`mt-7 flex gap-5 ${shake ? 'shake' : ''}`} aria-label={`${pin.length} chiffres saisis sur 4`}>
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-4 w-4 rounded-full border-2 transition-all duration-150 ${
                        i < pin.length
                          ? 'bg-[#ea580c] border-[#ea580c] scale-110'
                          : 'bg-transparent border-[var(--ios-fg-tertiary)]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Round iOS Keypad */}
              <div className="grid w-full max-w-[296px] grid-cols-3 justify-items-center gap-x-5 gap-y-4 my-auto py-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <Key key={d} label={d} onPress={() => press(d)} />
                ))}
                <span />
                <Key label="0" onPress={() => press('0')} />
                <button
                  type="button"
                  onClick={erase}
                  aria-label="Effacer le dernier chiffre"
                  className={`ios-btn-spring flex h-[76px] w-[76px] items-center justify-center rounded-full text-[var(--ios-fg-secondary)] ${
                    pin.length ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                >
                  <Delete className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
                </button>
              </div>

              {/* Footer Status / Guard Notice */}
              <div className="min-h-[56px] flex items-center justify-center text-center max-w-xs">
                {mode === 'locked' &&
                  (isStudent ? (
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-[18px] bg-[var(--ios-surface)] border border-[var(--ios-border)] text-[12px] font-medium text-[var(--ios-fg-secondary)] leading-snug">
                      <ShieldAlert className="w-4 h-4 text-[#ea580c] flex-shrink-0" />
                      <span>
                        Code oublié ou compte bloqué ? Déblocage exclusivement au guichet Admin CROU.
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
                      className="ios-btn-spring min-h-[48px] px-5 text-[15px] font-bold text-[#ea580c]"
                    >
                      Déconnexion Administrateur
                    </button>
                  ))}
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
    aria-label={`Chiffre ${label}`}
    className="ios-btn-spring flex h-[76px] w-[76px] select-none items-center justify-center rounded-full bg-[var(--ios-surface)] border border-[var(--ios-border)] text-[30px] font-semibold text-[var(--ios-fg)] tabular-nums shadow-xs active:bg-[#ea580c]/15"
  >
    {label}
  </button>
);

export const lockAppNow = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('programas:lock'));
  }
};
