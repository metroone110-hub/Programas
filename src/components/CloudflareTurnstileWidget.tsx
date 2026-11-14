import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, params: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

const TURNSTILE_SITE_KEY = '0x4AAAAAAGAPY5g0Xyku92xS';

interface Props {
  onTokenChange: (token: string | null) => void;
  resetSignal?: number;
  action?: string;
}

export const CloudflareTurnstileWidget: React.FC<Props> = ({
  onTokenChange,
  resetSignal = 0,
  action = 'recharge'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  onTokenChangeRef.current = onTokenChange;

  const [status, setStatus] = useState<'loading' | 'ready' | 'verified' | 'expired' | 'error'>('loading');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | null = null;
    let attempts = 0;

    const mountWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile?.render) return false;
      if (widgetIdRef.current) return true;

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          theme: 'auto',
          size: 'flexible',
          language: 'fr',
          callback: (token: string) => {
            if (cancelled) return;
            setStatus('verified');
            setErrorDetail(null);
            onTokenChangeRef.current(token);
          },
          'expired-callback': () => {
            if (cancelled) return;
            setStatus('expired');
            setErrorDetail('La vérification a expiré. Actualisez pour continuer.');
            onTokenChangeRef.current(null);
          },
          'timeout-callback': () => {
            if (cancelled) return;
            setStatus('expired');
            setErrorDetail('Délai dépassé. Cliquez sur Actualiser.');
            onTokenChangeRef.current(null);
          },
          'error-callback': (code?: string | number) => {
            if (cancelled) return;
            const codeStr = code !== undefined ? String(code) : '';
            setStatus('error');
            onTokenChangeRef.current(null);
            if (codeStr.startsWith('110200')) {
              setErrorDetail(
                `Domaine non autorisé par le widget Turnstile (${window.location.hostname}, code ${codeStr}).`
              );
            } else {
              setErrorDetail(
                `Vérification Cloudflare impossible${codeStr ? ` (code ${codeStr})` : ''}. Cliquez sur Actualiser.`
              );
            }
          }
        });
        widgetIdRef.current = id;
        setStatus((prev) => (prev === 'loading' ? 'ready' : prev));
        return true;
      } catch (err) {
        console.error('Turnstile render error:', err);
        setStatus('error');
        setErrorDetail('Impossible de charger le module de sécurité Cloudflare.');
        return true;
      }
    };

    if (!mountWidget()) {
      pollTimer = window.setInterval(() => {
        attempts += 1;
        if (mountWidget()) {
          if (pollTimer !== null) window.clearInterval(pollTimer);
        } else if (attempts >= 100) {
          if (pollTimer !== null) window.clearInterval(pollTimer);
          if (!cancelled) {
            setStatus('error');
            setErrorDetail('Le script Cloudflare Turnstile met trop de temps à répondre.');
          }
        }
      }, 150);
    }

    return () => {
      cancelled = true;
      if (pollTimer !== null) window.clearInterval(pollTimer);
      if (widgetIdRef.current && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [action]);

  useEffect(() => {
    if (resetSignal === 0) return;
    if (widgetIdRef.current && window.turnstile?.reset) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        setStatus('ready');
        setErrorDetail(null);
        onTokenChangeRef.current(null);
      } catch {
        // Ignore reset errors
      }
    }
  }, [resetSignal]);

  const handleManualReset = () => {
    setErrorDetail(null);
    onTokenChangeRef.current(null);
    if (widgetIdRef.current && window.turnstile?.reset) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        setStatus('ready');
      } catch {
        setStatus('error');
      }
    }
  };

  return (
    <div className="p-3.5 bg-[var(--ios-bg)] border border-[var(--ios-border)] rounded-[20px] space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {status === 'verified' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : status === 'loading' ? (
            <Loader2 className="w-4 h-4 text-[#ea580c] animate-spin flex-shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-[#ea580c] flex-shrink-0" />
          )}
          <span className="text-[13px] font-bold text-[var(--ios-fg)] truncate">
            {status === 'verified'
              ? 'Sécurité Cloudflare validée'
              : 'Vérification Cloudflare Turnstile'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleManualReset}
          className="ios-btn-spring inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] bg-[var(--ios-surface)] border border-[var(--ios-border)] text-[12px] font-semibold text-[var(--ios-fg-secondary)] hover:text-[var(--ios-fg)] flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </button>
      </div>

      <div
        ref={containerRef}
        className="min-h-[65px] w-full flex items-center justify-center overflow-hidden rounded-[12px]"
      />

      {errorDetail && (
        <div className="flex items-start gap-2 text-[12px] text-red-600 dark:text-red-400 leading-snug">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorDetail}</span>
        </div>
      )}
    </div>
  );
};
