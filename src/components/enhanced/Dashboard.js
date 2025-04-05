import React from 'react';
import './Dashboard.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

const Dashboard = () => {
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/dashboard"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <main className="dashboard-container">
      <h1>Tableau de Bord</h1>
      <p>Votre espace personnalisé pour suivre vos activités et performances</p>
      
      <div className="dashboard-widgets">
        <div className="widget">
          <h2>Résumé d'Activités</h2>
          <article className="widget-content">
            <p>Connectez-vous pour voir vos activités récentes</p>
          </div>
        </div>
        
        <div className="widget">
          <h2>Cols Favoris</h2>
          <article className="widget-content">
            <p>Vos cols préférés apparaîtront ici</p>
          </div>
        </div>
        
        <div className="widget">
          <h2>Progression d'Entraînement</h2>
          <article className="widget-content">
            <p>Suivez votre progression ici</p>
          </div>
        </div>
        
        <div className="widget">
          <h2>Météo Locale</h2>
          <article className="widget-content">
            <p>Chargement des données météo...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
