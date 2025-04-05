/**
 * Documentation des API du Dashboard Cycliste Européen
 * Ce fichier configure Swagger/OpenAPI pour documenter toutes les routes API
 */

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Options de base Swagger
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Dashboard Cycliste Européen API',
    description: 'Documentation des API du Dashboard Cycliste Européen',
    version: '1.0.0',
    contact: {
      name: 'Équipe de développement',
      email: 'dev@grand-est-cyclisme.fr'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Serveur de développement'
    },
    {
      url: 'https://api.grand-est-cyclisme.fr',
      description: 'Serveur de production'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      NutritionPlan: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'nutrition-plan-endurance'
          },
          name: {
            type: 'string',
            example: 'Plan Nutrition Endurance'
          },
          type: {
            type: 'string',
            example: 'endurance'
          },
          description: {
            type: 'string'
          },
          daily_calories: {
            type: 'number',
            example: 2800
          },
          macronutrients: {
            type: 'object',
            properties: {
              carbs: {
                type: 'string',
                example: '55-60%'
              },
              protein: {
                type: 'string',
                example: '15-20%'
              },
              fat: {
                type: 'string',
                example: '25-30%'
              }
            }
          },
          daily_plans: {
            type: 'array',
            items: {
              type: 'object'
            }
          },
          supplements: {
            type: 'array',
            items: {
              type: 'object'
            }
          }
        }
      },
      NutritionalNeeds: {
        type: 'object',
        properties: {
          calories: {
            type: 'number',
            example: 2500
          },
          macronutrients: {
            type: 'object',
            properties: {
              carbs: {
                type: 'number',
                example: 325
              },
              protein: {
                type: 'number',
                example: 125
              },
              fat: {
                type: 'number',
                example: 70
              }
            }
          },
          hydration: {
            type: 'object',
            properties: {
              baseNeeds: {
                type: 'number',
                example: 2250
              },
              trainingNeeds: {
                type: 'number',
                example: 750
              }
            }
          }
        }
      },
      EventNutritionStrategy: {
        type: 'object',
        properties: {
          eventName: {
            type: 'string',
            example: 'Grand Prix des Ardennes'
          },
          caloriesBurned: {
            type: 'number',
            example: 2800
          },
          nutritionStrategy: {
            type: 'object',
            properties: {
              before: { type: 'object' },
              during: { type: 'object' },
              after: { type: 'object' }
            }
          },
          personalizedTips: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
      TrainingProgram: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'prog_1617293648123_user12'
          },
          name: {
            type: 'string',
            example: 'Programme Endurance personnalisé'
          },
          type: {
            type: 'string',
            example: 'endurance'
          },
          weeklyHours: {
            type: 'number',
            example: 8.5
          },
          weeklyWorkouts: {
            type: 'object'
          },
          focusAreas: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          duration: {
            type: 'number',
            description: 'Durée en jours',
            example: 28
          },
          nutritionRecommendations: {
            type: 'object'
          }
        }
      },
      IntegratedProgram: {
        type: 'object',
        properties: {
          id: {
            type: 'string'
          },
          name: {
            type: 'string'
          },
          description: {
            type: 'string'
          },
          training: {
            $ref: '#/components/schemas/TrainingProgram'
          },
          nutrition: {
            $ref: '#/components/schemas/NutritionPlan'
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
      NutritionPerformanceCorrelation: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean'
          },
          correlationData: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: {
                  type: 'string',
                  format: 'date'
                },
                nutrition: {
                  type: 'object',
                  properties: {
                    totalCalories: {
                      type: 'number'
                    },
                    macros: {
                      type: 'object'
                    },
                    carbsPercentage: {
                      type: 'number'
                    },
                    proteinPercentage: {
                      type: 'number'
                    },
                    fatPercentage: {
                      type: 'number'
                    }
                  }
                },
                performance: {
                  type: 'object',
                  properties: {
                    duration: {
                      type: 'number'
                    },
                    distance: {
                      type: 'number'
                    },
                    calories: {
                      type: 'number'
                    },
                    performanceScore: {
                      type: 'number'
                    }
                  }
                }
              }
            }
          },
          analysis: {
            type: 'object',
            properties: {
              bestPerformanceMacros: {
                type: 'object'
              },
              optimalCalorieRange: {
                type: 'object'
              },
              mostImpactfulNutrient: {
                type: 'object'
              },
              nutritionTiming: {
                type: 'string'
              }
            }
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
      PreEventNutritionAnalysis: {
        type: 'object',
        properties: {
          event: {
            type: 'object'
          },
          nutritionStrategy: {
            $ref: '#/components/schemas/EventNutritionStrategy'
          },
          complianceAnalysis: {
            type: 'object',
            properties: {
              score: {
                type: 'number'
              },
              level: {
                type: 'string'
              },
              strengths: {
                type: 'array',
                items: {
                  type: 'string'
                }
              },
              improvements: {
                type: 'array',
                items: {
                  type: 'string'
                }
              }
            }
          },
          adjustmentRecommendations: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
      PerformanceVisualizationData: {
        type: 'object',
        properties: {
          labels: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          datasets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: {
                  type: 'string'
                },
                data: {
                  type: 'array',
                  items: {
                    type: 'number'
                  }
                },
                backgroundColor: {
                  type: 'string'
                },
                yAxisID: {
                  type: 'string'
                }
              }
            }
          }
        }
      },
      DiagnosticHealthStatus: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'warning', 'critical'],
            example: 'healthy'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2025-04-04T02:57:06+07:00'
          },
          components: {
            type: 'object',
            properties: {
              weather: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['healthy', 'warning', 'critical'],
                    example: 'healthy'
                  },
                  latency: {
                    type: 'number',
                    example: 245
                  },
                  message: {
                    type: 'string',
                    example: 'Services météo fonctionnels'
                  }
                }
              },
              database: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['healthy', 'warning', 'critical'],
                    example: 'healthy'
                  },
                  connectionPool: {
                    type: 'object'
                  },
                  message: {
                    type: 'string',
                    example: 'Base de données opérationnelle'
                  }
                }
              },
              storage: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['healthy', 'warning', 'critical'],
                    example: 'healthy'
                  },
                  freeSpace: {
                    type: 'string',
                    example: '15.4 GB'
                  }
                }
              },
              cache: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['healthy', 'warning', 'critical'],
                    example: 'healthy'
                  },
                  hitRate: {
                    type: 'number',
                    example: 87.5
                  }
                }
              }
            }
          },
          system: {
            type: 'object',
            properties: {
              uptime: {
                type: 'string',
                example: '3d 7h 45m'
              },
              memory: {
                type: 'object',
                properties: {
                  total: {
                    type: 'string',
                    example: '8 GB'
                  },
                  used: {
                    type: 'string',
                    example: '3.2 GB'
                  },
                  percentage: {
                    type: 'number',
                    example: 40
                  }
                }
              },
              cpu: {
                type: 'object',
                properties: {
                  load: {
                    type: 'number',
                    example: 25.4
                  }
                }
              }
            }
          }
        }
      },
      ErrorStats: {
        type: 'object',
        properties: {
          totalErrors: {
            type: 'number',
            example: 156
          },
          byCategory: {
            type: 'object',
            properties: {
              weather: {
                type: 'number',
                example: 58
              },
              database: {
                type: 'number',
                example: 12
              },
              api: {
                type: 'number',
                example: 43
              },
              gpx: {
                type: 'number',
                example: 23
              },
              other: {
                type: 'number',
                example: 20
              }
            }
          },
          bySeverity: {
            type: 'object',
            properties: {
              critical: {
                type: 'number',
                example: 8
              },
              error: {
                type: 'number',
                example: 43
              },
              warning: {
                type: 'number',
                example: 105
              }
            }
          },
          recentErrors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: 'err_1234567890'
                },
                message: {
                  type: 'string'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time'
                },
                category: {
                  type: 'string'
                },
                severity: {
                  type: 'string'
                }
              }
            }
          },
          trends: {
            type: 'object',
            properties: {
              hourly: {
                type: 'array',
                items: {
                  type: 'number'
                }
              },
              daily: {
                type: 'array',
                items: {
                  type: 'number'
                }
              }
            }
          }
        }
      },
      LogDiagnostics: {
        type: 'object',
        properties: {
          logFiles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'app-2025-04-04.log'
                },
                size: {
                  type: 'string',
                  example: '2.3 MB'
                },
                lines: {
                  type: 'number',
                  example: 15430
                },
                lastModified: {
                  type: 'string',
                  format: 'date-time'
                },
                category: {
                  type: 'string',
                  example: 'application'
                }
              }
            }
          },
          totalSize: {
            type: 'string',
            example: '45.8 MB'
          },
          oldestLog: {
            type: 'string',
            format: 'date-time'
          },
          newestLog: {
            type: 'string',
            format: 'date-time'
          },
          errorFrequency: {
            type: 'object',
            properties: {
              critical: {
                type: 'number',
                example: 0.02
              },
              error: {
                type: 'number',
                example: 0.15
              },
              warning: {
                type: 'number',
                example: 0.83
              }
            }
          }
        }
      },
      WeatherServiceHealth: {
        type: 'object',
        properties: {
          services: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['healthy', 'degraded', 'down'],
                  example: 'healthy'
                },
                latency: {
                  type: 'number',
                  example: 245
                },
                uptime: {
                  type: 'number',
                  example: 99.8
                },
                errorRate: {
                  type: 'number',
                  example: 0.2
                },
                lastChecked: {
                  type: 'string',
                  format: 'date-time'
                },
                message: {
                  type: 'string'
                }
              }
            }
          },
          overall: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['healthy', 'degraded', 'critical'],
                example: 'healthy'
              },
              message: {
                type: 'string'
              },
              timestamp: {
                type: 'string',
                format: 'date-time'
              }
            }
          }
        }
      },
      TerrainData3D: {
        type: 'object',
        properties: {
          elevationData: {
            type: 'string',
            description: 'Données d\'élévation encodées en base64'
          },
          boundingBox: {
            type: 'object',
            properties: {
              sw: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' }
                }
              },
              ne: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' }
                }
              }
            }
          },
          resolution: {
            type: 'integer',
            example: 100
          },
          format: {
            type: 'string',
            example: 'mapbox-terrain-rgb'
          }
        }
      },
      ElevationProfile: {
        type: 'object',
        properties: {
          points: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                distance: { type: 'number' },
                elevation: { type: 'number' },
                coordinates: {
                  type: 'array',
                  items: { type: 'number' }
                }
              }
            }
          },
          distance: {
            type: 'number',
            description: 'Distance totale en kilomètres'
          },
          elevationGain: {
            type: 'number',
            description: 'Dénivelé positif en mètres'
          },
          elevationLoss: {
            type: 'number',
            description: 'Dénivelé négatif en mètres'
          },
          maxElevation: {
            type: 'number',
            description: 'Altitude maximale en mètres'
          },
          minElevation: {
            type: 'number',
            description: 'Altitude minimale en mètres'
          },
          avgGradient: {
            type: 'number',
            description: 'Pente moyenne en pourcentage'
          },
          steepestGradient: {
            type: 'number',
            description: 'Pente la plus raide en pourcentage'
          },
          visualization: {
            type: 'object',
            properties: {
              x: {
                type: 'array',
                items: { type: 'number' }
              },
              y: {
                type: 'array',
                items: { type: 'number' }
              }
            }
          }
        }
      },
      RoutePlan: {
        type: 'object',
        properties: {
          route: {
            type: 'object',
            description: 'Géométrie de l\'itinéraire au format GeoJSON'
          },
          distance: {
            type: 'number',
            description: 'Distance en mètres'
          },
          duration: {
            type: 'object',
            properties: {
              base: {
                type: 'number',
                description: 'Durée de base en secondes'
              },
              estimated: {
                type: 'number',
                description: 'Durée estimée en secondes basée sur le niveau du cycliste'
              },
              formattedEstimated: {
                type: 'string',
                example: '2h 30min'
              }
            }
          },
          elevationProfile: {
            $ref: '#/components/schemas/ElevationProfile'
          },
          difficulty: {
            type: 'object',
            properties: {
              score: {
                type: 'number',
                description: 'Score de difficulté (1-10)'
              },
              level: {
                type: 'string',
                example: 'Modéré'
              },
              factors: {
                type: 'object',
                properties: {
                  distance: { type: 'number' },
                  elevationGain: { type: 'number' },
                  steepestGradient: { type: 'number' }
                }
              }
            }
          },
          weather: {
            type: 'array',
            items: {
              type: 'object',
              description: 'Conditions météo le long de l\'itinéraire'
            }
          },
          traffic: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                location: {
                  type: 'array',
                  items: { type: 'number' }
                },
                congestion: {
                  type: 'string',
                  example: 'low'
                }
              }
            }
          }
        }
      },
      RealTimeOverlays: {
        type: 'object',
        properties: {
          weather: {
            type: 'object',
            properties: {
              current: {
                type: 'object',
                description: 'Conditions météo actuelles'
              },
              radar: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string' },
                  attribution: { type: 'string' },
                  url: { type: 'string' }
                }
              }
            }
          },
          traffic: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              attribution: { type: 'string' },
              url: { type: 'string' }
            }
          }
        }
      },
      ComparisonData: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              stats: {
                type: 'object',
                properties: {
                  ftp: { type: 'number' },
                  vo2max: { type: 'number' },
                  weeklyDistance: { type: 'number' },
                  weeklyElevation: { type: 'number' },
                  averageSpeed: { type: 'number' },
                  powerToWeight: { type: 'number' }
                }
              },
              recentActivities: {
                type: 'array',
                items: { type: 'object' }
              },
              progressions: {
                type: 'object'
              }
            }
          },
          similarAthletes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                anonymizedName: { type: 'string' },
                similarity: { type: 'number' },
                stats: {
                  type: 'object'
                },
                performance: {
                  type: 'object'
                }
              }
            }
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
      AdvancedPerformanceMetrics: {
        type: 'object',
        properties: {
          tss: {
            type: 'number',
            description: 'Training Stress Score'
          },
          if: {
            type: 'number',
            description: 'Intensity Factor'
          },
          ctl: {
            type: 'number',
            description: 'Chronic Training Load'
          },
          atl: {
            type: 'number',
            description: 'Acute Training Load'
          },
          tsb: {
            type: 'number',
            description: 'Training Stress Balance'
          },
          vo2maxEstimate: {
            type: 'number'
          },
          paceZones: {
            type: 'array',
            items: {
              type: 'object'
            }
          },
          variabilityIndex: {
            type: 'number'
          },
          efficiencyFactor: {
            type: 'number'
          },
          decoupling: {
            type: 'number'
          }
        }
      },
      PerformancePrediction: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string'
          },
          eventName: {
            type: 'string'
          },
          eventDate: {
            type: 'string',
            format: 'date'
          },
          predictions: {
            type: 'object',
            properties: {
              finishTime: {
                type: 'string',
                example: '3:45:12'
              },
              estimatedPower: {
                type: 'number'
              },
              estimatedHeartRate: {
                type: 'number'
              },
              pace: {
                type: 'string',
                example: '32.4 km/h'
              },
              position: {
                type: 'string',
                example: 'Top 15%'
              }
            }
          },
          trainingReadiness: {
            type: 'object',
            properties: {
              score: {
                type: 'number'
              },
              status: {
                type: 'string',
                example: 'Bon'
              },
              details: {
                type: 'object'
              }
            }
          },
          confidenceScore: {
            type: 'number'
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
      WeatherAlert: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['precipitation', 'wind', 'temperature', 'thunderstorm', 'visibility', 'suddenChange'],
            example: 'precipitation'
          },
          subType: {
            type: 'string',
            example: 'rain'
          },
          level: {
            type: 'string',
            example: 'moderate'
          },
          severity: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            example: 'medium'
          },
          time: {
            type: 'string',
            format: 'date-time'
          },
          coordinates: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  lat: {
                    type: 'number',
                    format: 'float'
                  },
                  lon: {
                    type: 'number',
                    format: 'float'
                  }
                }
              },
              {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    lat: {
                      type: 'number',
                      format: 'float'
                    },
                    lon: {
                      type: 'number',
                      format: 'float'
                    }
                  }
                }
              }
            ]
          },
          routeDistance: {
            type: 'number',
            description: 'Distance sur l\'itinéraire en km'
          },
          description: {
            type: 'string',
            example: 'Précipitations modérées (pluie)'
          },
          details: {
            type: 'object',
            additionalProperties: true,
            example: {
              intensity: '5.3',
              probability: '80%'
            }
          }
        },
        required: [
          'type',
          'severity',
          'time',
          'coordinates',
          'description'
        ]
      }
    }
  }
};

/**
 * @swagger
 * tags:
 *   name: Training IA
 *   description: API pour les fonctionnalités d'IA liées à l'entraînement
 */

/**
 * @swagger
 * tags:
 *   name: Prédictions Environnementales
 *   description: API pour les prédictions environnementales et les recommandations associées
 */

/**
 * @swagger
 * tags:
 *   name: Cache
 *   description: Informations sur le mécanisme de cache Redis utilisé par l'API
 */

/**
 * @swagger
 * tags:
 *   name: Nutrition
 *   description: API pour la gestion des plans nutritionnels et des recommandations diététiques
 */

/**
 * @swagger
 * tags:
 *   name: Entraînement
 *   description: API pour la gestion des programmes d'entraînement et l'analyse des performances
 */

/**
 * @swagger
 * tags:
 *   name: Programmes Intégrés
 *   description: API pour la gestion des programmes combinant entraînement et nutrition
 */

/**
 * @swagger
 * tags:
 *   name: Analyse de Performance
 *   description: API pour l'analyse de performance intégrant données nutritionnelles et d'entraînement
 */

/**
 * @swagger
 * tags:
 *   name: Cartographie Avancée
 *   description: API pour les fonctionnalités de cartographie avancée, profiles d'élévation et itinéraires
 */

/**
 * @swagger
 * tags:
 *   name: Tableau de Bord Analytique
 *   description: API pour les visualisations personnalisables et analyses comparatives
 */

/**
 * @swagger
 * tags:
 *   name: Prédictions de Performance
 *   description: API pour les prédictions de performance basées sur l'historique et les conditions
 */

/**
 * @swagger
 * tags:
 *   name: Diagnostic
 *   description: API de diagnostic et monitoring système
 */

/**
 * @swagger
 * tags:
 *   name: RouteVisualization
 *   description: API pour la visualisation avancée des itinéraires
 */

/**
 * @swagger
 * /api/training/ai/recommendations/{userId}:
 *   get:
 *     summary: Générer des recommandations d'entraînement personnalisées
 *     tags: [Training IA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur pour lequel générer des recommandations
 *     responses:
 *       200:
 *         description: Recommandations générées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: string
 *                       example: "Plan d'entraînement hebdomadaire équilibré adapté à votre niveau."
 *                     weekPlan:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           day:
 *                             type: string
 *                             example: "Lundi"
 *                           type:
 *                             type: string
 *                             example: "Récupération"
 *                           title:
 *                             type: string
 *                             example: "Récupération active"
 *                           description:
 *                             type: string
 *                             example: "Sortie légère pour récupérer du weekend"
 *                           duration:
 *                             type: string
 *                             example: "45-60 min"
 *                           intensity:
 *                             type: number
 *                             example: 2
 *                           metrics:
 *                             type: array
 *                             items:
 *                               type: string
 *                               example: "Fréquence cardiaque < 75% FCmax"
 *                     userId:
 *                       type: string
 *                       example: "123456789"
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                     validUntil:
 *                       type: string
 *                       format: date-time
 *                     fromCache:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Non autorisé - Authentification requise
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur lors de la génération des recommandations
 */

/**
 * @swagger
 * /api/training/ai/analyze/{userId}/{activityId}:
 *   get:
 *     summary: Analyser les performances d'une activité
 *     tags: [Training IA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *       - in: path
 *         name: activityId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'activité à analyser
 *     responses:
 *       200:
 *         description: Analyse générée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: string
 *                       example: "Sortie de 45 km avec une puissance moyenne de 230 watts."
 *                     strengths:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "Bonne régularité de l'effort"
 *                     improvements:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "Travailler sur la distribution des zones de puissance"
 *                     powerAnalysis:
 *                       type: string
 *                       example: "Votre puissance normalisée de 245 watts suggère un parcours avec des variations d'intensité."
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "Intégrer plus d'intervalles courts à haute intensité"
 *                     trainingImpact:
 *                       type: string
 *                       example: "Impact modéré sur votre progression globale"
 *                     activityId:
 *                       type: string
 *                       example: "987654321"
 *                     userId:
 *                       type: string
 *                       example: "123456789"
 *                     analyzedAt:
 *                       type: string
 *                       format: date-time
 *                     fromCache:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Non autorisé - Authentification requise
 *       403:
 *         description: Accès interdit à cette activité
 *       404:
 *         description: Activité non trouvée
 *       500:
 *         description: Erreur serveur lors de l'analyse de performance
 */

/**
 * @swagger
 * /api/environmental/predictions/route/{routeId}:
 *   get:
 *     summary: Prédit les conditions environnementales pour un itinéraire
 *     description: Génère des prédictions météo, qualité d'air et vent pour un itinéraire à une date spécifique
 *     tags: [Prédictions Environnementales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'itinéraire
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date cible pour la prédiction (format YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Prédictions générées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     routePoints:
 *                       type: integer
 *                       example: 120
 *                     keyPointsPredictions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     overallPrediction:
 *                       type: object
 *                       properties:
 *                         score:
 *                           type: integer
 *                           example: 78
 *                         category:
 *                           type: string
 *                           example: "Bon"
 *                     optimalTimeOfDay:
 *                       type: object
 *                     confidence:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Itinéraire non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/environmental/predictions/optimal-date/{routeId}:
 *   get:
 *     summary: Trouve la date optimale pour un itinéraire
 *     description: Détermine la meilleure date pour parcourir un itinéraire dans une plage donnée
 *     tags: [Prédictions Environnementales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'itinéraire
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début de la plage (format YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin de la plage (format YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Date optimale trouvée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     routeId:
 *                       type: string
 *                       example: "60a1f2c3d4e5f6a7b8c9d0e1"
 *                     optimalDate:
 *                       type: string
 *                       format: date-time
 *                     score:
 *                       type: integer
 *                       example: 85
 *                     allDates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date-time
 *                           score:
 *                             type: integer
 *                           category:
 *                             type: string
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Itinéraire non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/environmental/effort-estimation/{routeId}:
 *   get:
 *     summary: Estime l'effort requis pour un itinéraire
 *     description: Calcule l'effort requis en fonction des conditions environnementales et du profil du cycliste
 *     tags: [Prédictions Environnementales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'itinéraire
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date cible pour l'estimation (format YYYY-MM-DD)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur pour personnaliser l'estimation (optionnel)
 *     responses:
 *       200:
 *         description: Estimation générée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     routeId:
 *                       type: string
 *                     effort:
 *                       type: object
 *                       properties:
 *                         score:
 *                           type: integer
 *                           example: 75
 *                         category:
 *                           type: string
 *                           example: "Difficile"
 *                     estimates:
 *                       type: object
 *                       properties:
 *                         time:
 *                           type: object
 *                         energy:
 *                           type: object
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Itinéraire non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/environmental/weather-alerts/{routeId}:
 *   get:
 *     summary: Vérifie les alertes météo pour un itinéraire
 *     description: Recherche les changements significatifs dans les prévisions météo pour un itinéraire
 *     tags: [Prédictions Environnementales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'itinéraire
 *     responses:
 *       200:
 *         description: Vérification des alertes effectuée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     alerts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             example: "precipitation"
 *                           severity:
 *                             type: string
 *                             example: "high"
 *                           message:
 *                             type: string
 *       404:
 *         description: Itinéraire non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/diagnostic/health:
 *   get:
 *     summary: Obtient l'état de santé global du système
 *     description: Récupère les informations sur l'état de santé des différents composants du système
 *     tags: [Diagnostic]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: État de santé récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiagnosticHealthStatus'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit (rôle administrateur requis)
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/diagnostic/errors:
 *   get:
 *     summary: Obtient les statistiques d'erreurs
 *     description: Récupère les statistiques globales sur les erreurs du système
 *     tags: [Diagnostic]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorStats'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit (rôle administrateur requis)
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/diagnostic/errors/patterns:
 *   get:
 *     summary: Analyse les modèles d'erreur
 *     description: Identifie les modèles récurrents dans les erreurs du système
 *     tags: [Diagnostic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: integer
 *         description: Période d'analyse en heures (défaut 24)
 *       - in: query
 *         name: minOccurrences
 *         schema:
 *           type: integer
 *         description: Nombre minimum d'occurrences pour considérer un modèle (défaut 3)
 *       - in: query
 *         name: types
 *         schema:
 *           type: string
 *         description: Types d'erreurs à analyser (séparés par virgule, défaut error,weather,api)
 *     responses:
 *       200:
 *         description: Analyse effectuée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 patterns:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       pattern:
 *                         type: string
 *                       occurrences:
 *                         type: integer
 *                       category:
 *                         type: string
 *                       firstSeen:
 *                         type: string
 *                         format: date-time
 *                       lastSeen:
 *                         type: string
 *                         format: date-time
 *                       impact:
 *                         type: string
 *                       suggestion:
 *                         type: string
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit (rôle administrateur requis)
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/diagnostic/weather:
 *   get:
 *     summary: Vérifie l'état des services météo
 *     description: Effectue un diagnostic complet des services météo externes
 *     tags: [Diagnostic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: services
 *         schema:
 *           type: string
 *         description: Services météo à vérifier (séparés par virgule)
 *     responses:
 *       200:
 *         description: Vérification effectuée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeatherServiceHealth'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit (rôle administrateur requis)
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/diagnostic/logs:
 *   get:
 *     summary: Effectue un diagnostic des logs
 *     description: Analyse les fichiers de logs du système et fournit des statistiques
 *     tags: [Diagnostic]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Diagnostic effectué avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogDiagnostics'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit (rôle administrateur requis)
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/diagnostic/errors/reset:
 *   post:
 *     summary: Réinitialise les statistiques d'erreur
 *     description: Remet à zéro les compteurs d'erreurs (sans supprimer les logs)
 *     tags: [Diagnostic]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Réinitialisation effectuée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'success'
 *                 message:
 *                   type: string
 *                   example: 'Statistiques d''erreurs réinitialisées avec succès'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit (rôle administrateur requis)
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/route-visualization/route/{routeId}:
 *   get:
 *     summary: Récupère un itinéraire avec code couleur par difficulté
 *     tags: [RouteVisualization]
 *     parameters:
 *       - in: path
 *         name: routeId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'itinéraire
 *       - in: query
 *         name: includeSegments
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Inclure les segments de difficulté distincte (par défaut true)
 *     responses:
 *       200:
 *         description: GeoJSON de l'itinéraire coloré récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: FeatureCollection
 *                     features:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             example: Feature
 *                           properties:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               difficulty:
 *                                 type: string
 *                               color:
 *                                 type: string
 *                               cssClass:
 *                                 type: string
 *                           geometry:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 example: LineString
 *                               coordinates:
 *                                 type: array
 *                                 items:
 *                                   type: array
 *                                   items:
 *                                     type: number
 *       404:
 *         description: Itinéraire non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/route-visualization/colors.css:
 *   get:
 *     summary: Récupère le CSS pour les couleurs d'itinéraires
 *     tags: [RouteVisualization]
 *     responses:
 *       200:
 *         description: CSS pour les couleurs d'itinéraires
 *         content:
 *           text/css:
 *             schema:
 *               type: string
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/route-visualization/difficulty:
 *   post:
 *     summary: Calcule la difficulté globale d'un itinéraire
 *     tags: [RouteVisualization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avgGradient:
 *                 type: number
 *                 description: Gradient moyen en pourcentage
 *               elevationGain:
 *                 type: number
 *                 description: Dénivelé positif en mètres
 *               distance:
 *                 type: number
 *                 description: Distance en km
 *               maxGradient:
 *                 type: number
 *                 description: Gradient maximum en pourcentage
 *     responses:
 *       200:
 *         description: Difficulté calculée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     difficulty:
 *                       type: string
 *                       enum: [easy, moderate, difficult, very_difficult, extreme, challenge]
 *                     colorInfo:
 *                       type: object
 *                       properties:
 *                         baseColor:
 *                           type: string
 *                         gradient:
 *                           type: array
 *                           items:
 *                             type: string
 *                         cssClass:
 *                           type: string
 *                         gpxColor:
 *                           type: string
 *       400:
 *         description: Statistiques d'itinéraire invalides
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/route-visualization/gradient-style/{gradient}:
 *   get:
 *     summary: Génère le style Leaflet pour un segment de pente spécifique
 *     tags: [RouteVisualization]
 *     parameters:
 *       - in: path
 *         name: gradient
 *         schema:
 *           type: number
 *         required: true
 *         description: Valeur du gradient en pourcentage
 *     responses:
 *       200:
 *         description: Style Leaflet récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     color:
 *                       type: string
 *                     weight:
 *                       type: number
 *                     opacity:
 *                       type: number
 *                     className:
 *                       type: string
 *       400:
 *         description: Gradient invalide
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/route-visualization/color-palette:
 *   post:
 *     summary: Obtient une palette de couleurs pour un ensemble de routes
 *     tags: [RouteVisualization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               routeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Palette de couleurs récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       difficulty:
 *                         type: string
 *                       color:
 *                         type: string
 *                       cssClass:
 *                         type: string
 *       400:
 *         description: Liste d'IDs d'itinéraires invalide
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */

const swaggerOptions = {
  swaggerDefinition,
  apis: [
    './server/routes/*.js',
    './server/controllers/*.js',
    './server/models/*.js',
    './server/docs/api-examples.js'
  ]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Fonction pour configurer Swagger dans l'application Express
const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Dashboard Cycliste Européen API'
  }));
  
  console.log('📚 Documentation API disponible sur /api-docs');
};

module.exports = {
  setupSwagger,
  swaggerDocs
};
