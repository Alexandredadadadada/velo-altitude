# Guide de Maintenance pour Velo-Altitude

Ce document décrit les procédures de maintenance régulières pour l'application Velo-Altitude après son déploiement en production.

## Table des matières

1. [Tâches de maintenance régulières](#tâches-de-maintenance-régulières)
2. [Surveillance des performances](#surveillance-des-performances)
3. [Gestion des erreurs](#gestion-des-erreurs)
4. [Mises à jour des dépendances](#mises-à-jour-des-dépendances)
5. [Sauvegarde et récupération](#sauvegarde-et-récupération)
6. [Procédures de déploiement](#procédures-de-déploiement)
7. [Correctifs Lint & Nettoyage Code (15/04/2025)](#correctifs-lint--nettoyage-code-15042025)
8. [Guide de Maintenance – Sprint Excellence 2025](#guide-de-maintenance-–-sprint-excellence-2025)

## Tâches de maintenance régulières

### Quotidiennes
- Vérifier les journaux d'erreurs sur Netlify
- Surveiller les métriques de performance
- Vérifier les alertes de sécurité

### Hebdomadaires
- Analyser les métriques d'utilisation
- Vérifier les temps de réponse des API
- Examiner les rapports de crash

### Mensuelles
- Mettre à jour les dépendances non critiques
- Effectuer des tests de charge
- Réviser et optimiser les requêtes API les plus utilisées
- Vérifier les vulnérabilités avec `npm audit`

### Trimestrielles
- Mettre à jour les dépendances majeures
- Effectuer un audit de sécurité complet
- Réviser la stratégie de mise en cache
- Optimiser les performances globales

## Surveillance des performances

### Outils de surveillance
- **Netlify Analytics** : Pour le suivi du trafic et des performances de base
- **Google Analytics** : Pour l'analyse détaillée du comportement utilisateur
- **Sentry** : Pour le suivi des erreurs front-end

### Métriques clés à surveiller
- Temps de chargement initial (FCP - First Contentful Paint)
- Temps d'interaction (TTI - Time to Interactive)
- Taux de rebond
- Taux d'erreur API
- Utilisation de la mémoire

### Tableau de bord
Un tableau de bord de surveillance est disponible à l'adresse suivante : [URL du tableau de bord]

## Gestion des erreurs

### Procédure de gestion des erreurs
1. **Identification** : Utiliser Sentry pour identifier les erreurs
2. **Priorisation** : Classer les erreurs par impact et fréquence
3. **Résolution** : Corriger dans l'environnement de développement
4. **Test** : Valider dans l'environnement de staging
5. **Déploiement** : Déployer en production

### Erreurs courantes et solutions
- **Erreurs d'authentification** : Vérifier la configuration Auth0 et les tokens
- **Erreurs API** : Vérifier les endpoints et les paramètres
- **Erreurs de rendu** : Vérifier les props et l'état des composants

## Mises à jour des dépendances

### Procédure de mise à jour
1. Exécuter `npm outdated` pour identifier les packages obsolètes
2. Mettre à jour les packages non critiques avec `npm update`
3. Pour les mises à jour majeures, créer une branche de test
4. Exécuter les tests unitaires et d'intégration
5. Déployer sur l'environnement de staging pour tests
6. Fusionner et déployer en production

### Dépendances critiques
Les dépendances suivantes sont critiques et nécessitent une attention particulière lors des mises à jour :
- React et React DOM
- React Router
- Auth0
- Axios
- React Query

## Sauvegarde et récupération

### Stratégie de sauvegarde
- **Code source** : Sauvegarde Git complète hebdomadaire
- **Base de données** : Sauvegarde quotidienne automatisée
- **Contenu utilisateur** : Sauvegarde quotidienne

### Procédure de récupération
1. Identifier la dernière sauvegarde stable
2. Restaurer le code source depuis Git
3. Restaurer la base de données depuis la sauvegarde
4. Vérifier l'intégrité des données
5. Effectuer des tests de fonctionnalité
6. Redéployer l'application

## Procédures de déploiement

### Déploiement standard
1. Fusionner les changements dans la branche `main`
2. Exécuter `npm run build:production`
3. Vérifier le build localement
4. Déployer sur Netlify avec `netlify deploy --prod`

### Déploiement d'urgence (hotfix)
1. Créer une branche `hotfix` à partir de `main`
2. Implémenter et tester la correction
3. Exécuter `npm run build:production`
4. Déployer sur Netlify avec `netlify deploy --prod`
5. Fusionner le hotfix dans `main` et `develop`

### Rollback
En cas de problème après déploiement :
1. Accéder au tableau de bord Netlify
2. Trouver le dernier déploiement stable
3. Cliquer sur "Publish deploy" pour ce déploiement

## Correctifs Lint & Nettoyage Code (15/04/2025)

### Actions réalisées
- Suppression des imports/variables inutiles dans l'ensemble du codebase.
- Correction des hooks React et clarification des dépendances.
- Suppression du code unreachable et simplification des fonctions inutiles.
- Refactoring des opérateurs logiques complexes pour plus de clarté.
- Correction des fonctions utilisées avant définition.

### Points de vigilance pour la maintenance
- Vérifier à chaque mise à jour de dépendance l'impact sur les hooks et la structure des composants.
- Relancer un lint complet (`npm run lint`) après chaque refonte majeure.
- Surveiller les warnings liés aux hooks et à l'utilisation des opérateurs logiques dans les nouveaux composants.

### Recommandations pour la reprise
- Consulter PROJECT_STATUS.md pour la liste exhaustive des corrections et des points restants.
- Poursuivre la suppression des warnings restants (voir section "Prochaines étapes" dans les autres fichiers MD).
- Maintenir la documentation technique à jour après chaque refactor ou correction majeure.

## Guide de Maintenance – Sprint Excellence 2025

### Nouvelles procédures

- Scripts d’import batch pour les données cols, trainings, recettes
- Validation automatisée de la complétude data (images, météo, etc.)
- Surveillance des erreurs API et alertes Slack intégrées
- Maintenance des endpoints OpenAPI (versionnage, dépréciation)
- Ajout de tests de non-régression sur les imports massifs

### Outils

- Dashboard admin pour monitoring temps réel
- Scripts Node.js pour migration/validation
- Documentation des scripts dans /scripts

### Bonnes pratiques

- Toujours tester l’import sur environnement staging
- Documenter toute modification de schéma data
- Utiliser les scripts de validation avant chaque déploiement

---

Contact lead dev pour toute anomalie critique ou suggestion d’amélioration continue.

## Note du 16 avril 2025

- Attention à ne jamais committer de fichiers volumineux (>100Mo) ou de caches (node_modules, .webpack-cache)
- Procédure de nettoyage de l’historique git ajoutée pour supprimer les gros fichiers bloquants
- Mise à jour du .gitignore pour éviter les problèmes futurs

Ce guide est un document vivant qui doit être mis à jour régulièrement pour refléter les changements dans l'application et les meilleures pratiques.
