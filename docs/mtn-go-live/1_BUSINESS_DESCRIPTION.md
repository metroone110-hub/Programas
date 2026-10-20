# DOSSIER TECHNIQUE & COMMERCIAL : MTN MOMO GO LIVE
## CROU MENU - RESTO U (CENTRE RÉGIONAL DES ŒUVRES UNIVERSITAIRES DE KORHOGO)
### SYSTÈME NUMÉRIQUE DE VENTE DE TICKETS DE RESTAURATION ÉTUDIANTE VIA MTN MOBILE MONEY

---

### DOCUMENT 1 : DESCRIPTION DE L'ENTREPRISE & DU PROJET (BUSINESS DESCRIPTION)

#### 1. Informations Générales
- **Nom du Projet / Solution :** CROU Menu - Resto U (Billetterie Numérique Universitaire)
- **Établissement Bénéficiaire :** Centre Régional des Œuvres Universitaires de Korhogo (CROU-K) / Université Peleforo Gon Coulibaly (UPGC)
- **Localisation :** Korhogo, République de Côte d'Ivoire
- **Email Contact / Développeur :** metroone110@gmail.com
- **Type d'activité :** Restauration collective universitaire & services numériques aux étudiants
- **Produit MTN MoMo sollicité :** MTN MoMo Collection API (v1.0)
- **Devise des encaissements :** XOF (Franc CFA)
- **Montant unitaire par ticket :** 200 FCFA (tarif subventionné de l'enseignement supérieur)
- **URL de l'application :** https://ais-pre-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app

---

#### 2. Problématique résolue & Objectif
Historiquement, la vente de tickets de cantine physique au Restaurant Universitaire du CROU entraînait :
1. De longues files d'attente quotidiennes sous le soleil pour les étudiants avant chaque service de repas.
2. Des risques de pertes, vols et dégradations des tickets en papier.
3. Des écarts de caisse et une manipulation lourde de pièces de monnaie (pièces de 100 et 200 FCFA).

**La solution CROU Menu - Resto U** modernise l'expérience en permettant aux étudiants d'acheter leurs tickets en ligne en quelques secondes depuis leur smartphone grâce à leur compte MTN Mobile Money (Côte d'Ivoire).

---

#### 3. Parcours Utilisateur Détaillé (Customer Journey)
1. **Accès au menu :** L'étudiant consulte le menu du jour (Déjeuner ou Dîner) sur l'application web responsive.
2. **Choix de la commande :** L'étudiant clique sur "Acheter un ticket" et sélectionne la quantité désirée (ex: 1 ticket = 200 FCFA, 5 tickets = 1 000 FCFA).
3. **Sélection du moyen de paiement :** L'étudiant choisit l'option officielle **MTN Mobile Money**.
4. **Saisie du numéro :** L'étudiant entre son numéro MTN Côte d'Ivoire (ex: 05 XX XX XX XX).
5. **Déclenchement du paiement :** L'application envoie une requête `POST /collection/v1_0/requesttopay` à l'API MTN MoMo.
6. **Validation USSD par l'étudiant :** L'étudiant reçoit immédiatement une invite sur son téléphone (*133#) et confirme le prélèvement avec son code secret MTN MoMo personnel.
7. **Génération instantanée du ticket :** Dès confirmation du statut `SUCCESSFUL` par l'API MTN, l'application génère un ticket électronique sécurisé comprenant :
   - Un QR Code dynamique cryptographié unique.
   - Un code numérique de secours à 6 chiffres.
   - Le statut du ticket (Actif / Non consommé).
8. **Consommation au Restaurant Universitaire :** Au guichet du Resto U, l'agent du CROU-K scanne le QR Code avec la caméra de sa tablette/terminal. Le ticket est instantanément invalidé pour empêcher toute réutilisation.

---

#### 4. Estimations de Volumes & Prévisions Financières
- **Population étudiante cible :** Plus de 12 000 étudiants inscrits à l'Université Peleforo Gon Coulibaly de Korhogo.
- **Volume estimé de transactions journalières :** Entre 1 500 et 3 500 tickets/jour.
- **Volume mensuel estimé :** 40 000 à 75 000 transactions / mois.
- **Flux financier mensuel prévisionnel :** 8 000 000 FCFA à 15 000 000 FCFA.
- **Compte de reversement souhaité :** Compte Marchand MTN Mobile Money Entreprise ou Domiciliation bancaire officielle dédiée au CROU-K.
