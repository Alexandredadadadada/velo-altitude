# Migration des composants d'entraînement

## Contexte
Actuellement, il existe une duplication des composants d'entraînement entre:
- `src/components/training/workout/` (ancienne version, mélange de JS et TS)
- `client/src/components/training/workout/` (nouvelle version standardisée en TypeScript)

## Plan de migration
1. Confirmer que tous les composants dans `client/src/components/training/workout/` sont fonctionnels et à jour
2. Vérifier les imports dans toute l'application qui pourraient encore référencer les anciens composants
3. Mettre à jour les imports pour qu'ils pointent vers les nouveaux composants via le fichier `index.ts`
4. Supprimer les anciens fichiers de `src/components/training/workout/` une fois que tout est confirmé

## Correctifs Lint & Nettoyage Code (15/04/2025)

- Suppression des imports/variables inutiles dans l'ensemble du codebase.
- Correction des hooks React et clarification des dépendances.
- Suppression du code unreachable et simplification des fonctions inutiles.
- Refactoring des opérateurs logiques complexes pour plus de clarté.
- Correction des fonctions utilisées avant définition.

**Points de vigilance** :
- Vérifier l'impact des migrations sur la cohérence des hooks et des dépendances React.
- Relancer un lint complet après chaque migration majeure.
- Maintenir la documentation technique à jour après chaque refactor.

## Avantages
- Réduit la confusion et simplifie la maintenance
- Assure que seuls les composants standardisés sont utilisés
- Améliore la cohérence de l'architecture de l'application
- Facilite l'ajout des tests unitaires et de la documentation

# MIGRATION – Sprint Excellence 2025

<!-- Lint/Markdown Excellence: Blank lines, single H1, lists fixed (Sprint Excellence 2025) -->

## Nouvelles migrations de données

- Import massif de nouveaux profils de cols (JSON enrichi)
- Migration des programmes d’entraînement legacy vers structure hiérarchique
- Ajout de recettes cyclistes et plans nutritionnels (nouveau schéma)
- Migration des images vers /public/images/cols et /public/images/summits
- Intégration des historiques météo et temps de référence courses pro

## Procédures automatisées

- Scripts Node.js pour migration batch (voir /scripts)
- Tests de validation automatique post-migration
- Reporting détaillé dans PROGRESS_REPORT_S1.md

## Bonnes pratiques

- Effectuer toute migration sur environnement staging
- Sauvegarder les données avant toute opération
- Documenter chaque migration dans ce fichier avec date, auteur, impact

## Automatisation 2025

- Import batch automatisé pour trainings et recettes (Node.js)
- Scripts de validation pour garantir la cohérence
- Prochaines migrations : enrichissement massif des cols, automatisation API

---

Pour toute migration majeure, informer l’équipe lead et mettre à jour la documentation associée.
