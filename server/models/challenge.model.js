/**
 * Modèle pour les défis communautaires
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChallengeSchema = new Schema({
  // Titre du défi
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Description détaillée
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // Type de défi
  type: {
    type: String,
    required: true,
    enum: ['distance', 'elevation', 'duration', 'segment', 'col', 'custom'],
    index: true
  },
  
  // Date de début et fin
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Objectif à atteindre
  objective: {
    // Valeur cible (distance en km, dénivelé en m, durée en minutes, etc.)
    value: {
      type: Number,
      required: true
    },
    // Unité de la valeur (km, m, min, etc.)
    unit: {
      type: String,
      required: true,
      enum: ['km', 'm', 'min', 'count']
    }
  },
  
  // URL de l'image de couverture
  coverImage: {
    type: String,
    default: '/assets/images/challenges/default-challenge.jpg'
  },
  
  // Niveau de difficulté
  difficulty: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  
  // Points de réputation accordés
  reputationPoints: {
    type: Number,
    default: 100
  },
  
  // Badge associé au défi
  badge: {
    name: String,
    imageUrl: String,
    description: String
  },
  
  // Cols associés au défi (si type = 'col')
  cols: [{
    type: Schema.Types.ObjectId,
    ref: 'Pass'
  }],
  
  // Segment associé au défi (si type = 'segment')
  segmentId: {
    type: String,
    default: null
  },
  
  // Créateur du défi
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Liste des participants
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    }
  }],
  
  // Métadonnées temporelles
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: null
  },
  
  // État du défi
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'active',
    index: true
  },
  
  // Visibilité
  visibility: {
    type: String,
    enum: ['public', 'private', 'club'],
    default: 'public'
  },
  
  // Club ou groupe organisateur
  organizingClub: {
    type: String,
    trim: true,
    default: null
  },
  
  // Mots-clés pour la recherche
  tags: [{
    type: String,
    trim: true
  }]
});

// Index utiles
ChallengeSchema.index({ startDate: 1, endDate: 1, status: 1 });
ChallengeSchema.index({ type: 1, startDate: 1 });

/**
 * Méthodes statiques
 */
ChallengeSchema.statics = {
  /**
   * Recherche des défis actifs
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Challenges[]>}
   */
  async findActive(options = {}) {
    const limit = parseInt(options.limit) || 10;
    const skip = parseInt(options.skip) || 0;
    const type = options.type || null;
    
    const now = new Date();
    
    const query = {
      startDate: { $lte: now },
      endDate: { $gte: now },
      status: 'active',
      visibility: 'public'
    };
    
    if (type) query.type = type;
    
    return this.find(query)
      .sort({ endDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName profilePicture')
      .exec();
  },
  
  /**
   * Recherche des défis à venir
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Challenges[]>}
   */
  async findUpcoming(options = {}) {
    const limit = parseInt(options.limit) || 10;
    const skip = parseInt(options.skip) || 0;
    
    const now = new Date();
    
    return this.find({
      startDate: { $gt: now },
      status: 'active',
      visibility: 'public'
    })
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName profilePicture')
      .exec();
  },
  
  /**
   * Recherche des défis auxquels un utilisateur participe
   * @param {ObjectId} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination
   * @returns {Promise<Challenges[]>}
   */
  async findUserChallenges(userId, options = {}) {
    const limit = parseInt(options.limit) || 10;
    const skip = parseInt(options.skip) || 0;
    const includeCompleted = options.includeCompleted || false;
    
    const now = new Date();
    const query = {
      'participants.user': userId
    };
    
    if (!includeCompleted) {
      query.endDate = { $gte: now };
      query.status = 'active';
    }
    
    return this.find(query)
      .sort({ endDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName profilePicture')
      .exec();
  }
};

/**
 * Méthodes d'instance
 */
ChallengeSchema.methods = {
  /**
   * Ajoute un participant au défi
   * @param {ObjectId} userId - ID de l'utilisateur
   * @returns {Promise<Boolean>} Succès de l'opération
   */
  async addParticipant(userId) {
    // Vérifier si l'utilisateur est déjà inscrit
    const existingParticipant = this.participants.find(p => 
      p.user.toString() === userId.toString()
    );
    
    if (existingParticipant) {
      return false;
    }
    
    // Ajouter le participant
    this.participants.push({
      user: userId,
      joinedAt: new Date(),
      progress: 0,
      completed: false
    });
    
    await this.save();
    return true;
  },
  
  /**
   * Met à jour la progression d'un participant
   * @param {ObjectId} userId - ID de l'utilisateur
   * @param {Number} newProgress - Nouvelle valeur de progression
   * @returns {Promise<Object>} Résultat avec info de complétion
   */
  async updateProgress(userId, newProgress) {
    const participant = this.participants.find(p => 
      p.user.toString() === userId.toString()
    );
    
    if (!participant) {
      return { success: false, error: 'Participant non trouvé' };
    }
    
    // Mettre à jour la progression
    participant.progress = newProgress;
    
    // Vérifier si le défi est complété
    const isNewlyCompleted = !participant.completed && newProgress >= this.objective.value;
    if (isNewlyCompleted) {
      participant.completed = true;
      participant.completedAt = new Date();
    }
    
    await this.save();
    return { 
      success: true, 
      completed: participant.completed,
      justCompleted: isNewlyCompleted,
      progress: newProgress,
      objective: this.objective.value 
    };
  },
  
  /**
   * Calcule le pourcentage de progression pour un utilisateur
   * @param {ObjectId} userId - ID de l'utilisateur
   * @returns {Number} Pourcentage de progression (0-100)
   */
  getProgressPercentage(userId) {
    const participant = this.participants.find(p => 
      p.user.toString() === userId.toString()
    );
    
    if (!participant) {
      return 0;
    }
    
    const percentage = (participant.progress / this.objective.value) * 100;
    return Math.min(100, Math.round(percentage));
  },
  
  /**
   * Vérifie si le défi est actif à la date actuelle
   * @returns {Boolean} Est actif ou non
   */
  isActive() {
    const now = new Date();
    return (
      this.status === 'active' &&
      this.startDate <= now &&
      this.endDate >= now
    );
  }
};

module.exports = mongoose.model('Challenge', ChallengeSchema);
