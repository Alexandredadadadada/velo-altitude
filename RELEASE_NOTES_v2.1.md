# Notes de Version - Velo-Altitude v2.1

## Date de Publication
09 avril 2025

## Changements Majeurs

### Migration vers React 18.2.0
- Downgrade depuis React 19.1.0 pour une meilleure stabilité
- Résolution des conflits de peer dependencies
- Compatibilité améliorée avec les bibliothèques Three.js et MUI

### Optimisation des Effets Météorologiques
- Performances améliorées pour les effets de pluie et de neige
- Support adaptatif GPU/CPU selon les capacités de l'appareil
- Transitions fluides entre différentes conditions météorologiques

### Compatibilité Navigateur
- Amélioration du styling des scrollbars sur tous les navigateurs
- Polyfills CSS pour assurer une expérience cohérente

## Détails Techniques

### Dépendances Core
- `react`: ^18.2.0 (depuis 19.1.0)
- `react-dom`: ^18.2.0 (depuis 19.1.0)
- `@react-three/drei`: ^9.88.0 (depuis ^9.122.0)
- `@react-three/fiber`: ^8.15.11 (depuis ^8.18.0)
- `@mui/material`: ^5.15.11 (depuis ^7.0.1)
- `@mui/icons-material`: ^5.15.11 (depuis ^7.0.1)
- `@emotion/react`: ^11.11.3 (depuis ^11.14.0)
- `@emotion/styled`: ^11.11.0 (depuis ^11.14.0)

### Configuration Système
- Node.js: ≥16.14.0 (depuis 22.14.0)
- npm: ≥8.0.0 (depuis 10.9.2)

### Services et Composants
- Validation complète des services météorologiques
- Vérification des fonctionnalités GPU pour visualisation météo
- Support assuré pour les composants de visualisation 3D des cols

## Problèmes Connus et Limitations

### Styling CSS
- Les propriétés `scrollbar-width` et `scrollbar-color` ne sont pas supportées par certains navigateurs
  - Chrome < 121
  - Safari (toutes versions)
  - iOS Safari
  - Samsung Internet
- Solution: Des fallbacks ont été ajoutés via `::-webkit-scrollbar`

### Performances GPU
- **Haute qualité** (tous effets activés): Nécessite une carte graphique dédiée récente
- **Qualité moyenne**: Compatible avec la plupart des cartes intégrées récentes
- **Mode économique**: Fallback CPU disponible pour tous les appareils

### Autres Limitations
- Certains composants d'UI peuvent nécessiter des ajustements suite à la mise à jour MUI
- Les animations de transition peuvent présenter des différences visuelles mineures

## Prochaines Étapes
- Tests supplémentaires des effets météorologiques sur différentes configurations
- Optimisation additionnelle pour appareils mobiles
- Documentation complète des API de visualisation météo

## Checklist de Validation

### Composants Critiques
- [ ] Visualisation 3D des cols
  - [ ] Rendu de base
  - [ ] Effets météo
  - [ ] Performance GPU
  
### Compatibilité Navigateur
- [ ] Chrome (dernière version)
- [ ] Firefox (dernière version)
- [ ] Safari (dernière version)
- [ ] Edge (dernière version)

### Tests Automatisés
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Tests de performance

### Documentation
- [x] README.md mis à jour
- [x] PROJECT_STATUS.md mis à jour
- [x] Notes de version complétées
