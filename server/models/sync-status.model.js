/**
 * Modèle pour le suivi des synchronisations Strava
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SyncStatusSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['initializing', 'in_progress', 'completed', 'error', 'cancelled', 'never_synced'],
    default: 'initializing'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  },
  options: {
    fullSync: Boolean,
    daysToSync: Number,
    startDate: Date,
    endDate: Date
  },
  stats: {
    total: {
      type: Number,
      default: 0
    },
    processed: {
      type: Number,
      default: 0
    },
    added: {
      type: Number,
      default: 0
    },
    updated: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    skipped: {
      type: Number,
      default: 0
    }
  },
  error: {
    message: String,
    code: String,
    details: String
  },
  message: String
}, {
  timestamps: true
});

// Indexer les champs fréquemment utilisés pour les requêtes
SyncStatusSchema.index({ userId: 1, startTime: -1 });
SyncStatusSchema.index({ status: 1, lastUpdate: -1 });

// Méthodes virtuelles pour calculer des informations utiles
SyncStatusSchema.virtual('duration').get(function() {
  if (!this.endTime) return null;
  return this.endTime - this.startTime;
});

SyncStatusSchema.virtual('durationInSeconds').get(function() {
  if (!this.endTime) return null;
  return Math.round((this.endTime - this.startTime) / 1000);
});

SyncStatusSchema.virtual('successRate').get(function() {
  if (!this.stats || this.stats.processed === 0) return 100;
  const successful = this.stats.added + this.stats.updated + this.stats.skipped;
  return Math.round((successful / this.stats.processed) * 100);
});

// Créer un index TTL pour nettoyer automatiquement les anciens enregistrements
// Garde les enregistrements pendant 30 jours
SyncStatusSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('SyncStatus', SyncStatusSchema);
