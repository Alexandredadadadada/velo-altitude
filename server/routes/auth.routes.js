/**
 * Routes d'authentification
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { authenticateJWT } = require('../middleware/auth.middleware');

/**
 * @route POST /api/auth/register
 * @desc Inscription d'un nouvel utilisateur
 * @access Public
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Créer le nouvel utilisateur
    const user = new User({
      email,
      password,  // Le mot de passe sera haché automatiquement via le middleware pre-save
      firstName,
      lastName,
      role: role === 'admin' ? 'admin' : 'user'  // Par défaut, le rôle est 'user'
    });
    
    await user.save();
    
    // Générer un token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.SESSION_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user,
      token
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Connexion d'un utilisateur
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Mettre à jour la date de dernière connexion
    user.lastLoginAt = new Date();
    await user.save();
    
    // Générer un token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.SESSION_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Connexion réussie',
      user,
      token
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Récupérer le profil de l'utilisateur connecté
 * @access Private
 */
router.get('/me', authenticateJWT, (req, res) => {
  res.json(req.user);
});

/**
 * @route POST /api/auth/logout
 * @desc Déconnexion d'un utilisateur (côté serveur)
 * @access Private
 */
router.post('/logout', authenticateJWT, (req, res) => {
  // Le token JWT est invalidé côté client
  // On pourrait implémenter une liste noire de tokens si nécessaire
  res.json({ message: 'Déconnexion réussie' });
});

/**
 * @route POST /api/auth/refresh-token
 * @desc Rafraîchir le token JWT
 * @access Public (avec un token de rafraîchissement)
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Token de rafraîchissement requis' });
    }
    
    // Vérifier le token de rafraîchissement (à implémenter)
    // ...
    
    // Générer un nouveau token JWT
    const token = jwt.sign(
      { userId: req.user._id },
      process.env.SESSION_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Token rafraîchi avec succès',
      token
    });
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    res.status(500).json({ message: 'Erreur lors du rafraîchissement du token' });
  }
});

/**
 * @route POST /api/auth/reset-password-request
 * @desc Demander une réinitialisation de mot de passe
 * @access Public
 */
router.post('/reset-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Aucun compte avec cet email' });
    }
    
    // Générer un token de réinitialisation
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.RESET_PASSWORD_SECRET,
      { expiresIn: '1h' }
    );
    
    // Envoyer un email avec le lien de réinitialisation (à implémenter)
    // ...
    
    res.json({ message: 'Instructions envoyées à votre email' });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({ message: 'Erreur lors de la demande de réinitialisation' });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Réinitialiser le mot de passe avec un token
 * @access Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
    
    // Récupérer l'utilisateur
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe' });
  }
});

module.exports = router;
