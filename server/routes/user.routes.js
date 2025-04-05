/**
 * Routes pour la gestion des utilisateurs
 */
const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { authenticateJWT, isAdmin, isResourceOwner } = require('../middleware/auth.middleware');

/**
 * @route GET /api/users
 * @desc Récupérer la liste de tous les utilisateurs
 * @access Admin
 */
router.get('/', authenticateJWT, isAdmin, async (req, res) => {
  try {
    // Paramètres de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filtres
    const filters = {};
    if (req.query.role) filters.role = req.query.role;
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filters.$or = [
        { email: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex }
      ];
    }
    
    // Récupérer les utilisateurs
    const users = await User.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password');
    
    // Compter le nombre total d'utilisateurs
    const total = await User.countDocuments(filters);
    
    res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
});

/**
 * @route GET /api/users/:id
 * @desc Récupérer un utilisateur par son ID
 * @access Admin ou Propriétaire
 */
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Vérifier les permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    // Récupérer l'utilisateur
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});

/**
 * @route PUT /api/users/:id
 * @desc Mettre à jour un utilisateur
 * @access Admin ou Propriétaire
 */
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Vérifier les permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    // Champs autorisés pour la mise à jour
    const { firstName, lastName, email, preferences } = req.body;
    
    // Ne pas permettre de modifier le rôle sauf pour les admins
    const updateData = { firstName, lastName, email, preferences };
    
    // Seuls les admins peuvent modifier les rôles
    if (req.user.role === 'admin' && req.body.role) {
      updateData.role = req.body.role;
    }
    
    // Mise à jour de l'utilisateur
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

/**
 * @route DELETE /api/users/:id
 * @desc Supprimer un utilisateur
 * @access Admin
 */
router.delete('/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Protéger contre la suppression de son propre compte admin
    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    
    // Supprimer l'utilisateur
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});

/**
 * @route PUT /api/users/profile
 * @desc Mettre à jour son propre profil
 * @access Private
 */
router.put('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Champs autorisés pour la mise à jour du profil
    const { firstName, lastName, preferences } = req.body;
    
    // Mise à jour du profil
    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, preferences },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
  }
});

/**
 * @route PUT /api/users/password
 * @desc Changer son mot de passe
 * @access Private
 */
router.put('/password', authenticateJWT, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.findById(req.user._id);
    
    // Vérifier le mot de passe actuel
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }
    
    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({ message: 'Erreur lors du changement de mot de passe' });
  }
});

/**
 * @route GET /api/users/stats
 * @desc Obtenir des statistiques sur les utilisateurs
 * @access Admin
 */
router.get('/stats', authenticateJWT, isAdmin, async (req, res) => {
  try {
    // Statistiques globales
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const usersByMonth = await User.aggregate([
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" }, 
            month: { $month: "$createdAt" } 
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);
    
    // Utilisateurs actifs (s'étant connectés dans les 30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({ 
      lastLoginAt: { $gte: thirtyDaysAgo } 
    });
    
    res.json({
      totalUsers,
      adminUsers,
      activeUsers,
      usersByMonth,
      roles: {
        admin: adminUsers,
        user: totalUsers - adminUsers
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
});

/**
 * @route PUT /api/users/:id/strava-connect
 * @desc Connecter un compte Strava
 * @access Private (propriétaire du compte)
 */
router.put('/:id/strava-connect', authenticateJWT, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Vérifier les permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    const { stravaId, stravaConnected } = req.body;
    
    // Mise à jour de l'utilisateur
    const user = await User.findByIdAndUpdate(
      userId,
      { stravaId, stravaConnected },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la connexion Strava:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion Strava' });
  }
});

module.exports = router;
