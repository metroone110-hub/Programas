import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Circle,
  useMap 
} from '@vis.gl/react-google-maps';
import { 
  Users, 
  MapPin, 
  Clock, 
  Navigation, 
  RefreshCw, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Compass, 
  Layers, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import type { LivePresenceData, StudentPresenceMarker } from '../types';

interface RestoAffluenceMapProps {
  visitorId: string;
}

// Center Coordinates of Restaurant CROU-K UPGC Korhogo
const RESTO_CENTER = {
  lat: 9.429064,
  lng: -5.634894,
};

// Map Recenter Helper Component
function MapController({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);
  return null;
}

export const RestoAffluenceMap: React.FC<RestoAffluenceMapProps> = ({ visitorId }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const [liveData, setLiveData] = useState<LivePresenceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);
  
  // Real GPS & simulation states
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'inside' | 'outside' | 'denied'>('idle');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userDistance, setUserDistance] = useState<number | null>(null);
  const [isSimulatedInside, setIsSimulatedInside] = useState<boolean>(false);
  const [isTrackingGps, setIsTrackingGps] = useState<boolean>(false);
  
  // Map View settings
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'hybrid'>('hybrid');
  const [mapCenter, setMapCenter] = useState(RESTO_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(19);
  const [selectedStudent, setSelectedStudent] = useState<StudentPresenceMarker | null>(null);
  const [activeServiceTab, setActiveServiceTab] = useState<'lunch' | 'dinner'>('lunch');

  // Watch for Quota Exceeded event from global defense in main.tsx
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Fetch live crowd presence from server
  const fetchPresence = useCallback(async () => {
    try {
      const res = await fetch(`/api/presence/live?visitorId=${encodeURIComponent(visitorId)}`);
      if (!res.ok) throw new Error('Impossible de charger les données du radar');
      const data: LivePresenceData = await res.json();
      setLiveData(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching presence:', err);
      setError('Erreur de connexion au radar CROU');
    } finally {
      setLoading(false);
    }
  }, [visitorId]);

  // Initial fetch and automatic refresh every 8 seconds for real-time crowd dynamics
  useEffect(() => {
    fetchPresence();
    const interval = setInterval(fetchPresence, 8000);
    return () => clearInterval(interval);
  }, [fetchPresence]);

  // Handle GPS location tracking
  const handleToggleGps = () => {
    if (isTrackingGps) {
      // Turn off GPS
      setIsTrackingGps(false);
      setGeoStatus('idle');
      setUserCoords(null);
      setUserDistance(null);
      // Notify server to remove marker
      fetch('/api/presence/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, simulatedInside: false }),
      }).then(() => fetchPresence());
      return;
    }

    if (!navigator.geolocation) {
      alert('La géolocalisation n’est pas supportée par votre navigateur.');
      return;
    }

    setGeoStatus('locating');
    setIsTrackingGps(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);

        try {
          const res = await fetch('/api/presence/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              visitorId,
              lat: coords.lat,
              lng: coords.lng,
            }),
          });
          const result = await res.json();
          setUserDistance(result.distanceMeters);
          setGeoStatus(result.insidePerimeter ? 'inside' : 'outside');
          if (result.insidePerimeter) {
            setMapCenter(coords);
          }
          fetchPresence();
        } catch (e) {
          console.error('Ping failed:', e);
        }
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err);
        setGeoStatus('denied');
        setIsTrackingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  // Toggle quick simulation to test geofence in-out directly
  const handleToggleSimulation = async (state: boolean) => {
    setIsSimulatedInside(state);
    setGeoStatus(state ? 'inside' : 'outside');
    try {
      const res = await fetch('/api/presence/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          simulatedInside: state,
        }),
      });
      const result = await res.json();
      setUserDistance(result.distanceMeters);
      if (state) {
        setMapCenter(RESTO_CENTER);
        setMapZoom(19);
      }
      fetchPresence();
    } catch (e) {
      console.error('Sim ping failed:', e);
    }
  };

  // Recenter map on CROU-K UPGC
  const handleRecenter = () => {
    setMapCenter(RESTO_CENTER);
    setMapZoom(19);
  };

  // Switch to current service tab by time
  useEffect(() => {
    const hours = new Date().getUTCHours();
    if (hours >= 17) {
      setActiveServiceTab('dinner');
    } else {
      setActiveServiceTab('lunch');
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* ============================================================== */}
      {/* QUOTA EXCEEDED BANNER (STRICT COMPLIANCE REQUIREMENT)          */}
      {/* ============================================================== */}
      {quotaExceeded && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 text-xs rounded-2xl shadow-xs flex items-center justify-between gap-2">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
          <button
            onClick={() => setQuotaExceeded(false)}
            className="text-amber-800 font-bold px-2 py-0.5 rounded-lg hover:bg-amber-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* HEADER CARD: LIVE AFFLUENCE SUMMARY & CROWD STATUS             */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 text-white rounded-3xl p-5 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-400">
                Radar CROU-K UPGC en Direct
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                Périmètre 65m
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1">
              Affluence au Restaurant Universitaire
            </h2>

            <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{liveData?.currentService || 'Déjeuner 11h30-14h30 • Dîner 18h30-21h30'}</span>
            </p>
          </div>

          {/* Crowd Stats Counter Box */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10">
            <div className="text-center pr-3 border-r border-white/15">
              <div className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-1">
                <span>{liveData?.insideCount ?? '--'}</span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                Présents dans le cercle
              </div>
            </div>

            <div className="text-center pl-1">
              <div className="text-base sm:text-lg font-black text-amber-300">
                ~{liveData?.waitTimeMinutes ?? 5} min
              </div>
              <div className="text-[10px] font-semibold text-slate-300">
                Attente estimée
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Affluence Level Gauge */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
              liveData?.affluenceLevel === 'forte'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : liveData?.affluenceLevel === 'moderee'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                liveData?.affluenceLevel === 'forte' ? 'bg-red-500' : liveData?.affluenceLevel === 'moderee' ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
              {liveData?.crowdBadge || 'Affluence Normale'}
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Mise à jour automatique toutes les 8s
            </span>
          </div>

          <button
            onClick={fetchPresence}
            className="touch-press inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Rafraîchir</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* GOOGLE MAPS INTERACTIVE CARD (SATELLITE / ROADMAP)             */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-md border border-slate-200/80 overflow-hidden">
        {/* Map Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-black text-slate-900 tracking-tight">
              Restaurant CROU-K UPGC
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
              Korhogo
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Switcher: Hybrid Satellite vs Roadmap */}
            <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-[11px] font-bold">
              <button
                onClick={() => setMapTypeId('hybrid')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mapTypeId === 'hybrid' || mapTypeId === 'satellite'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setMapTypeId('roadmap')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mapTypeId === 'roadmap'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Plan
              </button>
            </div>

            {/* Recenter button */}
            <button
              onClick={handleRecenter}
              title="Recentrer sur le Restaurant CROU-K"
              className="touch-press p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAP CONTAINER (Explicit height required by Google Maps CF2) */}
        <div className="relative w-full h-[400px] sm:h-[460px] md:h-[500px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
          <APIProvider apiKey={apiKey} language="fr" region="CI">
            <Map
              mapId="DEMO_MAP_ID"
              defaultCenter={RESTO_CENTER}
              defaultZoom={19}
              mapTypeId={mapTypeId}
              gestureHandling="greedy"
              disableDefaultUI={false}
              fullscreenControl={false}
              streetViewControl={false}
              mapTypeControl={false}
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
              style={{ width: '100%', height: '100%' }}
            >
              <MapController center={mapCenter} zoom={mapZoom} />

              {/* 1. RESTAURANT CROU-K MAIN PERIMETER CIRCLE (65 METERS) */}
              <Circle
                center={RESTO_CENTER}
                radius={65}
                strokeColor="#EA580C"
                strokeOpacity={0.9}
                strokeWeight={2.5}
                fillColor="#F97316"
                fillOpacity={0.16}
              />

              {/* 2. OFFICIAL RESTAURANT CROU-K ADVANCED MARKER */}
              <AdvancedMarker
                position={RESTO_CENTER}
                title="Restaurant Universitaire CROU-K UPGC"
                onClick={handleRecenter}
              >
                <div className="flex flex-col items-center cursor-pointer group">
                  <div className="px-2.5 py-1 rounded-full bg-orange-600 text-white text-[10px] font-black shadow-lg border border-white flex items-center gap-1 transform transition-transform group-hover:scale-105">
                    <span>🏛️ Resto U CROU-K</span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-orange-500 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-black -mt-1">
                    🍽️
                  </div>
                  <div className="w-1.5 h-2 bg-orange-600 rounded-b-full -mt-0.5" />
                </div>
              </AdvancedMarker>

              {/* 3. CONNECTED STUDENTS PRESENT IN THE CIRCLE (RED SIGNS ONLY) */}
              {liveData?.students.map((student, idx) => {
                const isMe = student.isMe || (isSimulatedInside && idx === 0);
                return (
                  <AdvancedMarker
                    key={student.id}
                    position={{ lat: student.lat, lng: student.lng }}
                    title={isMe ? 'Votre position dans le Resto U' : `Étudiant connecté au Resto U (#${idx + 1})`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex flex-col items-center cursor-pointer relative group">
                      {/* Pulsing red radar beacon for connected students */}
                      <span className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
                      
                      {/* Red sign marker */}
                      <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-125 ${
                        isMe ? 'bg-red-600 ring-2 ring-red-400' : 'bg-[#FF0033]'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>

                      {/* Tooltip on hover or if it's the current user */}
                      {isMe && (
                        <div className="mt-1 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-black rounded-md shadow-md whitespace-nowrap">
                          Moi (Resto U)
                        </div>
                      )}
                    </div>
                  </AdvancedMarker>
                );
              })}
            </Map>
          </APIProvider>

          {/* Floating Map Legend & Overlay Note */}
          <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl text-[11px] shadow-xl border border-slate-700/80 max-w-[260px] pointer-events-none">
            <div className="flex items-center gap-1.5 font-bold mb-1 text-orange-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              <span>Signe rouge = Élève présent au Resto</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              Hors du cercle CROU (65m), la localisation quitte automatiquement la carte.
            </p>
          </div>

          {/* Selected student detail card popup if clicked */}
          {selectedStudent && (
            <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200 text-xs text-slate-800 max-w-[220px]">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {selectedStudent.isMe ? 'Vous au Resto U' : 'Étudiant Connecté'}
                </span>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-slate-600 mb-1">
                Présent à <strong>{selectedStudent.distanceMeters} mètres</strong> du centre de la cantine CROU.
              </p>
              <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                ✓ Dans le périmètre Resto
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* INTERACTION CONTROLS: REAL GPS & SIMULATION TEST               */}
        {/* ============================================================== */}
        <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-orange-600" />
              <span>Partager ma présence & Tester le cercle</span>
            </span>

            {geoStatus === 'inside' && (
              <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-2.5 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                Vous êtes visible (Signe Rouge)
              </span>
            )}

            {geoStatus === 'outside' && (
              <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                Hors du cercle (Non visible)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Button 1: Real GPS Location */}
            <button
              onClick={handleToggleGps}
              className={`touch-press py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isTrackingGps
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isTrackingGps ? 'text-orange-400 animate-pulse' : 'text-slate-600'}`} />
              <span>{isTrackingGps ? 'Désactiver mon GPS' : 'Activer mon GPS campus'}</span>
            </button>

            {/* Button 2: Quick Geofence Demonstration (Test presence in/out) */}
            <button
              onClick={() => handleToggleSimulation(!isSimulatedInside)}
              className={`touch-press py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSimulatedInside
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/30'
                  : 'bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 shadow-2xs'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isSimulatedInside
                  ? '🚶 Quitter le restaurant (Sortir)'
                  : '📍 Simuler ma présence au Resto U'}
              </span>
            </button>
          </div>

          {/* Privacy and Geofence Rule Notice */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200/60">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Confidentialité garantie :</strong> Seuls les élèves physiquement ou simulés dans le cercle de 65m du restaurant CROU-K apparaissent en signe rouge. Dès qu'un élève quitte le cercle, sa localisation disparaît instantanément.
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3-HOUR SERVICE FORECAST (DÉJEUNER 11H30-14H30 & DÎNER 18H30-21H)*/}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-md border border-slate-200/80">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-600" />
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Affluence prévue sur les 3h de repas
            </h3>
          </div>

          {/* Service Tabs */}
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveServiceTab('lunch')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeServiceTab === 'lunch'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ☀️ Déjeuner (11h30 - 14h30)
            </button>
            <button
              onClick={() => setActiveServiceTab('dinner')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeServiceTab === 'dinner'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🌙 Dîner (18h30 - 21h30)
            </button>
          </div>
        </div>

        {/* Hourly Forecast Bars */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
          {(activeServiceTab === 'lunch'
            ? liveData?.forecast.lunch
            : liveData?.forecast.dinner
          )?.map((item) => (
            <div
              key={item.time}
              className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col items-center justify-between text-center hover:bg-orange-50/50 transition-colors"
            >
              <span className="text-xs font-black text-slate-900 mb-1">
                {item.time}
              </span>

              {/* Crowd gauge bar */}
              <div className="w-full bg-slate-200 h-16 rounded-full p-1 flex flex-col justify-end mb-2">
                <div
                  className={`w-full rounded-full transition-all duration-500 ${
                    item.level === 'forte'
                      ? 'bg-red-500'
                      : item.level === 'moderee'
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{ height: `${item.crowd}%` }}
                />
              </div>

              <span className="text-[10px] font-bold text-slate-600 leading-tight">
                {item.label}
              </span>

              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md mt-1 ${
                item.level === 'forte'
                  ? 'bg-red-100 text-red-700'
                  : item.level === 'moderee'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {item.level}
              </span>
            </div>
          ))}
        </div>

        {/* Tip for students */}
        <div className="mt-3.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center gap-2 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Conseil CROU-K :</strong> Pour éviter l’attente, privilégiez les créneaux <strong>11h30 - 12h00</strong> ou <strong>13h45 - 14h30</strong> pour le midi, et <strong>18h30 - 19h00</strong> pour le dîner.
          </span>
        </div>
      </div>
    </div>
  );
};
