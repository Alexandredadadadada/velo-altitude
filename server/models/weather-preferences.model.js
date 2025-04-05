/**
 * Modèle pour les préférences météo des utilisateurs
 */
const mongoose = require('mongoose');

const WeatherPreferencesSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  alertEnabled: {
    type: Boolean,
    default: true
  },
  notificationChannels: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  thresholds: {
    temperature: {
      min: {
        type: Number,
        default: 5
      },
      max: {
        type: Number,
        default: 35
      },
      enabled: {
        type: Boolean,
        default: true
      }
    },
    precipitation: {
      probability: {
        type: Number,
        default: 50 // en pourcentage
      },
      intensity: {
        type: Number,
        default: 5 // en mm/h
      },
      enabled: {
        type: Boolean,
        default: true
      }
    },
    wind: {
      speed: {
        type: Number,
        default: 25 // en km/h
      },
      enabled: {
        type: Boolean,
        default: true
      }
    },
    visibility: {
      distance: {
        type: Number,
        default: 1000 // en mètres
      },
      enabled: {
        type: Boolean,
        default: false
      }
    },
    snow: {
      enabled: {
        type: Boolean,
        default: true
      }
    }
  },
  favoriteRoutes: {
    enabled: {
      type: Boolean,
      default: true
    },
    alertBefore: {
      type: Number,
      default: 24 // heures
    },
    routeIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    }],
    alertFrequency: {
      type: String,
      enum: ['once', 'daily'],
      default: 'daily'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('WeatherPreferences', WeatherPreferencesSchema);
