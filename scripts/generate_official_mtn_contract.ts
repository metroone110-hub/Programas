import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function generateMtnContractPdf() {
  const pdfDoc = await PDFDocument.create();

  // Fonts
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Palette officielle MTN
  const mtnYellow = rgb(1, 0.8, 0); // #FFCC00
  const mtnYellowDark = rgb(0.9, 0.7, 0);
  const darkNavy = rgb(0.08, 0.1, 0.15); // #141A26
  const slateText = rgb(0.2, 0.25, 0.3);
  const mutedText = rgb(0.45, 0.5, 0.55);
  const bgCard = rgb(0.98, 0.985, 0.99);
  const borderCard = rgb(0.85, 0.88, 0.92);
  const cardHighlight = rgb(1, 0.98, 0.9);

  const PAGE_WIDTH = 595.28; // A4 points
  const PAGE_HEIGHT = 841.89; // A4 points
  const MARGIN = 42;
  const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

  // ==========================================
  // PAGE 1 : CONTRAT OFFICIEL & CADRE MARCHAND CLIENT
  // ==========================================
  const page1 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // Top MTN Brand Header Bar (Yellow banner)
  page1.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 12,
    width: PAGE_WIDTH,
    height: 12,
    color: mtnYellow,
  });

  // Top right MTN MoMo Badge
  const badgeWidth = 120;
  const badgeHeight = 36;
  const badgeX = PAGE_WIDTH - MARGIN - badgeWidth;
  const badgeY = PAGE_HEIGHT - 60;

  page1.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeWidth,
    height: badgeHeight,
    color: mtnYellow,
    borderColor: mtnYellowDark,
    borderWidth: 1.5,
  });

  page1.drawText('MTN MoMo', {
    x: badgeX + 16,
    y: badgeY + 18,
    size: 14,
    font: fontHelveticaBold,
    color: darkNavy,
  });

  page1.drawText('Mobile Money CI', {
    x: badgeX + 16,
    y: badgeY + 6,
    size: 8,
    font: fontHelvetica,
    color: darkNavy,
  });

  // Top Left Header
  let currentY = PAGE_HEIGHT - 42;
  page1.drawText("RÉPUBLIQUE DE CÔTE D'IVOIRE", {
    x: MARGIN,
    y: currentY,
    size: 9.5,
    font: fontHelveticaBold,
    color: darkNavy,
  });

  currentY -= 13;
  page1.drawText("Ministère de l'Enseignement Supérieur et de la Recherche Scientifique", {
    x: MARGIN,
    y: currentY,
    size: 7.5,
    font: fontHelveticaOblique,
    color: mutedText,
  });

  currentY -= 11;
  page1.drawText("UNIVERSITÉ PELEFORO GON COULIBALY (UPGC) - KORHOGO", {
    x: MARGIN,
    y: currentY,
    size: 8,
    font: fontHelveticaBold,
    color: slateText,
  });

  currentY -= 18;
  page1.drawLine({
    start: { x: MARGIN, y: currentY },
    end: { x: PAGE_WIDTH - MARGIN, y: currentY },
    thickness: 1,
    color: borderCard,
  });

  // Document Title Header
  currentY -= 26;
  page1.drawRectangle({
    x: MARGIN,
    y: currentY - 6,
    width: CONTENT_WIDTH,
    height: 38,
    color: darkNavy,
  });

  page1.drawText('CONTRAT DE PARTENARIAT & SOUSCRIPTION SERVICE MOBILE MONEY', {
    x: MARGIN + 14,
    y: currentY + 17,
    size: 11,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  page1.drawText('INTÉGRATION OPEN API COLLECTION - ENCAISSEMENT RESTAURATION UNIVERSITAIRE', {
    x: MARGIN + 14,
    y: currentY + 4,
    size: 7.5,
    font: fontHelveticaBold,
    color: mtnYellow,
  });

  // Parties Preamble
  currentY -= 22;
  page1.drawText('ENTRE LES SOUSSIGNÉS :', {
    x: MARGIN,
    y: currentY,
    size: 9,
    font: fontHelveticaBold,
    color: darkNavy,
  });

  currentY -= 14;
  page1.drawText("1. MTN Mobile Money Côte d'Ivoire S.A., Société Anonyme au capital de 4.645.000.000 FCFA,", {
    x: MARGIN + 10,
    y: currentY,
    size: 8,
    font: fontHelvetica,
    color: slateText,
  });
  currentY -= 11;
  page1.drawText("Siège social : Abidjan Plateau, 37 Boulevard Général de Gaulle, 01 BP 3865 Abidjan 01, RCCM N° CI-ABJ-2005-B-1466,", {
    x: MARGIN + 10,
    y: currentY,
    size: 8,
    font: fontHelvetica,
    color: mutedText,
  });
  currentY -= 11;
  page1.drawText("Ci-après désignée « MTN » ou « MTN MoMo » d'une part,", {
    x: MARGIN + 10,
    y: currentY,
    size: 8,
    font: fontHelveticaOblique,
    color: slateText,
  });

  currentY -= 14;
  page1.drawText("ET D'AUTRE PART :", {
    x: MARGIN,
    y: currentY,
    size: 9,
    font: fontHelveticaBold,
    color: darkNavy,
  });

  // ==========================================
  // LE CADRE CENTRAL « LE CLIENT » (EXACTEMENT COMME IMG_0831)
  // ==========================================
  currentY -= 14;
  const cardX = MARGIN;
  const cardWidth = CONTENT_WIDTH;
  const cardHeight = 250;
  const cardTopY = currentY;

  // Background box with border
  page1.drawRectangle({
    x: cardX,
    y: cardTopY - cardHeight,
    width: cardWidth,
    height: cardHeight,
    color: bgCard,
    borderColor: mtnYellow,
    borderWidth: 2,
  });

  // Header band inside card
  page1.drawRectangle({
    x: cardX,
    y: cardTopY - 26,
    width: cardWidth,
    height: 26,
    color: mtnYellow,
  });

  page1.drawText('IDENTIFICATION DU CLIENT / PARTENAIRE MARCHAND', {
    x: cardX + 14,
    y: cardTopY - 18,
    size: 10,
    font: fontHelveticaBold,
    color: darkNavy,
  });

  page1.drawText('(Informations requises pour le passage en Production Live)', {
    x: cardX + 275,
    y: cardTopY - 17,
    size: 7.5,
    font: fontHelveticaOblique,
    color: darkNavy,
  });

  // Fields inside the box
  let fieldY = cardTopY - 44;
  const leftColX = cardX + 16;
  const valColX = cardX + 165;
  const rowStep = 18;

  const clientFields: { label: string; value: string; isBold?: boolean; highlight?: boolean }[] = [
    {
      label: 'Dénomination Sociale :',
      value: 'RESTO U UPGC / CROU KORHOGO',
      isBold: true,
    },
    {
      label: 'Nom Commercial / Service :',
      value: 'Resto U - Tickets Restauration Universitaire UPGC',
      isBold: true,
    },
    {
      label: 'Forme Juridique :',
      value: 'Projet Universitaire & Développeur Indépendant',
      isBold: false,
    },
    {
      label: 'Capital Social :',
      value: 'Néant (Pas encore de capital / En cours de constitution)',
      isBold: false,
      highlight: true,
    },
    {
      label: 'Siège Social :',
      value: 'Université Peleforo Gon Coulibaly (UPGC), Korhogo, Côte d\'Ivoire',
      isBold: true,
    },
    {
      label: 'RCCM / Immatriculation :',
      value: 'En cours d\'immatriculation (Projet Universitaire UPGC)',
      isBold: false,
    },
    {
      label: 'Représenté par :',
      value: 'Gueu Ange Michael',
      isBold: true,
      highlight: true,
    },
    {
      label: 'En qualité de / Fonction :',
      value: 'Développeur & Administrateur du projet Resto U',
      isBold: true,
    },
    {
      label: 'Contact Téléphonique :',
      value: '0596480773  (+225 05 96 48 07 73)',
      isBold: true,
      highlight: true,
    },
    {
      label: 'Adresse E-mail :',
      value: 'metroone110@gmail.com',
      isBold: true,
    },
    {
      label: 'Activité Principale :',
      value: 'Vente et encaissement numérique des tickets repas étudiants UPGC',
      isBold: false,
    },
  ];

  for (const field of clientFields) {
    if (field.highlight) {
      page1.drawRectangle({
        x: leftColX - 4,
        y: fieldY - 3,
        width: cardWidth - 24,
        height: 15,
        color: cardHighlight,
      });
    }

    page1.drawText(field.label, {
      x: leftColX,
      y: fieldY,
      size: 8.5,
      font: fontHelveticaBold,
      color: darkNavy,
    });

    page1.drawText(field.value, {
      x: valColX,
      y: fieldY,
      size: 8.5,
      font: field.isBold ? fontHelveticaBold : fontHelvetica,
      color: field.highlight ? darkNavy : slateText,
    });

    fieldY -= rowStep;
  }

  // ==========================================
  // ARTICLES DU CONTRAT (OPEN API COLLECTION)
  // ==========================================
  currentY = cardTopY - cardHeight - 16;

  page1.drawText('DISPOSITIONS CONTRACTUELLES ET ENGAGEMENTS TECHNIQUES', {
    x: MARGIN,
    y: currentY,
    size: 9.5,
    font: fontHelveticaBold,
    color: darkNavy,
  });

  currentY -= 14;
  page1.drawText('Article 1 - Objet :', {
    x: MARGIN,
    y: currentY,
    size: 8,
    font: fontHelveticaBold,
    color: slateText,
  });
  page1.drawText("MTN MoMo met à disposition l'Open API Collection permettant l'encaissement direct des paiements de", {
    x: MARGIN + 85,
    y: currentY,
    size: 8,
    font: fontHelvetica,
    color: slateText,
  });

  currentY -= 10;
  page1.drawText("tickets de restauration par les étudiants via leur compte MTN Mobile Money CI, crédité sur le compte marchand 0596480773.", {
    x: MARGIN,
    y: currentY,
    size: 8,
    font: fontHelvetica,
    color: slateText,
  });

  currentY -= 13;
  page1.drawText('Article 2 - Spécifications techniques :', {
    x: MARGIN,
    y: currentY,
    size: 8,
    font: fontHelveticaBold,
    color: slateText,
  });
  page1.drawText("Protocole REST HTTPS TLS 1.3, authentification OAuth 2.0 (Bearer Token),", {
    x: MARGIN + 145,
    y: currentY,
    size: 8,
    font: fontHelvetica,
    color: slateText,
  });

  currentY -= 10;
  page1.drawText("Idempotence stricte via UUID X-Reference-Id, Webhook de notification instantanée de confirmation.", {
    x: MARGIN,
    y: currentY,
    size: 8,
    font: fontHelvetica,
    color: slateText,
  });

  currentY -= 13;
  page1.drawText('Article 3 - Conformité & Sécurité :', {
    x: MARGIN,
    y: currentY,
    size: 8,
    font: fontHelveticaBold,
    color: slateText,
  });
  page1.drawText("Le Client garantit la non-conservation des codes PIN clients (validation sécurisée par USSD MTN).", {
    x: MARGIN + 135,
    y: currentY,
    size: 8,
    font: fontHelvetica,
    color: slateText,
  });

  // ==========================================
  // SIGNATURES BOX (Bas de page)
  // ==========================================
  currentY -= 22;
  const sigBoxHeight = 110;
  const colW = (CONTENT_WIDTH - 20) / 2;

  // Left Signature: MTN
  page1.drawRectangle({
    x: MARGIN,
    y: currentY - sigBoxHeight,
    width: colW,
    height: sigBoxHeight,
    color: bgCard,
    borderColor: borderCard,
    borderWidth: 1,
  });

  page1.drawText('POUR MTN MOBILE MONEY CÔTE D\'IVOIRE', {
    x: MARGIN + 10,
    y: currentY - 16,
    size: 8,
    font: fontHelveticaBold,
    color: darkNavy,
  });
  page1.drawText('Direction FinTech & Business Development', {
    x: MARGIN + 10,
    y: currentY - 28,
    size: 7,
    font: fontHelvetica,
    color: mutedText,
  });
  page1.drawText('Date : Fait à Abidjan', {
    x: MARGIN + 10,
    y: currentY - 42,
    size: 7.5,
    font: fontHelveticaOblique,
    color: mutedText,
  });
  page1.drawText('Cachet & Signature :', {
    x: MARGIN + 10,
    y: currentY - 95,
    size: 7,
    font: fontHelvetica,
    color: mutedText,
  });

  // Right Signature: CLIENT (GUEU ANGE MICHAEL)
  const clientSigX = MARGIN + colW + 20;
  page1.drawRectangle({
    x: clientSigX,
    y: currentY - sigBoxHeight,
    width: colW,
    height: sigBoxHeight,
    color: cardHighlight,
    borderColor: mtnYellow,
    borderWidth: 1.5,
  });

  page1.drawText('POUR LE CLIENT / PARTENAIRE MARCHAND', {
    x: clientSigX + 10,
    y: currentY - 16,
    size: 8,
    font: fontHelveticaBold,
    color: darkNavy,
  });

  page1.drawText('Mention : "Lu et approuvé"', {
    x: clientSigX + 10,
    y: currentY - 28,
    size: 7.5,
    font: fontHelveticaOblique,
    color: darkNavy,
  });

  page1.drawText('Nom & Prénoms : Gueu Ange Michael', {
    x: clientSigX + 10,
    y: currentY - 42,
    size: 8,
    font: fontHelveticaBold,
    color: darkNavy,
  });

  page1.drawText('Qualité : Développeur & Administrateur Resto U', {
    x: clientSigX + 10,
    y: currentY - 54,
    size: 7.5,
    font: fontHelvetica,
    color: slateText,
  });

  page1.drawText('Contact : 0596480773 | Korhogo (UPGC)', {
    x: clientSigX + 10,
    y: currentY - 66,
    size: 7.5,
    font: fontHelveticaBold,
    color: darkNavy,
  });

  page1.drawText('Signature du représentant :', {
    x: clientSigX + 10,
    y: currentY - 95,
    size: 7,
    font: fontHelvetica,
    color: mutedText,
  });

  // Footer
  page1.drawLine({
    start: { x: MARGIN, y: 32 },
    end: { x: PAGE_WIDTH - MARGIN, y: 32 },
    thickness: 0.5,
    color: borderCard,
  });

  page1.drawText("Document officiel conforme MTN MoMo OpenAPI Collection - Université Peleforo Gon Coulibaly (UPGC)", {
    x: MARGIN,
    y: 20,
    size: 7,
    font: fontHelvetica,
    color: mutedText,
  });

  page1.drawText("Page 1 / 1", {
    x: PAGE_WIDTH - MARGIN - 45,
    y: 20,
    size: 7,
    font: fontHelveticaBold,
    color: mutedText,
  });

  // Save PDF
  const pdfBytes = await pdfDoc.save();

  // Write to public/
  const outputPath1 = path.resolve(process.cwd(), 'public', 'CONTRAT_PARTENARIAT_MTN_MOMO_REMPLI.pdf');
  const outputPath2 = path.resolve(process.cwd(), 'public', 'contrat-mtn-momo.pdf');
  const outputPathLegacy = path.resolve(process.cwd(), 'public', 'CONTRAT_COLLECTION_OPEN_API_CROU_REMPLI.pdf');

  fs.writeFileSync(outputPath1, pdfBytes);
  fs.writeFileSync(outputPath2, pdfBytes);
  fs.writeFileSync(outputPathLegacy, pdfBytes);

  console.log(`PDF généré avec succès dans :
  - ${outputPath1} (${pdfBytes.length} octets)
  - ${outputPath2}
  - ${outputPathLegacy}`);
}

generateMtnContractPdf().catch((err) => {
  console.error('Erreur génération PDF:', err);
  process.exit(1);
});
