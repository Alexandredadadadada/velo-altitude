# Guide de Test du Module Explorateur de Cols

Ce document présente les protocoles de test pour valider le bon fonctionnement du module Explorateur de Cols après les optimisations et corrections effectuées.

## Prérequis pour les tests

- Application construite à partir de la dernière version du code
- Navigateur web moderne (Chrome, Firefox, Edge ou Safari)
- Connexion Internet active pour les fonctionnalités de météo et de carte

## Scénarios de test

### 1. Chargement initial et performance

| Test | Description | Résultat attendu | Validé |
|------|-------------|------------------|--------|
| Chargement paresseux | Vérifier que les composants lourds (carte, graphiques) se chargent uniquement quand nécessaire | Les composants s'affichent progressivement au défilement de la page | ⬜ |
| Temps de chargement | Mesurer le temps de chargement initial de la page | < 3 secondes sur une connexion standard | ⬜ |
| Placeholders | Vérifier que les placeholders s'affichent pendant le chargement | Les éléments de UI affichent un état de chargement | ⬜ |
| Charge CPU | Surveiller l'utilisation CPU pendant la navigation | Pas de pics d'utilisation CPU > 80% | ⬜ |

### 2. Fonctionnalités principales

| Test | Description | Résultat attendu | Validé |
|------|-------------|------------------|--------|
| Liste des cols | Charger la liste des cols disponibles | Liste affichée correctement avec images | ⬜ |
| Filtrage | Tester les filtres par difficulté, région, etc. | Liste filtrée correctement | ⬜ |
| Détail d'un col | Cliquer sur un col pour voir ses détails | Page de détail chargée avec toutes les informations | ⬜ |
| Graphique d'élévation | Vérifier le rendu du graphique d'élévation | Graphique affiché correctement | ⬜ |
| Graphique de gradient | Vérifier le rendu du graphique de gradient | Graphique affiché correctement | ⬜ |
| Interactions graphique | Tester le zoom et l'export du graphique | Zoom et export fonctionnent | ⬜ |
| Carte | Vérifier le fonctionnement de la carte interactive | Carte affichée avec marqueurs | ⬜ |
| Météo | Vérifier l'affichage des données météo | Données météo affichées ou placeholder si indisponible | ⬜ |

### 3. Système de cache météo

| Test | Description | Résultat attendu | Validé |
|------|-------------|------------------|--------|
| Premier chargement | Charger les données météo d'un col pour la première fois | Appel API effectué, données affichées | ⬜ |
| Rechargement immédiat | Recharger la page du même col dans les 30 minutes | Données chargées depuis le cache, pas d'appel API | ⬜ |
| Expiration du cache | Attendre plus de 30 minutes et recharger la page | Nouvel appel API effectué | ⬜ |
| Persistance | Fermer et réouvrir le navigateur puis charger un col déjà visité | Cache conservé si dans la limite de temps | ⬜ |
| Affichage hors-ligne | Désactiver la connexion Internet et charger un col déjà en cache | Données du cache affichées avec indicateur "hors-ligne" | ⬜ |

### 4. Responsive design

| Test | Description | Résultat attendu | Validé |
|------|-------------|------------------|--------|
| Desktop | Tester sur écran large (>1200px) | Mise en page optimale sur grand écran | ⬜ |
| Tablette | Tester sur tablette (768-1024px) | Adaptation correcte des composants | ⬜ |
| Mobile | Tester sur mobile (<768px) | Interface utilisable sur petit écran | ⬜ |
| Orientation | Changer l'orientation portrait/paysage | Adaptation correcte à l'orientation | ⬜ |

### 5. Gestion d'erreurs

| Test | Description | Résultat attendu | Validé |
|------|-------------|------------------|--------|
| API météo indisponible | Simuler une erreur de l'API météo | Message d'erreur approprié, données de secours affichées | ⬜ |
| Images manquantes | Tester avec des images manquantes | Placeholders affichés correctement | ⬜ |
| Données incomplètes | Tester avec un col ayant des données incomplètes | Interface affiche correctement les données disponibles et gère les manquantes | ⬜ |
| Perte de connexion | Désactiver la connexion Internet pendant l'utilisation | Message d'erreur approprié, fonctionnalités offline disponibles | ⬜ |

## Procédure de test détaillée

### Test du chargement paresseux

1. Ouvrir l'application et naviguer vers le module Explorateur de Cols
2. Ouvrir les outils de développement du navigateur (F12)
3. Aller dans l'onglet "Network" et activer la limitation de bande passante (3G)
4. Cliquer sur un col pour afficher sa page de détail
5. Observer que:
   - Les éléments essentiels (titre, description) s'affichent d'abord
   - La carte et les graphiques se chargent progressivement
   - Des indicateurs de chargement sont visibles pendant le chargement

### Test du système de cache météo

1. Vider le cache du navigateur
2. Ouvrir la page d'un col spécifique et noter le temps de chargement des données météo
3. Ouvrir les outils de développement et surveiller les requêtes réseau
4. Rafraîchir la page et vérifier qu'aucun nouvel appel API météo n'est effectué
5. Vérifier dans l'application Storage que les données sont stockées dans le localStorage
6. Attendre que le cache expire (ou modifier manuellement la date d'expiration)
7. Rafraîchir la page et vérifier qu'un nouvel appel API est effectué

### Test des graphiques

1. Ouvrir la page de détail d'un col
2. Vérifier que les graphiques d'élévation et de gradient s'affichent correctement
3. Tester les interactions:
   - Utiliser la molette de la souris pour zoomer
   - Cliquer et faire glisser pour déplacer le graphique
   - Cliquer sur le bouton "Réinitialiser le zoom"
   - Cliquer sur le bouton "Exporter" et vérifier que l'image est téléchargée

## Problèmes connus

| Problème | Impact | Workaround | Priorité |
|----------|--------|------------|----------|
| Délai d'affichage des graphiques sur mobiles lents | Expérience utilisateur dégradée sur appareils anciens | Optimiser davantage le lazy loading | Moyenne |
| Flickering lors du redimensionnement des graphiques | Visuel uniquement | Aucun | Basse |
| Cache météo parfois non persistant sur Safari | Données rechargées à chaque visite sur Safari | Utiliser sessionStorage pour Safari | Haute |

## Résultats des tests

Après avoir exécuté tous les tests mentionnés ci-dessus, remplir le tableau suivant:

| Date | Testeur | Version | % tests réussis | Problèmes critiques | Remarques |
|------|---------|---------|----------------|---------------------|-----------|
| 04/04/2025 | | V1.0.0 | | | |

## Prochaines étapes

- Automatiser ces tests avec un outil comme Cypress ou Playwright
- Ajouter des tests de performance avec Lighthouse
- Créer des tests unitaires pour les fonctions critiques (cache météo, formatage des données)

## Contact pour les questions

Pour toute question concernant ces tests, contacter l'équipe de développement à dev@grand-est-cyclisme.fr
