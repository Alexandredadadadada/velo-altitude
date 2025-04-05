const express = require('express');
const router = express.Router();
const challengesController = require('../controllers/challengesController');
const { authenticate } = require('../middleware/auth');

/**
 * Routes pour les défis cyclistes
 * /api/challenges
 */

// Routes publiques (ne nécessitant pas d'authentification)
router.get('/', challengesController.getAllChallenges);
router.get('/:challengeId', challengesController.getChallengeById);
router.get('/:challengeId/leaderboard', challengesController.getChallengeLeaderboard);

// Routes privées (nécessitant une authentification)
router.get('/users/:userId/all-progress', authenticate, challengesController.getUserAllChallengesProgress);
router.get('/users/:userId/stats', authenticate, challengesController.getUserChallengeStats);
router.get('/users/:userId/challenge-progress/:challengeId', authenticate, challengesController.getUserChallengeProgress);

// Routes pour la gestion de la progression d'un utilisateur
router.post(
  '/users/:userId/challenge-progress/:challengeId/cols/:colId',
  authenticate,
  challengesController.uploadColPhoto,
  challengesController.updateColProgress
);

router.delete(
  '/users/:userId/challenge-progress/:challengeId/cols/:colId',
  authenticate,
  challengesController.deleteColProgress
);

module.exports = router;
