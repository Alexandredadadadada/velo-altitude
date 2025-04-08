# Guide de Déploiement Netlify - Velo-Altitude

Ce document décrit spécifiquement les étapes pour déployer l'application Velo-Altitude sur Netlify, en tenant compte des dernières modifications apportées le 05/04/2025.

## Table des matières

1. [Configuration Netlify](#configuration-netlify)
2. [Optimisations webpack](#optimisations-webpack)
3. [Variables d'environnement](#variables-denvironnement)
4. [Résolution des problèmes courants](#résolution-des-problèmes-courants)
5. [Procédure de vérification post-déploiement](#procédure-de-vérification-post-déploiement)

## Configuration Netlify

### Fichier netlify.toml

Utilisez la configuration suivante dans le fichier `netlify.toml` à la racine du projet :

```toml
[build]
  command = "npm install && npm run build"
  publish = "build"
  functions = "netlify/functions"
  
[build.environment]
  NODE_VERSION = "18.17.0"
  NPM_VERSION = "9.6.7"
  CI = "false"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Commande de build dans package.json

Assurez-vous que le script de build dans `package.json` est correctement configuré :

```json
"scripts": {
  "build": "webpack --mode production"
}
```

## Optimisations webpack

### Configuration simplifiée

Pour garantir un déploiement réussi, nous avons mis en place une configuration webpack simplifiée qui :

1. Se concentre sur les loaders et plugins essentiels uniquement
2. Évite les références à des chemins spécifiques potentiellement manquants
3. Réduit la complexité des configurations d'optimisation

Fichier `webpack.config.js` simplifié :

```javascript
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: isProduction ? 'static/js/[name].[contenthash:8].js' : 'static/js/bundle.js',
      publicPath: '/',
      clean: true,
    },
    mode: isProduction ? 'production' : 'development',
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ],
        },
        {
          test: /\.(png|jpg|jpeg|gif)$/i,
          type: 'asset',
        },
        {
          test: /\.svg$/,
          use: ['@svgr/webpack', 'url-loader'],
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
      }),
      isProduction && new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      }),
      isProduction && new CopyPlugin({
        patterns: [
          { 
            from: 'public', 
            to: '', 
            globOptions: { 
              ignore: ['**/index.html'] 
            } 
          },
        ],
      }),
    ].filter(Boolean),
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
};
```

### Dépendances webpack requises

Assurez-vous que les dépendances suivantes sont installées :

```bash
npm install --save-dev webpack webpack-cli babel-loader @babel/core @babel/preset-env @babel/preset-react html-webpack-plugin mini-css-extract-plugin copy-webpack-plugin @svgr/webpack url-loader css-loader style-loader
```

## Variables d'environnement

Les variables d'environnement suivantes doivent être configurées dans les paramètres Netlify :

| Variable | Description | Valeur recommandée |
|----------|-------------|-------------------|
| `NODE_VERSION` | Version de Node.js | 18.17.0 |
| `NPM_VERSION` | Version de NPM | 9.6.7 |
| `CI` | Désactive l'interactivité lors du build | false |
| `MAPBOX_PUBLIC_TOKEN` | Token public Mapbox | Votre token |
| `OPENWEATHER_API_KEY` | Clé API OpenWeather | Votre clé |
| `REACT_APP_BRAND_NAME` | Nom de la marque | Velo-Altitude |
| `REACT_APP_BASE_URL` | URL de base | https://velo-altitude.com |

## Résolution des problèmes courants

### 1. Erreur "webpack not found"

**Problème :** Lors du build, l'erreur suivante apparaît : `sh: 1: webpack: not found`

**Solution :**
- Assurez-vous que webpack est correctement installé en tant que dépendance de développement :
  ```bash
  npm install --save-dev webpack webpack-cli
  ```
- Modifiez le script de build pour utiliser npx : `"build": "npx webpack --mode production"`

### 2. Erreur d'installation interactive

**Problème :** Webpack tente d'installer webpack-cli de manière interactive pendant le build.

**Solution :**
- Assurez-vous que `CI=false` est défini dans les variables d'environnement
- Installez webpack-cli explicitement avant le build :
  ```bash
  npm install --save-dev webpack-cli
  ```

### 3. Erreur de résolution de modules

**Problème :** Webpack ne trouve pas certains modules ou alias.

**Solution :**
- Utilisez la configuration webpack simplifiée
- Assurez-vous que les dépendances mentionnées dans webpack.config.js sont installées

## Procédure de vérification post-déploiement

Après avoir déployé avec succès :

1. **Vérification des routes :**
   - Accédez à la page d'accueil et vérifiez que tous les liens fonctionnent
   - Testez la navigation et les redirections

2. **Vérification des fonctionnalités principales :**
   - Module "Les 7 Majeurs"
   - Visualisation 3D des cols
   - Catalogue de cols
   - Module Nutrition
   - Module Entraînement

3. **Tests de performance :**
   - Utilisez Lighthouse pour mesurer les performances
   - Vérifiez les temps de chargement sur différents appareils

4. **Tests multiplateformes :**
   - Testez le site sur différents navigateurs (Chrome, Firefox, Safari, Edge)
   - Vérifiez la réactivité sur appareils mobiles et tablettes

## Optimisations futures post-déploiement

Une fois le déploiement réussi et stable, envisagez de réintroduire progressivement :

1. Les optimisations webpack avancées (fractionnement du code, compression, etc.)
2. L'intégration Redis pour améliorer les performances de l'API
3. Les fonctionnalités d'optimisation d'image avancées
4. La mise en cache agressive pour améliorer les performances
