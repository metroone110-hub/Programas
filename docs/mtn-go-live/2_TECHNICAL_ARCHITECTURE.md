# DOSSIER TECHNIQUE & ARCHITECTURE SYSTÈME : INTÉGRATION API MTN MOMO
## APPLICATION : CROU MENU - RESTO U (UNIVERSITÉ PELEFORO GON COULIBALY - CROU-K)
### SPÉCIFICATIONS TECHNIQUES CONFORMES À LA NORME OPENAPI COLLECTION (COLLECTION.YAML)

---

### 1. Vue d'Ensemble de l'Architecture Technique

L'architecture est conçue suivant les principes de haute disponibilité, de sécurité financière et de séparation stricte entre le client public et les secrets d'API :

- **Frontend Client :** Single Page Application moderne React 19 + TypeScript, optimisée mobile (PWA responsive).
- **Backend Serveur d'Application :** Serveur Node.js / Express sécurisé (reverse-proxy), responsable de l'authentification et des appels API vers les passerelles MTN.
- **Passerelle de Paiement :** Client officiel MTN MoMo Collection conforme aux spécifications OpenAPI Swagger de MTN Group.

```
[ Smartphone Étudiant ] 
        | (HTTPS / TLS 1.3)
        v
[ Serveur Backend CROU ] ---> (OAuth 2.0 / Basic Auth) ---> [ MTN MoMo Gateway ]
        |                                                            |
        |                                                  (Push USSD / Validation)
        v                                                            v
[ Base de Billetterie Sécurisée ]                             [ Mobile Étudiant ]
```

---

### 2. Endpoints API MTN MoMo Intégrés

L'application utilise rigoureusement les endpoints prévus dans le contrat d'interface OpenAPI MTN MoMo Collection :

#### A. Authentification & Token OAuth 2.0
- **Endpoint :** `POST /collection/token/`
- **Headers :**
  - `Ocp-Apim-Subscription-Key`: Clé primaire / secondaire de souscription
  - `Authorization`: `Basic {Base64(API_USER:API_KEY)}`
- **Fréquence :** Génération de jeton Bearer dynamique avec mise en cache selon le délai d'expiration `expires_in` (3600 secondes).

#### B. Demande de Débit (RequestToPay)
- **Endpoint :** `POST /collection/v1_0/requesttopay`
- **Headers :**
  - `Authorization`: `Bearer {access_token}`
  - `X-Reference-Id`: Identifiant unique UUID v4 de la transaction (évite les doublons)
  - `X-Target-Environment`: `mtnci` (Live) / `sandbox` (Test)
  - `Ocp-Apim-Subscription-Key`: Clé de souscription
  - `Content-Type`: `application/json`
- **Body JSON :**
  ```json
  {
    "amount": "200.00",
    "currency": "XOF",
    "externalId": "TICKET-CROU-948102",
    "payer": {
      "partyIdType": "MSISDN",
      "partyId": "0501020304"
    },
    "payerMessage": "Achat Ticket Resto U CROU-K",
    "payeeNote": "Restaurant Universitaire Korhogo"
  }
  ```

#### C. Contrôle du Statut de Transaction
- **Endpoint :** `GET /collection/v1_0/requesttopay/{referenceId}`
- **Fonctionnement :** Vérification du statut de paiement (`SUCCESSFUL`, `PENDING`, `FAILED`). La billetterie n'émet de tickets QUE lorsque le statut certifié par MTN passe à `SUCCESSFUL`.

#### D. Consultation du Solde Marchand
- **Endpoint :** `GET /collection/v1_0/account/balance`
- **Usage :** Rapprochement comptable par l'administration du CROU-K pour s'assurer de la bonne réception des fonds.

---

### 3. Mesures de Sécurité & Confidentialité Financière

1. **Isolation totale des Clés Secrètes :**
   - Aucune clé secrète, aucun token Bearer et aucun mot de passe API n'est exposé au navigateur ou sur le smartphone de l'étudiant.
   - Tous les appels vers l'infrastructure MTN transitent exclusivement par le serveur d'application sécurisé.

2. **Chiffrement de Bout en Bout :**
   - Tous les échanges sont strictement chiffrés en **HTTPS / TLS 1.3**.
   - Hachage cryptographique et validation unitaire des tickets émis par QR Code pour empêcher la falsification ou le dédoublement de repas.

3. **Non-conservation des données sensibles (Zero PIN Storage) :**
   - L'application ne demande et n'enregistre **JAMAIS** le code PIN de l'étudiant. Le PIN est saisi par l'étudiant directement sur l'interface sécurisée de l'opérateur MTN (*133# SIM toolkit).

4. **Gestion de l'Idempotence :**
   - Chaque tentative de paiement est protégée par un `X-Reference-Id` (UUID v4) unique. En cas de coupure réseau ou de retry, un étudiant ne peut pas être débité deux fois pour le même ticket.

---

### 4. Fiche d'Environnement de Déploiement

- **Serveur de Production :** Google Cloud Run (Europe-West1 / Haute disponibilité)
- **Nom de Domaine / URL Web :** `https://ais-pre-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app`
- **URL de Callback / Notification Webhook :** `https://ais-pre-s7jmfetse63yx36zu3eo4z-327586051225.europe-west1.run.app/api/tickets/momo-callback`
- **Contact Technique Responsable :** Service Informatique CROU-K / Développeur Principal (`metroone110@gmail.com`)
