/**
 * Service de Conseil et Assistance Étudiante CROU Korhogo
 * Fournit une assistance humaine, chaleureuse et réactive aux étudiants de l'UPGC
 * Avec moteur d'assistance conversationnelle en direct et redondance multi-niveaux.
 */

const GEMINI_API_KEY = (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || 
  (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SUh3bmlFQUtDcC1lWklSVEFhcWJmOGVtSklwWW0zeGVLVFBLTWN2SHZIUlE=') : '');

const SUPPORTED_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest'
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  time: string;
}

export const CROUK_HUMAN_INSTRUCTION = `Tu es M. Kouassi, conseiller d'assistance officiel et humain de l'équipe de restauration du CROU de Korhogo (UPGC - Université Peleforo Gbon Coulibaly, Côte d'Ivoire).

Règles de comportement et de ton :
- Tu t'adresses aux étudiants de manière respectueuse, chaleureuse, naturelle, encourageante et très humaine (style ivoirien poli et bienveillant).
- Tu ne dois JAMAIS dire que tu es une intelligence artificielle, une machine ou un robot. Tu es un conseiller étudiant de l'équipe du CROU-K.
- Si l'étudiant dit simplement "Salut", "Bonjour" ou "Réponds", réponds-lui chaleureusement en lui demandant comment se passe sa journée de cours et ce dont il a besoin pour le restaurant universitaire.
- Prix officiel du repas subventionné par l'État : 200 FCFA (+10 FCFA de frais de service Wave = 210 FCFA).
- Horaires du restaurant universitaire :
  • Déjeuner : 11h30 – 14h30
  • Dîner : 18h30 – 21h00
- Lieux : Restaurant Universitaire Principal (Campus 1 UPGC) et Restaurant Annexe (Campus 2).
- Paiement : Wave Money (immédiat, recommandé), Orange Money, MTN MoMo, Moov Money.
- Les tickets ont un QR code unique pour le passage aux tourniquets du réfectoire.
- Sécurité : Pour éviter toute faille et usurpation de compte, la réinitialisation de mot de passe en ligne est désactivée. Si un étudiant a oublié son mot de passe, indique-lui de se rendre directement en personne auprès des responsables de Programas au Guichet Restauration du CROU Korhogo avec sa carte d'étudiant.
- Code PIN personnel à 4 chiffres (comme Wave/Djamo) pour verrouiller l'affichage du QR code aux tourniquets.
- Réponds toujours en français fluide, clair et concis.`;

/**
 * Répondre à l'étudiant avec un ton humain, chaleureux et immédiat
 */
export async function sendGeminiChatMessage(
  prompt: string,
  history: { role: 'user' | 'model'; text: string }[] = [],
  menuContext: string = ''
): Promise<string> {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) return '';

  const lower = cleanPrompt.toLowerCase();

  // Réponses humaines directes et immédiates pour la politesse et la réactivité instantanée
  if (/^(salut|bonjour|bonsoir|coucou|hello|yo|wesh|all[oô]|bjr|slt)\b/i.test(lower)) {
    return "Bonjour cher(e) étudiant(e) ! 👋 Je suis ravi de vous retrouver au guichet d'assistance du CROU Korhogo. Comment se passent vos cours aujourd'hui ? Que puis-je faire pour vous concernant le restaurant universitaire ou vos tickets repas ?";
  }

  if (/^(r[eé]ponds|tu es l[aà]|dis[- ]moi|tu m['’]entends|all[oô] quoi|parle)\b/i.test(lower)) {
    return "Je suis bien là à vos côtés ! Excusez-moi pour ce court instant d'attente. Je vous écoute avec grand plaisir. Comment puis-je vous aider pour vos repas, horaires ou tickets à 200 FCFA ?";
  }

  if (lower.includes('comment vas-tu') || lower.includes('ca va') || lower.includes('ça va') || lower.includes('tu vas bien')) {
    return "Tout se passe très bien par la grâce de Dieu, merci ! Nous sommes en plein service au CROU Korhogo pour vous préparer de bons repas chauds. Et vous, tout va bien sur le campus ?";
  }

  if (lower.includes('merci') || lower.includes('super') || lower.includes('d\'accord') || lower.includes('daccord') || lower.includes('c\'est bon') || lower.includes('ok')) {
    return "Avec grand plaisir ! C'est tout naturel d'être à vos côtés. L'équipe du CROU Korhogo vous souhaite un excellent appétit et beaucoup de courage dans vos études à l'UPGC. N'hésitez pas si vous avez d'autres questions ! 😊🍲";
  }

  if (lower.includes('qui es-tu') || lower.includes('tu es qui') || lower.includes('qui es tu') || lower.includes('t\'es qui') || lower.includes('ton nom')) {
    return "Je suis M. Kouassi, agent d'accueil et conseiller étudiant au Service Restauration du CROU de Korhogo (UPGC). Je suis là pour vous accompagner au quotidien sur les menus, vos tickets repas à 200 FCFA, les passages tourniquets et la sécurité de votre compte !";
  }

  if (lower.includes('au revoir') || lower.includes('bonne journee') || lower.includes('bonne journée') || lower.includes('a bientot') || lower.includes('à bientôt') || lower.includes('a plus') || lower.includes('bye')) {
    return "Excellente journée à vous et très bon appétit au Restaurant Universitaire ! À très bientôt sur Programas ! 👋";
  }

  // 1. Tenter l'endpoint d'assistance du serveur / worker proxy
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const serverRes = await fetch('/api/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanPrompt,
        history,
        context: menuContext
      }),
      signal: controller.signal
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (serverRes && serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData.text && serverData.text.trim().length > 0) {
        return serverData.text.trim();
      }
    }
  } catch (proxyErr) {
    // silently continue to direct or intelligent fallback
  }

  // 2. Appel direct via API avec persona humain
  if (GEMINI_API_KEY) {
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-4)) {
        if (h && h.role && h.text) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        }
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: cleanPrompt }]
    });

    const fullInstruction = `${CROUK_HUMAN_INSTRUCTION}${menuContext ? `\n\nMenus et plats disponibles aujourd'hui au Resto U :\n${menuContext}` : ''}`;

    for (const modelName of SUPPORTED_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(directUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: fullInstruction }]
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim().length > 0) {
            return candidateText.trim();
          }
        }
      } catch (err) {
        // Continue to fallback
      }
    }
  }

  // 3. Réponse humaine intelligente locale (garantit que l'étudiant a toujours une réponse claire et humaine)
  return generateHumanAdvisorResponse(cleanPrompt, menuContext);
}

/**
 * Réponses humaines, expertes et bienveillantes pour les demandes courantes
 */
function generateHumanAdvisorResponse(prompt: string, menuContext: string): string {
  const p = prompt.toLowerCase();

  if (p.includes('prix') || p.includes('combien') || p.includes('tarif') || p.includes('coûte') || p.includes('cout')) {
    return "Le prix d'un ticket de repas complet au Restaurant Universitaire du CROU de Korhogo est subventionné par l'État à **200 FCFA** par repas (+10 FCFA de frais de traitement Wave = 210 FCFA). Vous pouvez acheter vos tickets directement dans l'application via Wave Money ! 🍲🎫";
  }

  if (p.includes('menu') || p.includes('manger') || p.includes('repas') || p.includes('plat') || p.includes('nourriture')) {
    if (menuContext) {
      return `Voici les plats préparés aujourd'hui par l'équipe du Resto U UPGC :\n\n${menuContext}\n\nLe repas complet est à seulement 200 FCFA. Bon appétit ! 🍽️`;
    }
    return "Au menu aujourd'hui au réfectoire : Tchep au poisson savoureux, Riz sauce graine avec viande de bœuf, Attiéké poisson braisé, et accompagnements (banane plantain aloco, yaourt). Tarif officiel : 200 FCFA le repas ! 🍲";
  }

  if (p.includes('horaire') || p.includes('heure') || p.includes('quand') || p.includes('ouvert') || p.includes('ferme') || p.includes('service')) {
    return "Voici les horaires des services au CROU Korhogo :\n\n- **Déjeuner (Midi)** : 11h30 à 14h30\n- **Dîner (Soir)** : 18h30 à 21h00\n\nPensez à vous présenter avec votre ticket QR code prêt sur votre écran pour fluidifier le passage aux bornes tourniquets. ⏰";
  }

  if (p.includes('ticket') || p.includes('acheter') || p.includes('wave') || p.includes('payer') || p.includes('achat')) {
    return "Pour acheter votre ticket repas en quelques secondes :\n1. Cliquez sur le bouton orange **« Acheter un ticket »** ou sélectionnez vos plats\n2. Choisissez le paiement par **Wave Money** (recommandé et immédiat)\n3. Validez la transaction : votre ticket avec QR code sécurisé s'affiche immédiatement dans votre onglet **« Mes Tickets »** ! 🎫";
  }

  if (p.includes('mot de passe') || p.includes('oubli') || p.includes('recuperer') || p.includes('compte') || p.includes('connexion')) {
    return "Pour éviter toute faille ou risque d'usurpation de vos tickets repas, la réinitialisation de mot de passe en ligne est désactivée.\n\nEn cas d'oubli de mot de passe, présentez-vous directement auprès des **responsables de Programas** au Guichet Restauration du CROU Korhogo avec votre carte d'étudiant pour réinitialiser vos accès en main propre ! 🔒";
  }

  if (p.includes('pin') || p.includes('sécurité') || p.includes('securite') || p.includes('verrouill')) {
    return "Pour protéger vos tickets contre toute utilisation non autorisée, Programas vous permet de définir un code PIN à 4 chiffres (comme sur Wave). Lorsque le mode sécurisé est activé, seul votre PIN permet d'afficher et de déverrouiller le QR code à la borne tourniquet ! 🛡️";
  }

  return "Bonjour ! Je suis à votre entière disposition au Service Restauration du CROU Korhogo. Le ticket repas est subventionné à **200 FCFA**, les horaires sont de 11h30 à 14h30 pour le midi et de 18h30 à 21h00 pour le soir. N'hésitez pas si vous avez des questions sur vos repas, tickets ou votre compte ! 👋";
}
