# DOSSIER COMPLET DE DEMANDE DE PASSAGE EN PRODUCTION (GO LIVE)
## API MTN MOBILE MONEY COLLECTION
### APPLICATION : CROU MENU - RESTO U (UNIVERSITÉ PELEFORO GON COULIBALY - CROU-K)

---

**Demandeur :** Centre Régional des Œuvres Universitaires de Korhogo (CROU-K) / UPGC  
**Email Développeur / Compte MoMo :** `metroone110@gmail.com`  
**Application URL :** `https://ais-pre-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app`  
**Produit MoMo sollicité :** Collection API (v1.0)  
**Pays / Devise :** Côte d'Ivoire (CI) / XOF (Franc CFA)  
**Date :** 19 Octobre 2026  

---

## TABLE DES MATIÈRES
1. Lettre Officielle de Demande d'Agrément Technique (Signée)
2. Fiche des Réponses au Formulaire en Ligne de MTN Developer
3. Dossier de Présentation de la Solution & Business Case
4. Spécifications Techniques d'Intégration & Architecture de Sécurité (OpenAPI v1.0)
5. Conditions Générales d'Utilisation & Politique de Confidentialité (Conformité ARTCI)

---

## SECTION 1 : LETTRE OFFICIELLE DE DEMANDE

**RÉPUBLIQUE DE CÔTE D'IVOIRE**  
*Union - Discipline - Travail*  
Ministère de l'Enseignement Supérieur et de la Recherche Scientifique  
**Centre Régional des Œuvres Universitaires de Korhogo (CROU-K)**  
Université Peleforo Gon Coulibaly (UPGC)  
Service de la Restauration & de l'Informatique  

**À l’attention de :**  
Monsieur le Directeur Général de MTN Côte d'Ivoire  
Direction Générale de MTN Mobile Money CI  
Département Partenariats B2B & Écosystème Développeurs  
Abidjan, République de Côte d'Ivoire  

**Objet :** Demande formelle de passage en production (« Go Live ») de l'API MTN Mobile Money Collection pour la billetterie universitaire numérique (CROU-K)  
**Compte Développeur :** `metroone110@gmail.com`  

Monsieur le Directeur,

Par la présente, nous venons solliciter auprès de votre haute bienveillance l'autorisation d'accès et l'attribution des clés de production (« Go Live ») pour l'API MTN Mobile Money Collection, dans le cadre du déploiement de notre plateforme numérique de gestion et de vente des tickets de restauration universitaire : CROU Menu - Resto U.

Le Centre Régional des Œuvres Universitaires de Korhogo (CROU-K) assure au quotidien la restauration de plus de 12 000 étudiants inscrits à l'Université Peleforo Gon Coulibaly. Afin de désengorger les guichets de vente physiques, de supprimer les longues files d'attente sous le soleil et d'offrir une expérience moderne et sécurisée à nos étudiants, nous avons développé une billetterie électronique 100% dématérialisée.

Cette plateforme permet aux étudiants d'acquérir directement leurs tickets de cantine (au tarif subventionné officiel de 200 FCFA par repas) par débit instantané de leur compte MTN Mobile Money. Les tickets générés sous forme de QR Codes dynamiques uniques sont ensuite validés aux guichets par les agents du CROU à l'aide de lecteurs mobiles.

Notre équipe technique a d'ores et déjà intégré et validé avec succès l'ensemble du cycle de la spécification OpenAPI MTN MoMo (collection.yaml) : génération des jetons OAuth 2.0 Bearer, requêtes RequestToPay et vérification certifiée du statut de paiement.

Dans l'attente d'une suite favorable à notre demande qui contribuera grandement à la digitalisation des services universitaires en Côte d'Ivoire, nous vous prions d'agréer, Monsieur le Directeur, l'expression de nos salutations distinguées.

*Service Informatique & Billetterie Resto U*  
Centre Régional des Œuvres Universitaires de Korhogo (CROU-K)  
Email : metroone110@gmail.com  

---

## SECTION 2 : FICHE PRATIQUE DES RÉPONSES AU FORMULAIRE MTN

- **Entity / Business Name :** CROU-K Resto U (Centre Régional des Œuvres Universitaires de Korhogo)
- **Application Name :** CROU Menu - Resto U
- **Country / City :** Côte d'Ivoire (CI) / Korhogo, Université Peleforo Gon Coulibaly
- **Contact Email :** metroone110@gmail.com
- **Website / App URL :** https://ais-pre-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app
- **Callback URL :** https://ais-pre-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app/api/tickets/momo-callback
- **Target Environment :** mtnci
- **Currency :** XOF
- **Estimated Monthly Transactions :** 45 000 transactions / mois
- **Business Description (Texte à coller) :**
  > Plateforme numérique officielle de billetterie et de restauration pour les étudiants de l'Université Peleforo Gon Coulibaly, gérée en partenariat avec le Centre Régional des Œuvres Universitaires de Korhogo (CROU-K). L'application permet à plus de 12 000 étudiants de consulter le menu quotidien de la cantine universitaire et d'acheter leurs tickets de repas dématérialisés au tarif subventionné officiel de 200 FCFA via MTN Mobile Money. Les tickets sous forme de QR Code unique sont ensuite scannés et validés aux tourniquets et guichets du restaurant universitaire.

---

## SECTION 3 : SPÉCIFICATION TECHNIQUE & SÉCURITÉ

- **Protocole :** HTTPS / TLS 1.3
- **Endpoints :**
  1. `POST /collection/token/` (Token OAuth 2.0 Bearer)
  2. `POST /collection/v1_0/requesttopay` (Requête de paiement avec identifiant idempotent X-Reference-Id UUID v4)
  3. `GET /collection/v1_0/requesttopay/{referenceId}` (Contrôle certifié du statut SUCCESSFUL)
  4. `GET /collection/v1_0/account/balance` (Interrogation du solde marchand)
- **Sécurité des fonds :**
  - Aucune clé secrète n'est exposée sur le smartphone étudiant.
  - L'application ne stocke JAMAIS le code PIN de l'étudiant (validation 100% USSD *133# gérée par MTN).
  - Validation unitaire des tickets avec QR code cryptographique à usage unique.

---

## SECTION 4 : CONDITIONS GÉNÉRALES & CONFIDENTIALITÉ

- Tarif unitaire officiel : 200 FCFA par repas.
- Traitement sécurisé certifié par MTN Mobile Money.
- Conformité aux dispositions de l'ARTCI relatives à la protection des données personnelles.
