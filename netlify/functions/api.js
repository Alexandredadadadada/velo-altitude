/**
 * Fonction API simplifiée pour Velo-Altitude
 * Approche incrémentale : d'abord assurer que le déploiement fonctionne
 */

exports.handler = async (event, context) => {
  console.log('API Velo-Altitude appelée', {
    path: event.path,
    httpMethod: event.httpMethod
  });
  
  // Réponse simple pour tester le déploiement
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      message: 'API Velo-Altitude fonctionnelle',
      timestamp: new Date().toISOString(),
      path: event.path,
      // Intégration future avec la base de données MongoDB Atlas (50 cols alpins et 5 défis "Les 7 Majeurs" déjà importés)
      services: {
        cols: '/api/cols',
        weather: '/api/weather',
        nutrition: '/api/nutrition',
        challenges: '/api/challenges'
      }
    })
  };
};
