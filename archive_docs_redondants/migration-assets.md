# Migration des Assets Graphiques vers Dashboard-Velo

Ce document liste les fichiers image qui doivent être mis à jour pour refléter le nouveau nom "Dashboard-Velo" au lieu de "Grand Est Cyclisme".

## Images à mettre à jour

### Images principales
- `client/public/images/logo.png` → Nouveau logo Dashboard-Velo
- `client/public/images/logo_large.png` → Version large du logo Dashboard-Velo
- `client/public/images/cropped-cropped-grand-est-cyclisme-75x75.png` → Renommer en `dashboard-velo-75x75.png`

### Icônes d'application
- `client/public/images/icon16.png` → Nouvelle icône 16x16px
- `client/public/images/icon48.png` → Nouvelle icône 48x48px
- `client/public/images/icon128.png` → Nouvelle icône 128x128px
- `client/public/images/icons/icon-16.png` → Nouvelle icône 16x16px
- `client/public/images/icons/icon-48.png` → Nouvelle icône 48x48px
- `client/public/images/icons/icon-128.png` → Nouvelle icône 128x128px
- `client/public/images/icons/icon-192.png` → Nouvelle icône 192x192px
- `client/public/images/icons/icon-512.png` → Nouvelle icône 512x512px

### Favicon
- `client/public/favicon.ico` → Nouveau favicon avec logo Dashboard-Velo

## Instructions pour le designer

Les nouvelles images doivent respecter les règles suivantes :
1. Utiliser les couleurs de la nouvelle palette :
   - Primaire : #0078D7 (bleu)
   - Secondaire : #FF8C00 (orange)
   - Accent : #32CD32 (vert)
   - Gris fonctionnel : #333333
   - Arrière-plan clair : #F8F9FA

2. Le logo devrait représenter un cycliste stylisé avec un élément de tableau de bord ou de données pour refléter le nom "Dashboard-Velo"

3. Maintenir une cohérence visuelle entre les différentes versions du logo et des icônes

## Images de partage social

Des images pour les réseaux sociaux devront également être créées :
- `client/public/images/social/dashboard-velo-facebook.png` (1200x630px)
- `client/public/images/social/dashboard-velo-twitter.png` (1200x675px)
- `client/public/images/social/dashboard-velo-linkedin.png` (1200x627px)

Ces images doivent inclure :
- Le nouveau logo Dashboard-Velo
- Un slogan court : "Votre tableau de bord cycliste pour l'Europe entière"
- Un design moderne qui met en valeur le caractère européen de la plateforme

## Actions techniques requises

1. Créer les nouvelles images et les placer dans les emplacements appropriés
2. Mettre à jour toutes les références aux images dans le code
3. S'assurer que les balises meta pour les partages sociaux pointent vers les nouvelles images
4. Vérifier que le manifest.json utilise les bonnes icônes
5. Mettre à jour les références dans les styles CSS si nécessaire
