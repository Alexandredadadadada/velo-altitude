// Routes API communautaires : événements et témoignages
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const EVENTS_PATH = path.join(__dirname, '../data/community/events.json');
const TESTIMONIALS_PATH = path.join(__dirname, '../data/community/testimonials.json');

// GET /api/community/events
router.get('/events', (req, res) => {
  if (!fs.existsSync(EVENTS_PATH)) return res.json([]);
  const data = JSON.parse(fs.readFileSync(EVENTS_PATH, 'utf8'));
  res.json(data);
});

// GET /api/community/testimonials
router.get('/testimonials', (req, res) => {
  if (!fs.existsSync(TESTIMONIALS_PATH)) return res.json([]);
  const data = JSON.parse(fs.readFileSync(TESTIMONIALS_PATH, 'utf8'));
  res.json(data);
});

module.exports = router;
