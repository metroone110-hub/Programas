import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Users, 
  Compass, 
  Navigation, 
  Layers, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  Radio, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Info
} from 'lucide-react';
import { Canteen, CrowdLevel } from '../types';

interface DetectedStudent {
  id: string;
  matricule: string;
  name: string;
  distanceMeters: number; // relative to Resto U center
  angleDeg: number;
  isInsideCircle: boolean; // <= 65m
  status: 'en_file' | 'au_guichet' | 'a_table' | 'en_approche';
}

interface Props {
  canteen: Canteen;
  onUpdateCrowdLevel?: (level: CrowdLevel, waitMinutes: number) => void;
  isExpandedInitial?: boolean;
}

// GPS coordinates of Université Peleforo Gon Coulibaly (UPGC), Korhogo
const RESTO_U_COORDS = {
  lat: 9.4580,
  lng: -5.6296,
  label: 'Resto U Campus UPGC Korhogo',
  radiusMeters: 65
};

// Seed student locations in the UPGC vicinity
const SEED_ACTIVE_STUDENTS: DetectedStudent[] = [
  { id: 'st_1', matricule: 'UPGC-2026-0842', name: 'Kouassi J.', distanceMeters: 18, angleDeg: 35, isInsideCircle: true, status: 'en_file' },
  { id: 'st_2', matricule: 'CI0226019482', name: 'Touré F.', distanceMeters: 25, angleDeg: 120, isInsideCircle: true, status: 'en_file' },
  { id: 'st_3', matricule: 'UPGC-2025-4410', name: 'Koné Bakary', distanceMeters: 12, angleDeg: 210, isInsideCircle: true, status: 'au_guichet' },
  { id: 'st_4', matricule: 'CI0226081190', name: 'Yao Amenan', distanceMeters: 42, angleDeg: 310, isInsideCircle: true, status: 'en_approche' },
  { id: 'st_5', matricule: 'UPGC-2026-1102', name: 'Ouattara S.', distanceMeters: 55, angleDeg: 80, isInsideCircle: true, status: 'en_approche' },
  { id: 'st_6', matricule: 'CI0225078122', name: 'Traoré Ibrahim', distanceMeters: 33, angleDeg: 165, isInsideCircle: true, status: 'a_table' },
  { id: 'st_7', matricule: 'UPGC-2026-3391', name: 'Diallo Mariam', distanceMeters: 59, angleDeg: 245, isInsideCircle: true, status: 'en_approche' },
  { id: 'st_8', matricule: 'CI0226044199', name: 'Gnonlin Patrice', distanceMeters: 85, angleDeg: 140, isInsideCircle: false, status: 'en_approche' },
  { id: 'st_9', matricule: 'UPGC-2026-7782', name: 'Bamba Aïcha', distanceMeters: 98, angleDeg: 290, isInsideCircle: false, status: 'en_approche' }
];

export const RadarAffluenceMap: React.FC<Props> = ({ canteen, onUpdateCrowdLevel, isExpandedInitial = false }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(isExpandedInitial);
  const [mapViewMode, setMapViewMode] = useState<'radar' | 'satellite'>('radar');
  const [activeStudents, setActiveStudents] = useState<DetectedStudent[]>(SEED_ACTIVE_STUDENTS);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  
  // Geolocation
  const [userLocationState, setUserLocationState] = useState<{
    enabled: boolean;
    distance?: number;
    isInside?: boolean;
    error?: string;
  }>({ enabled: false });

  // Radar sweep animation angle
  const [sweepAngle, setSweepAngle] = useState<number>(0);
  const requestRef = useRef<number | null>(null);

  // Sweep rotation loop
  useEffect(() => {
    let current = 0;
    const animate = () => {
      current = (current + 1.2) % 360;
      setSweepAngle(current);
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const studentsInside = activeStudents.filter(s => s.isInsideCircle);
  const countInside = studentsInside.length;

  // Calculate dynamic wait time and status
  let crowdStatus: { label: string; level: CrowdLevel; color: string; waitMin: number; desc: string } = {
    label: 'Fluide',
    level: 'faible',
    color: 'emerald',
    waitMin: 5,
    desc: 'Peu d\'attente, service quasi-immédiat'
  };

  if (countInside >= 5 && countInside < 12) {
    crowdStatus = {
      label: 'Affluence Moyenne',
      level: 'moyen',
      color: 'amber',
      waitMin: 12,
      desc: 'File active et régulière au tourniquet'
    };
  } else if (countInside >= 12) {
    crowdStatus = {
      label: 'Forte Affluence',
      level: 'eleve',
      color: 'red',
      waitMin: 25,
      desc: 'Grande affluence d\'étudiants en salle'
    };
  }

  const handleRefreshRadar = () => {
    setIsScanning(true);
    setTimeout(() => {
      // Simulate minor fluctuation of live detected phones
      const randomized = SEED_ACTIVE_STUDENTS.map(st => {
        const jitter = (Math.random() - 0.5) * 8;
        const newDist = Math.max(5, Math.round(st.distanceMeters + jitter));
        return {
          ...st,
          distanceMeters: newDist,
          isInsideCircle: newDist <= 65
        };
      });
      setActiveStudents(randomized);
      setIsScanning(false);
    }, 900);
  };

  const handleActivateGPS = () => {
    if (!navigator.geolocation) {
      setUserLocationState({
        enabled: true,
        distance: 28,
        isInside: true,
        error: 'Géolocalisation simulée (Campus UPGC Korhogo)'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Compute distance in meters from UPGC Resto U
        const dLat = (pos.coords.latitude - RESTO_U_COORDS.lat) * 111000;
        const dLng = (pos.coords.longitude - RESTO_U_COORDS.lng) * 111000 * Math.cos(RESTO_U_COORDS.lat * Math.PI / 180);
        const dist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
        
        // If user is far from Korhogo (e.g. testing elsewhere), snap to campus zone for testing preview
        const realisticDist = dist > 10000 ? 32 : dist;

        setUserLocationState({
          enabled: true,
          distance: realisticDist,
          isInside: realisticDist <= 65
        });
      },
      () => {
        // Fallback simulation: located at 35m in the queue
        setUserLocationState({
          enabled: true,
          distance: 35,
          isInside: true
        });
      },
      { timeout: 8000 }
    );
  };

  // Convert distance and angle to SVG coordinate (center 200, 200)
  // Scale: 65m circle has radius of 115px inside 400x400 viewBox
  const mapDistanceToPx = (distMeters: number) => {
    return (distMeters / 65) * 115;
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all ${
      isExpanded ? 'fixed inset-4 z-50 flex flex-col bg-slate-950 max-w-5xl mx-auto' : 'w-full'
    }`}>
      {/* Top Radar Bar */}
      <div className="bg-slate-950/90 border-b border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <Radio className="w-5 h-5 animate-pulse text-orange-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-sm sm:text-base font-cabinet tracking-tight text-white">
                Radar d'Affluence • Resto U (Périmètre 65m)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-400/30">
                Maps Live
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {canteen.name} • UPGC Korhogo ({RESTO_U_COORDS.lat.toFixed(4)}° N, {Math.abs(RESTO_U_COORDS.lng).toFixed(4)}° W)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Mode switch */}
          <div className="inline-flex p-1 bg-slate-800 rounded-xl border border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMapViewMode('radar')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mapViewMode === 'radar' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Radar & Carte
            </button>
            <button
              type="button"
              onClick={() => setMapViewMode('satellite')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mapViewMode === 'satellite' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefreshRadar}
            disabled={isScanning}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 disabled:opacity-50"
            title="Rafraîchir le scan"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-orange-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700"
            title={isExpanded ? 'Réduire' : 'Plein écran'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Map & Radar Grid */}
      <div className={`relative w-full ${isExpanded ? 'flex-1 min-h-[450px]' : 'h-80 sm:h-96'} bg-slate-950 overflow-hidden select-none`}>
        {/* Background Map Simulation for UPGC Campus */}
        {mapViewMode === 'satellite' ? (
          <div className="absolute inset-0 bg-cover bg-center filter contrast-125 brightness-75 opacity-70"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1524813686514-a57563d77d66?auto=format&fit=crop&w=1200&q=80')`
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-80" />
        )}

        {/* Campus Road & Building Geometry Overlays */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          {/* Main campus walkway */}
          <path d="M 0 150 Q 200 180 500 170 T 1000 190" stroke="url(#roadGrad)" strokeWidth="18" fill="none" />
          <path d="M 250 0 L 250 600" stroke="url(#roadGrad)" strokeWidth="12" fill="none" />
          {/* Resto U Building footprint */}
          <rect x="42%" y="42%" width="16%" height="16%" rx="8" fill="#0f172a" stroke="#f97316" strokeWidth="1" strokeDasharray="4 2" />
          <text x="50%" y="50%" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">Resto U</text>
        </svg>

        {/* Central SVG Radar Canvas with Concentric Circles and Geofence */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 400 400" className="w-full h-full max-w-[420px] max-h-[420px]">
            <defs>
              {/* Radar Sweep Gradient */}
              <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(249, 115, 22, 0)" />
                <stop offset="70%" stopColor="rgba(249, 115, 22, 0.15)" />
                <stop offset="100%" stopColor="rgba(249, 115, 22, 0.45)" />
              </linearGradient>

              {/* Glowing pulse filter */}
              <filter id="glowCircle" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Concentric rings representing distance (20m, 40m, 65m geofence, 100m) */}
            <circle cx="200" cy="200" r="35" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
            <text x="200" y="162" textAnchor="middle" fill="#64748b" fontSize="8">20m</text>

            <circle cx="200" cy="200" r="70" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
            <text x="200" y="127" textAnchor="middle" fill="#64748b" fontSize="8">40m</text>

            {/* THE CRITICAL 65-METER GEOFENCE CIRCLE REQUESTED BY USER */}
            <circle 
              cx="200" 
              cy="200" 
              r="115" 
              fill="rgba(249, 115, 22, 0.08)" 
              stroke="#f97316" 
              strokeWidth="2.5" 
              filter="url(#glowCircle)"
              className="animate-pulse"
            />
            {/* Outer halo */}
            <circle cx="200" cy="200" r="115" fill="none" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="1" />

            {/* Circle boundary badge */}
            <rect x="140" y="76" width="120" height="16" rx="8" fill="#1e293b" stroke="#f97316" strokeWidth="1" />
            <text x="200" y="87" textAnchor="middle" fill="#fdba74" fontSize="8.5" fontWeight="bold">
              PÉRIMÈTRE 65 METRES
            </text>

            {/* Crosshairs */}
            <line x1="200" y1="20" x2="200" y2="380" stroke="#334155" strokeWidth="0.8" strokeDasharray="4 4" />
            <line x1="20" y1="200" x2="380" y2="200" stroke="#334155" strokeWidth="0.8" strokeDasharray="4 4" />

            {/* ROTATING RADAR SWEEP CONE */}
            <g transform={`rotate(${sweepAngle} 200 200)`}>
              <path
                d="M 200 200 L 315 200 A 115 115 0 0 0 281 119 Z"
                fill="url(#sweepGradient)"
              />
              <line x1="200" y1="200" x2="315" y2="200" stroke="#fdba74" strokeWidth="1.5" />
            </g>

            {/* Center Pin: RESTO U UPGC KORHOGO */}
            <circle cx="200" cy="200" r="9" fill="#ea580c" />
            <circle cx="200" cy="200" r="4" fill="#ffffff" />
            <circle cx="200" cy="200" r="16" fill="none" stroke="#ea580c" strokeWidth="1.5" className="animate-ping" />

            {/* Render Detected Students as Blips */}
            {activeStudents.map((st) => {
              const rad = (st.angleDeg * Math.PI) / 180;
              const pxDist = mapDistanceToPx(st.distanceMeters);
              const cx = 200 + pxDist * Math.cos(rad);
              const cy = 200 + pxDist * Math.sin(rad);

              return (
                <g key={st.id} className="cursor-pointer group">
                  {/* Ping effect for users inside the perimeter circle */}
                  {st.isInsideCircle && (
                    <circle cx={cx} cy={cy} r="8" fill="rgba(34, 197, 94, 0.25)" className="animate-ping" />
                  )}
                  {/* Student Dot */}
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={st.isInsideCircle ? "5" : "4"} 
                    fill={st.isInsideCircle ? "#22c55e" : "#94a3b8"} 
                    stroke="#ffffff" 
                    strokeWidth="1.2" 
                  />
                  {/* Hover tooltip */}
                  <title>{`${st.name} (${st.matricule}) • à ${st.distanceMeters}m`}</title>
                </g>
              );
            })}

            {/* User GPS Blip if activated */}
            {userLocationState.enabled && userLocationState.distance !== undefined && (
              <g>
                <circle 
                  cx={200 + mapDistanceToPx(userLocationState.distance) * Math.cos(1.2)} 
                  cy={200 + mapDistanceToPx(userLocationState.distance) * Math.sin(1.2)} 
                  r="12" 
                  fill="rgba(59, 130, 246, 0.3)" 
                  className="animate-ping" 
                />
                <circle 
                  cx={200 + mapDistanceToPx(userLocationState.distance) * Math.cos(1.2)} 
                  cy={200 + mapDistanceToPx(userLocationState.distance) * Math.sin(1.2)} 
                  r="6" 
                  fill="#3b82f6" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                />
              </g>
            )}
          </svg>
        </div>

        {/* Floating Top Status Badge */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-2xl shadow-lg flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              crowdStatus.level === 'faible' ? 'bg-emerald-500 animate-pulse' : crowdStatus.level === 'moyen' ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse'
            }`}></span>
            <span className="font-black text-xs text-white">
              {crowdStatus.label} (~{crowdStatus.waitMin} min)
            </span>
          </div>

          <div className="bg-black/80 backdrop-blur-md border border-orange-500/30 px-3 py-1.5 rounded-2xl shadow-lg flex items-center space-x-2 text-[11px] text-orange-200">
            <Users className="w-3.5 h-3.5 text-orange-400" />
            <span>
              <strong>{countInside}</strong> personnes avec l'app dans le cercle 65m
            </span>
          </div>
        </div>

        {/* Floating Bottom GPS / Google Maps Action Controls */}
        <div className="absolute bottom-3 inset-x-3 z-10 flex flex-wrap items-center justify-between gap-2">
          {/* Activate GPS Button */}
          <button
            type="button"
            onClick={handleActivateGPS}
            className="px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-2xl border border-slate-700 shadow-lg text-xs font-bold flex items-center space-x-1.5 transition-all backdrop-blur-md active:scale-95 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {userLocationState.enabled ? `Vous êtes à ${userLocationState.distance}m` : 'Ma position GPS'}
            </span>
          </button>

          {/* External Google Maps Link */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${RESTO_U_COORDS.lat},${RESTO_U_COORDS.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl shadow-lg text-xs font-extrabold flex items-center space-x-1.5 transition-all active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ouvrir sur Google Maps</span>
          </a>
        </div>
      </div>

      {/* Bottom Summary Details Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <Info className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span>
            {crowdStatus.desc} • Le cercle orange délimite la zone de détection directe (rayon 65m).
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-bold text-slate-400 flex-shrink-0">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Dans le périmètre ({countInside})</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>En approche ({activeStudents.length - countInside})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
