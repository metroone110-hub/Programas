# FICHE PRATIQUE : RÉPONSES À COPIER-COLLER DANS LE FORMULAIRE GO LIVE MTN MOMO

Utilisez cette fiche pour remplir directement les champs demandés sur le portail https://momodeveloper.mtn.com lors de votre demande de « Go Live ».

---

### 1. Business / Company Information (Informations sur l'Entreprise)

| Champ demandé par MTN | Que copier / coller |
|---|---|
| **Business / Entity Name** (Nom de l'entité) | `CROU-K Resto U (Centre Régional des Œuvres Universitaires de Korhogo)` |
| **Trading Name / App Name** (Nom de la solution) | `CROU Menu - Resto U` |
| **Country of Operation** (Pays d'opération) | `Côte d'Ivoire (CI)` |
| **City / Address** (Ville et adresse) | `Korhogo, Université Peleforo Gon Coulibaly, B.P. 1328 Korhogo` |
| **Contact Person Name** (Nom du contact) | *Votre Nom & Prénom (ex: Responsable Projet Resto U)* |
| **Contact Email** (Email du compte développeur) | `metroone110@gmail.com` |
| **Contact Phone Number** (Numéro de téléphone) | *Votre numéro de téléphone professionnel / personnel en Côte d'Ivoire* |
| **Website / Application URL** (URL de l'application) | `https://ais-pre-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app` |

---

### 2. Business Description (Description de l'activité)
*À copier dans la boîte de texte « Business Description » :*

**Version Française :**
> Plateforme numérique officielle de billetterie et de restauration pour les étudiants de l'Université Peleforo Gon Coulibaly, gérée en partenariat avec le Centre Régional des Œuvres Universitaires de Korhogo (CROU-K). L'application permet à plus de 12 000 étudiants de consulter le menu quotidien de la cantine universitaire et d'acheter leurs tickets de repas dématérialisés au tarif subventionné officiel de 200 FCFA via MTN Mobile Money. Les tickets sous forme de QR Code unique sont ensuite scannés et validés aux tourniquets et guichets du restaurant universitaire.

**English Version (si le formulaire MTN est en anglais) :**
> Official digital ticketing and catering platform for university students at Peleforo Gon Coulibaly University, managed in partnership with CROU-K (Regional Center for University Welfare of Korhogo). The application allows over 12,000 enrolled students to view the daily university restaurant menu and purchase secure electronic meal tickets at the subsidized price of 200 XOF using MTN Mobile Money. Tickets featuring unique encrypted QR codes are then scanned and validated at canteen entrance counters.

---

### 3. Financial Forecast & Volumes (Volumes & Prévisions)

| Champ demandé | Valeur à renseigner |
|---|---|
| **Product Requested** (Produit sollicité) | `Collection API` |
| **Currency** (Devise) | `XOF` (Franc CFA) |
| **Average Transaction Amount** (Panier moyen) | `200 XOF` (ou `1000 XOF` pour les carnets de 5 tickets) |
| **Expected Monthly Transactions** (Volume mensuel) | `45,000 transactions` |
| **Expected Monthly Turnover** (Chiffre d'affaires mensuel) | `9,000,000 XOF` |
| **Target Audience / Customer Base** | `University students and campus staff` |

---

### 4. Technical Integration Details (Détails Techniques)

| Champ technique demandé | Valeur à renseigner |
|---|---|
| **Integration Protocol** | `REST API (JSON / HTTPS) - MTN OpenAPI v1.0` |
| **Security Protocol** | `TLS 1.3 / OAuth 2.0 Bearer Token` |
| **Callback / Webhook URL** | `https://ais-pre-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app/api/tickets/momo-callback` |
| **Production Target Environment** | `mtnci` (MTN Côte d'Ivoire) |
| **IP Whitelisting (si demandé)** | `Cloud Run Dynamic Egress / Server HTTPS` *(à laisser vide si facultatif)* |

---

### 5. Pièces Jointes / Documents à Téléverser (Uploads)

1. **Document "Business Description / System Architecture" :**  
   Téléchargez et envoyez le fichier généré `1_BUSINESS_DESCRIPTION.md` ou exportez en PDF.
2. **Document "Technical Architecture / Security" :**  
   Téléchargez et envoyez le fichier généré `2_TECHNICAL_ARCHITECTURE.md` ou exportez en PDF.
3. **Document "Official Letter of Intent / Application" :**  
   Imprimez ou exportez `3_LETTRE_OFFICIELLE_DEMANDE_PROD.md` avec votre nom et signez-le.
4. **Pièce d'Identité (CNI / Passeport / Attestation) :**  
   Fournissez une photo recto-verso de votre carte d'identité ivoirienne ou passeport en cours de validité.
5. **Justificatif d'entité / Domiciliation :**  
   Copie de l'attestation ou document d'identification du CROU-K / Université ou document d'enregistrement d'entreprise/prestataire agréé.
