/**
 * Modèle pour les activités des utilisateurs dans le flux communautaire
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActivitySchema = new Schema({
  // Utilisateur qui a créé l'activité
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Type d'activité (ride, comment, event_join, achievement, challenge_completion, follow, kudos)
  type: {
    type: String,
    required: true,
    enum: ['ride', 'comment', 'event_join', 'achievement', 'challenge_completion', 'follow', 'kudos'],
    index: true
  },
  
  // Données spécifiques au type d'activité (structure flexible)
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Liste des utilisateurs qui ont donné un kudos à cette activité
  kudos: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Métadonnées temporelles
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // État de visibilité de l'activité
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  },
  
  // Localisation associée à l'activité (si applicable)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    name: String
  },
  
  // Stats spécifiques aux sorties vélo
  rideStats: {
    distance: Number,        // en km
    duration: Number,        // en secondes
    elevation: Number,       // en mètres
    averageSpeed: Number,    // en km/h
    maxSpeed: Number,        // en km/h
    power: Number,           // en watts
    calories: Number         // en kcal
  }
});

// Indexation pour les recherches géospatiales
ActivitySchema.index({ 'location.coordinates': '2dsphere' });

// Indexation pour les requêtes de flux d'activités
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ type: 1, createdAt: -1 });

/**
 * Méthodes statiques
 */
ActivitySchema.statics = {
  /**
   * Récupère les activités d'un utilisateur
   * @param {ObjectId} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination et filtrage
   * @returns {Promise<Activities[]>}
   */
  async getUserActivities(userId, options = {}) {
    const limit = parseInt(options.limit) || 20;
    const skip = parseInt(options.skip) || 0;
    const type = options.type || null;
    
    const query = { userId };
    if (type) query.type = type;
    
    return this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName profilePicture')
      .exec();
  },
  
  /**
   * Récupère le flux d'activités pour un utilisateur (ses propres activités + celles des personnes qu'il suit)
   * @param {ObjectId} userId - ID de l'utilisateur
   * @param {Array<ObjectId>} followingIds - IDs des utilisateurs suivis
   * @param {Object} options - Options de pagination et filtrage
   * @returns {Promise<Activities[]>}
   */
  async getFeed(userId, followingIds, options = {}) {
    const limit = parseInt(options.limit) || 20;
    const skip = parseInt(options.skip) || 0;
    
    // Combiner l'ID de l'utilisateur et les IDs des personnes suivies
    const userIds = [userId, ...followingIds];
    
    return this.find({
      userId: { $in: userIds },
      visibility: { $in: ['public', 'followers'] }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName profilePicture')
      .exec();
  }
};

module.exports = mongoose.model('Activity', ActivitySchema);
