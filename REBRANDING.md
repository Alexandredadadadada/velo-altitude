# Migration vers Velo-Altitude.com

## Historique des changements de marque

### Migration 2025-04
**Date de migration :** 5 avril 2025  
**Ancien nom :** Dashboard-Velo  
**Nouveau nom :** Velo-Altitude  
**Nouveau domaine :** velo-altitude.com

### Migration précédente (2024-04)
**Date de migration :** 6 avril 2024  
**Ancien nom :** Grand Est Cyclisme / Euro Cycling Dashboard  
**Nouveau nom :** Dashboard-Velo  
**Ancien domaine :** dashboard-velo.com

## Raisons du changement vers Velo-Altitude

### Spécialisation et positionnement
La plateforme évolue pour se concentrer spécifiquement sur les cyclistes passionnés par les cols et l'altitude. Le nouveau nom "Velo-Altitude" communique immédiatement cette spécialisation et positionne la plateforme comme la référence pour les amateurs de défis en montagne.

### Différenciation sur le marché européen
"Velo-Altitude" offre une identité plus distinctive et mémorable sur le marché européen, se démarquant des autres applications cyclistes généralistes.

### Cohérence avec les fonctionnalités phares
Le nouveau nom met en valeur nos fonctionnalités les plus populaires (visualisation 3D des cols, défi des 7 majeurs) qui sont toutes liées à l'altitude et la montagne.

### Partenariat stratégique
"Velo-Altitude" est développé en partenariat avec Grand Est Cyclisme, tirant parti de l'expertise régionale tout en élargissant sa portée internationale.

## Identité visuelle mise à jour

Les couleurs, polices et éléments graphiques ont été modernisés pour refléter le positionnement axé sur l'altitude et la montagne:

- **Palette principale:** dégradés de bleu alpin et gris montagne
- **Logo:** réinterprétation graphique d'un vélo gravissant une montagne stylisée
- **Typographie:** Plus moderne et aérée, avec des titres en Montserrat et du contenu en Open Sans
- **Iconographie:** Ensemble cohérent d'icônes représentant les différents modules (cols, entraînement, nutrition, etc.)

## État actuel du rebranding (5 avril 2025)

### Éléments déjà migrés
- [x] Titre et métadonnées dans `index.html`
- [x] Variables d'environnement (`REACT_APP_BRAND_NAME`, etc.)
- [x] Configuration Netlify pour le nouveau domaine
- [x] Mise à jour du fichier netlify.toml avec les redirections appropriées
- [x] Documentation mise à jour (README, DEPLOYMENT, DOCUMENTATION_TRAINING)

### Déploiement en cours
- [x] Création du repository GitHub
- [x] Configuration initiale Netlify
- [ ] Finalisation du déploiement (en attente de résolution des problèmes de structure)

### Modules optimisés pour Velo-Altitude
- [x] **Calculateur FTP** avec ses 6 méthodes de calcul:
  - Test 20 minutes
  - Test 60 minutes
  - Test Ramp
  - Test 8 minutes
  - Test 5 minutes
  - Seuil Lactate
- [x] **Visualisation des zones d'entraînement** avec TrainingZoneChart
- [x] **Module HIIT** avec validation robuste:
  - Fonction generateLadderIntervals optimisée
  - Fonction generateOverUnderIntervals améliorée
  - Validation des types avec PropTypes
  - Gestion des cas limites pour les profils utilisateur incomplets
- [x] **Explorateur de Cols** avec son système de cache météo
- [x] **Les 7 Majeurs** avec visualisation 3D des parcours

## Prochaines étapes

1. **Finalisation du déploiement** (priorité immédiate):
   - Résoudre les problèmes de structure entre dépôt GitHub et structure locale
   - Compléter le déploiement sur netlify via méthode ZIP ou ajustement des paramètres

2. **Tests post-déploiement**:
   - Vérifier le fonctionnement de tous les modules
   - S'assurer que l'ensemble des pages reflète la nouvelle identité visuelle

3. **Migration complète des ressources**:
   - Configurer les redirections depuis l'ancien domaine
   - Mettre à jour la documentation destinée aux utilisateurs
   - Informer la communauté existante
