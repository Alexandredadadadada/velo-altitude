/**
 * Routes API pour les conditions des cols
 */
const express = require('express');
const router = express.Router();
const colsConditionsService = require('../services/cols-conditions-monitor.service');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');

/**
 * @route GET /api/cols-conditions
 * @desc Récupérer les conditions pour tous les cols
 * @access Public
 */
router.get('/', (req, res) => {
  try {
    const conditions = colsConditionsService.getAllColsConditions();
    res.json(conditions);
  } catch (error) {
    console.error('Erreur lors de la récupération des conditions des cols:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des conditions des cols' });
  }
});

/**
 * @route GET /api/cols-conditions/:colId
 * @desc Récupérer les conditions pour un col spécifique
 * @access Public
 */
router.get('/:colId', (req, res) => {
  try {
    const { colId } = req.params;
    const conditions = colsConditionsService.getColConditions(colId);
    
    if (!conditions) {
      return res.status(404).json({ error: 'Col non trouvé' });
    }
    
    res.json(conditions);
  } catch (error) {
    console.error(`Erreur lors de la récupération des conditions pour le col ${req.params.colId}:`, error);
    res.status(500).json({ error: 'Erreur lors de la récupération des conditions du col' });
  }
});

/**
 * @route GET /api/cols-conditions/alerts/active
 * @desc Récupérer les alertes actives
 * @access Public
 */
router.get('/alerts/active', (req, res) => {
  try {
    const { type, severity, colId, limit } = req.query;
    const alerts = colsConditionsService.getActiveAlerts({ type, severity, colId, limit });
    res.json({ count: alerts.length, alerts });
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des alertes' });
  }
});

/**
 * @route POST /api/cols-conditions/:colId/update
 * @desc Forcer la mise à jour des conditions pour un col spécifique
 * @access Admin
 */
router.post('/:colId/update', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { colId } = req.params;
    const conditions = await colsConditionsService.updateColConditions(colId);
    res.json(conditions);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour des conditions pour le col ${req.params.colId}:`, error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des conditions du col' });
  }
});

/**
 * @route POST /api/cols-conditions/update-all
 * @desc Forcer la mise à jour des conditions pour tous les cols
 * @access Admin
 */
router.post('/update-all', authenticateJWT, isAdmin, async (req, res) => {
  try {
    // Démarrer la mise à jour en arrière-plan
    colsConditionsService.updateAllColsConditions();
    
    res.json({ 
      message: 'Mise à jour des conditions lancée en arrière-plan',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des conditions de tous les cols:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des conditions' });
  }
});

module.exports = router;
