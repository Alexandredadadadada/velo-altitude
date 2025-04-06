// netlify/functions/post-processing.js
// Optimisation des performances pour l'application Velo-Altitude
exports.handler = async (event, context) => {
  // Extrait le HTML original
  const html = event.body;
  
  // Implémente des optimisations de performance:
  // 1. Ajoute des indices de préchargement pour les ressources critiques
  const optimizedHtml = html.replace(
    '</head>',
    `
    <!-- Préchargement des ressources critiques -->
    <link rel="preload" href="/static/css/main.css" as="style">
    <link rel="preload" href="/static/js/main.js" as="script">
    <link rel="preload" href="/auth-override.js" as="script">
    <link rel="dns-prefetch" href="https://api.mapbox.com">
    <link rel="dns-prefetch" href="https://api.openweathermap.org">
    <link rel="dns-prefetch" href="https://api.strava.com">
    <meta name="description" content="Velo-Altitude - La plateforme complète pour les cyclistes de montagne">
    </head>
    `
  );
  
  return {
    statusCode: 200,
    body: optimizedHtml,
    headers: {
      'Content-Type': 'text/html',
    },
  };
};
