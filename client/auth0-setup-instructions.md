# Configuration Auth0 pour le développement local

Pour résoudre l'erreur `Auth0 is not properly configured`, vous devez créer un fichier `.env.local` dans le répertoire `client` avec les variables d'environnement suivantes (en utilisant les mêmes valeurs que celles configurées sur Netlify) :

```
# Auth0 Configuration
REACT_APP_AUTH0_DOMAIN=votre-domaine-auth0.auth0.com
REACT_APP_AUTH0_CLIENT_ID=votre-client-id-auth0
REACT_APP_AUTH0_AUDIENCE=https://api.velo-altitude.com
REACT_APP_AUTH0_SCOPE="openid profile email"
REACT_APP_AUTH0_REDIRECT_URI=http://localhost:3000/callback
REACT_APP_AUTH0_LOGOUT_URL=http://localhost:3000

# Autres variables importantes
REACT_APP_API_URL=http://localhost:5000
REACT_APP_MAPBOX_TOKEN=votre-token-mapbox
REACT_APP_STRAVA_CLIENT_ID=votre-client-id-strava
REACT_APP_OPENWEATHER_API_KEY=votre-api-key-openweather
```

## Étapes pour configurer Auth0 en développement local

1. Créez un fichier `.env.local` dans le répertoire `client`
2. Copiez les variables ci-dessus dans ce fichier
3. Remplacez les valeurs par celles configurées dans votre tableau de bord Netlify
4. Redémarrez le serveur de développement avec `npm start`

## Remarque importante

Les valeurs pour le développement local peuvent être légèrement différentes de celles de production, notamment pour les URLs de redirection qui doivent pointer vers `localhost` au lieu du domaine de production.
