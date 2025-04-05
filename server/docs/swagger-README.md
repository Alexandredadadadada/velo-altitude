# Documentation API Dashboard-Velo

## Vue d'ensemble

Cette documentation API utilise la spécification OpenAPI 3.0 (Swagger) pour décrire l'ensemble des endpoints disponibles dans l'API Dashboard-Velo. La documentation est divisée en plusieurs fichiers pour une meilleure organisation et maintenance :

- `swagger-core.yaml` : Définitions de base, schémas communs et endpoints d'authentification
- `swagger-cols-3d.yaml` : Endpoints pour les cols et visualisations 3D
- `swagger-routes.yaml` : Endpoints pour les itinéraires et la planification
- `swagger-training.yaml` : Endpoints pour l'entraînement et les zones d'entraînement

## Utilisation

### Interface Swagger UI

Pour explorer la documentation de manière interactive :

1. Assurez-vous que le serveur Dashboard-Velo est en cours d'exécution
2. Accédez à l'URL : `http://localhost:5000/api-docs`
3. Vous pouvez tester les endpoints directement depuis l'interface

### Intégration dans les clients

La documentation peut être utilisée pour générer automatiquement des clients API dans différents langages :

```bash
# Générer un client JavaScript
npx openapi-generator-cli generate -i ./server/docs/swagger-core.yaml -g javascript -o ./clients/js

# Générer un client TypeScript
npx openapi-generator-cli generate -i ./server/docs/swagger-core.yaml -g typescript-fetch -o ./clients/ts

# Générer un client Python
npx openapi-generator-cli generate -i ./server/docs/swagger-core.yaml -g python -o ./clients/python
```

## Configuration de Swagger UI dans le serveur

Le serveur Express est configuré pour servir la documentation Swagger UI. La configuration se trouve dans le fichier `server.js` :

```javascript
// Configuration Swagger
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Charger les fichiers Swagger
const swaggerCore = YAML.load(path.join(__dirname, 'docs/swagger-core.yaml'));
const swaggerCols3D = YAML.load(path.join(__dirname, 'docs/swagger-cols-3d.yaml'));
const swaggerRoutes = YAML.load(path.join(__dirname, 'docs/swagger-routes.yaml'));
const swaggerTraining = YAML.load(path.join(__dirname, 'docs/swagger-training.yaml'));

// Fusionner les documents
const swaggerDocument = {
  ...swaggerCore,
  paths: {
    ...swaggerCore.paths,
    ...swaggerCols3D.paths,
    ...swaggerRoutes.paths,
    ...swaggerTraining.paths
  }
};

// Configurer Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Dashboard-Velo API Documentation",
  customfavIcon: "/favicon.ico"
}));
```

## Mise à jour de la documentation

Pour mettre à jour la documentation :

1. Modifiez les fichiers YAML correspondants dans le dossier `server/docs/`
2. Redémarrez le serveur pour que les changements soient pris en compte
3. Vérifiez les modifications dans l'interface Swagger UI

## Validation

Vous pouvez valider les fichiers Swagger avec l'outil `swagger-cli` :

```bash
# Installation
npm install -g @apidevtools/swagger-cli

# Validation
swagger-cli validate ./server/docs/swagger-core.yaml
swagger-cli validate ./server/docs/swagger-cols-3d.yaml
swagger-cli validate ./server/docs/swagger-routes.yaml
swagger-cli validate ./server/docs/swagger-training.yaml
```

## Bonnes pratiques

1. **Maintenir la cohérence** : Utilisez les mêmes conventions de nommage et structures dans tous les endpoints
2. **Documenter les erreurs** : Chaque endpoint doit documenter les codes d'erreur possibles
3. **Exemples** : Fournissez des exemples de requêtes et réponses pour faciliter l'utilisation
4. **Versions** : Mettez à jour le numéro de version lors de changements importants
5. **Tests** : Vérifiez que les exemples correspondent aux réponses réelles de l'API

## Intégration avec le monitoring

La documentation Swagger est intégrée avec le système de monitoring de Dashboard-Velo. Les métriques d'utilisation des endpoints sont collectées et peuvent être visualisées dans le tableau de bord de monitoring.

## Références

- [Spécification OpenAPI](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Generator](https://openapi-generator.tech/)
