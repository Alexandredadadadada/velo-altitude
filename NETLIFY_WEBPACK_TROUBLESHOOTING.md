# Solutions aux problèmes de déploiement Netlify avec Webpack

## Solution 1: Gestion des dépendances et NODE_ENV

### Description
L'une des causes les plus courantes de l'erreur "Cannot find module 'webpack'" est liée à la configuration de NODE_ENV et à la gestion des dépendances dans package.json.

### Source originale
[Sh: 1: webpack: not found for React deployment](https://answers.netlify.com/t/sh-1-webpack-not-found-for-react-deployment/23879)

### Contexte et pertinence
Lorsque NODE_ENV est défini sur "production", npm n'installe pas les devDependencies. Comme webpack est généralement défini comme une dépendance de développement, cela provoque l'erreur lors du build.

### Code ou configuration à mettre en place
1. Déplacer webpack des devDependencies vers les dependencies dans package.json :
```json
{
  "dependencies": {
    "webpack": "^5.98.0",
    "webpack-cli": "^5.0.0",
    // autres dépendances
  },
  "devDependencies": {
    // autres dépendances de développement
  }
}
```

2. Ou supprimer/modifier la variable d'environnement NODE_ENV dans les paramètres Netlify :
   - Accéder à Site settings > Build & deploy > Environment
   - Supprimer la variable NODE_ENV=production ou la définir sur NODE_ENV=development

### Étapes d'implémentation
1. Vérifier si webpack est dans les devDependencies de votre package.json
2. Soit déplacer webpack et webpack-cli vers les dependencies
3. Soit modifier la variable d'environnement NODE_ENV dans les paramètres Netlify
4. Redéployer le site

### Avantages et inconvénients
**Avantages :**
- Solution simple qui résout le problème à la source
- Ne nécessite pas de modifier les scripts de build

**Inconvénients :**
- Déplacer webpack vers les dependencies peut augmenter la taille du bundle final
- Définir NODE_ENV=development peut affecter d'autres aspects de l'application

## Solution 2: Commande de build non-interactive avec CI

### Description
Les outils comme webpack-cli peuvent tenter d'installer des dépendances de manière interactive, ce qui échoue dans un environnement CI/CD comme Netlify.

### Source originale
[Deployment failing due to webpack-cli issue](https://answers.netlify.com/t/deployment-failing-due-to-webpack-cli-issue/15615)

### Contexte et pertinence
Dans un environnement CI/CD, les prompts interactifs comme "Do you want to install webpack-cli?" ne peuvent pas être répondus, ce qui fait échouer le build.

### Code ou configuration à mettre en place
Utiliser la variable CI pour désactiver l'interactivité :

```
CI='' npm install && CI='' npm install webpack webpack-cli --no-save && CI='' npx webpack --mode production
```

Ou dans le fichier netlify.toml :
```toml
[build]
  command = "CI='' npm install && CI='' npm install webpack webpack-cli --no-save && CI='' npx webpack --mode production"
  publish = "build"
```

### Étapes d'implémentation
1. Modifier la commande de build dans netlify.toml ou dans les paramètres de build Netlify
2. S'assurer que l'option --no-save est utilisée pour éviter de modifier package.json
3. Utiliser CI='' pour chaque commande afin d'éviter l'interactivité
4. Redéployer le site

### Avantages et inconvénients
**Avantages :**
- Évite les problèmes d'interactivité dans l'environnement CI/CD
- Ne modifie pas la structure du projet

**Inconvénients :**
- La commande est plus complexe et moins lisible
- Peut masquer d'autres problèmes sous-jacents

## Solution 3: Spécification explicite de la version de Node.js

### Description
Les incompatibilités de version entre Node.js et les packages peuvent causer des erreurs lors du build.

### Source originale
[Netlify build error: cannot find module](https://answers.netlify.com/t/netlify-build-error-cannot-find-module/123226)

### Contexte et pertinence
Les logs de build montrent des avertissements EBADENGINE pour plusieurs packages, indiquant des incompatibilités avec la version de Node.js utilisée.

### Code ou configuration à mettre en place
Spécifier explicitement la version de Node.js dans netlify.toml :

```toml
[build.environment]
  NODE_VERSION = "20.10.0"
```

Ou créer un fichier .nvmrc à la racine du projet :
```
20.10.0
```

### Étapes d'implémentation
1. Vérifier les versions de Node.js requises par vos dépendances
2. Ajouter la configuration NODE_VERSION dans netlify.toml ou créer un fichier .nvmrc
3. S'assurer que la version spécifiée est compatible avec toutes les dépendances
4. Redéployer le site

### Avantages et inconvénients
**Avantages :**
- Assure la compatibilité entre Node.js et les packages
- Rend le build plus prévisible et reproductible

**Inconvénients :**
- Peut nécessiter des mises à jour régulières pour suivre les nouvelles versions de Node.js
- Ne résout pas directement les problèmes de dépendances manquantes

## Solution 4: Installation explicite de webpack dans le script de build

### Description
Installer explicitement webpack et webpack-cli avant d'exécuter la commande de build.

### Source originale
[First deploy problems. React / Node.js / Webpack build failing](https://answers.netlify.com/t/first-deploy-problems-react-node-js-webpack-build-failing/50196)

### Contexte et pertinence
Cette approche garantit que webpack est disponible pendant le processus de build, même s'il y a des problèmes avec l'installation des dépendances.

### Code ou configuration à mettre en place
Modifier le script de build dans package.json :

```json
{
  "scripts": {
    "build": "npm install webpack webpack-cli --no-save && webpack --mode production",
    "netlify-build": "npm install && npm run build"
  }
}
```

Et dans netlify.toml :
```toml
[build]
  command = "npm run netlify-build"
  publish = "build"
```

### Étapes d'implémentation
1. Modifier les scripts dans package.json pour inclure l'installation explicite de webpack
2. Configurer netlify.toml pour utiliser le script netlify-build
3. S'assurer que le répertoire de publication est correctement défini
4. Redéployer le site

### Avantages et inconvénients
**Avantages :**
- Garantit que webpack est disponible pendant le build
- Sépare clairement les étapes d'installation et de build

**Inconvénients :**
- Ajoute une étape supplémentaire qui peut ralentir le processus de build
- Peut masquer des problèmes plus profonds dans la configuration du projet

## Solution 5: Utilisation d'un fichier webpack.config.js personnalisé

### Description
Créer un fichier webpack.config.js personnalisé pour mieux contrôler le processus de build.

### Source originale
[Starting with Webpack from scratch](https://www.netlify.com/blog/2017/11/30/starting-with-webpack-from-scratch/)

### Contexte et pertinence
Un fichier de configuration webpack personnalisé permet de définir précisément comment webpack doit fonctionner, ce qui peut aider à résoudre les problèmes de build.

### Code ou configuration à mettre en place
Créer un fichier webpack.config.js à la racine du projet :

```javascript
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
};
```

### Étapes d'implémentation
1. Créer un fichier webpack.config.js à la racine du projet
2. Configurer les entrées, sorties et loaders selon les besoins du projet
3. Modifier le script de build pour utiliser ce fichier de configuration
4. Redéployer le site

### Avantages et inconvénients
**Avantages :**
- Donne un contrôle total sur le processus de build
- Permet de résoudre des problèmes spécifiques à votre projet

**Inconvénients :**
- Nécessite une bonne compréhension de webpack
- Peut être complexe à maintenir

## Solution 6: Effacement du cache Netlify

### Description
Les problèmes de cache peuvent parfois causer des erreurs de build sur Netlify.

### Source originale
[Build fails on Netlify but runs successfully locally](https://github.com/gatsbyjs/gatsby/issues/19103)

### Contexte et pertinence
Parfois, le cache de Netlify peut contenir des versions incompatibles ou corrompues des dépendances.

### Code ou configuration à mettre en place
Aucun code spécifique n'est nécessaire, mais vous pouvez forcer un build sans cache via l'interface Netlify ou en ajoutant un paramètre à votre commande de build :

```toml
[build]
  command = "npm ci && npm run build"
  publish = "build"
```

### Étapes d'implémentation
1. Dans l'interface Netlify, accéder à Deploys > Trigger deploy > Clear cache and deploy site
2. Ou utiliser npm ci au lieu de npm install dans votre script de build
3. Observer si le build réussit sans utiliser le cache

### Avantages et inconvénients
**Avantages :**
- Peut résoudre des problèmes difficiles à diagnostiquer
- Simple à mettre en œuvre

**Inconvénients :**
- Augmente le temps de build car toutes les dépendances doivent être réinstallées
- Ne résout pas la cause sous-jacente si le problème est lié à la configuration
