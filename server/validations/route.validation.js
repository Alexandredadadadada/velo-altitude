/**
 * Validation des requêtes liées aux itinéraires
 * Utilise Joi pour valider les données entrantes
 */
const Joi = require('joi');

// Schémas de validation pour les coordonnées
const coordinateSchema = Joi.array().items(Joi.number().required()).length(2).required()
  .description('Coordonnées au format [longitude, latitude]');

const waypointsSchema = Joi.array().items(coordinateSchema)
  .description('Points intermédiaires au format [[longitude, latitude], ...]');

const routeValidation = {
  /**
   * Validation pour le calcul d'itinéraire
   */
  calculateRoute: Joi.object({
    start: coordinateSchema.required()
      .description('Point de départ au format [longitude, latitude]'),
    end: coordinateSchema.required()
      .description('Point d\'arrivée au format [longitude, latitude]'),
    waypoints: waypointsSchema.default([])
      .description('Points intermédiaires facultatifs'),
    profile: Joi.string().valid('cycling-regular', 'cycling-road', 'cycling-mountain', 'cycling-electric')
      .default('cycling-road')
      .description('Profil de cyclisme à utiliser'),
    preference: Joi.string().valid('fastest', 'shortest', 'recommended')
      .default('recommended')
      .description('Préférence d\'itinéraire'),
    options: Joi.object({
      avoid_features: Joi.array().items(Joi.string().valid('highways', 'tollways', 'ferries', 'steps')),
      avoid_borders: Joi.string().valid('all', 'controlled'),
      avoid_countries: Joi.array().items(Joi.number()),
      elevation: Joi.boolean().default(true),
      continue_straight: Joi.boolean().default(true),
      round_trip: Joi.boolean().default(false),
      alternative_routes: Joi.object({
        target_count: Joi.number().integer().min(1).max(3),
        weight_factor: Joi.number().min(1).max(2),
        share_factor: Joi.number().min(0).max(1)
      })
    }).default({})
  }),

  /**
   * Validation pour le calcul d'isochrone
   */
  calculateIsochrone: Joi.object({
    center: coordinateSchema.required()
      .description('Centre de l\'isochrone au format [longitude, latitude]'),
    range: Joi.number().positive().required()
      .description('Portée de l\'isochrone (en minutes ou kilomètres)'),
    rangeType: Joi.string().valid('time', 'distance').default('time')
      .description('Type de portée: temps (minutes) ou distance (km)'),
    profile: Joi.string().valid('cycling-regular', 'cycling-road', 'cycling-mountain', 'cycling-electric')
      .default('cycling-road')
      .description('Profil de cyclisme à utiliser'),
    options: Joi.object({
      interval: Joi.number().positive(),
      smoothing: Joi.number().min(0).max(100),
      avoid_features: Joi.array().items(Joi.string().valid('highways', 'tollways', 'ferries', 'steps'))
    }).default({})
  }),

  /**
   * Validation pour la récupération des données d'élévation
   */
  getElevation: Joi.object({
    points: Joi.array().items(coordinateSchema).min(2).required()
      .description('Points pour lesquels récupérer l\'élévation'),
    format: Joi.string().valid('geojson', 'polyline', 'encodedpolyline').default('geojson')
      .description('Format de sortie des données d\'élévation')
  }),

  /**
   * Validation pour l'optimisation d'itinéraire
   */
  optimizeRoute: Joi.object({
    points: Joi.array().items(coordinateSchema).min(2).max(50).required()
      .description('Points à visiter dans l\'ordre optimal'),
    roundTrip: Joi.boolean().default(false)
      .description('Si vrai, l\'itinéraire revient au point de départ'),
    profile: Joi.string().valid('cycling-regular', 'cycling-road', 'cycling-mountain', 'cycling-electric')
      .default('cycling-road')
      .description('Profil de cyclisme à utiliser'),
    metric: Joi.string().valid('distance', 'time').default('time')
      .description('Métrique à optimiser: temps ou distance')
  }),

  /**
   * Validation pour l'enregistrement d'un itinéraire
   */
  saveRoute: Joi.object({
    name: Joi.string().min(3).max(100).required()
      .description('Nom de l\'itinéraire'),
    description: Joi.string().max(500)
      .description('Description de l\'itinéraire'),
    start: coordinateSchema.required()
      .description('Point de départ au format [longitude, latitude]'),
    end: coordinateSchema.required()
      .description('Point d\'arrivée au format [longitude, latitude]'),
    waypoints: waypointsSchema.default([])
      .description('Points intermédiaires facultatifs'),
    route: Joi.object().required()
      .description('Données GeoJSON de l\'itinéraire'),
    distance: Joi.number().positive()
      .description('Distance totale en kilomètres'),
    duration: Joi.number().positive()
      .description('Durée estimée en secondes'),
    elevation: Joi.object({
      gain: Joi.number(),
      loss: Joi.number(),
      min: Joi.number(),
      max: Joi.number()
    })
      .description('Données d\'élévation'),
    tags: Joi.array().items(Joi.string())
      .description('Tags associés à l\'itinéraire'),
    isPublic: Joi.boolean().default(false)
      .description('Si vrai, l\'itinéraire est visible par tous les utilisateurs')
  })
};

module.exports = {
  routeValidation
};
