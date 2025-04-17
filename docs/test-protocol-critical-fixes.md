# Protocole de test pour les correctifs critiques

## Objectif
Valider l'efficacité et la robustesse des correctifs critiques implémentés avant le lancement de Velo-Altitude.

## Composants à tester

### 1. Auth0 Configuration et Authentification

#### Tests fonctionnels
| Test ID | Description | Étapes | Résultat attendu | Priorité |
|---------|-------------|--------|-----------------|----------|
| AUTH-01 | Connexion standard | 1. Accéder à la page d'accueil<br>2. Cliquer sur Connexion<br>3. Saisir identifiants valides | Connexion réussie et redirection correcte | CRITIQUE |
| AUTH-02 | Rafraîchissement de token | 1. Se connecter<br>2. Attendre l'expiration du token ou la forcer<br>3. Effectuer une action nécessitant l'authentification | Rafraîchissement silencieux du token et succès de l'action | CRITIQUE |
| AUTH-03 | Échec de rafraîchissement | 1. Se connecter<br>2. Simuler un échec de rafraîchissement<br>3. Observer la gestion d'erreur | Retry automatique (jusqu'à 3 fois) puis message d'erreur approprié | HAUTE |
| AUTH-04 | Déconnexion | 1. Se connecter<br>2. Cliquer sur Déconnexion<br>3. Vérifier l'état d'authentification | Déconnexion réussie et redirection vers la page d'accueil | HAUTE |

#### Tests de limite
| Test ID | Description | Étapes | Résultat attendu | Priorité |
|---------|-------------|--------|-----------------|----------|
| AUTH-05 | Connexions multiples | 1. Ouvrir plusieurs onglets/fenêtres<br>2. Se connecter sur chacun d'eux | Gestion cohérente de l'état d'authentification entre les onglets | MOYENNE |
| AUTH-06 | Coupure réseau | 1. Se connecter<br>2. Couper la connexion internet<br>3. Attendre le timeout<br>4. Rétablir la connexion | Message d'erreur approprié et rétablissement automatique | HAUTE |

### 2. Défis "Les 7 Majeurs"

#### Tests fonctionnels
| Test ID | Description | Étapes | Résultat attendu | Priorité |
|---------|-------------|--------|-----------------|----------|
| CHALL-01 | Création de défi valide | 1. Accéder à l'interface de création<br>2. Sélectionner 7 cols<br>3. Remplir les informations<br>4. Soumettre | Défi créé avec succès et visible dans la liste | CRITIQUE |
| CHALL-02 | Validation de données | 1. Tenter de créer un défi avec moins de 7 cols<br>2. Tenter de créer un défi avec des cols dupliqués | Messages d'erreur appropriés empêchant la soumission | HAUTE |
| CHALL-03 | Persistance des données | 1. Créer un défi<br>2. Se déconnecter<br>3. Se reconnecter<br>4. Vérifier le défi | Défi correctement persisté avec toutes ses données | CRITIQUE |

#### Tests de modification
| Test ID | Description | Étapes | Résultat attendu | Priorité |
|---------|-------------|--------|-----------------|----------|
| CHALL-04 | Modification de défi | 1. Sélectionner un défi existant<br>2. Modifier le nom et la description<br>3. Soumettre | Modifications sauvegardées avec succès | MOYENNE |
| CHALL-05 | Suivi de progression | 1. Sélectionner un défi<br>2. Simuler l'achèvement d'un col<br>3. Vérifier la progression | Progression mise à jour correctement | HAUTE |

### 3. Strava API et synchronisation

#### Tests fonctionnels
| Test ID | Description | Étapes | Résultat attendu | Priorité |
|---------|-------------|--------|-----------------|----------|
| STRAVA-01 | Authentification Strava | 1. Accéder à l'interface de connexion Strava<br>2. Autoriser l'application<br>3. Observer la redirection | Connexion réussie et stockage des tokens | CRITIQUE |
| STRAVA-02 | Rafraîchissement token Strava | 1. Se connecter à Strava<br>2. Simuler l'expiration du token<br>3. Effectuer une action nécessitant l'API Strava | Rafraîchissement automatique et action réussie | CRITIQUE |
| STRAVA-03 | Synchronisation d'activités | 1. Se connecter à Strava<br>2. Lancer une synchronisation d'activités<br>3. Vérifier les activités importées | Activités correctement importées avec métadonnées | HAUTE |

#### Tests d'erreur
| Test ID | Description | Étapes | Résultat attendu | Priorité |
|---------|-------------|--------|-----------------|----------|
| STRAVA-04 | Échec d'authentification | 1. Annuler l'autorisation Strava<br>2. Observer la gestion d'erreur | Message d'erreur approprié et possibilité de réessayer | HAUTE |
| STRAVA-05 | Limite d'API atteinte | 1. Simuler l'atteinte de la limite d'API Strava<br>2. Observer la gestion d'erreur | Signalement approprié et mise en file d'attente | MOYENNE |

### 4. Optimisation mobile et visualisation 3D

#### Tests de performance
| Test ID | Description | Étapes | Résultat attendu | Priorité |
|---------|-------------|--------|-----------------|----------|
| 3D-01 | Détection automatique des capacités | 1. Charger la visualisation sur différents appareils<br>2. Observer la détection des capacités | Détection correcte des capacités GPU/CPU | HAUTE |
| 3D-02 | Ajustement automatique de la qualité | 1. Charger la visualisation 3D<br>2. Observer les paramètres de qualité initiaux<br>3. Mesurer les FPS | Qualité adaptée automatiquement aux capacités de l'appareil | CRITIQUE |
| 3D-03 | Adaptation aux écrans mobiles | 1. Charger la visualisation sur mobile<br>2. Tester les interactions tactiles<br>3. Vérifier l'affichage | Interface adaptée à l'écran et interactions tactiles fonctionnelles | CRITIQUE |

#### Tests de limite
| Test ID | Description | Étapes | Résultat attendu | Priorité |
|---------|-------------|--------|-----------------|----------|
| 3D-04 | Charge mémoire | 1. Charger plusieurs cols en 3D<br>2. Surveiller l'utilisation mémoire<br>3. Changer de col plusieurs fois | Utilisation mémoire stable sans fuites | HAUTE |
| 3D-05 | Performance sous charge | 1. Charger un terrain complexe<br>2. Activer les effets météo<br>3. Mesurer les FPS | Dégradation gracieuse et maintien d'un FPS acceptable | HAUTE |

### 5. Service météo et limitation de taux

#### Tests fonctionnels
| Test ID | Description | Étapes | Résultat attendu | Priorité |
|---------|-------------|--------|-----------------|----------|
| WEATHER-01 | Récupération des données météo | 1. Sélectionner un col<br>2. Charger les données météo<br>3. Vérifier l'affichage | Données météo correctement affichées | HAUTE |
| WEATHER-02 | Mise en cache | 1. Charger les données météo pour un col<br>2. Recharger les mêmes données<br>3. Observer les requêtes réseau | Seconde requête servie depuis le cache | HAUTE |

#### Tests de limite
| Test ID | Description | Étapes | Résultat attendu | Priorité |
|---------|-------------|--------|-----------------|----------|
| WEATHER-03 | Limite de taux atteinte | 1. Effectuer de nombreuses requêtes météo<br>2. Atteindre la limite de taux<br>3. Observer le comportement | Utilisation des données en cache ou de repli | CRITIQUE |
| WEATHER-04 | Données de repli | 1. Simuler une erreur API<br>2. Observer les données affichées | Affichage des données de repli avec indication "estimé" | HAUTE |
| WEATHER-05 | Reprise après limite | 1. Atteindre la limite de taux<br>2. Attendre la fin de la période<br>3. Effectuer une nouvelle requête | Reprise normale du service après la période de limitation | MOYENNE |

## Environnements de test
- Production (minimal, uniquement les tests critiques)
- Pré-production (tous les tests)
- Développement (tests exploratoires)

## Appareils de test
- Desktop: Chrome, Firefox, Safari, Edge
- Mobile:
  - iOS: iPhone SE (petit écran), iPhone 12 (moyen), iPad (grand)
  - Android: Pixel 4a (petit écran), Samsung S21 (moyen), Samsung Tab (grand)

## Critères de réussite
- Tous les tests CRITIQUES doivent passer à 100%
- Les tests HAUTE priorité doivent passer à 95% minimum
- Les tests MOYENNE priorité doivent passer à 90% minimum
- Performance mobile: FPS > 30 sur tous les appareils
- Temps de chargement 3D < 3s sur appareils milieu de gamme
- Taux d'erreur API < 0.1%

## Procédure de rapport
1. Exécuter les tests selon le protocole
2. Documenter les résultats avec captures d'écran si nécessaire
3. Pour chaque échec, documenter:
   - Environnement et appareil
   - Étapes précises pour reproduire
   - Comportement observé vs attendu
   - Gravité et impact utilisateur
4. Prioriser les correctifs selon l'impact et la criticité

## Outils de test recommandés
- Surveillance performance: Lighthouse, WebPageTest
- Tests automatisés: Jest, Cypress
- Monitoring en temps réel: Sentry, LogRocket

## Calendrier de test
- J-2: Tests complets en environnement de développement
- J-1: Tests critiques en pré-production
- J0 (jour du lancement): Tests critiques en production
- J+1: Tests complets en production
