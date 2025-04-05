/**
 * Modèle utilisateur pour le tableau de bord européen de cyclisme
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email requis'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Format d\'email invalide']
  },
  password: {
    type: String,
    required: [true, 'Mot de passe requis'],
    minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères']
  },
  firstName: {
    type: String,
    required: [true, 'Prénom requis'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Nom requis'],
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profilePicture: {
    type: String,
    default: ''
  },
  stravaConnected: {
    type: Boolean,
    default: false
  },
  stravaId: {
    type: String
  },
  preferences: {
    distanceUnit: {
      type: String,
      enum: ['km', 'mi'],
      default: 'km'
    },
    elevationUnit: {
      type: String,
      enum: ['m', 'ft'],
      default: 'm'
    },
    temperatureUnit: {
      type: String,
      enum: ['c', 'f'],
      default: 'c'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      enum: ['fr', 'en', 'de', 'es', 'it'],
      default: 'fr'
    }
  },
  cyclingStats: {
    ftp: {
      type: Number,
      min: 0
    },
    weight: {
      type: Number,
      min: 0
    },
    totalDistance: {
      type: Number,
      default: 0
    },
    totalElevation: {
      type: Number,
      default: 0
    },
    yearlyGoal: {
      type: Number,
      default: 5000
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true
});

/**
 * Méthodes du modèle
 */

// Hacher le mot de passe avant l'enregistrement
userSchema.pre('save', async function(next) {
  // Ne pas hacher à nouveau si le mot de passe n'a pas été modifié
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Comparer le mot de passe haché
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode statique pour hacher un mot de passe (utile pour les tests)
userSchema.statics.hashPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Transformer le document lors de la conversion en JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password; // Ne jamais renvoyer le mot de passe
  return user;
};

// Générer un nom d'affichage complet
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

const User = mongoose.model('User', userSchema);

module.exports = User;
