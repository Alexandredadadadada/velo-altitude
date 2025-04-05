#!/usr/bin/env node
/**
 * Script de génération automatique de documentation OpenAPI 3.0
 * Extrait les commentaires JSDoc des contrôleurs et routes pour générer
 * une spécification OpenAPI complète
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const doctrine = require('doctrine');
const yaml = require('js-yaml');
const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Configuration de base OpenAPI
const openApiConfig = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Grand Est Cyclisme',
      version: process.env.npm_package_version || '1.0.0',
      description: 'API pour le site Grand Est Cyclisme',
      contact: {
        name: 'Équipe de développement',
        email: 'dev@grand-est-cyclisme.fr'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Serveur de développement'
      },
      {
        url: 'https://api.grand-est-cyclisme.fr/api',
        description: 'Serveur de production'
      }
    ],
    tags: [
      { name: 'Authentification', description: 'Opérations liées à l\'authentification' },
      { name: 'Utilisateurs', description: 'Gestion des utilisateurs' },
      { name: 'Cols', description: 'Données et visualisations des cols de la région' },
      { name: 'Entraînement', description: 'Programmes et suivi d\'entraînement' },
      { name: 'Nutrition', description: 'Plans et calculs nutritionnels' },
      { name: 'Itinéraires', description: 'Planification et partage d\'itinéraires' },
      { name: 'Monitoring', description: 'Points d\'accès pour le monitoring' }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        // Ces schémas seront automatiquement remplis par l'analyse des modèles
      },
      responses: {
        UnauthorizedError: {
          description: 'Accès non autorisé',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Non autorisé. Authentification requise.'
                  }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Ressource introuvable.'
                  }
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Erreur de validation des données',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Erreur de validation des données.'
                  },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: {
                          type: 'string',
                          example: 'email'
                        },
                        message: {
                          type: 'string',
                          example: 'Email invalide'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [
    // Ces chemins seront remplis programmatiquement
  ]
};

// Chemins pour rechercher les fichiers à analyser
const ROUTES_PATH = path.resolve(__dirname, '../routes');
const CONTROLLERS_PATH = path.resolve(__dirname, '../controllers');
const MODELS_PATH = path.resolve(__dirname, '../models');
const OUTPUT_PATH = path.resolve(__dirname, '../docs/api-spec');

// Préparation des dossiers de sortie
if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

/**
 * Trouve tous les fichiers correspondant au pattern dans le chemin spécifié
 * @param {string} basePath - Chemin de base
 * @param {string} pattern - Pattern glob
 * @returns {Array<string>} - Liste des chemins de fichiers
 */
function findFiles(basePath, pattern) {
  return glob.sync(pattern, { cwd: basePath }).map(file => path.join(basePath, file));
}

/**
 * Extrait les schémas de modèles Mongoose
 */
function extractModelSchemas() {
  const modelFiles = findFiles(MODELS_PATH, '*.model.js');
  const schemas = {};

  modelFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const modelName = path.basename(file, '.model.js');
    
    // Extraction du schéma à partir du contenu du fichier
    // Note: cette approche simple peut nécessiter des améliorations pour des modèles complexes
    const schemaRegex = /new mongoose\.Schema\(({[\s\S]*?})\)/;
    const match = content.match(schemaRegex);
    
    if (match) {
      try {
        // Analyse manuelle du schéma pour en extraire la structure
        const schemaStr = match[1];
        const schema = { type: 'object', properties: {} };
        
        // Extraction simple des propriétés
        const propRegex = /(\w+):\s*{(?:\s*type:\s*(\w+))?/g;
        let propMatch;
        
        while ((propMatch = propRegex.exec(schemaStr)) !== null) {
          const [, propName, propType] = propMatch;
          
          if (propName && propType) {
            let type = propType.toLowerCase();
            // Conversion des types Mongoose en types OpenAPI
            if (type === 'string') schema.properties[propName] = { type: 'string' };
            else if (type === 'number') schema.properties[propName] = { type: 'number' };
            else if (type === 'date') schema.properties[propName] = { type: 'string', format: 'date-time' };
            else if (type === 'boolean') schema.properties[propName] = { type: 'boolean' };
            else if (type === 'objectid') schema.properties[propName] = { type: 'string' };
            else if (type === 'array') schema.properties[propName] = { type: 'array', items: {} };
            else schema.properties[propName] = { type: 'object' };
          }
        }
        
        schemas[modelName] = schema;
      } catch (error) {
        console.error(`Erreur lors de l'analyse du modèle ${modelName}:`, error);
      }
    }
  });
  
  return schemas;
}

/**
 * Analyse les fichiers routes pour générer les chemins OpenAPI
 */
function analyzeRoutesAndControllers() {
  const routeFiles = findFiles(ROUTES_PATH, '*.routes.js');
  const controllerFiles = findFiles(CONTROLLERS_PATH, '*.controller.js');
  
  // Ajoute les fichiers à la configuration OpenAPI
  openApiConfig.apis = [...routeFiles, ...controllerFiles];
  
  // Récupère les schémas des modèles
  const schemas = extractModelSchemas();
  openApiConfig.definition.components.schemas = schemas;
  
  // Génère la spécification OpenAPI avec swagger-jsdoc
  const openapiSpecification = swaggerJsdoc(openApiConfig);
  
  // Ajoute manuellement la documentation pour les endpoints critiques
  enrichCriticalEndpoints(openapiSpecification);
  
  return openapiSpecification;
}

/**
 * Enrichit la documentation des endpoints critiques mentionnés
 * @param {Object} spec - Spécification OpenAPI
 */
function enrichCriticalEndpoints(spec) {
  // Endpoint /api/cols/3d-data/:id
  if (!spec.paths['/cols/3d-data/{id}']) {
    spec.paths['/cols/3d-data/{id}'] = {
      get: {
        tags: ['Cols'],
        summary: 'Récupère les données 3D d\'un col spécifique',
        description: 'Renvoie les données de terrain et les informations nécessaires pour la visualisation 3D d\'un col.',
        operationId: 'get3DDataForCol',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'ID unique du col',
            required: true,
            schema: {
              type: 'string'
            }
          },
          {
            name: 'resolution',
            in: 'query',
            description: 'Résolution des données 3D (high, medium, low)',
            required: false,
            schema: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              default: 'medium'
            }
          },
          {
            name: 'includePOI',
            in: 'query',
            description: 'Inclure les points d\'intérêt',
            required: false,
            schema: {
              type: 'boolean',
              default: true
            }
          }
        ],
        responses: {
          '200': {
            description: 'Données 3D du col',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      description: 'ID du col'
                    },
                    name: {
                      type: 'string',
                      description: 'Nom du col'
                    },
                    elevation: {
                      type: 'number',
                      description: 'Altitude du col (m)'
                    },
                    heightmap: {
                      type: 'object',
                      description: 'Données de la carte de hauteur',
                      properties: {
                        data: {
                          type: 'array',
                          description: 'Points de hauteur',
                          items: {
                            type: 'number'
                          }
                        },
                        width: {
                          type: 'integer',
                          description: 'Largeur de la grille'
                        },
                        height: {
                          type: 'integer',
                          description: 'Hauteur de la grille'
                        },
                        minHeight: {
                          type: 'number',
                          description: 'Hauteur minimale (m)'
                        },
                        maxHeight: {
                          type: 'number',
                          description: 'Hauteur maximale (m)'
                        }
                      }
                    },
                    texture: {
                      type: 'string',
                      description: 'URL de la texture de terrain'
                    },
                    route: {
                      type: 'object',
                      description: 'Tracé de la route',
                      properties: {
                        points: {
                          type: 'array',
                          description: 'Points du tracé',
                          items: {
                            type: 'object',
                            properties: {
                              x: { type: 'number' },
                              y: { type: 'number' },
                              z: { type: 'number' }
                            }
                          }
                        },
                        width: {
                          type: 'number',
                          description: 'Largeur de la route (m)'
                        }
                      }
                    },
                    pointsOfInterest: {
                      type: 'array',
                      description: 'Points d\'intérêt sur le parcours',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          description: { type: 'string' },
                          type: { type: 'string' },
                          position: {
                            type: 'object',
                            properties: {
                              x: { type: 'number' },
                              y: { type: 'number' },
                              z: { type: 'number' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Col non trouvé',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Col non trouvé'
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Erreur serveur',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Erreur lors de la récupération des données 3D'
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
  }
  
  // Endpoint /api/training/zones/:userId
  if (!spec.paths['/training/zones/{userId}']) {
    spec.paths['/training/zones/{userId}'] = {
      get: {
        tags: ['Entraînement'],
        summary: 'Récupère les zones d\'entraînement d\'un utilisateur',
        description: 'Calcule et renvoie les zones d\'entraînement personnalisées en fonction des paramètres de l\'utilisateur (FTP, LTHR, etc.).',
        operationId: 'getTrainingZones',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            description: 'ID de l\'utilisateur',
            required: true,
            schema: {
              type: 'string'
            }
          },
          {
            name: 'type',
            in: 'query',
            description: 'Type de zones (puissance, fréquence cardiaque, allure)',
            required: false,
            schema: {
              type: 'string',
              enum: ['power', 'hr', 'pace'],
              default: 'power'
            }
          }
        ],
        security: [
          {
            BearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'Zones d\'entraînement de l\'utilisateur',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: {
                      type: 'string',
                      description: 'ID de l\'utilisateur'
                    },
                    type: {
                      type: 'string',
                      description: 'Type de zones',
                      enum: ['power', 'hr', 'pace']
                    },
                    referenceValue: {
                      type: 'number',
                      description: 'Valeur de référence (FTP, LTHR, etc.)'
                    },
                    zones: {
                      type: 'array',
                      description: 'Liste des zones d\'entraînement',
                      items: {
                        type: 'object',
                        properties: {
                          name: {
                            type: 'string',
                            description: 'Nom de la zone',
                            example: 'Z1 - Endurance'
                          },
                          description: {
                            type: 'string',
                            description: 'Description de la zone',
                            example: 'Effort très facile, récupération active'
                          },
                          lowerBound: {
                            type: 'number',
                            description: 'Limite inférieure',
                            example: 0.55
                          },
                          upperBound: {
                            type: 'number',
                            description: 'Limite supérieure',
                            example: 0.75
                          },
                          lowerValue: {
                            type: 'number',
                            description: 'Valeur minimale absolue',
                            example: 155
                          },
                          upperValue: {
                            type: 'number',
                            description: 'Valeur maximale absolue',
                            example: 210
                          },
                          color: {
                            type: 'string',
                            description: 'Couleur associée à la zone (code hex)',
                            example: '#2ECC71'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/UnauthorizedError'
          },
          '404': {
            description: 'Utilisateur non trouvé',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Utilisateur non trouvé'
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Erreur serveur',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Erreur lors du calcul des zones d\'entraînement'
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
  }
}

/**
 * Génère et écrit la spécification OpenAPI
 */
function generateOpenApiSpec() {
  const openApiSpec = analyzeRoutesAndControllers();
  
  // Écrit la spécification au format JSON
  fs.writeFileSync(
    path.join(OUTPUT_PATH, 'openapi.json'),
    JSON.stringify(openApiSpec, null, 2),
    'utf8'
  );
  
  // Écrit la spécification au format YAML
  fs.writeFileSync(
    path.join(OUTPUT_PATH, 'openapi.yaml'),
    yaml.dump(openApiSpec),
    'utf8'
  );
  
  console.log(`Documentation OpenAPI générée avec succès dans ${OUTPUT_PATH}`);
  return openApiSpec;
}

/**
 * Exporte un serveur Express pour prévisualiser la documentation
 */
function createDocServer(openApiSpec) {
  const app = express();
  
  // Configurer Swagger UI
  const options = {
    explorer: true,
    swaggerOptions: {
      displayRequestDuration: true
    }
  };
  
  // Servir la documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, options));
  
  // Servir les fichiers JSON et YAML
  app.use('/api-docs/json', (req, res) => {
    res.sendFile(path.join(OUTPUT_PATH, 'openapi.json'));
  });
  
  app.use('/api-docs/yaml', (req, res) => {
    res.sendFile(path.join(OUTPUT_PATH, 'openapi.yaml'));
  });
  
  // Route par défaut
  app.get('/', (req, res) => {
    res.redirect('/api-docs');
  });
  
  return app;
}

// Exécution principale
if (require.main === module) {
  const openApiSpec = generateOpenApiSpec();
  
  // Si --serve est passé, démarrer un serveur pour visualiser la documentation
  if (process.argv.includes('--serve')) {
    const port = process.env.PORT || 3030;
    const app = createDocServer(openApiSpec);
    
    app.listen(port, () => {
      console.log(`Serveur de documentation démarré sur http://localhost:${port}/api-docs`);
    });
  }
}

module.exports = {
  generateOpenApiSpec,
  createDocServer
};
