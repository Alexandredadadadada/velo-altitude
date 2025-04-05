# Rapport de Standardisation des URLs - Velo-Altitude

*Généré le 2025-04-05*

Ce rapport détaille la structure d'URL standardisée pour le site Velo-Altitude, conforme aux meilleures pratiques SEO et d'expérience utilisateur.

## Structure d'URL standardisée

### Cols

- **Pattern**: `/cols/:country/:slug`
- **Redirections**:
  - `/cols/:slug` → `/cols/:country/:slug`
- **Répertoire de données**: `server/data/cols`

### Training

- **Pattern**: `/entrainement/:level/:slug`
- **Redirections**:
  - `/training/:slug` → `/entrainement/:level/:slug`
  - `/entrainement/:slug` → `/entrainement/:level/:slug`
- **Répertoire de données**: `server/data/training`

### Nutrition

- **Pattern**: `/nutrition/:category/:slug`
- **Redirections**:
  - `/nutrition/:slug` → `/nutrition/:category/:slug`
  - `/nutrition/recipes/:slug` → `/nutrition/:category/:slug`
- **Répertoire de données**: `server/data/nutrition`

### Challenges

- **Pattern**: `/defis/:type/:slug`
- **Redirections**:
  - `/7-majeurs/:slug` → `/defis/:type/:slug`
  - `/seven-majors/:slug` → `/defis/:type/:slug`
- **Répertoire de données**: `server/data/challenges`

### Visualization

- **Pattern**: `/visualisation-3d/:country/:slug`
- **Redirections**:
  - `/routes/:slug` → `/visualisation-3d/:country/:slug`
  - `/visualisation-3d/:slug` → `/visualisation-3d/:country/:slug`
- **Répertoire de données**: `server/data/visualization`

### Community

- **Pattern**: `/communaute/:section/:slug`
- **Redirections**:
  - `/social/:slug` → `/communaute/:section/:slug`
  - `/challenges/:slug` → `/communaute/:section/:slug`
  - `/communaute/:slug` → `/communaute/:section/:slug`
- **Répertoire de données**: `server/data/community`

## Guide d'implémentation

1. Ajout de nouvelles URLs:
   - Suivre rigoureusement les patterns définis
   - Utiliser des slugs normalisés (kebab-case, sans caractères spéciaux)
   - Placer les données dans les répertoires appropriés

2. Migration des anciennes URLs:
   - Les redirections sont définies dans le fichier `netlify.toml`
   - Toute ancienne URL doit être redirigée vers sa version standardisée

3. Paramètres d'URL:
   - Les paramètres de filtrage doivent utiliser la notation `?param=valeur`
   - Les paramètres de pagination doivent utiliser `?page=n&limit=m`

4. URLs multilingues:
   - Le préfixe de langue doit être ajouté au début de l'URL: `/fr/cols/...`, `/en/cols/...`
   - La langue par défaut (français) peut omettre le préfixe

## État de standardisation

- Fichier Netlify de redirections généré: `netlify.toml`
- Structure de répertoires créée selon le modèle standardisé
- Prochaine étape: migration des données vers la nouvelle structure
