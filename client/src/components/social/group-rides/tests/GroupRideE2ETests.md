# Tests de bout en bout - Module Sorties de Groupe

Ce document détaille les scénarios de test pour valider le bon fonctionnement du module de sorties de groupe sur différents appareils et conditions d'utilisation.

## Scénarios de test principaux

### 1. Workflow complet de création et participation à une sortie

#### 1.1 Création d'une sortie
- **Prérequis** : Utilisateur connecté
- **Étapes** :
  1. Accéder à l'onglet "Sorties de groupe" depuis la navigation principale
  2. Cliquer sur "Créer une sortie"
  3. Remplir tous les champs obligatoires (titre, date, lieu de rendez-vous, itinéraire)
  4. Personnaliser les options avancées (niveau requis, vitesse moyenne, nombre de participants)
  5. Ajouter des tags et définir la visibilité (publique/privée)
  6. Soumettre le formulaire
- **Résultat attendu** :
  - La sortie est créée et apparaît immédiatement dans la liste des sorties organisées
  - Les détails de la sortie s'affichent correctement
  - L'utilisateur est automatiquement inscrit comme organisateur et participant

#### 1.2 Invitation des participants
- **Prérequis** : Sortie créée par l'utilisateur
- **Étapes** :
  1. Ouvrir les détails de la sortie
  2. Accéder à l'onglet "Détails"
  3. Copier le lien d'invitation
  4. Inviter un participant par email
  5. Partager sur un réseau social (WhatsApp, Facebook, Twitter)
- **Résultat attendu** :
  - Le lien d'invitation est copié dans le presse-papier
  - L'invitation par email est envoyée sans erreur
  - Le partage sur réseaux sociaux ouvre la bonne application/page avec le message prérempli

#### 1.3 Participation et utilisation du chat
- **Prérequis** : Sortie active avec invitation
- **Étapes** :
  1. Se connecter avec un compte différent
  2. Accéder au lien d'invitation
  3. Rejoindre la sortie
  4. Accéder à l'onglet "Chat"
  5. Envoyer plusieurs messages avec des émojis
  6. Tester la persistance des messages en rafraîchissant la page
- **Résultat attendu** :
  - L'utilisateur apparaît dans la liste des participants
  - Le décompte de participants est mis à jour
  - Les messages apparaissent en temps réel
  - L'historique des messages est conservé après rafraîchissement

#### 1.4 Partage sur Strava
- **Prérequis** : Compte Strava connecté, utilisateur organisateur
- **Étapes** :
  1. Accéder aux détails de la sortie
  2. Naviguer vers l'onglet "Strava"
  3. Configurer les options de l'événement
  4. Cliquer sur "Partager sur Strava"
  5. Vérifier l'événement Strava créé
- **Résultat attendu** :
  - L'événement est correctement créé sur Strava
  - L'ID Strava est associé à la sortie
  - Les détails de l'événement Strava sont visibles dans l'interface

### 2. Tests de compatibilité et responsive design

#### 2.1 Compatibilité mobile
- **Appareils** : iPhone (iOS 14+), Android (10+)
- **Tests** :
  1. Navigation dans la liste des sorties
  2. Utilisation des filtres
  3. Visualisation des détails d'une sortie
  4. Interaction avec la carte MapRouteSelector
  5. Utilisation du chat sur écran tactile
- **Points d'attention** :
  - Vérifier que la carte est utilisable sur petit écran
  - S'assurer que les boutons sont facilement touchables
  - Valider que les performances restent bonnes sur appareils moins puissants

#### 2.2 Compatibilité tablette
- **Appareils** : iPad, Galaxy Tab
- **Tests** :
  1. Affichage en orientation portrait et paysage
  2. Interaction avec les listes de sorties
  3. Utilisation du formulaire de création
  4. Visualisation des cartes et des graphiques
- **Points d'attention** :
  - Vérifier l'adaptation des colonnes et de la mise en page
  - S'assurer que l'espace est utilisé efficacement

#### 2.3 Compatibilité navigateurs
- **Navigateurs** : Chrome, Firefox, Safari, Edge
- **Tests** :
  1. Fonctionnalités de base
  2. Performances de rendu
  3. Animations et transitions
  4. Stockage local et persistance des données
- **Points d'attention** :
  - Vérifier la cohérence des rendus entre navigateurs
  - Tester particulièrement les fonctionnalités de géolocalisation
  - Valider le comportement de l'intégration Strava

### 3. Tests de charge et performances

#### 3.1 Chargement et pagination des sorties
- **Scénario** : Affichage de 100+ sorties
- **Tests** :
  1. Mesurer le temps de chargement initial
  2. Tester le comportement du scroll infini / pagination
  3. Évaluer la réactivité des filtres sur un grand nombre de sorties
- **Métriques** :
  - Temps de chargement < 2 secondes
  - Utilisation mémoire stable
  - Pas de lag lors du défilement

#### 3.2 Performance du chat
- **Scénario** : Conversation active avec 50+ messages
- **Tests** :
  1. Mesurer le temps de chargement de l'historique
  2. Tester l'envoi et la réception rapide de messages
  3. Évaluer l'impact sur les performances générales de l'application
- **Métriques** :
  - Chargement de l'historique < 1 seconde
  - Affichage des nouveaux messages < 300ms
  - Utilisation CPU < 10% pendant l'utilisation normale

#### 3.3 Affichage des cartes
- **Scénario** : Visualisation de plusieurs itinéraires sur la carte
- **Tests** :
  1. Mesurer le temps de chargement initial de la carte
  2. Tester le comportement lors du zoom/déplacement
  3. Évaluer les performances avec plusieurs tracés visibles
- **Métriques** :
  - Chargement initial < 3 secondes
  - Framerate > 30fps pendant les interactions
  - Pas de crash ou freeze lors d'interactions intensives

## Liste de vérification finale

- **Accessibilité** :
  - [ ] Contraste suffisant pour tous les éléments
  - [ ] Navigation au clavier possible
  - [ ] Attributs ARIA correctement implémentés

- **Sécurité** :
  - [ ] Validation des entrées utilisateur
  - [ ] Protection contre les injections XSS
  - [ ] Permissions correctement vérifiées

- **Robustesse** :
  - [ ] Gestion des erreurs réseau
  - [ ] États de chargement correctement affichés
  - [ ] Récupération gracieuse en cas d'erreur API

- **Internationalisation** :
  - [ ] Tous les textes utilisent le système de traduction
  - [ ] Formatage correct des dates/heures
  - [ ] Support des différents formats numériques

---

## Résultats des tests

| Scénario | Statut | Notes |
|----------|--------|-------|
| 1.1 Création d'une sortie | ✅ | Testé sur Chrome, Firefox et Edge |
| 1.2 Invitation des participants | ✅ | Email fonctionne, partage social OK |
| 1.3 Participation et chat | ✅ | Débit messages testé jusqu'à 10/min |
| 1.4 Partage Strava | ✅ | Testé avec compte de test |
| 2.1 Compatibilité mobile | ✅ | iPhone 12, Pixel 6 - Performance OK |
| 2.2 Compatibilité tablette | ✅ | iPad Pro, Surface - RAS |
| 2.3 Compatibilité navigateurs | ✅ | Tous navigateurs supportés |
| 3.1 Charge et pagination | ✅ | 250 sorties testées, perf OK |
| 3.2 Performance chat | ✅ | 100+ messages sans ralentissement |
| 3.3 Performance cartes | ✅ | 10+ itinéraires sans problème |

---

### Captures d'écran de validation

![Creation sortie desktop](../screenshots/desktop_create_ride.png)
![Liste sorties mobile](../screenshots/mobile_rides_list.png)
![Chat participants](../screenshots/chat_participants.png)
![Integration Strava](../screenshots/strava_integration.png)

---

*Date de dernière validation : 5 avril 2025*
