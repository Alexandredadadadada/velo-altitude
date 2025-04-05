import React from 'react';
import './NotFound.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';
import OptimizedImage from '../common/OptimizedImage';

const NotFound = () => {
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/notfound"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <main className="not-found-container">
      <h1>404 - Page Non Trouvée</h1>
      <p>Désolé, la page que vous recherchez n'existe pas.</p>
      <div className="not-found-image">
        <OptimizedImage src="/images/404-cyclist.svg" alt="Cycliste perdu" />
      </div>
      <p>Peut-être avez-vous pris le mauvais col ?</p>
      <a href="/" className="return-home-button">Retourner à l'accueil</a>
    </div>
  );
};

export default NotFound;
