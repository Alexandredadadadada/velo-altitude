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

## Avantages
- Réduit la confusion et simplifie la maintenance
- Assure que seuls les composants standardisés sont utilisés
- Améliore la cohérence de l'architecture de l'application
- Facilite l'ajout des tests unitaires et de la documentation
