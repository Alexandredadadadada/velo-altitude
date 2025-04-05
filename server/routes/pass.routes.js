// routes/pass.routes.js - Routes pour les cols cyclistes
const express = require('express');
const router = express.Router();
const passController = require('../controllers/pass.controller');

// Routes pour la gestion des cols
router.get('/', passController.getAllPasses.bind(passController));
router.get('/:id', passController.getPassById.bind(passController));
router.post('/', passController.createPass.bind(passController));
router.put('/:id', passController.updatePass.bind(passController));
router.delete('/:id', passController.deletePass.bind(passController));

module.exports = router;
