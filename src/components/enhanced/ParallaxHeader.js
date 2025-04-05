import React from 'react';
import './ParallaxHeader.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';
import OptimizedImage from '../common/OptimizedImage';

const ParallaxHeader = () => {
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/parallaxheader"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <div className="parallax-header">
      <div className="parallax-layer parallax-layer-back">
        <div className="mountains"></div>
      </div>
      <div className="parallax-layer parallax-layer-base">
        <article className="header-content">
          <div className="logo">
            <OptimizedImage src="/images/logo.svg" alt="Grand Est Cyclisme" />
          </div>
          <h1>Grand Est Cyclisme</h1>
          <p>Explorez les plus beaux cols d'Europe</p>
        </div>
      </div>
    </div>
  );
};

export default ParallaxHeader;
