# Solutions aux problèmes de déploiement Netlify avec Webpack

Ce document présente les solutions concrètes aux problèmes de déploiement rencontrés lors de l'utilisation de Webpack avec Netlify pour le projet Velo-Altitude.

## Solution finale (05/04/2025)

Après plusieurs tentatives, nous avons mis en place une solution complète qui résout définitivement les problèmes de déploiement :

### 1. Modifications du package.json

```json
// 1. Déplacer webpack et webpack-cli dans les dependencies principales
"dependencies": {
  // autres dépendances...
  "webpack": "^5.98.0",
  "webpack-cli": "^5.0.0"
}

// 2. Scripts de build optimisés
"scripts": {
  "build": "CI='' webpack --mode production",
  "netlify-build": "CI='' npm install && CI='' npm run build"
}
```

### 2. Configuration netlify.toml

```toml
[build]
  command = "npm run netlify-build"
  publish = "build"
  functions = "netlify/functions"
  
[build.environment]
  NODE_VERSION = "18.17.0"
  NPM_VERSION = "9.6.7"
  CI = "false"
```

### Explication détaillée

Cette solution résout les trois problèmes majeurs de déploiement :

1. **Problème d'installation de webpack** :
   - En déplaçant webpack et webpack-cli des devDependencies vers les dependencies principales, nous garantissons leur installation même en environnement de production où NODE_ENV=production
   - Cela évite l'erreur "Cannot find module 'webpack'"

2. **Problème d'interactivité** :
   - L'utilisation de `CI=''` dans les commandes de build empêche webpack-cli de demander des confirmations interactives
   - La variable d'environnement `CI="false"` dans netlify.toml assure également la non-interactivité au niveau de l'environnement

3. **Robustesse du processus** :
   - Le script dédié `netlify-build` encapsule toutes les étapes nécessaires dans le bon ordre
   - L'utilisation des versions spécifiques de Node.js et npm évite les incompatibilités

## Autres solutions testées

### Solution avec installation globale

```toml
[build]
  command = "npm install -g webpack-cli && npx webpack --mode production"
```

**Problème** : Ne résout pas complètement les problèmes d'interactivité et peut poser des problèmes de permission dans l'environnement Netlify.

### Solution avec installation locale et CI

```toml
[build]
  command = "CI='' npm install -D webpack webpack-cli && CI='' npx webpack-cli --mode production"
```

**Problème** : Les dépendances de développement peuvent ne pas être installées si NODE_ENV=production.

### Solution avec CI dans l'environnement uniquement

```toml
[build.environment]
  CI = "false"
```

**Problème** : Ne suffit pas toujours à éviter les problèmes d'interactivité dans toutes les étapes du processus.

## Résolution des erreurs communes

| Erreur | Solution |
|--------|----------|
| `Cannot find module 'webpack'` | Déplacer webpack et webpack-cli dans les dependencies principales |
| `Do you want to install 'webpack-cli'?` | Utiliser CI='' dans les commandes de build |
| `EBADENGINE` | Spécifier NODE_VERSION et NPM_VERSION compatibles dans netlify.toml |
| Erreur de build liée à un path absent | Simplifier la configuration webpack et utiliser des chemins relatifs |
| `Exit code 2` | S'assurer que toutes les dépendances sont correctement installées et que les commandes sont non-interactives |

## Recommandations supplémentaires

1. **Tests locaux** : Tester le build en local avec les mêmes variables d'environnement que Netlify :
   ```bash
   CI='' npm run build
   ```

2. **Vérification des logs** : En cas d'échec, examiner attentivement les logs Netlify pour identifier l'étape précise qui échoue

3. **Cache Netlify** : Si les problèmes persistent après les modifications, essayer de vider le cache de build Netlify

4. **Dépendances explicites** : Toujours référencer explicitement toutes les dépendances requises pour le build

La solution finale implémentée garantit un déploiement stable et reproductible pour le projet Velo-Altitude.
