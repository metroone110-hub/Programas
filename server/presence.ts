/**
 * CROU-K UPGC Korhogo - Real-time Restaurant Crowd & Geofence Service
 * Center Coordinates: 9.429064, -5.634894 (Restaurant CROU-K UPGC)
 * Restaurant perimeter geofence radius: 65 meters
 * 
 * STRICT REAL-DATA POLICY:
 * Absolutely NO simulated/fake baseline crowd.
 * The red markers and crowd count reflect ONLY 100% real connected users 
 * who are currently located within the 65m restaurant circle (or when explicitly testing via the test button).
 * If 0 people are at the restaurant, insideCount is 0 and 0 red markers are shown.
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

// In-memory active presence registry (strictly real connected devices)
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

// Clean up expired visits (inactive for more than 2 minutes)
function purgeStaleVisitors() {
  const now = Date.now();
  for (const [id, student] of activeStudents.entries()) {
    if (now - student.lastSeen > 120000) {
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

  // If user explicitly triggers test simulation in/out
  if (simulatedInside !== undefined) {
    if (simulatedInside) {
      // Place testing student inside the resto circle (e.g. 18m from center)
      const testLat = 9.429120;
      const testLng = -5.634820;
      const dist = calculateDistanceMeters(RESTO_CROU_K.lat, RESTO_CROU_K.lng, testLat, testLng);
      activeStudents.set(visitorId, {
        id: visitorId,
        lat: testLat,
        lng: testLng,
        lastSeen: Date.now(),
        distanceMeters: dist,
        isSimulated: true,
      });
      return { insidePerimeter: true, distanceMeters: dist };
    } else {
      // User left: delete immediately from presence so red marker vanishes!
      activeStudents.delete(visitorId);
      return { insidePerimeter: false, distanceMeters: 450 };
    }
  }

  // Real GPS coordinate ping from device
  if (lat !== undefined && lng !== undefined) {
    const dist = calculateDistanceMeters(RESTO_CROU_K.lat, RESTO_CROU_K.lng, lat, lng);
    const inside = dist <= RESTO_CROU_K.radiusMeters;

    if (inside) {
      // Student is inside the 65m restaurant circle: show red sign on them
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
  let waitTimeMinutes = 0;
  let crowdBadge = '🟢 Restaurant fluide • Aucun temps d’attente';

  if (insideCount === 0) {
    affluenceLevel = 'faible';
    waitTimeMinutes = 0;
    crowdBadge = '🟢 Restaurant libre • 0 attente';
  } else if (insideCount > 40) {
    affluenceLevel = 'forte';
    waitTimeMinutes = Math.min(30, Math.round(15 + (insideCount - 40) * 0.4));
    crowdBadge = '🔴 Forte affluence';
  } else if (insideCount >= 20) {
    affluenceLevel = 'moderee';
    waitTimeMinutes = Math.round(6 + (insideCount - 20) * 0.4);
    crowdBadge = '🟡 Affluence modérée';
  } else {
    affluenceLevel = 'faible';
    waitTimeMinutes = Math.max(1, Math.round(insideCount * 0.3));
    crowdBadge = `🟢 File d’attente fluide (${insideCount} connecté${insideCount > 1 ? 's' : ''})`;
  }

  // 3-hour period forecast data (typical curves for Lunch 11h30-14h30 and Dinner 18h30-21h30)
  const forecastLunch = [
    { time: '11h30', crowd: 15, label: 'Ouverture calme', level: 'faible' as const },
    { time: '12h00', crowd: 45, label: 'Arrivée des facultés', level: 'moderee' as const },
    { time: '12h30', crowd: 90, label: 'Pointe maximale', level: 'forte' as const },
    { time: '13h00', crowd: 80, label: 'Forte affluence', level: 'forte' as const },
    { time: '13h30', crowd: 40, label: 'Ralentissement', level: 'moderee' as const },
    { time: '14h00', crowd: 15, label: 'Fin de service', level: 'faible' as const },
  ];

  const forecastDinner = [
    { time: '18h30', crowd: 20, label: 'Ouverture du soir', level: 'faible' as const },
    { time: '19h00', crowd: 60, label: 'Pointe dîner', level: 'forte' as const },
    { time: '19h30', crowd: 75, label: 'Affluence soutenue', level: 'forte' as const },
    { time: '20h00', crowd: 45, label: 'Service moyen', level: 'moderee' as const },
    { time: '20h30', crowd: 25, label: 'Calme', level: 'faible' as const },
    { time: '21h00', crowd: 10, label: 'Derniers plateaux', level: 'faible' as const },
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
