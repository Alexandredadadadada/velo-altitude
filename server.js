const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Create a simple API endpoint to simulate backend
app.get('/api/cols', (req, res) => {
  const cols = [
    {
      id: 1,
      name: 'Col de la Schlucht',
      region: 'Vosges',
      elevation: 1139,
      difficulty: 'medium',
      length: 9.3,
      avgGradient: 6.8,
      description: 'Un col emblématique des Vosges, offrant une vue panoramique exceptionnelle.',
      image: '/images/summits/col-schlucht.jpg'
    },
    {
      id: 2,
      name: 'Grand Ballon',
      region: 'Vosges',
      elevation: 1424,
      difficulty: 'hard',
      length: 13.5,
      avgGradient: 7.2,
      description: 'Le point culminant des Vosges, avec un panorama à 360° sur la plaine d\'Alsace et la Forêt Noire.',
      image: '/images/summits/grand-ballon.jpg'
    },
    {
      id: 3,
      name: 'Col du Donon',
      region: 'Vosges',
      elevation: 727,
      difficulty: 'easy',
      length: 7.8,
      avgGradient: 5.1,
      description: 'Un col accessible offrant une belle introduction au massif vosgien.',
      image: '/images/summits/col-donon.jpg'
    },
    {
      id: 4,
      name: 'Col de Grosse Pierre',
      region: 'Vosges',
      elevation: 955,
      difficulty: 'medium',
      length: 6.2,
      avgGradient: 8.3,
      description: 'Un col exigeant avec des passages raides et techniques.',
      image: '/images/summits/col-grosse-pierre.jpg'
    }
  ];
  
  res.json({
    success: true,
    count: cols.length,
    data: cols
  });
});

// Create a simple HTML page for demo
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
