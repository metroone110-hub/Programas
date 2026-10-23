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
  ChevronUp,
  FileCode,
  Server,
  ShieldAlert
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import type { 
  TicketValidationResult, 
  TicketStats, 
  PaymentDiagnosisResult,
  MoovDiagnosisResult,
  CinetPayDiagnosisResult,
  JekoDiagnosisResult,
  OpenApiFullDiagnostic 
} from '../types';
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
  const [isScanningPhoto, setIsScanningPhoto] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const [gatewayTab, setGatewayTab] = useState<'jeko' | 'cinetpay' | 'moov' | 'mtn'>('jeko');

  // Jèko Pay State (Wave, Orange Money, MTN MoMo, Moov Africa, Djamo, Jèko)
  const [jekoApiKey, setJekoApiKey] = useState<string>('');
  const [jekoApiKeyId, setJekoApiKeyId] = useState<string>('');
  const [jekoStoreId, setJekoStoreId] = useState<string>('59ae202a-f583-4a15-970f-9e99bd1e0baa');
  const [jekoWebhookSecret, setJekoWebhookSecret] = useState<string>('');
  const [jekoDiagnosis, setJekoDiagnosis] = useState<JekoDiagnosisResult | null>(null);
  const [testingJeko, setTestingJeko] = useState<boolean>(false);
  const [simulatingJeko, setSimulatingJeko] = useState<boolean>(false);
  const [jekoSimResult, setJekoSimResult] = useState<string | null>(null);

  // Run live diagnosis on Jeko
  const runJekoDiagnosis = async () => {
    try {
      setTestingJeko(true);
      const res = await fetch('/api/tickets/jeko-diagnosis');
      const data = await res.json();
      if (data.diagnosis) {
        setJekoDiagnosis(data.diagnosis);
      }
    } catch (err) {
      console.error('Failed to run Jeko diagnosis:', err);
    } finally {
      setTestingJeko(false);
    }
  };

  // Test simulation for Jeko
  const handleSimulateJeko = async (operator: string) => {
    try {
      setSimulatingJeko(true);
      const res = await fetch('/api/tickets/jeko-simulate-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'unitaire',
          phone: '0102030405',
          visitorId: 'vis_admin_test',
          operator,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setJekoSimResult(`✅ Simulation Jèko (${operator}) réussie : 1 ticket repas généré dans la base.`);
        fetchStats();
        setTimeout(() => setJekoSimResult(null), 4000);
      }
    } catch (err: any) {
      setJekoSimResult(`❌ Erreur: ${err.message}`);
    } finally {
      setSimulatingJeko(false);
    }
  };

  // CinetPay State (Wave, Orange Money, MTN MoMo, Moov Flooz)
  const [cinetpayApiKey, setCinetpayApiKey] = useState<string>('');
  const [cinetpaySiteId, setCinetpaySiteId] = useState<string>('');
  const [cinetpaySecretKey, setCinetpaySecretKey] = useState<string>('');
  const [cinetpayMode, setCinetpayMode] = useState<'sandbox' | 'production'>('sandbox');
  const [cinetpayDiagnosis, setCinetpayDiagnosis] = useState<CinetPayDiagnosisResult | null>(null);
  const [testingCinetPay, setTestingCinetPay] = useState<boolean>(false);
  const [simulatingCinetPay, setSimulatingCinetPay] = useState<boolean>(false);
  const [cinetpaySimResult, setCinetpaySimResult] = useState<string | null>(null);

  // Run live diagnosis on CinetPay
  const runCinetPayDiagnosis = async () => {
    try {
      setTestingCinetPay(true);
      const res = await fetch('/api/tickets/cinetpay-diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cinetpayApiKey,
          cinetpaySiteId,
          cinetpaySecretKey,
          cinetpayMode,
        }),
      });
      const data = await res.json();
      if (data.diagnosis) {
        setCinetpayDiagnosis(data.diagnosis);
      }
    } catch (err) {
      console.error('Failed to run CinetPay diagnosis:', err);
    } finally {
      setTestingCinetPay(false);
    }
  };

  // Test simulation for CinetPay
  const handleSimulateCinetPay = async (operator: string) => {
    try {
      setSimulatingCinetPay(true);
      const res = await fetch('/api/tickets/cinetpay-simulate-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'unitaire',
          phone: '0102030405',
          visitorId: 'vis_admin_test',
          operator,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCinetpaySimResult(`✅ Simulation ${operator} réussie : 1 ticket repas généré dans la base.`);
        fetchStats();
        setTimeout(() => setCinetpaySimResult(null), 4000);
      }
    } catch (err: any) {
      setCinetpaySimResult(`❌ Erreur: ${err.message}`);
    } finally {
      setSimulatingCinetPay(false);
    }
  };

  // Moov Money State
  const [moovUsername, setMoovUsername] = useState<string>('crou_korhogo');
  const [moovPassword, setMoovPassword] = useState<string>('');
  const [moovEncryptionKey, setMoovEncryptionKey] = useState<string>('tlc12345tlc12345tlc12345tlc12345');
  const [moovBaseUrl, setMoovBaseUrl] = useState<string>('https://testapimarchand2.moov-africa.bj:2010/com.tlc.merchant.api/UssdPush?wsdl');
  const [moovUseSandbox, setMoovUseSandbox] = useState<boolean>(true);
  const [moovReceiverPhone, setMoovReceiverPhone] = useState<string>('0102030405');
  const [moovDiagnosis, setMoovDiagnosis] = useState<MoovDiagnosisResult | null>(null);
  const [testingMoov, setTestingMoov] = useState<boolean>(false);
  const [testPushPhone, setTestPushPhone] = useState<string>('0102030405');
  const [testingPush, setTestingPush] = useState<boolean>(false);
  const [pushResult, setPushResult] = useState<string | null>(null);

  // Run live diagnosis on Moov Money
  const runMoovDiagnosis = async () => {
    try {
      setTestingMoov(true);
      const res = await fetch('/api/tickets/moov-diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moovUsername,
          moovPassword,
          moovEncryptionKey,
          moovBaseUrl,
          moovUseSandbox,
          moovReceiverPhone,
        }),
      });
      const data = await res.json();
      if (data.diagnosis) {
        setMoovDiagnosis(data.diagnosis);
      }
    } catch (err) {
      console.error('Failed to run Moov diagnosis:', err);
    } finally {
      setTestingMoov(false);
    }
  };

  // Test Moov USSD Push
  const handleTestMoovPush = async () => {
    if (!testPushPhone) return;
    try {
      setTestingPush(true);
      setPushResult(null);
      const res = await fetch('/api/tickets/moov-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPushPhone,
          amount: 200,
          config: {
            moovUsername,
            moovPassword,
            moovEncryptionKey,
            moovBaseUrl,
            moovUseSandbox,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setPushResult(`✅ USSD Push envoyé : Code ${data.result.statusCode} (${data.result.longDescription || data.result.description}) - Réf: ${data.result.referenceId}`);
      } else {
        setPushResult(`❌ Échec : ${data.error || 'Erreur technique'}`);
      }
    } catch (e: any) {
      setPushResult(`❌ Erreur réseau : ${e.message}`);
    } finally {
      setTestingPush(false);
    }
  };

  // Receiver phone and merchant code settings
  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [merchantCode, setMerchantCode] = useState<string>('');
  const [momoSubscriptionKey, setMomoSubscriptionKey] = useState<string>('');
  const [momoSecondaryKey, setMomoSecondaryKey] = useState<string>('');
  const [momoApiUser, setMomoApiUser] = useState<string>('');
  const [momoApiKey, setMomoApiKey] = useState<string>('');
  const [momoTargetEnvironment, setMomoTargetEnvironment] = useState<string>('sandbox');
  const [momoCurrency, setMomoCurrency] = useState<string>('XOF');
  
  // OpenAPI Diagnostic
  const [openApiDiagnostic, setOpenApiDiagnostic] = useState<OpenApiFullDiagnostic | null>(null);
  const [isRunningOpenApi, setIsRunningOpenApi] = useState<boolean>(false);
  const [isOpenApiExpanded, setIsOpenApiExpanded] = useState<boolean>(true);
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
          setMomoSubscriptionKey(json.config.momoSubscriptionKey || json.config.momoApiKey || '');
          setMomoSecondaryKey(json.config.momoSecondaryKey || '');
          setMomoApiUser(json.config.momoApiUser || '');
          setMomoApiKey(json.config.momoApiKey || '');
          setMomoTargetEnvironment(json.config.momoTargetEnvironment || 'sandbox');
          setMomoCurrency(json.config.momoCurrency || 'XOF');
          if (json.config.moovUsername) setMoovUsername(json.config.moovUsername);
          if (json.config.moovPassword) setMoovPassword(json.config.moovPassword);
          if (json.config.moovEncryptionKey) setMoovEncryptionKey(json.config.moovEncryptionKey);
          if (json.config.moovBaseUrl) setMoovBaseUrl(json.config.moovBaseUrl);
          if (typeof json.config.moovUseSandbox === 'boolean') setMoovUseSandbox(json.config.moovUseSandbox);
          if (json.config.moovReceiverPhone) {
            setMoovReceiverPhone(json.config.moovReceiverPhone);
            setTestPushPhone(json.config.moovReceiverPhone);
          }
          if (json.config.cinetpayApiKey) setCinetpayApiKey(json.config.cinetpayApiKey);
          if (json.config.cinetpaySiteId) setCinetpaySiteId(json.config.cinetpaySiteId);
          if (json.config.cinetpaySecretKey) setCinetpaySecretKey(json.config.cinetpaySecretKey);
          if (json.config.cinetpayMode) setCinetpayMode(json.config.cinetpayMode);
          if (json.config.jekoApiKey) setJekoApiKey(json.config.jekoApiKey);
          if (json.config.jekoApiKeyId) setJekoApiKeyId(json.config.jekoApiKeyId);
          if (json.config.jekoStoreId) setJekoStoreId(json.config.jekoStoreId);
          if (json.config.jekoWebhookSecret) setJekoWebhookSecret(json.config.jekoWebhookSecret);
          if (json.config.momoSubscriptionKey || json.config.momoApiKey) {
            setCustomKeyInput(json.config.momoSubscriptionKey || json.config.momoApiKey);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load payment config:', e);
    }
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
          momoSubscriptionKey: momoSubscriptionKey || customKeyInput,
          momoSecondaryKey,
          momoApiUser,
          momoApiKey,
          momoTargetEnvironment,
          momoCurrency,
          moovUsername,
          moovPassword,
          moovEncryptionKey,
          moovBaseUrl,
          moovUseSandbox,
          moovReceiverPhone,
          cinetpayApiKey,
          cinetpaySiteId,
          cinetpaySecretKey,
          cinetpayMode,
          jekoApiKey,
          jekoApiKeyId,
          jekoStoreId,
          jekoWebhookSecret,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
        runJekoDiagnosis();
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setSavingConfig(false);
    }
  };

  const runOpenApiTest = async () => {
    try {
      setIsRunningOpenApi(true);
      const res = await fetch('/api/tickets/momo-openapi-diagnostic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          subscriptionKey: momoSubscriptionKey || customKeyInput,
          secondarySubscriptionKey: momoSecondaryKey,
          apiUser: momoApiUser,
          apiKey: momoApiKey,
          targetEnvironment: momoTargetEnvironment,
          currency: momoCurrency,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.diagnostic) {
          setOpenApiDiagnostic(json.diagnostic);
        }
      }
    } catch (err) {
      console.error('Failed to run OpenAPI diagnostic:', err);
    } finally {
      setIsRunningOpenApi(false);
    }
  };

  useEffect(() => {
    fetchStats();
    runMomoDiagnosis();
    runJekoDiagnosis();
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

  // Scan QR code from photo (100% compatible on iPhone without WebRTC restrictions)
  const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsScanningPhoto(true);
      setCameraError(null);
      // Ensure instance exists for scanning file
      const scanner = new Html5Qrcode('qr-temp-scanner-file');
      const decodedText = await scanner.scanFile(file, true);
      if (decodedText) {
        handleValidate(decodedText);
      }
    } catch (err: any) {
      console.warn('Photo scan error:', err);
      setCameraError('Aucun QR code lisible sur la photo. Rapprochez l\'appareil ou tapez le code à 6 chiffres.');
    } finally {
      setIsScanningPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Camera QR Scanner control (with iOS permission pre-flight)
  const startCamera = async () => {
    setCameraError(null);
    try {
      // Pre-check permissions so Safari prompts the user if not yet asked
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const testStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          testStream.getTracks().forEach((track) => track.stop());
        } catch (permErr: any) {
          console.warn('getUserMedia permission error:', permErr);
          if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
            setCameraError(
              '⚠️ Accès caméra refusé. Sur iPhone : appuyez sur le bouton "aA" (dans la barre d\'adresse de Safari) > "Réglages du site web" > "Appareil photo" > "Autoriser". Vous pouvez aussi utiliser le bouton "Prendre en Photo le QR" ci-dessous.'
            );
            return;
          }
        }
      }

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
        '⚠️ Impossible d\'ouvrir le flux vidéo continu. Sur iPhone, utilisez le bouton "📸 Prendre une Photo du QR" ou tapez le code à 6 chiffres.'
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

      {/* MODULE PASSERELLES DE PAIEMENT : MTN MOMO & MOOV MONEY */}
      <div className="bg-white rounded-3xl border border-black/10 shadow-sm p-5 sm:p-6 space-y-5">
        {/* ONGLET DE SÉLECTION DE LA PASSERELLE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Passerelles Mobile Money de Côte d'Ivoire
            </span>
            <h4 className="font-black text-slate-950 text-base sm:text-lg">
              Configuration & Diagnostic des Opérateurs
            </h4>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl shrink-0 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setGatewayTab('jeko')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                gatewayTab === 'jeko'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <span>⚡</span>
              <span>Jèko Pay (Wave · OM · MoMo)</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 font-black">Actif 🇨🇮</span>
            </button>

            <button
              type="button"
              onClick={() => setGatewayTab('cinetpay')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                gatewayTab === 'cinetpay'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <span>🟠</span>
              <span>CinetPay (Tous Réseaux)</span>
            </button>

            <button
              type="button"
              onClick={() => setGatewayTab('moov')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                gatewayTab === 'moov'
                  ? 'bg-[#005CA9] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <span>🔵</span>
              <span>Moov Flooz (Direct)</span>
            </button>

            <button
              type="button"
              onClick={() => setGatewayTab('mtn')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                gatewayTab === 'mtn'
                  ? 'bg-[#FFCC00] text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <span>🟡</span>
              <span>MTN MoMo (Direct)</span>
            </button>
          </div>
        </div>

        {/* CONTENU ONGLET JEKO PAY (WAVE, ORANGE, MTN, MOOV) */}
        {gatewayTab === 'jeko' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-black text-slate-950 text-base">
                      Passerelle Agrégateur Jèko Pay (Côte d'Ivoire)
                    </h5>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                      Wave · Orange Money · MTN MoMo · Moov Africa
                    </span>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 flex items-center gap-1">
                      <span>🛡️</span>
                      <span>Protection Rate-Limit 429 Active</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Encaissez les étudiants UPGC sur tous les réseaux avec validation instantanée par Webhook sécurisé et mécanisme de réessai automatique anti-saturation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={runJekoDiagnosis}
                  disabled={testingJeko}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingJeko ? 'animate-spin' : ''}`} />
                  <span>{testingJeko ? 'Test en cours...' : 'Tester la connexion Jèko'}</span>
                </button>
              </div>
            </div>

            {/* RÉSULTAT DU DIAGNOSTIC JEKO */}
            {jekoDiagnosis && (
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${jekoDiagnosis.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="font-bold text-slate-900">
                      {jekoDiagnosis.message}
                    </span>
                    <span className="font-mono text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                      HTTP {jekoDiagnosis.httpStatus}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Vérifié à {new Date(jekoDiagnosis.testedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Clé API Marchand</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px]">{jekoDiagnosis.apiKeyPreview}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Secret Webhook HMAC</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px]">{jekoDiagnosis.webhookSecretPreview}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Algorithme Anti-Saturation</span>
                    <span className="font-bold text-teal-700 text-[11px]">Backoff exponentiel (1s à 16s)</span>
                  </div>
                </div>

                {jekoDiagnosis.recommendations.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">
                      État opérationnel
                    </span>
                    <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc">
                      {jekoDiagnosis.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* BOX WEBHOOK PRODUCTION URL POUR COPIER DANS LE DASHBOARD JEKO */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <span>🔗</span>
                  <span>URL Webhook Officielle CROU à renseigner sur le portail Jèko Pay :</span>
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Signature HMAC-SHA256 active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://crou-menu-resto-u-648760950612.europe-west1.run.app/api/webhooks/jeko"
                  className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 select-all cursor-pointer font-bold"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Lorsque Jèko valide une transaction mobile (Wave, Orange, MTN ou Moov), cette URL génère automatiquement le ticket repas sécurisé avec QR code dans la base de données.
              </p>
            </div>

            {/* SIMULATEUR DE PAIEMENT JEKO POUR TESTER LE FLUX INSTANTANÉMENT */}
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h6 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <span>🧪</span>
                    <span>Tester une simulation instantanée Jèko (Mode Test Resto U)</span>
                  </h6>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Cliquez sur un opérateur pour tester immédiatement la création d'un ticket repas et le contrôler au scanner.
                  </p>
                </div>
                {jekoSimResult && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
                    {jekoSimResult}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  type="button"
                  disabled={simulatingJeko}
                  onClick={() => handleSimulateJeko('Wave CI')}
                  className="py-2.5 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <span>🌊</span>
                  <span>Wave CI</span>
                </button>

                <button
                  type="button"
                  disabled={simulatingJeko}
                  onClick={() => handleSimulateJeko('Orange Money CI')}
                  className="py-2.5 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <span>🍊</span>
                  <span>Orange Money</span>
                </button>

                <button
                  type="button"
                  disabled={simulatingJeko}
                  onClick={() => handleSimulateJeko('MTN MoMo CI')}
                  className="py-2.5 px-3 bg-[#FFCC00] hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <span>🟡</span>
                  <span>MTN MoMo</span>
                </button>

                <button
                  type="button"
                  disabled={simulatingJeko}
                  onClick={() => handleSimulateJeko('Moov Africa CI')}
                  className="py-2.5 px-3 bg-[#005CA9] hover:bg-[#004d8c] text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <span>🔵</span>
                  <span>Moov Africa</span>
                </button>
              </div>
            </div>

            {/* FORMULAIRE DE PARAMÉTRAGE JEKO */}
            <form onSubmit={handleSaveConfig} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Clé API Jèko Pay (API Key - X-API-KEY) :
                  </label>
                  <input
                    type="text"
                    value={jekoApiKey}
                    onChange={(e) => setJekoApiKey(e.target.value)}
                    placeholder="Ex: jeko_c4f416c852f48e..."
                    className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Générée depuis le portail développeur Jèko (commence par jeko_)
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ID de la Clé API (X-API-KEY-ID) :
                  </label>
                  <input
                    type="text"
                    value={jekoApiKeyId}
                    onChange={(e) => setJekoApiKeyId(e.target.value)}
                    placeholder="Ex: identifiant unique dans le tableau des clés"
                    className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Visible dans le tableau de bord Jèko (colonne ID de votre clé API)
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Identifiant Boutique (Store ID) :
                  </label>
                  <input
                    type="text"
                    value={jekoStoreId}
                    onChange={(e) => setJekoStoreId(e.target.value)}
                    placeholder="Ex: 59ae202a-f583-4a15-970f-9e99bd1e0baa"
                    className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Identifiant de votre boutique ou store Jèko (par défaut: 59ae202a...)
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Secret Webhook Jèko (HMAC-SHA256) :
                  </label>
                  <input
                    type="text"
                    value={jekoWebhookSecret}
                    onChange={(e) => setJekoWebhookSecret(e.target.value)}
                    placeholder="Ex: bf74a75e95c8c88f601..."
                    className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Fourni lors de la configuration du webhook pour authentifier les notifications
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {savingConfig ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Enregistrer les identifiants Jèko Pay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CONTENU ONGLET 0 : CINETPAY MULTI-OPÉRATEURS (WAVE, ORANGE, MTN, MOOV) */}
        {gatewayTab === 'cinetpay' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-black shadow-xs">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-black text-slate-950 text-base">
                      Passerelle Agrégateur CinetPay (Multi-Opérateurs)
                    </h5>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900">
                      Wave · Orange · MTN · Moov
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      cinetpayMode === 'production' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {cinetpayMode === 'production' ? '🔴 Débit Réel (Production)' : '🧪 Sandbox / Test'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Un seul compte marchand pour encaisser les 4 réseaux ivoiriens sans multiplier les contrats opérateurs.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={runCinetPayDiagnosis}
                  disabled={testingCinetPay}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingCinetPay ? 'animate-spin' : ''}`} />
                  <span>{testingCinetPay ? 'Vérification CinetPay...' : 'Tester la connexion CinetPay'}</span>
                </button>
              </div>
            </div>

            {/* RÉSULTAT DU DIAGNOSTIC CINETPAY */}
            {cinetpayDiagnosis && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-black/5 space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cinetpayDiagnosis.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-bold text-slate-900">
                      {cinetpayDiagnosis.message}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                      Code: {cinetpayDiagnosis.code}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Testé le {new Date(cinetpayDiagnosis.testedAt).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  {cinetpayDiagnosis.description}
                </p>

                {cinetpayDiagnosis.explanations.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Analyse de configuration
                    </span>
                    <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                      {cinetpayDiagnosis.explanations.map((exp, i) => (
                        <li key={i}>{exp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {cinetpayDiagnosis.recommendations.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <span className="font-bold block">💡 Conseils d'activation :</span>
                    <ul className="space-y-1 pl-4 list-disc">
                      {cinetpayDiagnosis.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* SIMULATEUR DE PAIEMENT INSTANTANÉ POUR VALIDER LE FLUX */}
            <div className="p-4 bg-orange-50/70 rounded-2xl border border-orange-200/80 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h6 className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                    <span>🧪</span>
                    <span>Tester une simulation instantanée de paiement (Mode Test CROU)</span>
                  </h6>
                  <p className="text-[11px] text-orange-800 font-medium">
                    Cliquez sur un opérateur pour simuler un achat étudiant réussi et vérifier la génération du ticket sécurisé.
                  </p>
                </div>
                {cinetpaySimResult && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
                    {cinetpaySimResult}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  type="button"
                  disabled={simulatingCinetPay}
                  onClick={() => handleSimulateCinetPay('Wave CI')}
                  className="py-2.5 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <span>🌊</span>
                  <span>Wave CI</span>
                </button>

                <button
                  type="button"
                  disabled={simulatingCinetPay}
                  onClick={() => handleSimulateCinetPay('Orange Money CI')}
                  className="py-2.5 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <span>🍊</span>
                  <span>Orange Money</span>
                </button>

                <button
                  type="button"
                  disabled={simulatingCinetPay}
                  onClick={() => handleSimulateCinetPay('MTN MoMo CI')}
                  className="py-2.5 px-3 bg-[#FFCC00] hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <span>🟡</span>
                  <span>MTN MoMo</span>
                </button>

                <button
                  type="button"
                  disabled={simulatingCinetPay}
                  onClick={() => handleSimulateCinetPay('Moov Flooz CI')}
                  className="py-2.5 px-3 bg-[#005CA9] hover:bg-[#004d8c] text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <span>🔵</span>
                  <span>Moov Flooz</span>
                </button>
              </div>
            </div>

            {/* FORMULAIRE DE PARAMÉTRAGE CINETPAY */}
            <form onSubmit={handleSaveConfig} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Clé API CinetPay (API Key) :
                  </label>
                  <input
                    type="text"
                    value={cinetpayApiKey}
                    onChange={(e) => setCinetpayApiKey(e.target.value)}
                    placeholder="Ex: 204987654362d8e4..."
                    className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <span className="text-[10px] text-slate-400">
                    Disponible sur votre dashboard <a href="https://cinetpay.com" target="_blank" rel="noreferrer" className="underline text-orange-600">cinetpay.com</a> &gt; Paramètres &gt; API
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Identifiant du Site (Site ID) :
                  </label>
                  <input
                    type="text"
                    value={cinetpaySiteId}
                    onChange={(e) => setCinetpaySiteId(e.target.value)}
                    placeholder="Ex: 123456"
                    className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <span className="text-[10px] text-slate-400">
                    Numéro de site fourni par CinetPay lors de la création de votre guichet
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mode d'opération :
                  </label>
                  <select
                    value={cinetpayMode}
                    onChange={(e) => setCinetpayMode(e.target.value as 'sandbox' | 'production')}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="sandbox">🧪 Mode Sandbox / Test (Transactions de test sans frais)</option>
                    <option value="production">🔴 Mode Production Réel (Prélèvements effectifs Wave, OM, MTN, Moov)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Clé Secrète / Signature Webhook (Optionnel) :
                  </label>
                  <input
                    type="password"
                    value={cinetpaySecretKey}
                    onChange={(e) => setCinetpaySecretKey(e.target.value)}
                    placeholder="Clé secrète de validation IPN"
                    className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-black/5 text-[11px] text-slate-500 font-medium">
                <span>URL de notification Webhook IPN de votre application : </span>
                <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
                  /api/tickets/cinetpay-notify
                </code>
              </div>

              <div className="flex items-center justify-between pt-2">
                {saveSuccess ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Configuration CinetPay enregistrée avec succès !</span>
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingConfig ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <span>Enregistrer la configuration CinetPay</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CONTENU ONGLET 1 : MTN MOMO OPENAPI */}
        {gatewayTab === 'mtn' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
                  <FileCode className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-950 text-base sm:text-lg">
                      Spécification OpenAPI MTN MoMo (<code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-amber-900">collection.yaml</code>)
                    </h4>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      openApiDiagnostic?.allSuccess
                        ? 'bg-emerald-100 text-emerald-800'
                        : openApiDiagnostic?.steps.some(s => s.httpStatus === 500)
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {momoTargetEnvironment === 'production' ? '🔴 Live Production' : '🧪 Sandbox MoMo'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Implémentation stricte des endpoints OpenAPI MTN MoMo : Tokens Bearer, RequestToPay & Soldes.
                  </p>
                </div>
              </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runOpenApiTest}
              disabled={isRunningOpenApi}
              className="px-4 py-2 bg-[#18181B] hover:bg-black text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRunningOpenApi ? 'animate-spin' : ''}`} />
              <span>{isRunningOpenApi ? 'Test en cours...' : 'Exécuter le cycle OpenAPI'}</span>
            </button>
            <button
              onClick={() => setIsOpenApiExpanded(!isOpenApiExpanded)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Afficher/Masquer le détail"
            >
              {isOpenApiExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isOpenApiExpanded && (
          <div className="space-y-4 pt-2">
            {/* RÉSULTAT DU CYCLE OPENAPI SI EXÉCUTÉ */}
            {openApiDiagnostic ? (
              <div className="space-y-3">
                <div className={`p-4 rounded-2xl border ${
                  openApiDiagnostic.allSuccess
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                    : openApiDiagnostic.steps.some(s => s.httpStatus === 500)
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                    : 'bg-rose-50/90 border-rose-300 text-rose-950'
                }`}>
                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                    <div className="space-y-1">
                      <div className="font-black text-sm">
                        {openApiDiagnostic.summary}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Serveur cible : <code className="font-mono font-bold">{openApiDiagnostic.baseUrl}</code> • Environnement : <span className="font-bold uppercase">{openApiDiagnostic.environment}</span> • Clé testée : <code className="font-mono">{openApiDiagnostic.subscriptionKeyPreview}</code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LES 4 ÉTAPES OPENAPI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {openApiDiagnostic.steps.map((st, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-50 p-3.5 rounded-2xl border border-black/5 flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{st.step}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          st.success
                            ? 'bg-emerald-100 text-emerald-800'
                            : st.httpStatus === 500
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          HTTP {st.httpStatus || '0'}
                        </span>
                      </div>
                      <div>
                        <div className="font-mono text-[10px] text-slate-500 font-bold mb-1">
                          {st.method} {st.endpoint}
                        </div>
                        <p className="text-xs text-slate-700 leading-snug">
                          {st.details}
                        </p>
                      </div>
                      {st.rawResponse && (
                        <div className="text-[10px] font-mono text-slate-500 bg-white p-2 rounded-xl border border-black/5 truncate">
                          {st.rawResponse}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* RECOMMANDATIONS ET CONSEILS DE DÉPLOIEMENT */}
                {openApiDiagnostic.recommendations.length > 0 && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-1.5">
                    <div className="font-black text-slate-900 flex items-center gap-1.5">
                      <span>💡</span>
                      <span>Analyse technique du déploiement MTN MoMo :</span>
                    </div>
                    <ul className="space-y-1 list-disc list-inside text-slate-700 text-[11px] leading-relaxed">
                      {openApiDiagnostic.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                <p className="text-xs text-slate-600 font-medium">
                  Le cycle OpenAPI exécute les 4 requêtes du fichier <code className="font-mono font-bold">collection.yaml</code> : vérification de la clé d'abonnement, enregistrement de l'API User, création du jeton Bearer OAuth 2.0 et interrogation du solde marchand.
                </p>
                <button
                  type="button"
                  onClick={runOpenApiTest}
                  disabled={isRunningOpenApi}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors"
                >
                  🚀 Démarrer la vérification OpenAPI MTN
                </button>
              </div>
            )}

            {/* FORMULAIRE DE CONFIGURATION COMPLET DES CLÉS OPENAPI */}
            <form onSubmit={handleSaveConfig} className="bg-slate-50 p-5 rounded-2xl border border-black/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-3">
                <div>
                  <h5 className="font-black text-sm text-slate-900">
                    Paramètres des Clés de l'API MTN MoMo
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Renseignez vos identifiants obtenus sur le portail développeur ou le contrat MTN CI
                  </p>
                </div>
                {saveSuccess && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                    ✅ Configuration enregistrée avec succès !
                  </span>
                )}
              </div>

              {/* ENVIRONNEMENT & DEVISE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Environnement Cible (Target Environment) :
                  </label>
                  <select
                    value={momoTargetEnvironment}
                    onChange={(e) => setMomoTargetEnvironment(e.target.value)}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="sandbox">Sandbox Test (sandbox.momodeveloper.mtn.com)</option>
                    <option value="production">Production Directe (proxy.momoapi.mtn.com)</option>
                    <option value="mtnciv">MTN Côte d'Ivoire (mtnciv)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Devise (Currency) :
                  </label>
                  <select
                    value={momoCurrency}
                    onChange={(e) => setMomoCurrency(e.target.value)}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="XOF">XOF - Franc CFA (Côte d'Ivoire en Production)</option>
                    <option value="EUR">EUR - Euro (Obligatoire sur la Sandbox MTN)</option>
                  </select>
                </div>
              </div>

              {/* CLÉS D'ABONNEMENT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Clé Primaire (Primary Subscription Key) :
                  </label>
                  <input
                    type="text"
                    value={momoSubscriptionKey}
                    onChange={(e) => {
                      setMomoSubscriptionKey(e.target.value);
                      setCustomKeyInput(e.target.value);
                    }}
                    placeholder="Ex: e30c2168b25a47aab7e93dd81d4224e7"
                    className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Clé Secondaire (Secondary Subscription Key) :
                  </label>
                  <input
                    type="text"
                    value={momoSecondaryKey}
                    onChange={(e) => setMomoSecondaryKey(e.target.value)}
                    placeholder="Ex: 4cbfbb5dffd44f06a045bd7893274c62"
                    className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* API USER & API KEY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    API User (UUID v4) :
                  </label>
                  <input
                    type="text"
                    value={momoApiUser}
                    onChange={(e) => setMomoApiUser(e.target.value)}
                    placeholder="Ex: 81930870-7db8-4def-85d3-1d84efa082b7"
                    className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    API Key (Clé API secrète) :
                  </label>
                  <input
                    type="text"
                    value={momoApiKey}
                    onChange={(e) => setMomoApiKey(e.target.value)}
                    placeholder="Clé secrète générée pour l'API User"
                    className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* NUMÉRO DE RÉCEPTION ET CODE MARCHAND */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-black/5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Numéro Téléphone de Réception (Caisse CROU) :
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-5 py-2.5 bg-[#18181B] hover:bg-black text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  {savingConfig ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <span>Enregistrer la configuration OpenAPI</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    )}

    {/* CONTENU ONGLET 2 : MOOV MONEY (FLOOZ / SDK V1P3R75) */}
    {gatewayTab === 'moov' && (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#005CA9] text-white flex items-center justify-center font-black shadow-xs">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h5 className="font-black text-slate-950 text-base">
                  Passerelle Moov Money (Flooz / TLC Gateway)
                </h5>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900">
                  SDK v1p3r75 intégré
                </span>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  moovUseSandbox ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                }`}>
                  {moovUseSandbox ? '🧪 Sandbox Moov' : '🔴 Production Live'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Protocole SOAP/XML avec chiffrement symétrique AES-256-CBC des tokens de sécurité.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runMoovDiagnosis}
              disabled={testingMoov}
              className="px-4 py-2 bg-[#005CA9] hover:bg-[#004d8c] text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingMoov ? 'animate-spin' : ''}`} />
              <span>{testingMoov ? 'Vérification Moov...' : 'Diagnostiquer Moov'}</span>
            </button>
          </div>
        </div>

        {/* RÉSULTAT DU DIAGNOSTIC MOOV */}
        {moovDiagnosis && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-black/5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${moovDiagnosis.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="font-bold text-slate-900">
                  {moovDiagnosis.connected ? 'Passerelle connectée (HTTP 200)' : 'Passerelle distante protégée par liste blanche IP'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Token AES: {moovDiagnosis.tokenPreview}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-black/5 text-xs space-y-1">
              <div className="font-bold text-slate-800">
                Statut Moov : {moovDiagnosis.statusMessage}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                URL WSDL : {moovDiagnosis.baseUrl}
              </div>
            </div>

            {moovDiagnosis.explanations?.length > 0 && (
              <ul className="space-y-1 list-disc list-inside text-slate-700 text-[11px] leading-relaxed">
                {moovDiagnosis.explanations.map((exp, i) => (
                  <li key={i}>{exp}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* TEST DIRECT USSD PUSH MOOV SUR MOBILE */}
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
          <div>
            <h6 className="font-black text-xs text-blue-950 flex items-center gap-1.5">
              <span>📲</span>
              <span>Test Direct USSD Push Moov Money (Simulation sur mobile)</span>
            </h6>
            <p className="text-[11px] text-blue-800 mt-0.5">
              Déclenche une requête SOAP &lt;api:PushWithPending&gt; vers la passerelle TLC Moov.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="tel"
                value={testPushPhone}
                onChange={(e) => setTestPushPhone(e.target.value)}
                placeholder="Numéro Moov (ex: 0102030405)"
                className="w-full px-3 py-2 bg-white rounded-xl border border-blue-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="button"
              onClick={handleTestMoovPush}
              disabled={testingPush || !testPushPhone}
              className="w-full sm:w-auto px-4 py-2 bg-[#005CA9] hover:bg-[#004d8c] text-white text-xs font-black rounded-xl shadow-xs transition-colors shrink-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {testingPush ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Envoyer Push Test (200 F)</span>
            </button>
          </div>

          {pushResult && (
            <div className="p-2.5 bg-white rounded-xl border border-blue-200 text-xs font-bold text-slate-800">
              {pushResult}
            </div>
          )}
        </div>

        {/* FORMULAIRE DE CONFIGURATION MOOV MONEY */}
        <form onSubmit={handleSaveConfig} className="bg-slate-50 p-5 rounded-2xl border border-black/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-3">
            <div>
              <h5 className="font-black text-sm text-slate-900">
                Paramètres de Connexion Moov Money (Flooz)
              </h5>
              <p className="text-[11px] text-slate-500">
                Identifiants fournis par Moov Africa pour la passerelle SOAP / USSD Push
              </p>
            </div>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                ✅ Configuration enregistrée avec succès !
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nom d'utilisateur Marchand (Username) :
              </label>
              <input
                type="text"
                value={moovUsername}
                onChange={(e) => setMoovUsername(e.target.value)}
                placeholder="Ex: crou_korhogo"
                className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Mot de Passe Marchand (Password) :
              </label>
              <input
                type="password"
                value={moovPassword}
                onChange={(e) => setMoovPassword(e.target.value)}
                placeholder="Mot de passe API Moov"
                className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Clé de Chiffrement AES-256 (32 caractères) :
              </label>
              <input
                type="text"
                value={moovEncryptionKey}
                onChange={(e) => setMoovEncryptionKey(e.target.value)}
                placeholder="tlc12345tlc12345tlc12345tlc12345"
                className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-[10px] text-slate-400">
                Clé officielle par défaut : <code>tlc12345tlc12345tlc12345tlc12345</code>
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Environnement Moov :
              </label>
              <select
                value={moovUseSandbox ? 'sandbox' : 'production'}
                onChange={(e) => {
                  const isSand = e.target.value === 'sandbox';
                  setMoovUseSandbox(isSand);
                  setMoovBaseUrl(isSand 
                    ? 'https://testapimarchand2.moov-africa.bj:2010/com.tlc.merchant.api/UssdPush?wsdl'
                    : 'https://apimarchand.moov-africa.bj/com.tlc.merchant.api/UssdPush?wsdl');
                }}
                className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="sandbox">Sandbox Test (testapimarchand2.moov-africa.bj:2010)</option>
                <option value="production">Production Directe (apimarchand.moov-africa.bj)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                URL du service SOAP WSDL :
              </label>
              <input
                type="text"
                value={moovBaseUrl}
                onChange={(e) => setMoovBaseUrl(e.target.value)}
                placeholder="https://apimarchand.moov-africa.bj/..."
                className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Numéro Téléphone Récepteur Moov (Caisse CROU) :
              </label>
              <input
                type="text"
                value={moovReceiverPhone}
                onChange={(e) => setMoovReceiverPhone(e.target.value)}
                placeholder="Ex: 01 02 03 04 05"
                className="w-full bg-white px-3 py-2 rounded-xl border border-black/10 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={savingConfig}
              className="px-5 py-2.5 bg-[#005CA9] hover:bg-[#004d8c] text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              {savingConfig ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <span>Enregistrer la configuration Moov Money</span>
              )}
            </button>
          </div>
        </form>
      </div>
    )}
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

            {/* Hidden temp element for file QR scanner */}
            <div id="qr-temp-scanner-file" style={{ display: 'none' }} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoScan}
              className="hidden"
            />

            {/* Video preview container for html5-qrcode */}
            <div
              id={scannerContainerId}
              className={`w-full overflow-hidden rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-center p-4 transition-all ${
                isScanning ? 'min-h-[260px]' : 'h-36'
              }`}
            >
              {!isScanning && (
                <div className="text-slate-400 space-y-1">
                  <Camera className="w-8 h-8 mx-auto stroke-1 text-slate-400" />
                  <p className="text-xs font-semibold">
                    Caméra désactivée.
                  </p>
                </div>
              )}
            </div>

            {/* BOUTONS ET ASTUCE IPHONE */}
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanningPhoto}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                {isScanningPhoto ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Analyse du QR en cours...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>📸 Prendre une Photo du QR (100% garanti sur iPhone)</span>
                  </>
                )}
              </button>

              <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[10px] text-amber-900 leading-relaxed">
                <span className="font-bold">📱 Sur iPhone (Safari) :</span> Pour autoriser la vidéo en direct, appuyez sur l'icône <strong>« aA »</strong> à gauche dans la barre d'adresse de Safari &gt; <strong>« Réglages du site web »</strong> &gt; <strong>« Appareil photo »</strong> &gt; <strong>« Autoriser »</strong>.
              </div>
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
