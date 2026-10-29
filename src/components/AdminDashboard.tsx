import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Camera, 
  Sparkles, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft, 
  UtensilsCrossed, 
  TrendingUp, 
  ShieldCheck, 
  Search, 
  QrCode, 
  Ticket, 
  DollarSign, 
  AlertOctagon, 
  UserCheck, 
  UserX,
  Scan,
  RefreshCw,
  Archive,
  History,
  RotateCcw,
  Calendar,
  CheckCircle2,
  X,
  HelpCircle
} from 'lucide-react';
import { Dish, Canteen, CrowdLevel, UserProfile, MealTicket } from '../types';
import { ImageWithLoader } from './ImageWithLoader';
import { TurnstileWaveScanner } from './TurnstileWaveScanner';
import { 
  getAllRegisteredStudents, 
  verifyTurnstileTicket, 
  getFraudAuditLogs, 
  FraudAuditLog 
} from '../services/studentAuth';
import { 
  DailyLedgerStats,
  getActiveDailyLedger,
  getAllDailyArchives,
  archivePastDay,
  getTodayDateString,
  getTodayFormatted
} from '../services/dailyLedger';
import { compressImage } from '../utils/imageCompressor';

interface Props {
  canteen: Canteen;
  dishes: Dish[];
  onUpdateCanteen: (updated: Canteen) => void;
  onAddDish: (dish: Dish) => void;
  onToggleDishAvailability: (dishId: string) => void;
  onDeleteDish: (dishId: string) => void;
  onDeleteAllDishes?: () => void;
  onClose: () => void;
}

export const AdminDashboard: React.FC<Props> = ({
  canteen,
  dishes,
  onUpdateCanteen,
  onAddDish,
  onToggleDishAvailability,
  onDeleteDish,
  onDeleteAllDishes,
  onClose
}) => {
  const [adminTab, setAdminTab] = useState<'scanner' | 'dishes' | 'fraud' | 'tickets'>('scanner');

  // Daily Ledger State (starts at zero or active day)
  const [dailyLedger, setDailyLedger] = useState<DailyLedgerStats>({
    date: getTodayDateString(),
    formattedDate: getTodayFormatted(),
    totalTicketsSold: 0,
    mealsValidated: 0,
    ticketsInCirculation: 0,
    revenueCollected: 0,
    servedTickets: []
  });

  // Modals for Archives
  const [showArchivesModal, setShowArchivesModal] = useState<boolean>(false);
  const [archivesList, setArchivesList] = useState<DailyLedgerStats[]>([]);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // New dish form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('200');
  const [category, setCategory] = useState<'plat_principal' | 'entree' | 'dessert' | 'boisson'>('plat_principal');
  const [mealType, setMealType] = useState<'dejeuner' | 'diner'>('dejeuner');
  const [imageUrl, setImageUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Anti-fraud & Student Matricules Registry
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [matriculeSearch, setMatriculeSearch] = useState('');
  const [fraudLogs, setFraudLogs] = useState<FraudAuditLog[]>([]);

  // Manual Turnstile check simulation fallback
  const [scanTicketNumber, setScanTicketNumber] = useState('');
  const [scanMatricule, setScanMatricule] = useState('');
  const [manualScanResult, setManualScanResult] = useState<{ status: string; message: string; ticket?: MealTicket } | null>(null);
  const [isVerifyingManual, setIsVerifyingManual] = useState(false);

  useEffect(() => {
    loadRegistryData();
    loadLedgerData();
  }, []);

  const loadRegistryData = async () => {
    const list = await getAllRegisteredStudents();
    setStudents(list);
    setFraudLogs(getFraudAuditLogs());
  };

  const loadLedgerData = async () => {
    const stats = await getActiveDailyLedger();
    setDailyLedger(stats);
  };

  const openArchives = async () => {
    const list = await getAllDailyArchives();
    setArchivesList(list);
    setShowArchivesModal(true);
  };

  const handleManualArchiveDay = async () => {
    await archivePastDay(dailyLedger);
    const updatedArchives = await getAllDailyArchives();
    setArchivesList(updatedArchives);
    setActionSuccessNotice('La journée a été archivée avec succès dans l\'historique permanent.');
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  // Crowd controls
  const handleCrowdChange = (level: CrowdLevel) => {
    let waitMinutes = 5;
    if (level === 'moyen') waitMinutes = 15;
    if (level === 'eleve') waitMinutes = 30;

    onUpdateCanteen({
      ...canteen,
      crowdLevel: level,
      waitingTimeMinutes: waitMinutes
    });
  };

  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsPublishing(true);
    try {
      let finalImageUrl = imageUrl.trim();
      if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
        try {
          finalImageUrl = await compressImage(finalImageUrl, 600, 600, 0.72);
        } catch (compErr) {
          console.warn('Compression notice:', compErr);
        }
      }

      const newDish: Dish = {
        id: 'dish_' + Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        description: description.trim() || 'Plat préparé avec soin par l\'équipe du restaurant universitaire CROU.',
        category,
        price: parseInt(price, 10) || 200,
        regularPrice: 500,
        imageUrl: finalImageUrl,
        isAvailable: true,
        mealType,
        canteenId: 'all', // Diffusé pour tous les étudiants UPGC
        tags: ['Distribution Officielle', 'Resto U'],
        rating: 5.0,
        ratingCount: 1
      };

      onAddDish(newDish);
      setName('');
      setDescription('');
      setImageUrl('');
      setActionSuccessNotice(`Plat "${newDish.name}" publié et synchronisé sur tous les appareils.`);
      setTimeout(() => setActionSuccessNotice(null), 3000);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRunManualTurnstileCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanTicketNumber.trim()) return;

    setIsVerifyingManual(true);
    setManualScanResult(null);

    const res = await verifyTurnstileTicket(scanTicketNumber.trim(), scanMatricule.trim());
    setManualScanResult(res);
    setIsVerifyingManual(false);
    loadRegistryData();
    loadLedgerData();
  };

  const canteenDishes = dishes.filter(d => 
    !d.canteenId || 
    d.canteenId === 'all' || 
    d.canteenId === canteen.id || 
    (canteen.id.startsWith('resto-upgc') && (d.canteenId.startsWith('resto-upgc') || d.canteenId === 'all'))
  );

  const filteredStudents = students.filter(s => {
    const q = matriculeSearch.toLowerCase();
    const matMatch = (s.matricule || '').toLowerCase().includes(q);
    const nameMatch = (s.displayName || '').toLowerCase().includes(q);
    return matMatch || nameMatch;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-lg border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white"
              title="Retour à l'application"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-black font-cabinet text-white">
                  Administration Restau. U • CROU Korhogo
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Compte Vérifié
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {canteen.name} • UPGC Korhogo
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1.5 p-1 bg-slate-800 rounded-2xl border border-slate-700 text-xs font-bold overflow-x-auto">
            <button
              type="button"
              onClick={() => { setAdminTab('scanner'); loadLedgerData(); }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                adminTab === 'scanner'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Scan className="w-4 h-4" />
              <span>Borne Scanner (Wave)</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('dishes')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                adminTab === 'dishes'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Plats Distribués</span>
            </button>

            <button
              type="button"
              onClick={() => { setAdminTab('fraud'); loadRegistryData(); }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                adminTab === 'fraud'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Contrôle Anti-Fraude ({students.length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setAdminTab('tickets'); loadRegistryData(); loadLedgerData(); }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                adminTab === 'tickets'
                  ? 'bg-slate-700 text-amber-300 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Billetterie & Archives</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Notification Banner */}
      {actionSuccessNotice && (
        <div className="bg-emerald-600 text-white py-2.5 px-4 text-center text-xs font-bold animate-fadeIn flex items-center justify-center space-x-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccessNotice}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">

        {/* TAB 1: SCANNER BORNE TOURNIQUET (STYLE WAVE) & STATISTIQUES EN DIRECT */}
        {adminTab === 'scanner' && (
          <div className="space-y-6">
            
            {/* 4 Stat Cards Exactly Matching Screenshot IMG_1077 */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 font-cabinet">
                    Tableau de Bord des Ventes & Tourniquet
                  </h2>
                  <p className="text-xs text-slate-500">
                    Chiffres en temps réel de la journée • {dailyLedger.formattedDate}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={loadLedgerData}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs"
                    title="Actualiser les compteurs"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={openArchives}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 shadow-xs"
                  >
                    <History className="w-4 h-4 text-amber-400" />
                    <span>Archives Quotidiennes</span>
                  </button>

                  <div
                    className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs"
                    title="Sécurité CROU : Registre inaltérable et infalsifiable par le personnel de caisse"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Registre Inaltérable (Anti-Fraude)</span>
                  </div>
                </div>
              </div>

              {/* 4 CARDS: Identical to IMG_1077_6105293f.png */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                {/* Card 1 */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
                    TOTAL TICKETS VENDUS
                  </span>
                  <div className="my-2">
                    <span className="text-3xl sm:text-4xl font-black font-cabinet text-slate-900">
                      {dailyLedger.totalTicketsSold}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600">
                    Tarif subventionné 200 FCFA
                  </span>
                </div>

                {/* Card 2 */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
                    REPAS SERVIS (VALIDÉS)
                  </span>
                  <div className="my-2">
                    <span className="text-3xl sm:text-4xl font-black font-cabinet text-emerald-600">
                      {dailyLedger.mealsValidated}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Passages au self
                  </span>
                </div>

                {/* Card 3 */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
                    TICKETS EN CIRCULATION
                  </span>
                  <div className="my-2">
                    <span className="text-3xl sm:text-4xl font-black font-cabinet text-blue-600">
                      {dailyLedger.ticketsInCirculation}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Disponibles
                  </span>
                </div>

                {/* Card 4 */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
                    RECETTES ENCAISSÉES
                  </span>
                  <div className="my-2 flex items-baseline space-x-1">
                    <span className="text-3xl sm:text-4xl font-black font-cabinet text-slate-900">
                      {dailyLedger.revenueCollected.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-xs font-black text-slate-500">FCFA</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600">
                    Compte Régie CROU-K
                  </span>
                </div>

              </div>
            </div>

            {/* WAVE-STYLE REAL-TIME QR SCANNER COMPONENT */}
            <TurnstileWaveScanner
              onTicketValidated={() => {
                loadLedgerData();
                loadRegistryData();
              }}
              onRefreshStats={loadLedgerData}
            />

            {/* Manual Code Guichet Fallback Box */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                    Saisie Manuelle (Code Guichet)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Si le téléphone de l'étudiant a l'écran fissuré ou batterie faible, entrez le code ticket ou matricule.
                  </p>
                </div>
              </div>

              <form onSubmit={handleRunManualTurnstileCheck} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={scanTicketNumber}
                  onChange={(e) => setScanTicketNumber(e.target.value)}
                  placeholder="Ex: CROUK-2026-016278"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
                <input
                  type="text"
                  value={scanMatricule}
                  onChange={(e) => setScanMatricule(e.target.value.toUpperCase())}
                  placeholder="Matricule (optionnel)"
                  className="w-full sm:w-44 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={isVerifyingManual}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isVerifyingManual ? 'Vérification...' : 'Valider Ticket'}
                </button>
              </form>

              {manualScanResult && (
                <div className={`p-3.5 rounded-2xl border text-xs flex items-start space-x-2.5 ${
                  manualScanResult.status === 'valid'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}>
                  {manualScanResult.status === 'valid' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertOctagon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-extrabold block">{manualScanResult.message}</span>
                    {manualScanResult.ticket && (
                      <span className="text-[11px] text-slate-600 font-mono block mt-0.5">
                        {manualScanResult.ticket.ticketNumber} • {manualScanResult.ticket.dishName} • {manualScanResult.ticket.studentName}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Zero Data Loss Guarantee Card */}
            <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Garantie de Conservation Intégrale des Données</span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  À minuit, le système bascule automatiquement sur un nouveau jour à 0 ticket, tandis que l'ensemble des ventes et tickets de la veille est archivé définitivement dans le registre sécurisé Firestore et local. Aucune donnée d'étudiant n'est jamais effacée.
                </p>
              </div>

              <button
                type="button"
                onClick={openArchives}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 flex-shrink-0"
              >
                <Archive className="w-4 h-4 text-amber-400" />
                <span>Voir Historique Complet</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: PLATS DU MENU CROU */}
        {adminTab === 'dishes' && (
          <div className="space-y-6">
            
            {/* Live Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold block">Plats Distribués</span>
                <span className="text-2xl font-black font-cabinet text-slate-900">{canteenDishes.length}</span>
                <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">
                  {canteenDishes.filter(d => d.isAvailable).length} en service actif
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold block">Tarif Subventionné</span>
                <span className="text-2xl font-black font-cabinet text-orange-600">200 FCFA</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Subvention CROUK 90%</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold block">File au Tourniquet</span>
                <span className="text-lg font-black text-slate-900 capitalize">
                  {canteen.crowdLevel === 'faible' ? 'Fluide' : canteen.crowdLevel === 'moyen' ? 'Moyenne' : 'Forte'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">~{canteen.waitingTimeMinutes} min d'attente</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold block">Étudiants Inscrits</span>
                <span className="text-2xl font-black font-cabinet text-slate-900">{students.length}</span>
                <span className="text-[11px] text-indigo-600 font-bold block mt-0.5">Matricules audités</span>
              </div>
            </div>

            {/* Live Crowd Adjuster */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Affluence en Direct (Radar CROU)</h3>
                <p className="text-xs text-slate-500">Mettez à jour le temps d'attente visible par les étudiants.</p>
              </div>
              <div className="flex items-center space-x-2">
                {(['faible', 'moyen', 'eleve'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleCrowdChange(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      canteen.crowdLevel === lvl
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lvl === 'faible' ? '🟢 Fluide (~5m)' : lvl === 'moyen' ? '🟡 Moyenne (~15m)' : '🔴 Forte (~30m)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Create Dish Form & Current Dish List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Form */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-base text-slate-900 font-cabinet">Ajouter un Plat Distribué</h3>
                    <p className="text-xs text-slate-500">Configurez le menu servi au restaurant universitaire.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-orange-100 text-orange-800 text-[10px] font-black rounded-lg">
                    Tarif 200 FCFA
                  </span>
                </div>

                <form onSubmit={handleCreateDish} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nom du Plat *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Riz Sauce Graine au Poisson & Banane Alloco"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description du repas</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ingrédients, garniture..."
                      rows={2}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Service</label>
                      <select
                        value={mealType}
                        onChange={(e) => setMealType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold"
                      >
                        <option value="dejeuner">☀️ Déjeuner (Midi)</option>
                        <option value="diner">🌙 Dîner (Soir)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold"
                      >
                        <option value="plat_principal">Plat Principal Chaud</option>
                        <option value="entree">Entrée & Alloco</option>
                        <option value="dessert">Dessert & Dêguê</option>
                        <option value="boisson">Jus de bissap & Boisson</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Photo du plat (Facultatif - à la décision de l'administration)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Lien URL de la photo (optionnel)"
                        className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                      <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-200 transition-colors">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{isUploadingPhoto ? 'Traitement...' : 'Importer photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsUploadingPhoto(true);
                              try {
                                const compressed = await compressImage(file, 600, 600, 0.72);
                                setImageUrl(compressed);
                              } catch (err) {
                                console.error('Image compression error:', err);
                              } finally {
                                setIsUploadingPhoto(false);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                    {imageUrl && (
                      <div className="mt-2 flex items-center space-x-2">
                        <img src={imageUrl} alt="Aperçu" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                        <span className="text-[11px] text-emerald-600 font-bold">Photo prête et optimisée</span>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="text-[10px] text-red-500 hover:underline cursor-pointer"
                        >
                          Retirer
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      Les photos sont automatiquement optimisées pour s'afficher rapidement sur le téléphone des étudiants.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isPublishing || isUploadingPhoto}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isPublishing ? 'Synchronisation sur tous les appareils...' : 'Publier au Menu des Étudiants'}</span>
                  </button>
                </form>
              </div>

              {/* Dishes List */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base text-slate-900 font-cabinet">
                    Plats Actuels ({canteenDishes.length})
                  </h3>
                  <div className="flex items-center space-x-2">
                    {canteenDishes.length > 0 && onDeleteAllDishes && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Voulez-vous vraiment supprimer TOUS les plats du menu ?')) {
                            onDeleteAllDishes();
                          }
                        }}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                        title="Supprimer tous les plats du menu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Tout Supprimer</span>
                      </button>
                    )}
                    <span className="text-xs text-slate-400">Modifications instantanées</span>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {canteenDishes.map((d) => (
                    <div
                      key={d.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                        <ImageWithLoader
                          src={d.imageUrl}
                          alt={d.name}
                          className="w-full h-full"
                          imgClassName="object-cover"
                          showSpiralText={false}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {d.name}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            d.mealType === 'dejeuner' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {d.mealType === 'dejeuner' ? 'Midi' : 'Soir'}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-orange-600">
                          {d.price} FCFA
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleDishAvailability(d.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                            d.isAvailable
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {d.isAvailable ? 'En stock' : 'Rupture'}
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteDish(d.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Supprimer ce plat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: CONTRÔLE ANTI-FRAUDE & REGISTRE DES MATRICULES */}
        {adminTab === 'fraud' && (
          <div className="space-y-6">
            
            {/* Students Matricules Table */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-base text-slate-900 font-cabinet">
                    Registre des Étudiants & Matricules UPGC ({students.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Contrôle des numéros de matricule pour prévenir toute tentative d'usurpation ou de fraude.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={matriculeSearch}
                    onChange={(e) => setMatriculeSearch(e.target.value)}
                    placeholder="Rechercher un matricule..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Matricule Étudiant</th>
                      <th className="py-3 px-4">Nom et Prénoms</th>
                      <th className="py-3 px-4">Solde</th>
                      <th className="py-3 px-4">Tickets Actifs</th>
                      <th className="py-3 px-4">Tickets Consommés</th>
                      <th className="py-3 px-4">Statut Anti-Fraude</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Aucun étudiant correspondant au matricule recherché.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st) => {
                        const validCount = (st.savedTickets || []).filter(t => t.status === 'valid').length;
                        const usedCount = (st.savedTickets || []).filter(t => t.status === 'used').length;
                        return (
                          <tr key={st.uid} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-orange-600">
                              {st.matricule || st.uid}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {st.displayName}
                            </td>
                            <td className="py-3 px-4 font-extrabold text-slate-800">
                              {st.balance} FCFA
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {validCount} prêt{validCount > 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {usedCount} repas
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <UserCheck className="w-3 h-3 text-emerald-600" />
                                <span>Authentifié UPGC</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fraud Logs History */}
            {fraudLogs.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-red-200 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-red-600 font-bold text-sm font-cabinet">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Journal des Alertes de Fraude Récents</span>
                </div>
                <div className="space-y-2">
                  {fraudLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start justify-between text-xs">
                      <div>
                        <span className="font-bold text-red-900 block">{log.reason}</span>
                        <span className="text-[11px] text-red-700 font-mono mt-0.5 block">
                          Matricule: {log.matricule} • Ticket No: {log.ticketNumber} • {log.timestamp}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white">
                        {log.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: BILLETTERIE & ARCHIVES JOURNALIÈRES */}
        {adminTab === 'tickets' && (
          <div className="space-y-6">
            
            {/* Quick Ledger Summary */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-slate-900 font-cabinet">
                  Régie & Billetterie Officielle CROU
                </h3>
                <p className="text-xs text-slate-500">
                  Total cumulé aujourd'hui : {dailyLedger.totalTicketsSold} tickets vendus • {dailyLedger.revenueCollected.toLocaleString('fr-FR')} FCFA encaissés
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={openArchives}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5"
                >
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Historique des Journées</span>
                </button>

                <button
                  type="button"
                  onClick={loadRegistryData}
                  className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
                  title="Actualiser"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Issued Tickets List */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Tickets Émis et Liés aux Matricules
                  </h4>
                  <p className="text-xs text-slate-500">
                    Traçabilité complète contre la fraude ou double utilisation.
                  </p>
                </div>
                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-mono font-bold text-slate-700">
                  {students.flatMap(s => s.savedTickets || []).length} tickets émis
                </span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {students.flatMap(s => s.savedTickets || []).length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Aucun ticket encore émis pour le moment.
                  </div>
                ) : (
                  students.flatMap(s => s.savedTickets || []).map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                          🎟️
                        </div>
                        <div>
                          <span className="font-black text-slate-900 block">{t.dishName}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {t.ticketNumber} • {t.studentName} ({t.studentMatricule})
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-orange-600 block">{t.price} FCFA</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {t.status === 'valid' ? 'Valide' : 'Consommé'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </main>



      {/* ARCHIVES MODAL: HISTORICAL JOURNALS (NEVER LOST) */}
      {showArchivesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-5 animate-scaleUp max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-slate-900 text-white rounded-2xl">
                  <Archive className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 font-cabinet">
                    Registre des Archives Quotidiennes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Historique permanent des journées passées • Sauvegarde garantie
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowArchivesModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Daily Rollover Info Box */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-1">
                <span className="font-black flex items-center space-x-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sauvegarde Automatique Quotidienne Active</span>
                </span>
                <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                  Chaque nouveau jour, les chiffres de la veille basculent automatiquement ici sans jamais s'effacer, et le nouveau jour redémarre à zéro pour le service.
                </p>
              </div>

              {/* Archives Listing */}
              {archivesList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                  Aucune archive passée pour l'instant. Les journées terminées apparaîtront ici automatiquement chaque jour.
                </div>
              ) : (
                <div className="space-y-3">
                  {archivesList.map((arch) => (
                    <div
                      key={arch.date}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          <span className="font-bold text-xs text-slate-900 capitalize">
                            {arch.formattedDate || arch.date}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          Date : {arch.date} {arch.closedAt ? `• Clôturé à ${new Date(arch.closedAt).toLocaleTimeString('fr-FR')}` : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-bold">Vendus</span>
                          <span className="font-black text-slate-900 text-sm">{arch.totalTicketsSold}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-bold">Servis</span>
                          <span className="font-black text-emerald-600 text-sm">{arch.mealsValidated}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-bold">Circulation</span>
                          <span className="font-black text-blue-600 text-sm">{arch.ticketsInCirculation}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-bold">Recettes</span>
                          <span className="font-black text-slate-900 text-sm">{arch.revenueCollected.toLocaleString('fr-FR')} F</span>
                        </div>
                      </div>

                      {arch.servedTickets && arch.servedTickets.length > 0 && (
                        <div className="text-[11px] text-slate-500 pt-1">
                          <span className="font-bold text-slate-700">Détails des {arch.servedTickets.length} repas servis : </span>
                          <span>{arch.servedTickets.slice(0, 5).map(t => `${t.ticketNumber} (${t.dishName})`).join(', ')}{arch.servedTickets.length > 5 ? ` +${arch.servedTickets.length - 5} autres...` : ''}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with manual close day button */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                La clôture manuelle archive la journée en cours et redémarre à 0.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleManualArchiveDay}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
                >
                  <Archive className="w-4 h-4" />
                  <span>Clôturer & Archiver Aujourd'hui</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowArchivesModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
