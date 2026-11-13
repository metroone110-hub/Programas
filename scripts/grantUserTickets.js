import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId || '(default)'}/documents`;
const API_KEY = config.apiKey;

function toFirestoreRestValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreRestValue)
      }
    };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreRestValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreRestFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreRestValue(v);
    }
  }
  return fields;
}

function fromFirestoreRestValue(val) {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    const values = val.arrayValue?.values || [];
    return values.map(fromFirestoreRestValue);
  }
  if ('mapValue' in val) {
    const fields = val.mapValue?.fields || {};
    const res = {};
    for (const [k, v] of Object.entries(fields)) {
      res[k] = fromFirestoreRestValue(v);
    }
    return res;
  }
  return val;
}

function parseDoc(doc) {
  if (!doc || !doc.fields) return null;
  const res = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    res[k] = fromFirestoreRestValue(v);
  }
  return res;
}

async function main() {
  const matricule = (process.argv[2] || '96480773').trim().toUpperCase();
  const quantity = parseInt(process.argv[3] || '3', 10);

  console.log(`Attribution de ${quantity} ticket(s) pour le matricule ${matricule}...`);

  // 1. Fetch existing student profile from Firestore
  let existingStudent = null;
  try {
    const getRes = await fetch(`${BASE_URL}/students/${encodeURIComponent(matricule)}?key=${API_KEY}`);
    if (getRes.ok) {
      const data = await getRes.json();
      existingStudent = parseDoc(data);
      console.log(`✓ Étudiant trouvé : ${existingStudent.displayName || matricule}`);
    }
  } catch (e) {
    console.warn('Recherche étudiant:', e.message);
  }

  const displayName = existingStudent?.displayName || `Étudiant ${matricule}`;

  // Generate distinct authentic meal tickets
  const dishOptions = [
    'Riz blanc avec sauce graine & viande de bœuf',
    'Foutou banane avec sauce claire au poisson frais',
    'Attiéké poisson carpe braisé & alloco',
    'Tô de maïs avec sauce gombo au poulet bicyclette',
    'Plat complet Resto U (CROU-K)'
  ];

  const newTickets = [];
  const today = new Date().toLocaleDateString('fr-FR');
  const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  for (let i = 1; i <= quantity; i++) {
    const serial = `CROUK-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const ticket = {
      id: `tkt_${matricule}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ticketNumber: serial,
      studentId: existingStudent?.uid || matricule,
      studentName: displayName,
      studentMatricule: matricule,
      canteenId: 'resto-1',
      canteenName: 'Restaurant Universitaire UPGC',
      dishName: dishOptions[(i - 1) % dishOptions.length],
      mealType: i % 2 === 0 ? 'diner' : 'dejeuner',
      date: today,
      price: 200,
      status: 'valid',
      qrCodeData: `https://crou.ci/verify?tkt=${serial}&mat=${matricule}`,
      purchaseTime: nowTime
    };
    newTickets.push(ticket);
  }

  const existingTickets = Array.isArray(existingStudent?.savedTickets) ? existingStudent.savedTickets : [];
  const mergedTickets = [...newTickets, ...existingTickets];

  // 2. Save / update student document in Firestore
  const studentPayload = {
    fields: toFirestoreRestFields({
      uid: existingStudent?.uid || matricule,
      matricule: matricule,
      displayName: displayName,
      email: existingStudent?.email || `${matricule}@crou-korhogo.ci`,
      role: 'student',
      balance: existingStudent?.balance ?? 0,
      savedTickets: mergedTickets,
      passwordHash: existingStudent?.passwordHash || matricule.slice(-4) || '1234',
      university: 'Université Peleforo Gbon Coulibaly (UPGC)',
      campus: 'Campus UPGC Korhogo',
      createdAt: existingStudent?.createdAt || new Date().toISOString(),
      lastSync: new Date().toISOString()
    })
  };

  const studentUrl = `${BASE_URL}/students/${encodeURIComponent(matricule)}?key=${API_KEY}`;
  const resStudent = await fetch(studentUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentPayload)
  });

  if (!resStudent.ok) {
    const errText = await resStudent.text();
    console.error('Erreur enregistrement étudiant Firestore:', resStudent.status, errText);
    process.exit(1);
  }

  console.log(`✓ Profil étudiant mis à jour dans Firestore: students/${matricule}`);

  // 3. Save each ticket to top-level 'tickets' collection in Firestore
  for (const tkt of newTickets) {
    const tktUrl = `${BASE_URL}/tickets/${encodeURIComponent(tkt.ticketNumber)}?key=${API_KEY}`;
    const tktPayload = { fields: toFirestoreRestFields(tkt) };
    const resTkt = await fetch(tktUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tktPayload)
    });
    if (resTkt.ok) {
      console.log(`  ✓ Ticket synchronisé dans tickets/${tkt.ticketNumber} (${tkt.dishName})`);
    }

    // Also by id
    const tktIdUrl = `${BASE_URL}/tickets/${encodeURIComponent(tkt.id)}?key=${API_KEY}`;
    await fetch(tktIdUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tktPayload)
    });
  }

  const validCount = mergedTickets.filter(t => t.status === 'valid').length;
  console.log(`\nSuccès ! ${quantity} tickets attribués à ${displayName} (${matricule}).`);
  console.log(`Total tickets valides disponibles pour cet étudiant : ${validCount}`);
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
