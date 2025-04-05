/**
 * Modèle pour les commentaires sur les activités
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  // Utilisateur qui a créé le commentaire
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Activité sur laquelle porte le commentaire
  activityId: {
    type: Schema.Types.ObjectId,
    ref: 'Activity',
    required: true,
    index: true
  },
  
  // Contenu du commentaire
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // Commentaire parent en cas de réponse à un autre commentaire
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  
  // Liste des utilisateurs qui ont aimé ce commentaire
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Métadonnées temporelles
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: null
  },
  
  // Indique si le commentaire a été édité
  isEdited: {
    type: Boolean,
    default: false
  }
});

// Indexation pour les requêtes fréquentes
CommentSchema.index({ activityId: 1, createdAt: 1 });

/**
 * Méthodes statiques
 */
CommentSchema.statics = {
  /**
   * Récupère les commentaires d'une activité
   * @param {ObjectId} activityId - ID de l'activité
   * @param {Object} options - Options de pagination
   * @returns {Promise<Comments[]>}
   */
  async getActivityComments(activityId, options = {}) {
    const limit = parseInt(options.limit) || 10;
    const skip = parseInt(options.skip) || 0;
    
    return this.find({ activityId, parentId: null })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName profilePicture')
      .exec();
  },
  
  /**
   * Récupère les réponses à un commentaire
   * @param {ObjectId} commentId - ID du commentaire parent
   * @param {Object} options - Options de pagination
   * @returns {Promise<Comments[]>}
   */
  async getCommentReplies(commentId, options = {}) {
    const limit = parseInt(options.limit) || 5;
    const skip = parseInt(options.skip) || 0;
    
    return this.find({ parentId: commentId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName profilePicture')
      .exec();
  },
  
  /**
   * Compte le nombre de commentaires pour une activité
   * @param {ObjectId} activityId - ID de l'activité
   * @returns {Promise<Number>}
   */
  async countActivityComments(activityId) {
    return this.countDocuments({ activityId });
  }
};

/**
 * Méthodes d'instance
 */
CommentSchema.methods = {
  /**
   * Mettre à jour le contenu d'un commentaire
   * @param {String} newContent - Nouveau contenu
   * @returns {Promise<Comment>}
   */
  async updateContent(newContent) {
    this.content = newContent;
    this.updatedAt = new Date();
    this.isEdited = true;
    return this.save();
  },
  
  /**
   * Ajouter un like au commentaire
   * @param {ObjectId} userId - ID de l'utilisateur
   * @returns {Promise<Boolean>} - true si ajouté, false si déjà présent
   */
  async addLike(userId) {
    if (this.likes.includes(userId)) {
      return false;
    }
    
    this.likes.push(userId);
    await this.save();
    return true;
  },
  
  /**
   * Retirer un like du commentaire
   * @param {ObjectId} userId - ID de l'utilisateur
   * @returns {Promise<Boolean>} - true si retiré, false si non présent
   */
  async removeLike(userId) {
    const initialLength = this.likes.length;
    this.likes = this.likes.filter(id => id.toString() !== userId.toString());
    
    if (this.likes.length === initialLength) {
      return false;
    }
    
    await this.save();
    return true;
  }
};

module.exports = mongoose.model('Comment', CommentSchema);
