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
  RefreshCw
} from 'lucide-react';
import { Dish, Canteen, CrowdLevel, UserProfile, MealTicket } from '../types';
import { GoogleGenAI } from '@google/genai';
import { ImageWithLoader } from './ImageWithLoader';
import { 
  getAllRegisteredStudents, 
  verifyTurnstileTicket, 
  getFraudAuditLogs, 
  FraudAuditLog 
} from '../services/studentAuth';

interface Props {
  canteen: Canteen;
  dishes: Dish[];
  onUpdateCanteen: (updated: Canteen) => void;
  onAddDish: (dish: Dish) => void;
  onToggleDishAvailability: (dishId: string) => void;
  onDeleteDish: (dishId: string) => void;
  onClose: () => void;
}

export const AdminDashboard: React.FC<Props> = ({
  canteen,
  dishes,
  onUpdateCanteen,
  onAddDish,
  onToggleDishAvailability,
  onDeleteDish,
  onClose
}) => {
  const [adminTab, setAdminTab] = useState<'dishes' | 'fraud' | 'tickets'>('dishes');

  // New dish form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('200');
  const [category, setCategory] = useState<'plat_principal' | 'entree' | 'dessert' | 'boisson'>('plat_principal');
  const [mealType, setMealType] = useState<'dejeuner' | 'diner'>('dejeuner');
  const [imageUrl, setImageUrl] = useState('');
  
  // AI Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResultNotice, setScanResultNotice] = useState<string | null>(null);

  // Anti-fraud & Student Matricules Registry
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [matriculeSearch, setMatriculeSearch] = useState('');
  const [fraudLogs, setFraudLogs] = useState<FraudAuditLog[]>([]);

  // Turnstile scanner simulation
  const [scanTicketNumber, setScanTicketNumber] = useState('');
  const [scanMatricule, setScanMatricule] = useState('');
  const [scanResult, setScanResult] = useState<{ status: string; message: string; ticket?: MealTicket } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    loadRegistryData();
  }, []);

  const loadRegistryData = async () => {
    const list = await getAllRegisteredStudents();
    setStudents(list);
    setFraudLogs(getFraudAuditLogs());
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

  const handleCreateDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newDish: Dish = {
      id: 'dish_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      description: description.trim() || 'Plat préparé avec soin par l\'équipe du restaurant universitaire CROU.',
      category,
      price: parseInt(price, 10) || 200,
      regularPrice: (parseInt(price, 10) || 200) * 10,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      isAvailable: true,
      mealType,
      canteenId: canteen.id,
      tags: ['Distribution Officielle', 'Resto U'],
      rating: 5.0,
      ratingCount: 1
    };

    onAddDish(newDish);
    setName('');
    setDescription('');
    setImageUrl('');
  };

  const handleRunTurnstileCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanTicketNumber.trim()) return;

    setIsVerifying(true);
    setScanResult(null);

    const res = await verifyTurnstileTicket(scanTicketNumber.trim(), scanMatricule.trim());
    setScanResult(res);
    setIsVerifying(false);
    loadRegistryData();
  };

  const canteenDishes = dishes.filter(d => d.canteenId === canteen.id);

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
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-black font-cabinet text-white">
                  Administration Restau. U • CROU Korhogo
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  crouk_admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {canteen.name} • UPGC Korhogo
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1.5 p-1 bg-slate-800 rounded-2xl border border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setAdminTab('dishes')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                adminTab === 'dishes'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Plats Distribués</span>
            </button>

            <button
              type="button"
              onClick={() => { setAdminTab('fraud'); loadRegistryData(); }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                adminTab === 'fraud'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Contrôle Anti-Fraude ({students.length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setAdminTab('tickets'); loadRegistryData(); }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                adminTab === 'tickets'
                  ? 'bg-slate-700 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Billetterie & Ventes</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        
        {/* TAB 1: PLATS DU MENU CROU ("mets juste les plats distribuer par l'admin") */}
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
                      placeholder="Ex: Tchep au Poulet & Banane Alloco"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Photo du plat (URL)</label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publier au Menu des Étudiants</span>
                  </button>
                </form>
              </div>

              {/* Dishes List */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base text-slate-900 font-cabinet">
                    Plats Actuels ({canteenDishes.length})
                  </h3>
                  <span className="text-xs text-slate-400">Modifications instantanées</span>
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

        {/* TAB 2: CONTRÔLE ANTI-FRAUDE & REGISTRE DES MATRICULES */}
        {adminTab === 'fraud' && (
          <div className="space-y-6">
            
            {/* Turnstile Scan Simulator */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-red-600/30 border border-red-500/30 rounded-2xl">
                    <Scan className="w-6 h-6 text-red-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white font-cabinet">
                      Simulateur de Borne / Scanner Tourniquet CROU
                    </h3>
                    <p className="text-xs text-slate-400">
                      Vérification immédiate de l'authenticité et détection de tentative de fraude.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono font-bold text-amber-300">
                  Borne Restau U #01
                </span>
              </div>

              <form onSubmit={handleRunTurnstileCheck} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={scanTicketNumber}
                    onChange={(e) => setScanTicketNumber(e.target.value)}
                    placeholder="Entrez le numéro du ticket (ex: CROUK-2026-016278)"
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-xs sm:text-sm text-white placeholder:text-slate-500 font-mono tracking-wider focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scanMatricule}
                    onChange={(e) => setScanMatricule(e.target.value.toUpperCase())}
                    placeholder="Matricule de l'étudiant (Optionnel)"
                    className="flex-1 px-3 py-3 bg-black/50 border border-white/20 rounded-2xl text-xs text-white placeholder:text-slate-500 font-mono uppercase focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50 cursor-pointer flex-shrink-0"
                  >
                    <span>{isVerifying ? 'Scan...' : 'Scanner'}</span>
                  </button>
                </div>
              </form>

              {/* Scan Result Feedback */}
              {scanResult && (
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start space-x-3 ${
                  scanResult.status === 'valid'
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                    : 'bg-red-950/70 border-red-500/60 text-red-200 animate-bounce'
                }`}>
                  {scanResult.status === 'valid' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-extrabold text-sm block">{scanResult.message}</span>
                    {scanResult.ticket && (
                      <span className="text-[11px] text-slate-300 block mt-1 font-mono">
                        Ticket: {scanResult.ticket.ticketNumber} • Date: {scanResult.ticket.date} • Repas: {scanResult.ticket.dishName}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

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

        {/* TAB 3: BILLETTERIE & HISTORIQUE DES VENTES */}
        {adminTab === 'tickets' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900 font-cabinet">Billets Officiels Émis</h3>
                <p className="text-xs text-slate-500">Tous les tickets subventionnés enregistrés dans le système CROUK.</p>
              </div>
              <button
                type="button"
                onClick={loadRegistryData}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
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
        )}

      </main>
    </div>
  );
};
