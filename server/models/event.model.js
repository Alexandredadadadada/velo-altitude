/**
 * Modèle pour les événements communautaires
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema({
  // Titre de l'événement
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
  
  // Type d'événement
  type: {
    type: String,
    required: true,
    enum: ['ride', 'race', 'workshop', 'social', 'training', 'other'],
    index: true
  },
  
  // Date et heure de l'événement
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Durée estimée (en minutes)
  duration: {
    type: Number,
    default: 120
  },
  
  // Limite de participants (0 = illimité)
  participantLimit: {
    type: Number,
    default: 0
  },
  
  // URL de l'image de couverture
  coverImage: {
    type: String,
    default: '/assets/images/events/default-event.jpg'
  },
  
  // Localisation
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
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    region: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'France'
    }
  },
  
  // Niveau de difficulté
  difficulty: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  
  // Distance (en km)
  distance: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Dénivelé (en m)
  elevation: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Itinéraire associé
  routeId: {
    type: Schema.Types.ObjectId,
    ref: 'Route',
    default: null
  },
  
  // Créateur de l'événement
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
    status: {
      type: String,
      enum: ['registered', 'waiting', 'cancelled'],
      default: 'registered'
    },
    registeredAt: {
      type: Date,
      default: Date.now
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
  
  // État de l'événement
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'published',
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

// Indexation pour les recherches géospatiales
EventSchema.index({ 'location.coordinates': '2dsphere' });

// Autres index utiles
EventSchema.index({ date: 1, status: 1 });
EventSchema.index({ type: 1, date: 1 });

/**
 * Méthodes statiques
 */
EventSchema.statics = {
  /**
   * Recherche des événements à venir
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Events[]>}
   */
  async findUpcoming(options = {}) {
    const limit = parseInt(options.limit) || 10;
    const skip = parseInt(options.skip) || 0;
    const type = options.type || null;
    const region = options.region || null;
    
    const now = new Date();
    
    const query = {
      date: { $gte: now },
      status: 'published',
      visibility: 'public'
    };
    
    if (type) query.type = type;
    if (region) query['location.region'] = region;
    
    return this.find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName profilePicture')
      .exec();
  },
  
  /**
   * Recherche des événements proches d'une position
   * @param {Array} coordinates - [longitude, latitude]
   * @param {Number} maxDistance - Distance maximale en mètres
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Events[]>}
   */
  async findNearby(coordinates, maxDistance = 50000, options = {}) {
    const limit = parseInt(options.limit) || 10;
    const skip = parseInt(options.skip) || 0;
    
    return this.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates
          },
          $maxDistance: maxDistance
        }
      },
      date: { $gte: new Date() },
      status: 'published',
      visibility: 'public'
    })
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName profilePicture')
      .exec();
  },
  
  /**
   * Recherche des événements auxquels un utilisateur participe
   * @param {ObjectId} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination
   * @returns {Promise<Events[]>}
   */
  async findUserEvents(userId, options = {}) {
    const limit = parseInt(options.limit) || 10;
    const skip = parseInt(options.skip) || 0;
    const includeCompleted = options.includeCompleted || false;
    
    const query = {
      'participants.user': userId,
      'participants.status': 'registered'
    };
    
    if (!includeCompleted) {
      query.date = { $gte: new Date() };
      query.status = { $ne: 'cancelled' };
    }
    
    return this.find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName profilePicture')
      .exec();
  }
};

/**
 * Méthodes d'instance
 */
EventSchema.methods = {
  /**
   * Ajoute un participant à l'événement
   * @param {ObjectId} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Résultat avec statut d'inscription
   */
  async addParticipant(userId) {
    // Vérifier si l'événement est complet
    if (this.participantLimit > 0 && 
        this.participants.filter(p => p.status === 'registered').length >= this.participantLimit) {
      // Ajouter à la liste d'attente
      this.participants.push({
        user: userId,
        status: 'waiting',
        registeredAt: new Date()
      });
      
      await this.save();
      return { success: true, status: 'waiting' };
    }
    
    // Vérifier si l'utilisateur est déjà inscrit
    const existingParticipant = this.participants.find(p => 
      p.user.toString() === userId.toString()
    );
    
    if (existingParticipant) {
      if (existingParticipant.status === 'cancelled') {
        // Réinscrire l'utilisateur
        existingParticipant.status = 'registered';
        existingParticipant.registeredAt = new Date();
        
        await this.save();
        return { success: true, status: 'registered' };
      }
      
      return { success: false, status: existingParticipant.status, error: 'Déjà inscrit' };
    }
    
    // Ajouter le participant
    this.participants.push({
      user: userId,
      status: 'registered',
      registeredAt: new Date()
    });
    
    await this.save();
    return { success: true, status: 'registered' };
  },
  
  /**
   * Annule la participation d'un utilisateur
   * @param {ObjectId} userId - ID de l'utilisateur
   * @returns {Promise<Boolean>} Succès de l'opération
   */
  async cancelParticipation(userId) {
    const participant = this.participants.find(p => 
      p.user.toString() === userId.toString() && 
      (p.status === 'registered' || p.status === 'waiting')
    );
    
    if (!participant) {
      return false;
    }
    
    participant.status = 'cancelled';
    
    // Si une place se libère, promouvoir un utilisateur de la liste d'attente
    if (participant.status === 'registered' && this.participantLimit > 0) {
      const waitingUser = this.participants.find(p => p.status === 'waiting');
      if (waitingUser) {
        waitingUser.status = 'registered';
      }
    }
    
    await this.save();
    return true;
  },
  
  /**
   * Calcule le nombre de places disponibles
   * @returns {Number|null} Nombre de places ou null si illimité
   */
  getAvailableSpots() {
    if (this.participantLimit === 0) {
      return null; // Places illimitées
    }
    
    const registeredCount = this.participants.filter(p => p.status === 'registered').length;
    return Math.max(0, this.participantLimit - registeredCount);
  },
  
  /**
   * Marque l'événement comme terminé
   * @returns {Promise<Event>}
   */
  async markAsCompleted() {
    this.status = 'completed';
    this.updatedAt = new Date();
    return this.save();
  }
};

module.exports = mongoose.model('Event', EventSchema);
