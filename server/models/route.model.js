/**
 * Modèle d'itinéraire cyclable pour la plateforme Grand Est Cyclisme
 */
const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  }
}, { _id: false });

const elevationSchema = new mongoose.Schema({
  gain: {
    type: Number,
    default: 0
  },
  loss: {
    type: Number,
    default: 0
  },
  min: {
    type: Number
  },
  max: {
    type: Number
  },
  profile: {
    type: [Number],
    default: []
  }
}, { _id: false });

const ratingsSchema = new mongoose.Schema({
  average: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  difficulty: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  scenery: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  surface: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  traffic: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  count: {
    type: Number,
    default: 0
  }
}, { _id: false });

const routeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nom de l\'itinéraire requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Utilisateur requis']
  },
  start: {
    type: pointSchema,
    required: [true, 'Point de départ requis']
  },
  end: {
    type: pointSchema,
    required: [true, 'Point d\'arrivée requis']
  },
  waypoints: {
    type: [pointSchema],
    default: []
  },
  route: {
    type: mongoose.Schema.Types.Mixed, // GeoJSON pour l'itinéraire
    required: [true, 'Données d\'itinéraire requises']
  },
  distance: {
    type: Number, // en kilomètres
    required: [true, 'Distance requise']
  },
  duration: {
    type: Number, // en secondes
    required: [true, 'Durée requise']
  },
  elevation: {
    type: elevationSchema,
    default: () => ({})
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'hard', 'expert'],
    default: 'moderate'
  },
  tags: {
    type: [String],
    default: []
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  ratings: {
    type: ratingsSchema,
    default: () => ({})
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  profile: {
    type: String,
    enum: ['cycling-regular', 'cycling-road', 'cycling-mountain', 'cycling-electric'],
    default: 'cycling-road'
  },
  weather: {
    type: mongoose.Schema.Types.Mixed, // Données météo au moment de la création
    default: null
  },
  surface: {
    type: String,
    enum: ['paved', 'unpaved', 'mixed'],
    default: 'paved'
  },
  season: {
    type: String,
    enum: ['spring', 'summer', 'autumn', 'winter', 'all-year'],
    default: 'all-year'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances des requêtes
routeSchema.index({ user: 1, createdAt: -1 });
routeSchema.index({ tags: 1 });
routeSchema.index({ isPublic: 1 });
routeSchema.index({ 'start.coordinates': '2dsphere' });
routeSchema.index({ 'end.coordinates': '2dsphere' });
routeSchema.index({ 'ratings.average': -1 });

// Virtuals
routeSchema.virtual('durationFormatted').get(function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  return `${hours}h ${minutes}m`;
});

// Virtual pour les avis
routeSchema.virtual('reviews', {
  ref: 'RouteReview',
  localField: '_id',
  foreignField: 'route'
});

// Méthodes du modèle
routeSchema.methods.toJSON = function() {
  const route = this.toObject();
  
  // Simplifier les données GeoJSON pour les réponses API si nécessaire
  if (route.route && route.route.features && route.route.features.length > 0) {
    // Garder les propriétés mais simplifier la géométrie si elle est trop grande
    const geometrySize = JSON.stringify(route.route).length;
    if (geometrySize > 10000) { // Si plus de 10KB
      route.routeSimplified = true;
      // Conserver uniquement les métadonnées importantes
      route.route = {
        type: 'FeatureCollection',
        properties: route.route.properties || {},
        summary: {
          distance: route.distance,
          duration: route.duration,
          ...route.route.summary
        }
      };
    }
  }
  
  return route;
};

// Méthode statique pour trouver les itinéraires à proximité
routeSchema.statics.findNearby = async function(coordinates, maxDistance = 10000, limit = 10) {
  return this.find({
    'start.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates // [longitude, latitude]
        },
        $maxDistance: maxDistance // en mètres
      }
    },
    isPublic: true
  }).limit(limit);
};

// Méthode statique pour calculer les statistiques d'un utilisateur
routeSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    { $group: {
      _id: null,
      totalRoutes: { $sum: 1 },
      totalDistance: { $sum: '$distance' },
      totalDuration: { $sum: '$duration' },
      totalElevation: { $sum: '$elevation.gain' },
      avgDistance: { $avg: '$distance' },
      avgDuration: { $avg: '$duration' }
    }}
  ]);
  
  return stats.length > 0 ? stats[0] : {
    totalRoutes: 0,
    totalDistance: 0,
    totalDuration: 0,
    totalElevation: 0,
    avgDistance: 0,
    avgDuration: 0
  };
};

// Middleware pour mettre à jour la date de modification
routeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
