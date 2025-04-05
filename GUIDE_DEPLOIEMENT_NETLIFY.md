# Guide de Déploiement Velo-Altitude sur Netlify

Ce document détaille les problèmes rencontrés lors du déploiement de la plateforme Velo-Altitude sur Netlify et les solutions mises en œuvre. Il servira de référence pour l'équipe de développement et pour les futurs déploiements.

**Date de dernière mise à jour : 06/04/2025**

## Table des matières

1. [Architecture du Projet](#architecture-du-projet)
2. [Problèmes de Déploiement et Solutions](#problèmes-de-déploiement-et-solutions)
3. [Variables d'Environnement](#variables-denvironnement)
4. [Optimisations pour les Futurs Déploiements](#optimisations-pour-les-futurs-déploiements)
5. [Checklist de Déploiement](#checklist-de-déploiement)
6. [Architecture de la Plateforme](#architecture-de-la-plateforme)
7. [Ressources Utiles](#ressources-utiles)

## Architecture du Projet

Velo-Altitude est une plateforme complète dédiée au cyclisme de montagne en Europe, développée avec :

- **Frontend** : React, Material UI, Three.js/React Three Fiber
- **Backend** : Node.js, Express, Netlify Functions
- **Base de données** : MongoDB Atlas
- **Authentification** : Auth0
- **Cartographie** : Mapbox
- **API externes** : OpenWeather, OpenRouteService, Strava

## Problèmes de Déploiement et Solutions

### 1. Problème de Sous-module Git

**Symptôme** : Le build échouait avec des erreurs liées à un sous-module Git `VELO-ALTITUDE` inexistant.

**Cause** : Une référence à un sous-module qui n'existait pas ou n'était pas correctement configuré.

**Solution** : 
- Suppression des références au sous-module dans le fichier `.gitmodules`
- Vérification que le dépôt n'avait pas de dépendances de sous-modules

**Fichiers modifiés** :
- `.gitmodules` (vérification/suppression des références)

### 2. Problème de Script de Build Windows

**Symptôme** : La commande de build échouait car elle faisait référence à `cmd.exe`, incompatible avec l'environnement Linux de Netlify.

**Cause** : Le script de build dans `package.json` incluait une commande spécifique à Windows.

**Solution** :
- Modification du script pour utiliser une commande compatible avec l'environnement Unix de Netlify

**Fichiers modifiés** :
```diff
// package.json
"scripts": {
-  "build": "cmd.exe /c npx webpack --config webpack.fix.js --mode production",
+  "build": "webpack --config webpack.fix.js --mode production --stats-error-details",
}
```

### 3. Problème de Dépendances webpack

**Symptôme** : Erreur `Cannot find module 'html-webpack-plugin'` lors du build.

**Cause** : Netlify en mode production n'installe pas les dépendances de développement (`devDependencies`) par défaut, mais les plugins webpack étaient définis comme dépendances de développement.

**Solution** :
- Déplacement des dépendances webpack de `devDependencies` vers `dependencies` dans `package.json`

**Fichiers modifiés** :
```diff
// package.json
"dependencies": {
+  "html-webpack-plugin": "^5.6.3",
+  "copy-webpack-plugin": "^13.0.0",
+  "mini-css-extract-plugin": "^2.9.2",
+  "webpack": "^5.98.0",
+  "webpack-cli": "^5.0.0",
+  "webpack-manifest-plugin": "^5.0.1",
+  "babel-loader": "^10.0.0",
+  "css-loader": "^7.1.2",
+  "file-loader": "^6.2.0",
+  "style-loader": "^4.0.0",
+  "url-loader": "^4.1.1",
   // autres dépendances...
},
"devDependencies": {
-  "html-webpack-plugin": "^5.6.3",
-  "copy-webpack-plugin": "^13.0.0",
-  "mini-css-extract-plugin": "^2.9.2",
-  "webpack": "^5.98.0",
-  "webpack-cli": "^5.0.0",
-  "webpack-manifest-plugin": "^5.0.1",
-  "babel-loader": "^10.0.0",
-  "css-loader": "^7.1.2",
-  "file-loader": "^6.2.0",
-  "style-loader": "^4.0.0",
-  "url-loader": "^4.1.1",
   // autres dépendances...
}
```

### 4. Problème d'Installation de Go

**Symptôme** : Le build échouait avec des erreurs lors de l'installation de Go, notamment une erreur 404 pour `goskip.linux-amd64.tar.gz`.

**Cause** : 
- Netlify tente d'installer Go par défaut, même si le projet n'en a pas besoin.
- La valeur `GO_VERSION=skip` causait une tentative de téléchargement d'un fichier inexistant.

**Solution** :
- Configuration de la variable d'environnement `GO_IMPORT_DURING_BUILD=false` dans Netlify
- Suppression complète de la variable `GO_VERSION=skip`

**Fichiers modifiés** :
```diff
// netlify.toml
[build.environment]
  NODE_VERSION = "18.17.0"
  NPM_VERSION = "9.6.7"
  # Désactiver complètement l'installation de Go
  GO_IMPORT_DURING_BUILD = "false"
-  GO_VERSION = "skip"
  CI = "false"
```

### 5. Problème de Dépendances Babel

**Symptôme** : Erreur `Cannot find module '@babel/plugin-transform-runtime'` lors du build.

**Cause** : Même problème que pour webpack - les plugins Babel étaient dans `devDependencies` mais pas installés en production.

**Solution** :
- Déplacement des dépendances Babel de `devDependencies` vers `dependencies`

**Fichiers modifiés** :
```diff
// package.json
"dependencies": {
+  "@babel/plugin-syntax-dynamic-import": "^7.8.3",
+  "@babel/plugin-transform-runtime": "^7.26.10",
+  "@babel/preset-env": "^7.26.9",
+  "@babel/preset-react": "^7.26.3",
   // autres dépendances...
},
"devDependencies": {
-  "@babel/plugin-syntax-dynamic-import": "^7.8.3",
-  "@babel/plugin-transform-runtime": "^7.26.10",
-  "@babel/preset-env": "^7.26.9",
-  "@babel/preset-react": "^7.26.3",
   // autres dépendances...
}
```

### 6. Problème de Structure de Fichiers

**Symptôme** : Erreur `npm run netlify-build` - La structure de fichiers attendue par webpack ne correspondait pas à la structure réelle du projet.

**Cause** : Le fichier webpack.fix.js faisait référence à des chemins qui pouvaient ne pas exister dans l'environnement Netlify.

**Solution** :
- Création d'un script de vérification des chemins qui s'exécute avant le build
- Ce script vérifie et crée les structures de fichiers manquantes

**Fichiers créés** :
- `scripts/check-build-paths.js` : Script automatisé qui vérifie et crée les structures nécessaires

### 7. Problème de Compatibilité Node.js

**Symptôme** : Avertissement de compatibilité Node.js dans les logs de build :
```
npm WARN EBADENGINE current: { node: 'v18.17.0', npm: '9.6.7' }
```

**Cause** : Le champ `engines` dans package.json spécifiait une plage de versions (`"node": ">=18.0.0"`) au lieu d'une version exacte.

**Solution** :
- Spécification des versions exactes de Node.js et npm dans le champ `engines`
- Création d'un fichier `.node-version` pour une meilleure compatibilité avec Netlify

**Fichiers modifiés/créés** :
```diff
// package.json
"engines": {
-  "node": ">=18.0.0"
+  "node": "18.17.0",
+  "npm": "9.6.7"
}
```

Nouveau fichier `.node-version` :
```
18.17.0
```

### 8. Problème de Script netlify-build

**Symptôme** : Le script `netlify-build` échouait avec un code de sortie non nul.

**Cause** : 
- Le script utilisait `CI=false` qui n'est pas compatible avec Windows PowerShell
- Le script faisait référence à un script de diagnostic qui pouvait causer des erreurs

**Solution** :
- Simplification maximale du script pour assurer la compatibilité cross-platform

**Fichiers modifiés** :
```diff
// package.json
"scripts": {
-  "netlify-build": "node scripts/check-build-paths.js && npm install && npm run build"
+  "netlify-build": "npm install && npm run build"
}
```

## Variables d'Environnement

Pour un déploiement réussi de Velo-Altitude, les variables d'environnement suivantes doivent être configurées dans Netlify :

| Variable | Description | Valeur | Obligatoire |
|----------|-------------|--------|-------------|
| `NODE_VERSION` | Version de Node.js | 18.17.0 | Oui |
| `NPM_VERSION` | Version de NPM | 9.6.7 | Oui |
| `GO_IMPORT_DURING_BUILD` | Désactive l'installation de Go | false | Oui |
| `CI` | Supprime les avertissements de build | false | Recommandé |
| `MAPBOX_TOKEN` | Token pour l'API Mapbox | [votre token] | Oui |
| `OPENWEATHER_API_KEY` | Clé API OpenWeatherMap | [votre clé] | Oui |
| `OPENROUTE_API_KEY` | Clé API OpenRouteService | [votre clé] | Oui |
| `OPENAI_API_KEY` | Clé API OpenAI (chatbot) | [votre clé] | Oui |
| `CLAUDE_API_KEY` | Clé API Anthropic Claude (chatbot) | [votre clé] | Oui |
| `STRAVA_CLIENT_ID` | ID client Strava | [votre ID] | Optionnel |
| `STRAVA_CLIENT_SECRET` | Secret client Strava | [votre secret] | Optionnel |

## Optimisations pour les Futurs Déploiements

### 1. Configuration webpack Universelle

Pour éviter les problèmes de structure de fichiers, envisager de refactoriser webpack.fix.js pour qu'il soit plus flexible :

```javascript
// webpack.fix.js
const fs = require('fs');
const path = require('path');

// Détecter automatiquement les points d'entrée
const entryPointPaths = [
  './src/index.js',
  './client/src/index.js'
];

// Trouver le premier point d'entrée existant
const entry = entryPointPaths.find(entryPath => 
  fs.existsSync(path.resolve(__dirname, entryPath))
) || entryPointPaths[0];

module.exports = {
  entry: entry,
  // reste de la configuration...
};
```

### 2. Scripts de Build Conditionnels

Pour une meilleure compatibilité avec différents environnements :

```json
"scripts": {
  "build": "webpack --config webpack.fix.js --mode production",
  "build:dev": "webpack --config webpack.fix.js --mode development",
  "netlify-build": "npm install && npm run build"
}
```

### 3. Gestion des Dépendances

En mode développement, garder les dépendances clairement séparées entre `dependencies` et `devDependencies`. Avant le déploiement en production, suivre l'une des stratégies suivantes :

1. **Déplacer temporairement** les dépendances de build nécessaires vers `dependencies`
2. **Configurer Netlify** pour installer les devDependencies en ajoutant la variable d'environnement `NPM_FLAGS="--include=dev"`

## Checklist de Déploiement

Avant chaque déploiement, vérifier :

- [ ] Toutes les dépendances requises sont dans la section `dependencies`
- [ ] Le point d'entrée du projet (`src/index.js`) existe et est correct
- [ ] Les variables d'environnement sont configurées dans Netlify
- [ ] Le fichier `.node-version` est présent avec la version exacte (`18.17.0`)
- [ ] La commande de build est compatible avec Unix
- [ ] La variable `GO_IMPORT_DURING_BUILD=false` est configurée

## Architecture de la Plateforme Velo-Altitude

### Modules Principaux

- **Les 7 Majeurs** : Création de défis personnalisés avec 7 cols prestigieux
- **Visualisation 3D** : Exploration immersive des cols avec Three.js
- **Catalogue de Cols** : Base de données des cols européens avec fiches détaillées
- **Module Nutrition** : Recettes et plans nutritionnels pour cyclistes
- **Module Entraînement** : Programmes spécifiques à l'ascension de cols

### APIs Externes Intégrées

- **Mapbox** : Cartographie interactive
- **OpenWeather** : Données météorologiques en temps réel
- **OpenRouteService** : Calcul d'itinéraires
- **Strava** : Intégration des données d'activité (optionnel)
- **OpenAI/Claude** : Chatbots intelligents

## Ressources Utiles

- [Documentation Netlify sur les variables d'environnement](https://docs.netlify.com/configure-builds/environment-variables/)
- [Guide de débogage pour les builds Netlify](https://www.netlify.com/support-articles/build-troubleshooting-tips/)
- [Documentation webpack](https://webpack.js.org/concepts/)
- [Guide Babel pour React](https://babeljs.io/docs/en/babel-preset-react)
- [Documentation sur les versions Node.js dans Netlify](https://docs.netlify.com/configure-builds/manage-dependencies/#node-js-and-javascript)

---

Document rédigé le 06/04/2025 suite à la résolution complète des problèmes de déploiement de Velo-Altitude sur Netlify.
