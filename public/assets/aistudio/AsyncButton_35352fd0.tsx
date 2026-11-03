// src/components/AsyncButton.tsx
// Bouton qui passe en « spinner » pendant l'action, puis affiche succès ou échec.
// Exemple :
//   <AsyncButton className="..." onAction={() => buyTicket()} successLabel="Ticket acheté">
//     Acheter un ticket
//   </AsyncButton>
import React, { useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface Props extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onAction: () => Promise<unknown> | unknown;
  successLabel?: string;
  errorLabel?: string;
  /** Durée minimale du spinner, pour que le chargement soit lisible même si l'action est instantanée */
  minLoadingMs?: number;
  spinner?: 'light' | 'dark';
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const haptic = (ms: number) => (window as unknown as { haptic?: (n: number) => void }).haptic?.(ms);

export const AsyncButton: React.FC<Props> = ({
  onAction,
  successLabel = 'Terminé',
  errorLabel = 'Échec, réessaie',
  minLoadingMs = 450,
  spinner = 'light',
  onSuccess,
  onError,
  className = '',
  children,
  disabled,
  ...rest
}) => {
  const [status, setStatus] = useState<Status>('idle');
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const run = async () => {
    if (status !== 'idle') return;
    setStatus('loading');
    try {
      await Promise.all([Promise.resolve(onAction()), wait(minLoadingMs)]);
      if (!mounted.current) return;
      setStatus('success');
      haptic(20);
      onSuccess?.();
      await wait(1100);
    } catch (err) {
      if (!mounted.current) return;
      setStatus('error');
      haptic(40);
      onError?.(err);
      await wait(1400);
    }
    if (mounted.current) setStatus('idle');
  };

  return (
    <button
      {...rest}
      type={rest.type ?? 'button'}
      onClick={run}
      disabled={disabled}
      aria-busy={status === 'loading'}
      aria-live="polite"
      data-loading={status === 'loading' ? 'true' : undefined}
      data-spinner={spinner === 'dark' ? 'dark' : undefined}
      className={`${className} ${status === 'error' ? 'shake' : ''}`}
    >
      {status === 'success' ? (
        <span className="inline-flex items-center justify-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path className="check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          {successLabel}
        </span>
      ) : status === 'error' ? (
        errorLabel
      ) : (
        children
      )}
    </button>
  );
};
