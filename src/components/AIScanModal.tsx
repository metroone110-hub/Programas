import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Check, 
  AlertCircle, 
  X, 
  FileText, 
  RefreshCw, 
  ArrowRight,
  Sliders,
  DollarSign
} from 'lucide-react';
import type { ScanMenuResult, MealCategory, DietaryTag, MenuItem } from '../types';

interface AIScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExtractedMenu: (scanned: ScanMenuResult, mode: 'replace' | 'append') => void;
  adminToken: string;
}

// Built-in demo sample menu photos (base64 SVG/Canvas generated or simulated chalkboards)
// so the user can test the OCR instantly without needing to print an ardoise
function createChalkboardDataUrl(title: string, lines: string[]): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Dark slate chalkboard texture
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border wood frame
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 24;
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

  // Chalk border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);
  ctx.setLineDash([]);

  // Chalk Title
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 36px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🍽️ RESTO U - MENU DU JOUR', canvas.width / 2, 85);

  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 24px "Courier New", monospace';
  ctx.fillText(title, canvas.width / 2, 125);

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 145);
  ctx.lineTo(canvas.width - 60, 145);
  ctx.stroke();

  // Lines
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'left';
  let y = 185;
  for (const line of lines) {
    if (line.startsWith('---')) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillText(line.replace('---', '').trim(), 60, y);
      y += 36;
      ctx.fillStyle = '#f8fafc';
      ctx.font = '20px "Courier New", monospace';
    } else if (line.startsWith('TARIFS:')) {
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillText(line, 60, y);
      y += 34;
    } else {
      ctx.fillText(line, 80, y);
      y += 32;
    }
  }

  return canvas.toDataURL('image/jpeg', 0.88);
}

const SAMPLE_MENUS = [
  {
    id: 'ardoise-upgc-terroir',
    name: 'Tableau Resto U UPGC Korhogo',
    description: 'Menu ivoirien traditionnel (Sauce graine, Foutou, Kedjenou de poulet, Alloco, Dêguê)',
    generate: () =>
      createChalkboardDataUrl('RESTO U - CROU KORHOGO (UPGC)', [
        '--- ENTRÉES ---',
        '• Salade de crudités fraîches du Poro',
        '• Œufs durs sauce tomate épicée',
        '',
        '--- PLATS CHAUDS & SAUCES ---',
        '• Sauce graine traditionnelle au bœuf mijoté',
        '• Kedjenou de poulet fermier aux aromates du Nord',
        '• Poisson carpe braisé à la braise',
        '',
        '--- PÔLE VÉGÉTAL ---',
        '• Ragoût de haricots niébé aux légumes de saison',
        '',
        '--- ACCOMPAGNEMENTS ---',
        '• Foutou banane pilé traditionnel',
        '• Riz blanc parfumé de Korhogo',
        '• Attiéké frais de Côte d’Ivoire',
        '• Alloco bien doré (bananes plantains mûres)',
        '',
        '--- DESSERTS & DOUCEURS ---',
        '• Mangues fraîches du verger de Korhogo',
        '• Yaourt Dêguê au couscous de mil',
        '• Tranches d’ananas sucré',
        '',
        'TARIFS: Boursier 100 FCFA | Non-boursier 200 FCFA | Personnel 500 FCFA'
      ])
  },
  {
    id: 'ardoise-upgc-riz',
    name: 'Feuille Service Déjeuner UPGC',
    description: 'Tchep, Sauce gombo et Placali avec tarifs CROU-K',
    generate: () =>
      createChalkboardDataUrl('CROU-K SERVICE MIDI - UPGC', [
        '--- ENTRÉES ---',
        '• Avocat vinaigrette du pays sénoufo',
        '• Salade composée de concombre',
        '',
        '--- PLATS PRINCIPAUX ---',
        '• Riz au gras (Tchep) au poulet doré',
        '• Sauce gombo gluante au poisson fumé',
        '• Sauté de viande de bœuf aux oignons',
        '',
        '--- ACCOMPAGNEMENTS ---',
        '• Placali frais fermenté',
        '• Frites d’igname croustillantes',
        '• Riz blanc brisé 1er choix',
        '',
        '--- DESSERTS ---',
        '• Salade de papaye & fruits de saison',
        '• Yaourt sucré vanillé local',
        '',
        'TARIFS: Étudiant 100 FCFA | Personnel 500 FCFA'
      ])
  }
];

export const AIScanModal: React.FC<AIScanModalProps> = ({
  isOpen,
  onClose,
  onApplyExtractedMenu,
  adminToken
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanMenuResult | null>(null);
  const [selectedItemIndices, setSelectedItemIndices] = useState<Set<number>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setScanResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const loadSample = (sampleId: string) => {
    const sample = SAMPLE_MENUS.find((s) => s.id === sampleId);
    if (!sample) return;
    const dataUrl = sample.generate();
    setSelectedImage(dataUrl);
    setImageMime('image/jpeg');
    setScanResult(null);
    setError(null);
  };

  const handleLaunchScan = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisStep('Transmission sécurisée de la photo à Gemini 3.8 Flash...');

    try {
      const stepTimer1 = setTimeout(() => {
        setAnalysisStep('OCR en cours : reconnaissance de l’écriture manuscrite et des textes...');
      }, 1500);

      const stepTimer2 = setTimeout(() => {
        setAnalysisStep('Classification intelligente des catégories, labels et allergènes...');
      }, 3000);

      const response = await fetch('/api/menu/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: imageMime
        })
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Impossible d'analyser l'image");
      }

      setScanResult(result.data);
      // Select all items by default
      const allIndices = new Set<number>((result.data.items || []).map((_: any, idx: number) => idx));
      setSelectedItemIndices(allIndices);
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'Une erreur est survenue lors de l’analyse.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const toggleItemSelection = (index: number) => {
    const next = new Set(selectedItemIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedItemIndices(next);
  };

  const handleApply = (mode: 'replace' | 'append') => {
    if (!scanResult) return;
    // Filter only checked items
    const filteredResult: ScanMenuResult = {
      ...scanResult,
      items: scanResult.items.filter((_, idx) => selectedItemIndices.has(idx))
    };
    onApplyExtractedMenu(filteredResult, mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg leading-tight flex items-center gap-2">
                Scanner un Menu avec l'IA
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Gemini 3.8 Flash
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Prenez en photo une ardoise, un tableau blanc ou une feuille imprimée pour générer les plats
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-4 space-y-5">
          {!scanResult ? (
            <>
              {/* Photo Input Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Take Photo Mobile */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-4 rounded-xl border-2 border-dashed border-red-300 hover:border-red-500 bg-red-50/40 hover:bg-red-50/70 text-red-900 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-xs group-hover:scale-105 transition-transform flex items-center justify-center text-red-600">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block">Prendre une photo</span>
                    <span className="text-xs text-red-700/80">Ouvre l'appareil photo du smartphone</span>
                  </div>
                </button>

                {/* Upload File */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-500 bg-slate-50 hover:bg-slate-100 text-slate-800 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-xs group-hover:scale-105 transition-transform flex items-center justify-center text-slate-700">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block">Importer une image</span>
                    <span className="text-xs text-slate-500">JPG, PNG ou WEBP depuis la galerie</span>
                  </div>
                </button>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Demo Sample Ardoises */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                  Ou testez instantanément avec un exemple d'ardoise Resto U :
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_MENUS.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => loadSample(sample.id)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <span>📋</span>
                      <span>{sample.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Image Preview */}
              {selectedImage && (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-300 max-h-64 bg-slate-900 flex items-center justify-center">
                    <img
                      src={selectedImage}
                      alt="Menu à analyser"
                      className="object-contain max-h-64 w-full"
                    />
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-black/70 hover:bg-black text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Changer
                    </button>
                  </div>

                  {/* Scan Button or Loading State */}
                  {isAnalyzing ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />
                        <span className="font-bold text-sm">Analyse IA en cours...</span>
                      </div>
                      <p className="text-xs text-amber-800 font-medium">
                        {analysisStep}
                      </p>
                      <div className="w-full h-1.5 bg-amber-200/60 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-600 rounded-full animate-pulse w-3/4"></div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLaunchScan}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-red-500/20 transition-all hover:shadow-lg"
                    >
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>Lancer l'extraction automatique par Gemini</span>
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            /* Results Review Mode */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-sm block">
                      {scanResult.items.length} plats identifiés avec succès !
                    </span>
                    <span className="text-xs text-emerald-700">
                      Vérifiez les plats cochés ci-dessous avant de les injecter dans le menu.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setScanResult(null)}
                  className="text-xs font-semibold text-emerald-800 hover:underline"
                >
                  Scanner une autre photo
                </button>
              </div>

              {/* Detected info summary */}
              {(scanResult.pricing || scanResult.detectedNotes) && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  {scanResult.pricing && (
                    <div className="flex items-center gap-3 text-slate-700 font-medium">
                      <span className="font-bold text-slate-900">Tarifs lues :</span>
                      {scanResult.pricing.boursier && <span>Boursier : {scanResult.pricing.boursier}€</span>}
                      {scanResult.pricing.nonBoursier && <span>Non-boursier : {scanResult.pricing.nonBoursier}€</span>}
                      {scanResult.pricing.personnel && <span>Personnel : {scanResult.pricing.personnel}€</span>}
                    </div>
                  )}
                  {scanResult.detectedNotes && (
                    <p className="text-slate-500 italic">
                      Notes détectées : {scanResult.detectedNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Extracted items checklist */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {scanResult.items.map((item, idx) => {
                  const isChecked = selectedItemIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleItemSelection(idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-amber-50/50 border-amber-300'
                          : 'bg-white border-slate-200 opacity-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-slate-900">{item.title}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.tags?.map((t) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              #{t}
                            </span>
                          ))}
                          {item.allergens?.map((a) => (
                            <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700">
                              ⚠️ {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  {selectedItemIndices.size} plat(s) sélectionné(s)
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleApply('append')}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                  >
                    Ajouter aux plats existants
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApply('replace')}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    Remplacer tout le menu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
