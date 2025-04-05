/**
 * Modèle pour les avis et commentaires sur les itinéraires
 */
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: [true, 'Itinéraire requis']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Utilisateur requis']
  },
  rating: {
    type: Number,
    required: [true, 'Note requise'],
    min: [1, 'La note minimale est 1'],
    max: [5, 'La note maximale est 5']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères']
  },
  difficultyRating: {
    type: Number,
    min: [1, 'La difficulté minimale est 1'],
    max: [5, 'La difficulté maximale est 5']
  },
  sceneryRating: {
    type: Number,
    min: [1, 'La note de paysage minimale est 1'],
    max: [5, 'La note de paysage maximale est 5']
  },
  surfaceRating: {
    type: Number,
    min: [1, 'La note de surface minimale est 1'],
    max: [5, 'La note de surface maximale est 5']
  },
  trafficRating: {
    type: Number,
    min: [1, 'La note de trafic minimale est 1'],
    max: [5, 'La note de trafic maximale est 5']
  },
  images: [{
    url: String,
    caption: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  flags: {
    type: Number,
    default: 0
  },
  flaggedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  completedRoute: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances des requêtes
reviewSchema.index({ route: 1, user: 1 }, { unique: true });
reviewSchema.index({ route: 1, rating: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });

// Middleware pour mettre à jour la date de modification
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Méthode statique pour calculer la note moyenne d'un itinéraire
reviewSchema.statics.calculateAverageRating = async function(routeId) {
  const stats = await this.aggregate([
    { $match: { route: mongoose.Types.ObjectId(routeId) } },
    { $group: {
      _id: '$route',
      avgRating: { $avg: '$rating' },
      avgDifficulty: { $avg: '$difficultyRating' },
      avgScenery: { $avg: '$sceneryRating' },
      avgSurface: { $avg: '$surfaceRating' },
      avgTraffic: { $avg: '$trafficRating' },
      numReviews: { $sum: 1 }
    }}
  ]);
  
  // Mettre à jour les statistiques de l'itinéraire
  if (stats.length > 0) {
    try {
      const Route = mongoose.model('Route');
      await Route.findByIdAndUpdate(routeId, {
        'ratings.average': stats[0].avgRating,
        'ratings.difficulty': stats[0].avgDifficulty,
        'ratings.scenery': stats[0].avgScenery,
        'ratings.surface': stats[0].avgSurface,
        'ratings.traffic': stats[0].avgTraffic,
        'ratings.count': stats[0].numReviews
      });
    } catch (error) {
      console.error(`Erreur lors de la mise à jour des notes de l'itinéraire ${routeId}:`, error);
    }
  }
  
  return stats.length > 0 ? stats[0] : {
    avgRating: 0,
    avgDifficulty: 0,
    avgScenery: 0,
    avgSurface: 0,
    avgTraffic: 0,
    numReviews: 0
  };
};

// Méthode pour vérifier si un utilisateur a déjà noté un itinéraire
reviewSchema.statics.hasUserReviewed = async function(routeId, userId) {
  const review = await this.findOne({
    route: routeId,
    user: userId
  });
  
  return !!review;
};

// Méthode pour obtenir les avis les plus utiles pour un itinéraire
reviewSchema.statics.getMostHelpfulReviews = async function(routeId, limit = 3) {
  return this.find({ route: routeId })
    .sort({ likes: -1, createdAt: -1 })
    .limit(limit)
    .populate('user', 'firstName lastName profilePicture');
};

const RouteReview = mongoose.model('RouteReview', reviewSchema);

module.exports = RouteReview;
