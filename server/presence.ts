/**
 * CROU-K UPGC Korhogo - Real-time Restaurant Crowd & Geofence Service
 * Center Coordinates: 9.429064, -5.634894 (Restaurant CROU-K UPGC)
 * Restaurant perimeter geofence radius: 65 meters
 */

export interface StudentLocation {
  id: string;
  lat: number;
  lng: number;
  lastSeen: number;
  distanceMeters: number;
  isSimulated?: boolean;
}

export const RESTO_CROU_K = {
  lat: 9.429064,
  lng: -5.634894,
  name: 'Restaurant CROU-K UPGC Korhogo',
  campus: 'Université Peleforo Gon Coulibaly',
  radiusMeters: 65,
  lunchHours: '11h30 - 14h30',
  dinnerHours: '18h30 - 21h30',
};

// In-memory active presence registry
const activeStudents = new Map<string, StudentLocation>();

// Calculate Haversine distance in meters between two lat/lng points
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Generate slight jitter around the restaurant center for simulated campus student positions
function generatePointInCircle(centerLat: number, centerLng: number, radiusMeters: number) {
  const r = radiusMeters * Math.sqrt(Math.random());
  const theta = Math.random() * 2 * Math.PI;
  // 1 degree latitude is approx 111,320 meters
  // 1 degree longitude is approx 111,320 * cos(lat) meters
  const dx = r * Math.cos(theta);
  const dy = r * Math.sin(theta);
  const latOffset = dy / 111320;
  const lngOffset = dx / (111320 * Math.cos((centerLat * Math.PI) / 180));
  return {
    lat: Number((centerLat + latOffset).toFixed(7)),
    lng: Number((centerLng + lngOffset).toFixed(7)),
  };
}

// Seed baseline active students according to current meal service hours in Korhogo (UTC)
function maintainBaselineCrowd() {
  const now = new Date();
  // Korhogo is in UTC (GMT)
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  
  // Lunch: 11h30 (690 min) to 14h30 (870 min)
  const isLunch = currentMinutes >= 690 && currentMinutes <= 870;
  // Dinner: 18h30 (1110 min) to 21h30 (1290 min)
  const isDinner = currentMinutes >= 1110 && currentMinutes <= 1290;

  let targetBaseline = 12; // Default baseline on campus
  if (isLunch) {
    // Peak lunch around 12h30 - 13h15
    targetBaseline = currentMinutes >= 750 && currentMinutes <= 795 ? 48 : 34;
  } else if (isDinner) {
    // Peak dinner around 19h00 - 20h00
    targetBaseline = currentMinutes >= 1140 && currentMinutes <= 1200 ? 42 : 28;
  }

  // Count existing simulated students
  let simCount = 0;
  for (const [id, s] of activeStudents.entries()) {
    if (s.isSimulated) simCount++;
  }

  // Adjust to target
  if (simCount < targetBaseline) {
    const toAdd = targetBaseline - simCount;
    for (let i = 0; i < toAdd; i++) {
      const id = `sim_crou_${Math.random().toString(36).substring(2, 8)}`;
      // Keep strictly inside the 65m radius (e.g. 8m to 52m)
      const pt = generatePointInCircle(RESTO_CROU_K.lat, RESTO_CROU_K.lng, 50);
      const dist = calculateDistanceMeters(RESTO_CROU_K.lat, RESTO_CROU_K.lng, pt.lat, pt.lng);
      activeStudents.set(id, {
        id,
        lat: pt.lat,
        lng: pt.lng,
        lastSeen: Date.now() + Math.random() * 300000,
        distanceMeters: dist,
        isSimulated: true,
      });
    }
  }
}

// Clean up expired visits (older than 3 minutes)
function purgeStaleVisitors() {
  const now = Date.now();
  for (const [id, student] of activeStudents.entries()) {
    if (!student.isSimulated && now - student.lastSeen > 180000) {
      activeStudents.delete(id);
    }
  }
}

// Register or update student presence
export function updateStudentPresence(
  visitorId: string,
  lat?: number,
  lng?: number,
  simulatedInside?: boolean
): { insidePerimeter: boolean; distanceMeters: number } {
  purgeStaleVisitors();

  if (simulatedInside !== undefined) {
    if (simulatedInside) {
      // Place student within 15 to 45 meters inside the resto
      const pt = generatePointInCircle(RESTO_CROU_K.lat, RESTO_CROU_K.lng, 42);
      const dist = calculateDistanceMeters(RESTO_CROU_K.lat, RESTO_CROU_K.lng, pt.lat, pt.lng);
      activeStudents.set(visitorId, {
        id: visitorId,
        lat: pt.lat,
        lng: pt.lng,
        lastSeen: Date.now(),
        distanceMeters: dist,
        isSimulated: false,
      });
      return { insidePerimeter: true, distanceMeters: dist };
    } else {
      // Moved outside: delete from presence so red marker vanishes immediately!
      activeStudents.delete(visitorId);
      return { insidePerimeter: false, distanceMeters: 450 };
    }
  }

  if (lat !== undefined && lng !== undefined) {
    const dist = calculateDistanceMeters(RESTO_CROU_K.lat, RESTO_CROU_K.lng, lat, lng);
    const inside = dist <= RESTO_CROU_K.radiusMeters;

    if (inside) {
      // Student is inside the restaurant circle: show red sign on them
      activeStudents.set(visitorId, {
        id: visitorId,
        lat,
        lng,
        lastSeen: Date.now(),
        distanceMeters: dist,
        isSimulated: false,
      });
      return { insidePerimeter: true, distanceMeters: dist };
    } else {
      // Student is outside the circle: remove location immediately ("la localisation quitte sur eux, ils sont plus visible sur le champ")
      activeStudents.delete(visitorId);
      return { insidePerimeter: false, distanceMeters: dist };
    }
  }

  return { insidePerimeter: false, distanceMeters: 999 };
}

// Retrieve live crowd and student markers for the Map
export function getLivePresence(currentVisitorId?: string) {
  purgeStaleVisitors();
  maintainBaselineCrowd();

  const now = new Date();
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const isLunch = currentMinutes >= 690 && currentMinutes <= 870;
  const isDinner = currentMinutes >= 1110 && currentMinutes <= 1290;

  let currentService = 'Fermé (Prochain service : 11h30)';
  if (isLunch) {
    currentService = '☀️ Déjeuner Midi (11h30 - 14h30)';
  } else if (isDinner) {
    currentService = '🌙 Dîner Soir (18h30 - 21h30)';
  } else if (currentMinutes < 690) {
    currentService = '☕ Préparation du Déjeuner (Ouverture 11h30)';
  } else if (currentMinutes > 870 && currentMinutes < 1110) {
    currentService = '🍽️ Pause de l’après-midi (Dîner à 18h30)';
  }

  // Filter ONLY students strictly within the 65m perimeter
  const studentsInCircle: Array<{
    id: string;
    lat: number;
    lng: number;
    distanceMeters: number;
    isMe: boolean;
  }> = [];

  for (const [id, s] of activeStudents.entries()) {
    if (s.distanceMeters <= RESTO_CROU_K.radiusMeters) {
      studentsInCircle.push({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        distanceMeters: s.distanceMeters,
        isMe: Boolean(currentVisitorId && s.id === currentVisitorId),
      });
    }
  }

  const insideCount = studentsInCircle.length;

  let affluenceLevel: 'faible' | 'moderee' | 'forte' = 'faible';
  let waitTimeMinutes = 3;
  let crowdBadge = '🟢 File d’attente fluide';

  if (insideCount > 40) {
    affluenceLevel = 'forte';
    waitTimeMinutes = Math.min(30, Math.round(15 + (insideCount - 40) * 0.4));
    crowdBadge = '🔴 Forte affluence';
  } else if (insideCount >= 20) {
    affluenceLevel = 'moderee';
    waitTimeMinutes = Math.round(6 + (insideCount - 20) * 0.4);
    crowdBadge = '🟡 Affluence modérée';
  }

  // 3-hour period forecast data (Lunch 11h30-14h30 and Dinner 18h30-21h30)
  const forecastLunch = [
    { time: '11h30', crowd: 25, label: 'Ouverture calme', level: 'faible' },
    { time: '12h00', crowd: 55, label: 'Arrivée des facultés', level: 'moderee' },
    { time: '12h30', crowd: 90, label: 'Pointe maximale', level: 'forte' },
    { time: '13h00', crowd: 85, label: 'Forte affluence', level: 'forte' },
    { time: '13h30', crowd: 45, label: 'Ralentissement', level: 'moderee' },
    { time: '14h00', crowd: 20, label: 'Fin de service fluide', level: 'faible' },
  ];

  const forecastDinner = [
    { time: '18h30', crowd: 30, label: 'Ouverture du soir', level: 'faible' },
    { time: '19h00', crowd: 65, label: 'Pointe dîner', level: 'forte' },
    { time: '19h30', crowd: 80, label: 'Affluence soutenue', level: 'forte' },
    { time: '20h00', crowd: 50, label: 'Service moyen', level: 'moderee' },
    { time: '20h30', crowd: 30, label: 'Calme', level: 'faible' },
    { time: '21h00', crowd: 15, label: 'Derniers plateaux', level: 'faible' },
  ];

  return {
    resto: RESTO_CROU_K,
    insideCount,
    students: studentsInCircle,
    currentService,
    isServiceTime: isLunch || isDinner,
    affluenceLevel,
    waitTimeMinutes,
    crowdBadge,
    forecast: {
      lunch: forecastLunch,
      dinner: forecastDinner,
    },
    updatedAt: new Date().toISOString(),
  };
}
