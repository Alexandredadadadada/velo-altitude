// Route API pour import batch de cols enrichis
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '../data/cols/enriched');

// POST /api/cols/import
router.post('/import', (req, res) => {
  const { id, name, country, region, length_km, avg_gradient, max_elevation, difficulty, description, coordinates, elevation_profile, images, videos, weather_patterns, records } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: 'id et name obligatoires' });
  }
  const filePath = path.join(DATA_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    return res.status(409).json({ error: 'Col déjà présent' });
  }
  const data = { id, name, country, region, length_km, avg_gradient, max_elevation, difficulty, description, coordinates, elevation_profile, images, videos, weather_patterns, records };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return res.json({ success: true, col: id });
});

module.exports = router;
