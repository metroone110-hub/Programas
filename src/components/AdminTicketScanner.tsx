import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Trash2, 
  Sparkles, 
  Ticket, 
  UserCheck, 
  Clock, 
  Search,
  Check
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import type { TicketValidationResult, TicketStats } from '../types';
import { playScanSound } from '../utils/qrcode';

interface AdminTicketScannerProps {
  token: string;
}

export const AdminTicketScanner: React.FC<AdminTicketScannerProps> = ({ token }) => {
  const [manualCode, setManualCode] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<TicketValidationResult | null>(null);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'admin-camera-reader';

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch('/api/tickets/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Erreur chargement stats tickets:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    return () => {
      stopCameraScanner();
    };
  }, []);

  const handleValidateCode = async (codeToValidate: string) => {
    if (!codeToValidate.trim()) return;
    try {
      setIsValidating(true);
      setScannerError(null);

      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenOrCode: codeToValidate.trim(),
          validatedBy: 'Guichet Resto U UPGC #1',
        }),
      });

      const result: TicketValidationResult = await res.json();
      setLastResult(result);

      if (result.success && result.code === 'VALID') {
        playScanSound('success');
      } else {
        playScanSound('error');
      }

      await fetchStats();
      setManualCode('');
    } catch (err: any) {
      console.error('Erreur validation ticket:', err);
      playScanSound('error');
      setLastResult({
        success: false,
        code: 'NOT_FOUND',
        message: 'Erreur de connexion lors de la vérification du ticket.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const startCameraScanner = async () => {
    try {
      setScannerError(null);
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Once a QR code is detected
          handleValidateCode(decodedText);
          // Briefly pause scanning to prevent multiple triggers in 1 second
          stopCameraScanner();
        },
        (errorMessage) => {
          // Scanning frames, ignore intermediate empty frame messages
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error('Erreur démarrage caméra:', err);
      setScannerError('Impossible d\'activer la caméra (vérifiez les autorisations de votre navigateur). Vous pouvez saisir le code manuellement.');
      setIsScanning(false);
    }
  };

  const stopCameraScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.error('Erreur arrêt caméra:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleResetTickets = async () => {
    if (!window.confirm('Voulez-vous réinitialiser tous les tickets de démonstration et l\'historique des scans ?')) {
      return;
    }
    try {
      const res = await fetch('/api/tickets/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setLastResult(null);
        await fetchStats();
      }
    } catch (err) {
      console.error('Erreur reset tickets:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#18181B] via-slate-900 to-black text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-amber-900 flex items-center justify-center font-black border border-amber-300 shadow-sm shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#92400E]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white">
                Guichet & Scanner de Tickets
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                Direct Caisse CROU-K
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Contrôle instantané anti-fraude • Vérification des 200 FCFA & Souches 2 000 FCFA
            </p>
          </div>
        </div>

        <button
          onClick={fetchStats}
          disabled={statsLoading}
          className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Daily Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-3xl bg-white border border-black/5 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Repas Validés Aujourd'hui
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {stats ? stats.todayUsedCount : 0}
          </div>
          <span className="text-[11px] text-slate-500 font-bold">
            = {(stats ? stats.todayUsedCount : 0) * 200} FCFA servis
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-black/5 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Doubles Passages Bloqués
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {stats ? stats.todayFraudAttemptsBlocked : 0}
          </div>
          <span className="text-[11px] text-rose-500 font-bold">
            Anti-fraude actif 🛡️
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-black/5 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Total Tickets Actifs
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {stats ? stats.totalValid : 0}
          </div>
          <span className="text-[11px] text-slate-500 font-bold">
            En attente de passage
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-black/5 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Tarif Officiel Déclaré
          </span>
          <div className="text-2xl font-black text-amber-900 mt-1">
            200 <span className="text-xs font-bold text-slate-600">FCFA</span>
          </div>
          <span className="text-[11px] text-slate-500 font-bold">
            Souche : 2 000 FCFA
          </span>
        </div>
      </div>

      {/* SCANNER CAMERA & MANUAL INPUT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Camera Scanner */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-black/5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#F5B726]" />
              Scanner Caméra au Guichet
            </h4>
            {isScanning ? (
              <button
                onClick={stopCameraScanner}
                className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-black flex items-center gap-1 transition-colors"
              >
                <CameraOff className="w-3.5 h-3.5" />
                Arrêter caméra
              </button>
            ) : (
              <button
                onClick={startCameraScanner}
                className="px-3.5 py-2 rounded-xl bg-[#18181B] hover:bg-black text-white text-xs font-black flex items-center gap-1.5 transition-transform active:scale-95 shadow-xs"
              >
                <Camera className="w-3.5 h-3.5 text-[#F5B726]" />
                Allumer caméra
              </button>
            )}
          </div>

          {/* Camera preview window */}
          <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[260px] flex flex-col items-center justify-center relative">
            <div id={scannerContainerId} className="w-full h-full max-h-[300px]" />
            {!isScanning && (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <Camera className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs font-semibold">
                  Caméra en veille pour économiser la batterie du guichet.
                </p>
                <button
                  onClick={startCameraScanner}
                  className="px-4 py-2 rounded-xl bg-[#F5B726] text-slate-950 text-xs font-black hover:bg-amber-400 transition-colors shadow-sm"
                >
                  Activer la caméra
                </button>
              </div>
            )}
          </div>

          {scannerError && (
            <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {scannerError}
            </p>
          )}

          {/* Manual Input Alternative */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Saisie manuelle directe (Code 6 chiffres ou Réf. TK) :
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: 492108 ou TK-UPGC-..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleValidateCode(manualCode);
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-[#F5B726]"
              />
              <button
                onClick={() => handleValidateCode(manualCode)}
                disabled={isValidating || !manualCode.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#18181B] hover:bg-black text-white text-xs font-black transition-colors disabled:opacity-50 shrink-0"
              >
                {isValidating ? 'Contrôle...' : 'Valider'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Scan Result Box */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-black/5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="font-black text-sm text-slate-900 mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#F5B726]" />
              Résultat Instantané du Guichet
            </h4>

            {lastResult ? (
              <div
                className={`p-5 rounded-3xl border-2 transition-all space-y-3 ${
                  lastResult.success && lastResult.code === 'VALID'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 animate-bounce-short'
                    : lastResult.code === 'ALREADY_USED'
                    ? 'bg-rose-50 border-rose-500 text-rose-950 animate-shake'
                    : 'bg-amber-50 border-amber-400 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                      lastResult.success && lastResult.code === 'VALID'
                        ? 'bg-emerald-500 text-white'
                        : lastResult.code === 'ALREADY_USED'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {lastResult.success && lastResult.code === 'VALID' ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : (
                      <XCircle className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        lastResult.success && lastResult.code === 'VALID'
                          ? 'bg-emerald-200 text-emerald-900'
                          : lastResult.code === 'ALREADY_USED'
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {lastResult.code === 'VALID'
                        ? 'ACCORDÉ • 1 REPAS (200 FCFA)'
                        : lastResult.code === 'ALREADY_USED'
                        ? 'DOUBLE-PASSAGE BLOQUÉ'
                        : 'NON RECONNU'}
                    </span>
                    <h5 className="font-black text-base mt-1 leading-snug">
                      {lastResult.message}
                    </h5>
                  </div>
                </div>

                {lastResult.ticket && (
                  <div className="pt-3 border-t border-black/10 text-xs space-y-1">
                    <p className="font-bold">
                      Libellé : <span className="font-semibold">{lastResult.ticket.label}</span>
                    </p>
                    <p className="font-mono text-[11px] text-slate-600">
                      Réf: {lastResult.ticket.id} • Code: {lastResult.ticket.securityCode}
                    </p>
                    {lastResult.alreadyUsedAt && (
                      <p className="text-rose-700 font-bold bg-rose-100 p-2 rounded-xl mt-1">
                        ⚠️ Ce ticket a déjà été validé le {new Date(lastResult.alreadyUsedAt).toLocaleString('fr-FR')} !
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <Ticket className="w-10 h-10 mx-auto text-slate-400" />
                <h5 className="font-bold text-sm text-slate-800">
                  En attente du prochain ticket
                </h5>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Présentez le QR code d'un étudiant ou tapez son code de sécurité pour autoriser le passage au self.
                </p>
              </div>
            )}
          </div>

          {/* Reset & Simulation Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              Contrôlé par la Régie CROU-K
            </span>
            <button
              onClick={handleResetTickets}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Réinitialiser tests
            </button>
          </div>
        </div>
      </div>

      {/* RECENT SCANS AUDIT LOG */}
      {stats && stats.recentScans && stats.recentScans.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-black/5 shadow-xs space-y-3">
          <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F5B726]" />
            Derniers scans enregistrés au guichet
          </h4>
          <div className="divide-y divide-slate-100">
            {stats.recentScans.map((scan, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      scan.isDoubleAttempt ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="font-mono font-bold text-slate-800">
                    {scan.ticketId}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">
                    {new Date(scan.validatedAt).toLocaleTimeString('fr-FR')}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    scan.isDoubleAttempt
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {scan.isDoubleAttempt ? 'Fraude bloquée' : 'Repas validé (200 F)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
