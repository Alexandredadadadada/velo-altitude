/**
 * Routes pour les fonctionnalités sociales
 * Gère les connexions entre utilisateurs, partage d'activités et interactions
 */

const express = require('express');
const router = express.Router();
const socialController = require('../controllers/social.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Toutes les routes sociales nécessitent une authentification
router.use(authMiddleware.validateToken);

// Gestion des connexions entre utilisateurs
router.post('/users/:userId/follow', socialController.followUser);
router.delete('/users/:userId/follow/:targetUserId', socialController.unfollowUser);
router.get('/users/:userId/following', socialController.getFollowing);
router.get('/users/:userId/followers', socialController.getFollowers);

// Partage d'activités et interactions
router.post('/users/:userId/share', socialController.shareActivity);
router.post('/shares/:shareId/comments', socialController.addComment);
router.post('/shares/:shareId/kudos', socialController.addKudo);

// Fil d'activités et recherche
router.get('/users/:userId/feed', socialController.getFeed);
router.get('/search/users', socialController.searchUsers);
router.get('/users/:userId/stats', socialController.getUserSocialStats);

module.exports = router;
