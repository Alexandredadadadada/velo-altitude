/**
 * Routes pour le système de défi des cols
 * @module routes/col-challenge.routes
 */

const colChallengeController = require('../controllers/col-challenge.controller');
const express = require('express');
const router = express.Router();
const cacheMiddleware = require('../middlewares/cache.middleware');
const { authenticateUser } = require('../middlewares/auth.middleware');

// Préfixe de base pour les routes de défi des cols
const BASE_PATH = '/api/col-challenges';

// Routes publiques avec mise en cache
router.get('/available', cacheMiddleware.cache('challenge', 120), (req, res) => {
  colChallengeController.getAvailableChallenges(req, res);
});

router.get('/:challengeId/leaderboard', cacheMiddleware.cache('challenge', 15), (req, res) => {
  colChallengeController.getLeaderboard(req, res);
});

router.get('/:challengeId/col/:colId/details', cacheMiddleware.cache('challenge', 60), (req, res) => {
  colChallengeController.getColDetails(req, res);
});

router.get('/badge/:badgeId', cacheMiddleware.cache('challenge', 120), (req, res) => {
  colChallengeController.getBadgeDetails(req, res);
});

router.get('/:challengeId/statistics', cacheMiddleware.cache('challenge', 30), (req, res) => {
  colChallengeController.getChallengeStatistics(req, res);
});

// Routes authentifiées
router.get('/user/:userId', authenticateUser, (req, res) => {
  colChallengeController.getUserChallenges(req, res);
});

router.get('/:challengeId/user/:userId', authenticateUser, (req, res) => {
  colChallengeController.getUserChallenge(req, res);
});

router.post('/:challengeId/user/:userId', authenticateUser, (req, res) => {
  colChallengeController.createOrUpdateChallenge(req, res);
});

router.put('/:challengeId/user/:userId/col/:colId', authenticateUser, (req, res) => {
  colChallengeController.updateColProgress(req, res);
});

router.post('/:challengeId/user/:userId/col/:colId/effort', authenticateUser, (req, res) => {
  colChallengeController.addColEffort(req, res);
});

router.post('/:challengeId/user/:userId/share', authenticateUser, (req, res) => {
  colChallengeController.shareOnSocialMedia(req, res);
});

router.get('/:challengeId/user/:userId/certificate', authenticateUser, (req, res) => {
  colChallengeController.getCompletionCertificate(req, res);
});

module.exports = router;
