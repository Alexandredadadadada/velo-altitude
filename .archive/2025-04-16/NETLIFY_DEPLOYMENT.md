# Guide de déploiement Netlify pour Velo-Altitude

## Variables d'environnement requises

Pour que l'application fonctionne correctement sur Netlify, assurez-vous que les variables d'environnement suivantes sont configurées dans l'interface Netlify :

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/velo-altitude
OPENWEATHER_API_KEY=votre_clé_api_openweather
REACT_APP_API_URL=https://velo-altitude.com/api
REACT_APP_BASE_URL=https://velo-altitude.com
```

## Configuration de redirection

Les redirections sont automatiquement configurées via le fichier `_redirects` généré pendant la build :

```
/api/*    /.netlify/functions/api/:splat    200
/*        /index.html                       200
```

## Fonctions Netlify

L'API backend est implémentée en tant que fonction Netlify dans `netlify/functions/api.js`. Cette fonction gère :

- Connexion à MongoDB Atlas pour accéder aux cols et défis
- Endpoints pour météo, défis, nutrition, et autres fonctionnalités

## Optimisations de build

Pour résoudre les problèmes de build sur Netlify :

1. Un script personnalisé `build-netlify-fix.js` est utilisé pour contourner les problèmes avec webpack-cli
2. Des polyfills ont été implémentés pour remplacer les dépendances problématiques (rxjs, react-redux, etc.)
3. La configuration webpack a été adaptée spécifiquement pour Netlify

## Vérification du déploiement

Après le déploiement, vérifiez les fonctionnalités suivantes :

1. Accès aux 50 cols alpins via l'API
2. Visualisations 3D des cols
3. Données météo en temps réel
4. Défis "Les 7 Majeurs"
5. Fonctionnalités de nutrition

## Résolution des problèmes

Si des problèmes persistent après le déploiement :

1. Vérifiez les logs de build Netlify pour identifier les erreurs
2. Assurez-vous que toutes les variables d'environnement sont correctement configurées
3. Vérifiez que la connexion à MongoDB Atlas fonctionne correctement
4. Testez les fonctions Netlify individuellement
