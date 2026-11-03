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

async function main() {
  const matricule = '32165498';
  const password = '00000000';
  const displayName = 'Étudiant 32165498';

  console.log(`Création et attribution de 5 tickets pour le matricule ${matricule}...`);

  // Generate 5 distinct authentic meal tickets
  const dishOptions = [
    'Riz blanc avec sauce graine & viande de bœuf',
    'Foutou banane avec sauce claire au poisson frais',
    'Attiéké poisson carpe braisé & piment frais',
    'Tô de maïs avec sauce gombo gluante au poulet bicyclette',
    'Plat complet du jour (Protéines, féculents & légumes)'
  ];

  const tickets = [];
  const today = new Date().toLocaleDateString('fr-FR');
  const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  for (let i = 1; i <= 5; i++) {
    const serial = `CROUK-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const ticket = {
      id: `tkt_32165498_${i}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ticketNumber: serial,
      studentId: matricule,
      studentName: displayName,
      studentMatricule: matricule,
      canteenId: 'canteen-central',
      canteenName: 'Restaurant Universitaire UPGC',
      dishName: dishOptions[i - 1],
      mealType: i % 2 === 0 ? 'diner' : 'dejeuner',
      date: today,
      price: 200,
      status: 'valid',
      qrCodeData: `https://crou.ci/verify?tkt=${serial}&mat=${matricule}`,
      purchaseTime: nowTime
    };
    tickets.push(ticket);
  }

  // 1. Save student to Firestore: students/32165498
  const studentPayload = {
    fields: toFirestoreRestFields({
      uid: matricule,
      matricule: matricule,
      displayName: displayName,
      email: `${matricule}@upgc.ci`,
      role: 'student',
      balance: 0,
      savedTickets: tickets,
      passwordHash: password,
      university: 'Université Peleforo Gbon Coulibaly (UPGC)',
      campus: 'Campus UPGC Korhogo',
      phone: '+225 0700000000',
      createdAt: new Date().toISOString(),
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

  console.log(`✓ Profil étudiant enregistré dans Firestore: students/${matricule}`);

  // 2. Also save each of the 5 tickets into the top-level 'tickets' collection in Firestore
  for (const tkt of tickets) {
    const tktUrl = `${BASE_URL}/tickets/${encodeURIComponent(tkt.ticketNumber)}?key=${API_KEY}`;
    const tktPayload = { fields: toFirestoreRestFields(tkt) };
    const resTkt = await fetch(tktUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tktPayload)
    });
    if (resTkt.ok) {
      console.log(`  ✓ Ticket synchronisé dans tickets/${tkt.ticketNumber} (${tkt.dishName})`);
    } else {
      console.warn(`  ! Note enregistrement ticket ${tkt.ticketNumber}:`, resTkt.status);
    }
  }

  console.log('\n Succès ! Compte configuré avec 5 tickets valides.');
  console.log('Récapitulatif des 5 tickets :');
  tickets.forEach((t, idx) => {
    console.log(`  ${idx + 1}. N° ${t.ticketNumber} | ${t.mealType === 'dejeuner' ? 'Midi' : 'Soir'} | ${t.dishName}`);
  });
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
