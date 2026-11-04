// src/components/PinLock.tsx
// Code à 4 chiffres pour déverrouiller l'app, comme Wave ou Djamo.
//
// Usage (autour de l'app, une fois l'utilisateur connecté) :
//   <PinLock enabled={isLoggedIn} onForgot={() => signOut()}>
//     <App />
//   </PinLock>
//
// Fonctionnement :
//  - 1re ouverture : création du code, puis confirmation.
//  - Ensuite : l'app est verrouillée au démarrage et après 30 s passées en arrière-plan.
//  - 5 erreurs, ou « Code oublié » : le code est effacé et onForgot() est appelé (reconnexion obligatoire).
//  - Le code n'est jamais stocké en clair : seulement une empreinte PBKDF2 avec sel aléatoire.
//
// Attention : c'est un verrou de confort (téléphone prêté, curieux). Il ne remplace pas la sécurité du serveur :
// un paiement doit toujours être autorisé côté serveur.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Delete } from 'lucide-react';

const PIN_KEY = 'programas_pin';
const FAIL_KEY = 'programas_pin_fails';
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

const readPin = (): { salt: string; hash: string } | null => {
  try {
    return JSON.parse(localStorage.getItem(PIN_KEY) ?? 'null');
  } catch {
    return null;
  }
};

const wipePin = () => {
  try {
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem(FAIL_KEY);
  } catch {
    /* ignoré */
  }
};

type Mode = 'checking' | 'setup' | 'confirm' | 'locked' | 'open';

interface Props {
  children: React.ReactNode;
  /** false tant que l'utilisateur n'est pas connecté : aucun code n'est demandé */
  enabled?: boolean;
  onForgot?: () => void;
  lockAfterMs?: number;
  maxAttempts?: number;
}

const TEXT: Record<'setup' | 'confirm' | 'locked', { title: string; hint: string }> = {
  setup: { title: 'Crée ton code', hint: '4 chiffres pour protéger ton compte' },
  confirm: { title: 'Confirme ton code', hint: 'Saisis-le une deuxième fois' },
  locked: { title: 'Saisis ton code', hint: 'Programas est verrouillé' },
};

export const PinLock: React.FC<Props> = ({ children, enabled = true, onForgot, lockAfterMs = 30_000, maxAttempts = 5 }) => {
  const [mode, setMode] = useState<Mode>('checking');
  const [pin, setPin] = useState('');
  const [first, setFirst] = useState('');
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  const hiddenAt = useRef<number | null>(null);
  const content = useRef<HTMLDivElement>(null);

  // Au démarrage : code existant → verrouillé, sinon → création
  useEffect(() => {
    if (!enabled) return setMode('open');
    setPin('');
    setMessage('');
    setMode(readPin() ? 'locked' : 'setup');
  }, [enabled]);

  // Verrouillage automatique après un temps en arrière-plan
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now();
        return;
      }
      const away = hiddenAt.current ? Date.now() - hiddenAt.current : 0;
      hiddenAt.current = null;
      if (mode === 'open' && away >= lockAfterMs && readPin()) {
        setPin('');
        setMessage('');
        setMode('locked');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [mode, lockAfterMs]);

  // Verrouillage manuel à la demande (ex: clic sur "Verrouiller l'app")
  useEffect(() => {
    const handleManualLock = () => {
      if (enabled && readPin()) {
        setPin('');
        setMessage('');
        setMode('locked');
      }
    };
    window.addEventListener('programas:lock', handleManualLock);
    return () => window.removeEventListener('programas:lock', handleManualLock);
  }, [enabled]);

  // Le contenu de l'app est inactif (clic, clavier, lecteur d'écran) tant qu'elle est verrouillée
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
        await wait(180);
        setPin('');
        setMessage('');
        setMode('confirm');
      } else if (mode === 'confirm') {
        if (value === first) {
          const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
          localStorage.setItem(PIN_KEY, JSON.stringify({ salt, hash: await hashPin(value, salt) }));
          localStorage.removeItem(FAIL_KEY);
          haptic(20);
          await wait(150);
          setPin('');
          setMessage('');
          setMode('open');
        } else {
          await fail('Les deux codes sont différents. Recommence.');
          setFirst('');
          setMode('setup');
        }
      } else if (mode === 'locked') {
        const stored = readPin();
        if (stored && (await hashPin(value, stored.salt)) === stored.hash) {
          localStorage.removeItem(FAIL_KEY);
          haptic(15);
          await wait(120);
          setPin('');
          setMessage('');
          setMode('open');
        } else {
          const fails = Number(localStorage.getItem(FAIL_KEY) ?? 0) + 1;
          localStorage.setItem(FAIL_KEY, String(fails));
          if (fails >= maxAttempts) {
            await fail('Trop d’erreurs. Reconnecte-toi.');
            wipePin();
            onForgot?.();
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
    [pin, mode, first]
  );
  const erase = () => !busy.current && setPin((p) => p.slice(0, -1));

  // Clavier physique (ordinateur)
  useEffect(() => {
    if (mode === 'open' || mode === 'checking') return;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') erase();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, press]);

  const forgot = () => {
    wipePin();
    onForgot?.();
  };

  const showLock = mode === 'setup' || mode === 'confirm' || mode === 'locked';
  const copy = showLock ? TEXT[mode] : null;

  return (
    <>
      <div ref={content} aria-hidden={mode !== 'open'}>
        {mode !== 'checking' && children}
      </div>

      {(mode === 'checking' || showLock) && (
        <div
          className="fixed inset-0 z-[90] flex flex-col items-center bg-white px-8 text-[#1d1d1f] dark:bg-black dark:text-white"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
        >
          {copy && (
            <>
              <div className="mt-[10vh] h-14 w-14 rounded-[13px] bg-orange-600" aria-hidden="true" />
              <h1 className="mt-6 text-2xl font-semibold">{copy.title}</h1>
              <p className="mt-1 h-5 text-[15px] text-[rgba(60,60,67,0.6)] dark:text-[rgba(235,235,245,0.6)]" role="status">
                {message || copy.hint}
              </p>

              <div className={`mt-8 flex gap-5 ${shake ? 'shake' : ''}`} aria-label={`${pin.length} chiffres saisis sur 4`}>
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

              <div className="mt-6 h-11">
                {mode === 'locked' && (
                  <button type="button" onClick={forgot} className="h-11 px-4 text-[17px] text-orange-600">
                    Code oublié ?
                  </button>
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

