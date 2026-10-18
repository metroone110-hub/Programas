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
  Ticket, 
  Search,
  Check,
  TrendingUp,
  Clock,
  Activity,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import type { TicketValidationResult, TicketStats, PaymentDiagnosisResult } from '../types';
import { playScanSound } from '../utils/qrcode';

interface AdminTicketScannerProps {
  token?: string;
}

export const AdminTicketScanner: React.FC<AdminTicketScannerProps> = ({ token }) => {
  const [manualCode, setManualCode] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<TicketValidationResult | null>(null);

  // Scanner camera state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'admin-qr-reader-viewport';

  // Stats
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  // Diagnosis & Payment Gateway State
  const [diagnosis, setDiagnosis] = useState<PaymentDiagnosisResult | null>(null);
  const [testingKey, setTestingKey] = useState<boolean>(false);
  const [customKeyInput, setCustomKeyInput] = useState<string>('81930870-7db8-4def-85d3-1d84efa082b7');
  const [showDiagnosticDetails, setShowDiagnosticDetails] = useState<boolean>(true);

  // Fetch stats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch('/api/tickets/stats');
      if (res.ok) {
        const json = await res.json();
        if (json.stats) {
          setStats(json.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch ticket stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Run live diagnosis on MTN MoMo
  const runMomoDiagnosis = async (keyToTest?: string) => {
    try {
      setTestingKey(true);
      const url = keyToTest 
        ? `/api/tickets/momo-diagnosis?key=${encodeURIComponent(keyToTest)}`
        : '/api/tickets/momo-diagnosis';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.diagnosis) {
          setDiagnosis(json.diagnosis);
        }
      }
    } catch (err) {
      console.error('Failed to run MTN MoMo diagnosis:', err);
    } finally {
      setTestingKey(false);
    }
  };

  // Receiver phone and merchant code settings
  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [merchantCode, setMerchantCode] = useState<string>('');
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Fetch payment config
  const fetchPaymentConfig = async () => {
    try {
      const res = await fetch('/api/tickets/payment-config');
      if (res.ok) {
        const json = await res.json();
        if (json.config) {
          setReceiverPhone(json.config.momoReceiverPhone || '');
          setMerchantCode(json.config.momoMerchantCode || '');
          if (json.config.momoApiKey) {
            setCustomKeyInput(json.config.momoApiKey);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load payment config:', e);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      setSaveSuccess(false);
      const res = await fetch('/api/tickets/payment-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          momoReceiverPhone: receiverPhone,
          momoMerchantCode: merchantCode,
          momoApiKey: customKeyInput,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setSavingConfig(false);
    }
  };

  useEffect(() => {
    fetchStats();
    runMomoDiagnosis();
    fetchPaymentConfig();
  }, []);

  // Process ticket validation
  const handleValidate = async (rawCode: string) => {
    if (!rawCode || !rawCode.trim()) return;
    try {
      setIsValidating(true);
      setValidationResult(null);

      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: rawCode.trim() }),
      });

      const result: TicketValidationResult = await res.json();
      setValidationResult(result);

      if (result.valid) {
        playScanSound('success');
      } else if (result.status === 'used') {
        playScanSound('warning');
      } else {
        playScanSound('error');
      }

      // Refresh stats
      fetchStats();
    } catch (err) {
      console.error('Validation call failed:', err);
      setValidationResult({
        valid: false,
        status: 'not_found',
        message: 'Erreur réseau lors de la vérification du ticket.',
      });
      playScanSound('error');
    } finally {
      setIsValidating(false);
    }
  };

  // Camera QR Scanner control
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }
      setIsScanning(true);
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleValidate(decodedText);
        },
        () => {
          // scanning frame, ignore continuous errors
        }
      );
    } catch (err: any) {
      console.error('Failed to start camera:', err);
      setCameraError(
        'Impossible d\'accéder à la caméra. Vérifiez les autorisations de votre navigateur ou utilisez la saisie manuelle.'
      );
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Failed to stop camera:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop();
          }
        } catch {}
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 to-black text-white p-5 sm:p-6 rounded-3xl border border-white/10 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#FFCC00] text-slate-950">
              Guichet Resto U
            </span>
            <span className="text-xs text-slate-400 font-bold">
              UPGC Korhogo • CROU-K
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
            Contrôle & Validation des Tickets
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Scannez le QR code de l'étudiant ou saisissez son code à 6 chiffres pour valider son repas.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loadingStats}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
          <span>Actualiser les chiffres</span>
        </button>
      </div>

      {/* DIAGNOSTIC API EN DIRECT DE LA CLÉ FOURNIE (MTN MOMO / WAVE) */}
      <div className="bg-white rounded-3xl border border-black/10 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black shadow-xs ${
              diagnosis?.statusCode === 200 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-950 text-sm sm:text-base">
                  Diagnostic en Direct de l'API MTN MoMo
                </h4>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  diagnosis?.statusCode === 200
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {diagnosis?.statusCode === 200 ? '🟢 Connecté' : '🔴 HTTP ' + (diagnosis?.statusCode || '401')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Vérification réelle auprès des serveurs de paiement MTN MoMo
              </p>
            </div>
          </div>

          <button
            onClick={() => runMomoDiagnosis(customKeyInput)}
            disabled={testingKey}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingKey ? 'animate-spin' : ''}`} />
            <span>Tester la connexion</span>
          </button>
        </div>

        {/* INPUT DE TEST DE CLÉ */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-black/5 flex flex-col sm:flex-row gap-2 items-center">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-600 shrink-0">
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold">Clé testée :</span>
          </div>
          <input
            type="text"
            value={customKeyInput}
            onChange={(e) => setCustomKeyInput(e.target.value)}
            placeholder="Entrez une clé MTN MoMo..."
            className="flex-1 w-full bg-white px-3 py-1.5 rounded-xl border border-black/10 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            onClick={() => runMomoDiagnosis(customKeyInput)}
            disabled={testingKey}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl transition-colors shrink-0"
          >
            Vérifier cette clé
          </button>
        </div>

        {/* RÉSULTAT DU TEST EN DIRECT */}
        {diagnosis && (
          <div className="space-y-3">
            <div className={`p-4 rounded-2xl border ${
              diagnosis.statusCode === 200
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-rose-50/80 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  diagnosis.statusCode === 200 ? 'text-emerald-600' : 'text-rose-600'
                }`} />
                <div className="space-y-1">
                  <div className="font-black text-xs sm:text-sm">
                    {diagnosis.message}
                  </div>
                  <div className="text-[11px] text-slate-700 font-mono bg-white/70 p-2 rounded-xl border border-black/5">
                    Réponse brute du serveur MTN : <code>{diagnosis.rawResponse || 'HTTP 401 Unauthorized'}</code>
                  </div>
                </div>
              </div>
            </div>

            {/* EXPLICATIONS DÉTAILLÉES */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="font-black text-slate-900 flex items-center gap-1.5">
                <span>📋</span>
                <span>Rapport d'analyse pour le gestionnaire CROU :</span>
              </div>
              <ul className="space-y-1 list-disc list-inside text-slate-700 text-[11px] leading-relaxed">
                {diagnosis.explanations.map((exp, idx) => (
                  <li key={idx}>{exp}</li>
                ))}
              </ul>

              <div className="pt-2 border-t border-amber-200/60">
                <div className="font-black text-slate-900 mb-1">💡 Solutions recommandées pour le campus :</div>
                <ul className="space-y-1 list-disc list-inside text-slate-700 text-[11px] leading-relaxed">
                  {diagnosis.recommendations.map((rec, idx) => (
                    <li key={idx} className="font-medium">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* CONFIGURATION DU NUMÉRO RÉCEPTEUR DE LA CAISSE CROU-K */}
        <div className="pt-4 border-t border-black/5">
          <form onSubmit={handleSaveConfig} className="bg-slate-50 p-4 rounded-2xl border border-black/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-black text-xs text-slate-900">
                  Numéro Marchand / Récepteur de la Caisse CROU-K
                </h5>
                <p className="text-[11px] text-slate-500">
                  Le numéro ou code USSD où les fonds des tickets doivent être versés
                </p>
              </div>
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  ✅ Enregistré avec succès !
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Numéro MTN MoMo de Réception (Caisse CROU-K) :
                </label>
                <input
                  type="text"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="Ex: 05 00 11 22 33"
                  className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Code Marchand USSD MoMo Pay (Optionnel) :
                </label>
                <input
                  type="text"
                  value={merchantCode}
                  onChange={(e) => setMerchantCode(e.target.value)}
                  placeholder="Ex: *133*554433*200#"
                  className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={savingConfig}
                className="px-4 py-2 bg-[#18181B] hover:bg-black text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                {savingConfig ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <span>Enregistrer les coordonnées de caisse</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">
            Total Tickets Vendus
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {stats?.totalSold ?? 0}
          </div>
          <span className="text-[10px] text-amber-600 font-bold">
            Tarif 200 F / 2000 F
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">
            Repas Servis (Validés)
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {stats?.totalUsed ?? 0}
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">
            Passages au self
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">
            Tickets en Circulation
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {stats?.totalActive ?? 0}
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">
            Disponibles
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">
            Recettes Encaissées
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {(stats?.totalRevenue ?? 0).toLocaleString('fr-FR')}{' '}
            <span className="text-xs text-slate-500 font-bold">FCFA</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">
            Compte Régie CROU-K
          </span>
        </div>
      </div>

      {/* VALIDATION RESULT BANNER */}
      {validationResult && (
        <div
          className={`p-5 rounded-3xl border-2 transition-all shadow-md animate-in fade-in zoom-in-95 duration-150 ${
            validationResult.valid
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
              : validationResult.status === 'used'
              ? 'bg-amber-50 border-amber-500 text-amber-950'
              : 'bg-rose-50 border-rose-500 text-rose-950'
          }`}
        >
          <div className="flex items-start gap-3.5">
            {validationResult.valid ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
            ) : validationResult.status === 'used' ? (
              <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-8 h-8 text-rose-600 shrink-0 mt-0.5" />
            )}

            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    validationResult.valid
                      ? 'bg-emerald-200 text-emerald-900'
                      : validationResult.status === 'used'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-rose-200 text-rose-900'
                  }`}
                >
                  {validationResult.valid
                    ? 'ACCÈS AUTORISÉ'
                    : validationResult.status === 'used'
                    ? 'DÉJÀ UTILISÉ'
                    : 'TICKET INCONNU'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {validationResult.ticket?.securityCode}
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-black tracking-tight">
                {validationResult.message}
              </h4>

              {validationResult.ticket && (
                <div className="text-xs text-slate-600 font-medium pt-1">
                  Formule : <strong>{validationResult.ticket.label}</strong> • Montant :{' '}
                  <strong>{validationResult.ticket.price} FCFA</strong>
                  {validationResult.ticket.payerPhone && (
                    <span> • Payeur : {validationResult.ticket.payerPhone}</span>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setValidationResult(null)}
              className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* SCANNER & MANUAL ENTRY SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CAMERA SCANNER */}
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">
                    Scanner avec Caméra
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Pointez l'objectif vers le QR code de l'étudiant
                  </p>
                </div>
              </div>

              {isScanning ? (
                <button
                  onClick={stopCamera}
                  className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Arrêter</span>
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="px-3 py-1.5 bg-[#FFCC00] text-slate-950 hover:bg-[#f0c000] rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Activer Caméra</span>
                </button>
              )}
            </div>

            {cameraError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold mb-3">
                {cameraError}
              </div>
            )}

            {/* Video preview container for html5-qrcode */}
            <div
              id={scannerContainerId}
              className={`w-full overflow-hidden rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-center p-4 transition-all ${
                isScanning ? 'min-h-[260px]' : 'h-36'
              }`}
            >
              {!isScanning && (
                <div className="text-slate-400 space-y-1">
                  <Camera className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs font-semibold">
                    Caméra désactivée. Cliquez sur "Activer Caméra" ci-dessus.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MANUAL CODE ENTRY */}
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                <Search className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">
                  Saisie Manuelle (Code Guichet)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Entrez le code à 6 chiffres affiché sur le téléphone de l'étudiant
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleValidate(manualCode);
              }}
              className="space-y-4"
            >
              <div>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ex: 849201 ou TK-CROUK-..."
                  className="w-full px-4 py-3.5 text-center text-xl font-mono font-black tracking-widest bg-slate-50 rounded-2xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                />
              </div>

              <button
                type="submit"
                disabled={isValidating || !manualCode.trim()}
                className="w-full py-3.5 bg-[#18181B] hover:bg-black text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {isValidating ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#FFCC00]" />
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#FFCC00]" />
                    <span>Valider le Passage</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-black/5 text-[11px] text-slate-400">
            💡 Astuce : En cas de coupure de réseau ou d'écran sombre, le code à 6 chiffres permet une vérification instantanée sans caméra.
          </div>
        </div>
      </div>

      {/* RECENT VALIDATIONS AUDIT TRAIL */}
      <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h4 className="font-black text-slate-900 text-sm">
              Derniers Repas Servis (Journal d'audit)
            </h4>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {stats?.recentValidations.length ?? 0} enregistrements récents
          </span>
        </div>

        {stats && stats.recentValidations.length > 0 ? (
          <div className="divide-y divide-black/5">
            {stats.recentValidations.map((v) => (
              <div key={v.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-900">{v.label}</span>
                  <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                    Code: {v.securityCode}
                  </span>
                  {v.payerPhone && (
                    <span className="text-slate-400 text-[11px]">
                      • {v.payerPhone}
                    </span>
                  )}
                </div>
                <div className="text-slate-400 font-medium">
                  {new Date(v.usedAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-3 text-center">
            Aucun ticket validé pour le moment.
          </p>
        )}
      </div>
    </div>
  );
};
