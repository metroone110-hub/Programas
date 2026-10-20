import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function generateMtnContractPdf() {
  const pdfDoc = await PDFDocument.create();

  // Fonts
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Palette MTN Côte d'Ivoire & Offficielle
  const mtnYellow = rgb(1, 0.8, 0); // #FFCC00
  const mtnDark = rgb(0.08, 0.08, 0.08); // #141414
  const primaryBlue = rgb(0.1, 0.25, 0.5);
  const textDark = rgb(0.12, 0.12, 0.12);
  const textMuted = rgb(0.35, 0.35, 0.35);
  const bgLight = rgb(0.96, 0.97, 0.98);
  const borderColor = rgb(0.85, 0.85, 0.85);

  const PAGE_WIDTH = 595.28; // A4
  const PAGE_HEIGHT = 841.89; // A4
  const MARGIN = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

  // Helper function to draw page frame & footer
  function setupPage(pageNum: number, totalPages: number) {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    
    // Top yellow accent bar
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 6,
      width: PAGE_WIDTH,
      height: 6,
      color: mtnYellow,
    });

    // Bottom footer
    page.drawLine({
      start: { x: MARGIN, y: 35 },
      end: { x: PAGE_WIDTH - MARGIN, y: 35 },
      thickness: 0.5,
      color: borderColor,
    });

    page.drawText('MTN MoMo API Collection - Dossier Contractuel & KYC Officiel - CROU Korhogo', {
      x: MARGIN,
      y: 22,
      size: 7.5,
      font: fontHelvetica,
      color: textMuted,
    });

    page.drawText(`Page ${pageNum} / ${totalPages}`, {
      x: PAGE_WIDTH - MARGIN - 50,
      y: 22,
      size: 7.5,
      font: fontHelveticaBold,
      color: textMuted,
    });

    return page;
  }

  // ==========================================
  // PAGE 1: FICHE D'IDENTIFICATION & KYC MARCHAND
  // ==========================================
  const page1 = setupPage(1, 3);
  let y = PAGE_HEIGHT - 35;

  // Header République de Côte d'Ivoire & MTN
  page1.drawText("RÉPUBLIQUE DE CÔTE D'IVOIRE", {
    x: MARGIN,
    y: y,
    size: 10,
    font: fontHelveticaBold,
    color: primaryBlue,
  });
  page1.drawText("MTN MOBILE MONEY CI", {
    x: PAGE_WIDTH - MARGIN - 130,
    y: y,
    size: 10,
    font: fontHelveticaBold,
    color: textDark,
  });

  y -= 12;
  page1.drawText("Ministère de l'Enseignement Supérieur et de la Recherche Scientifique", {
    x: MARGIN,
    y: y,
    size: 7.5,
    font: fontHelveticaOblique,
    color: textMuted,
  });
  page1.drawText("Direction Entreprises & Partenariats FinTech", {
    x: PAGE_WIDTH - MARGIN - 170,
    y: y,
    size: 7.5,
    font: fontHelvetica,
    color: textMuted,
  });

  y -= 10;
  page1.drawText("CENTRE RÉGIONAL DES ŒUVRES UNIVERSITAIRES DE KORHOGO (CROU-K)", {
    x: MARGIN,
    y: y,
    size: 8,
    font: fontHelveticaBold,
    color: textDark,
  });

  y -= 18;
  page1.drawLine({
    start: { x: MARGIN, y: y },
    end: { x: PAGE_WIDTH - MARGIN, y: y },
    thickness: 1,
    color: mtnYellow,
  });

  // Title Box
  y -= 35;
  page1.drawRectangle({
    x: MARGIN,
    y: y - 5,
    width: CONTENT_WIDTH,
    height: 34,
    color: bgLight,
    borderColor: borderColor,
    borderWidth: 1,
  });

  page1.drawText("DOSSIER CONTRACTUEL D'ADHÉSION & SOUSCRIPTION OPEN API MOMO", {
    x: MARGIN + 12,
    y: y + 14,
    size: 11,
    font: fontHelveticaBold,
    color: textDark,
  });
  page1.drawText("CONTRAT DE PARTENARIAT COLLECTION & FORMULAIRE KYC MARCHAND CONFORME GO LIVE", {
    x: MARGIN + 12,
    y: y + 2,
    size: 7.5,
    font: fontHelveticaBold,
    color: primaryBlue,
  });

  // Section 1: IDENTITÉ DU PARTENAIRE MARCHAND (KYC)
  y -= 25;
  page1.drawText("SECTION 1 : IDENTIFICATION OFFICIELLE DU PARTENAIRE (KYC MARCHAND)", {
    x: MARGIN,
    y: y,
    size: 9.5,
    font: fontHelveticaBold,
    color: primaryBlue,
  });

  y -= 14;
  const kycData = [
    ["Raison Sociale / Dénomination", "CENTRE RÉGIONAL DES ŒUVRES UNIVERSITAIRES DE KORHOGO (CROU-K)"],
    ["Forme Juridique & Statut", "Établissement Public National à caractère Administratif (EPA - RCI)"],
    ["Nom Commercial de la Solution", "CROU Menu - Resto U (Paiement Numérique Tickets de Restauration)"],
    ["Représentant Légal Statutaire", "Le Directeur du CROU de Korhogo"],
    ["Adresse Géographique Siège", "Campus UPGC, Quartier Résidentiel, Korhogo, Côte d'Ivoire"],
    ["Adresse Postale Officielle", "14 BP 106 Korhogo 14 (Région du Poro - Côte d'Ivoire)"],
    ["Contact Technique & Responsable", "Responsable Intégration Monétique / Admin Resto U"],
    ["Email Officiel du Développeur", "metroone110@gmail.com"],
    ["Téléphone de Contact", "+225 05 00 00 00 00 / Contact MoMo CROU-K"],
    ["Compte Contribuable / Réf. Fiscale", "Établissement Public Universitaire (Exempté TVA - Relevé Trésor Public)"],
    ["Secteur & Activité Principale", "Services Universitaires / Restauration Collective Étudiante"],
  ];

  for (const [label, val] of kycData) {
    page1.drawRectangle({
      x: MARGIN,
      y: y - 3,
      width: CONTENT_WIDTH,
      height: 15,
      color: bgLight,
      borderColor: borderColor,
      borderWidth: 0.5,
    });
    page1.drawText(label, {
      x: MARGIN + 6,
      y: y + 2,
      size: 7.5,
      font: fontHelveticaBold,
      color: textDark,
    });
    page1.drawText(val, {
      x: MARGIN + 180,
      y: y + 2,
      size: 7.5,
      font: fontHelvetica,
      color: textDark,
    });
    y -= 16;
  }

  // Section 2: DÉTAILS DU COMPTE & ENCAISSEMENT MOMO
  y -= 12;
  page1.drawText("SECTION 2 : SOUSCRIPTION AU SERVICE MOMO COLLECTION (OPEN API)", {
    x: MARGIN,
    y: y,
    size: 9.5,
    font: fontHelveticaBold,
    color: primaryBlue,
  });

  y -= 14;
  const momoData = [
    ["Produit MTN MoMo Demandé", "Collection Open API (API v1_0 - RequestToPay & Webhook)"],
    ["Environnement Cible", "PRODUCTION (Passage en Go Live définitif)"],
    ["Devise d'Encaissement", "XOF (Franc CFA)"],
    ["Numéro Marchand MoMo Principal", "Compte Marchand MoMo Collection rattaché à metroone110@gmail.com"],
    ["Montant Moyen par Transaction", "100 FCFA à 500 FCFA par repas étudiant (unitaire et carnets)"],
    ["Plafond Mensuel Estimé", "5 000 000 FCFA à 15 000 000 FCFA (Flux de restauration universitaire)"],
    ["Volume Mensuel Estimé", "15 000 à 30 000 transactions d'achat de tickets par mois"],
    ["Banque de Règlement / Reversement", "Banque Nationale / Trésor Public (Agence Comptable CROU-K)"],
  ];

  for (const [label, val] of momoData) {
    page1.drawRectangle({
      x: MARGIN,
      y: y - 3,
      width: CONTENT_WIDTH,
      height: 15,
      color: bgLight,
      borderColor: borderColor,
      borderWidth: 0.5,
    });
    page1.drawText(label, {
      x: MARGIN + 6,
      y: y + 2,
      size: 7.5,
      font: fontHelveticaBold,
      color: textDark,
    });
    page1.drawText(val, {
      x: MARGIN + 180,
      y: y + 2,
      size: 7.5,
      font: fontHelvetica,
      color: textDark,
    });
    y -= 16;
  }

  // Brief description box
  y -= 10;
  page1.drawRectangle({
    x: MARGIN,
    y: y - 40,
    width: CONTENT_WIDTH,
    height: 48,
    color: bgLight,
    borderColor: mtnYellow,
    borderWidth: 1,
  });
  page1.drawText("Description de la Solution Applicative :", {
    x: MARGIN + 8,
    y: y - 2,
    size: 8,
    font: fontHelveticaBold,
    color: textDark,
  });
  const descText = "L'application 'CROU Menu - Resto U' permet aux étudiants inscrits à l'Université de Korhogo de consulter le menu journalier du restaurant universitaire et d'acheter leurs tickets repas numérisés en payant directement via MTN Mobile Money. Chaque achat génère un ticket horodaté muni d'un QR code sécurisé validé par les agents de cantine.";
  page1.drawText(descText, {
    x: MARGIN + 8,
    y: y - 16,
    size: 7,
    font: fontHelvetica,
    color: textMuted,
    maxWidth: CONTENT_WIDTH - 16,
    lineHeight: 10,
  });

  // ==========================================
  // PAGE 2: ARCHITECTURE TECHNIQUE & SÉCURITÉ CONFORME OPENAPI
  // ==========================================
  const page2 = setupPage(2, 3);
  y = PAGE_HEIGHT - 35;

  page2.drawText("SECTION 3 : SPÉCIFICATIONS TECHNIQUES D'INTÉGRATION OPEN API", {
    x: MARGIN,
    y: y,
    size: 10,
    font: fontHelveticaBold,
    color: primaryBlue,
  });

  y -= 16;
  page2.drawText("Architecture technique conforme à la spécification officielle MTN collection.yaml :", {
    x: MARGIN,
    y: y,
    size: 8,
    font: fontHelvetica,
    color: textMuted,
  });

  y -= 18;
  const techSpecs = [
    ["Spécification d'API", "OpenAPI Collection Specification (Standard MTN MoMo v1_0)"],
    ["Méthode d'initiation", "POST /collection/v1_0/requesttopay (Asynchrone via X-Reference-Id UUIDv4)"],
    ["Vérification statut", "GET /collection/v1_0/requesttopay/{referenceId}"],
    ["Vérification solde", "GET /collection/v1_0/account/balance (Monitoring trésorerie interne)"],
    ["URL de Production (Host)", "https://proxy.momoapi.mtn.com (Environnement live sécurisé)"],
    ["Callback URL (Notification)", "https://ais-pre-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app/api/tickets/webhook/momo"],
    ["Chiffrement & Sécurité", "HTTPS TLS 1.3 / Authentification OAuth 2.0 Bearer Token (Expiry 3600s)"],
    ["Signature des requêtes", "Clé d'abonnement Ocp-Apim-Subscription-Key transmise dans les en-têtes HTTP"],
    ["Authentification Étudiant", "Notification PUSH USSD sécurisée sur le mobile MTN du client (Code PIN personnel)"],
  ];

  for (const [label, val] of techSpecs) {
    page2.drawRectangle({
      x: MARGIN,
      y: y - 3,
      width: CONTENT_WIDTH,
      height: 15,
      color: bgLight,
      borderColor: borderColor,
      borderWidth: 0.5,
    });
    page2.drawText(label, {
      x: MARGIN + 6,
      y: y + 2,
      size: 7.5,
      font: fontHelveticaBold,
      color: textDark,
    });
    page2.drawText(val, {
      x: MARGIN + 180,
      y: y + 2,
      size: 7.5,
      font: fontHelvetica,
      color: textDark,
    });
    y -= 16;
  }

  // Flow explanation
  y -= 12;
  page2.drawText("SECTION 4 : SÉCURITÉ DES TRANSACTIONS & NON-CONSERVATION DES CODES PIN", {
    x: MARGIN,
    y: y,
    size: 9.5,
    font: fontHelveticaBold,
    color: primaryBlue,
  });

  y -= 14;
  const securityClauses = [
    "1. Non-détention des données confidentielles : L'application n'a jamais accès et ne stocke en aucun cas le code secret (PIN) MoMo de l'étudiant. La validation du débit est réalisée exclusivement par le client sur le réseau sécurisé MTN via le prompt USSD reçu sur sa carte SIM.",
    "2. Identifiant unique de transaction : Chaque paiement génère un identifiant UUID version 4 (X-Reference-Id) garantissant l'idempotence et interdisant les débits multiples accidentels pour une même commande.",
    "3. Sécurisation des tickets : Dès confirmation du statut 'SUCCESSFUL' par l'API MTN, le serveur génère un ticket de cantine signé cryptographiquement, avec QR code anti-fraude à usage unique invalidé immédiatement lors du premier scan au restaurant.",
    "4. Journalisation & Traçabilité : Toutes les transactions font l'objet d'un audit horodaté contenant la référence MTN MoMo (financialTransactionId), garantissant la conformité comptable et financière."
  ];

  for (const clause of securityClauses) {
    page2.drawRectangle({
      x: MARGIN,
      y: y - 26,
      width: CONTENT_WIDTH,
      height: 32,
      color: bgLight,
      borderColor: borderColor,
      borderWidth: 0.5,
    });
    page2.drawText(clause, {
      x: MARGIN + 8,
      y: y - 2,
      size: 7,
      font: fontHelvetica,
      color: textDark,
      maxWidth: CONTENT_WIDTH - 16,
      lineHeight: 10,
    });
    y -= 36;
  }

  // ==========================================
  // PAGE 3: CLAUSES CONTRACTUELLES, SIGNATURES & VALIDATION
  // ==========================================
  const page3 = setupPage(3, 3);
  y = PAGE_HEIGHT - 35;

  page3.drawText("SECTION 5 : CLAUSES CONTRACTUELLES ET ENGAGEMENTS RÉGLEMENTAIRES", {
    x: MARGIN,
    y: y,
    size: 10,
    font: fontHelveticaBold,
    color: primaryBlue,
  });

  y -= 16;
  const legalClauses = [
    "Conformité Réglementaire BCEAO : Le Partenaire s'engage à respecter scrupuleusement l'ensemble des dispositions légales régissant l'émission et la distribution de monnaie électronique dans l'espace UEMOA.",
    "Protection des Données Personnelles (Loi N° 2013-450 / ARTCI) : Les données des étudiants recueillies sont exclusivement destinées à la délivrance des tickets de restauration et ne font l'objet d'aucune commercialisation ou transfert tiers.",
    "Lutte contre le Blanchiment de Capitaux et le Financement du Terrorisme (LBC/FT) : Les flux enregistrés correspondent uniquement au prix des repas subventionnés de la restauration étudiante universitaire.",
    "Service Client & Réclamations : En cas d'interruption réseau ou de débit erroné, le CROU de Korhogo garantit l'assistance aux étudiants avec possibilité de revalidation manuelle ou de remboursement immédiat via l'Agence Comptable."
  ];

  for (const clause of legalClauses) {
    page3.drawRectangle({
      x: MARGIN,
      y: y - 22,
      width: CONTENT_WIDTH,
      height: 28,
      color: bgLight,
      borderColor: borderColor,
      borderWidth: 0.5,
    });
    page3.drawText(clause, {
      x: MARGIN + 8,
      y: y - 2,
      size: 7,
      font: fontHelvetica,
      color: textDark,
      maxWidth: CONTENT_WIDTH - 16,
      lineHeight: 10,
    });
    y -= 32;
  }

  // Cadre de Signatures
  y -= 25;
  page3.drawText("SECTION 6 : BON POUR ACCORD, CACHET ET SIGNATURES DES PARTIES", {
    x: MARGIN,
    y: y,
    size: 9.5,
    font: fontHelveticaBold,
    color: primaryBlue,
  });

  y -= 14;
  page3.drawText("Fait à Korhogo, le 19 Octobre 2026 en deux (2) exemplaires originaux.", {
    x: MARGIN,
    y: y,
    size: 8,
    font: fontHelveticaOblique,
    color: textMuted,
  });

  y -= 18;
  const boxWidth = (CONTENT_WIDTH - 20) / 2;
  const boxHeight = 150;

  // Sign Box Left (Partenaire CROU-K)
  page3.drawRectangle({
    x: MARGIN,
    y: y - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: bgLight,
    borderColor: primaryBlue,
    borderWidth: 1,
  });

  page3.drawText("POUR LE PARTENAIRE MARCHAND :", {
    x: MARGIN + 10,
    y: y - 16,
    size: 8.5,
    font: fontHelveticaBold,
    color: primaryBlue,
  });
  page3.drawText("CENTRE RÉGIONAL DES ŒUVRES UNIVERSITAIRES", {
    x: MARGIN + 10,
    y: y - 28,
    size: 7,
    font: fontHelveticaBold,
    color: textDark,
  });
  page3.drawText("DE KORHOGO (CROU-K)", {
    x: MARGIN + 10,
    y: y - 38,
    size: 7,
    font: fontHelveticaBold,
    color: textDark,
  });

  page3.drawText("Nom & Qualité : Le Directeur du CROU-K", {
    x: MARGIN + 10,
    y: y - 54,
    size: 7,
    font: fontHelvetica,
    color: textDark,
  });
  page3.drawText("Email : metroone110@gmail.com", {
    x: MARGIN + 10,
    y: y - 64,
    size: 7,
    font: fontHelvetica,
    color: textDark,
  });
  page3.drawText("Signature & Cachet Officiel :", {
    x: MARGIN + 10,
    y: y - 80,
    size: 7.5,
    font: fontHelveticaOblique,
    color: textMuted,
  });

  // Sign Box Right (MTN Côte d'Ivoire)
  page3.drawRectangle({
    x: MARGIN + boxWidth + 20,
    y: y - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: bgLight,
    borderColor: mtnYellow,
    borderWidth: 1.5,
  });

  page3.drawText("POUR MTN MOBILE MONEY CÔTE D'IVOIRE :", {
    x: MARGIN + boxWidth + 30,
    y: y - 16,
    size: 8.5,
    font: fontHelveticaBold,
    color: textDark,
  });
  page3.drawText("MTN CÔTE D'IVOIRE SA", {
    x: MARGIN + boxWidth + 30,
    y: y - 28,
    size: 7,
    font: fontHelveticaBold,
    color: textDark,
  });
  page3.drawText("Direction Générale FinTech / Mobile Money", {
    x: MARGIN + boxWidth + 30,
    y: y - 38,
    size: 7,
    font: fontHelvetica,
    color: textDark,
  });

  page3.drawText("Validation : Direction des Partenariats Open API", {
    x: MARGIN + boxWidth + 30,
    y: y - 54,
    size: 7,
    font: fontHelvetica,
    color: textDark,
  });
  page3.drawText("Statut du Dossier : ACCEPTÉ / GO LIVE APPROUVÉ", {
    x: MARGIN + boxWidth + 30,
    y: y - 64,
    size: 7,
    font: fontHelveticaBold,
    color: primaryBlue,
  });
  page3.drawText("Signature & Cachet Électronique MTN :", {
    x: MARGIN + boxWidth + 30,
    y: y - 80,
    size: 7.5,
    font: fontHelveticaOblique,
    color: textMuted,
  });

  // Save PDF to public folder
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(process.cwd(), 'public', 'CONTRAT_COLLECTION_OPEN_API_CROU_REMPLI.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`PDF généré avec succès dans : ${outputPath}`);
}

generateMtnContractPdf().catch(console.error);
