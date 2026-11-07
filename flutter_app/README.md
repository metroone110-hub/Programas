# 📱 Programas — Application Mobile Flutter (Dart)

Application mobile officielle de billetterie et de restauration étudiante du **CROU de Korhogo** (Université Peleforo Gbon Coulibaly - UPGC, Côte d'Ivoire).

---

## 🏛️ Architecture & Conception Professionnelle

* **Design System Institutionnel & Épuré** :
  * Palette officielle : Orange Ambre (`#EA580C`), Bleu Nuit Ardoise (`#0F172A`), Blanc pur et gris feutré.
  * Typographie institutionnelle : **Plus Jakarta Sans** via `google_fonts`.
  * Zéro stickers, zéro ton artificiel, aucun logo robotique. Interface hautement réaliste, inspirée des applications bancaires et Wave Côte d'Ivoire.
* **Sécurité & Protection Fraude Anti-Usurpation** :
  * Authentification par **Matricule étudiant UPGC**.
  * **Verrouillage PIN 4 chiffres** : dès 5 tentatives infructueuses, le compte est verrouillé de façon persistante (`isBlocked = true`) et requiert un déblocage physique au guichet du CROU.
  * **Suppression de la réinitialisation en ligne** du mot de passe pour prévenir toute faille de sécurité.
* **Tickets Repas & Passage Tourniquets** :
  * Tarif subventionné par l'État : **200 FCFA le repas complet**.
  * Émission de QR Codes sécurisés avec numéro de série officiel (`CROUK-2026-XXXXXX`).
  * Module d'administration pour la validation instantanée au tourniquet et la gestion des comptes.
* **Guichet d'Assistance Humain** :
  * Échange direct avec **M. Kouassi** (agent d'accueil du CROU Korhogo) pour l'accompagnement étudiant.

---

## 🚀 Lancement du projet Flutter

```bash
cd flutter_app
flutter pub get
flutter run
```

### Dépendances principales :
* `qr_flutter` : Rendu haute définition des QR Codes de tickets
* `google_fonts` : Typographie professionnelle Plus Jakarta Sans
* `shared_preferences` : Persistance locale et sécurisée des sessions et clés
* `intl` : Formatage monétaire et horodatage des passages
