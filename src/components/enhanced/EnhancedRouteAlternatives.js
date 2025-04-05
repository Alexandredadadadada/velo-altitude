import React from 'react';
import './EnhancedRouteAlternatives.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

const EnhancedRouteAlternatives = () => {
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/enhancedroutealternatives"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <div className="enhanced-route-alternatives">
      <div className="route-header">
        <h1>Alternatives d'Itinéraires</h1>
        <p>Découvrez différentes options pour votre parcours</p>
      </div>
      
      <div className="route-search">
        <div className="search-form">
          <div className="form-group">
            <label>Point de départ</label>
            <input type="text" placeholder="Saisissez un lieu de départ" />
          </div>
          
          <div className="form-group">
            <label>Destination</label>
            <input type="text" placeholder="Saisissez une destination" />
          </div>
          
          <div className="form-group">
            <label>Préférences</label>
            <select>
              <option value="fastest">Le plus rapide</option>
              <option value="scenic">Le plus panoramique</option>
              <option value="climbing">Maximum de dénivelé</option>
              <option value="flat">Minimum de dénivelé</option>
              <option value="quiet">Routes tranquilles</option>
            </select>
          </div>
          
          <button className="search-button">Rechercher</button>
        </div>
      </div>
      
      <div className="route-map">
        <div className="map-placeholder">
          <p>Carte interactive des itinéraires</p>
        </div>
      </div>
      
      <div className="route-alternatives">
        <h2>Itinéraires Suggérés</h2>
        
        <div className="alternatives-list">
          <div className="route-card">
            <div className="route-info">
              <h3>Itinéraire Classique</h3>
              <div className="route-stats">
                <div className="stat-item">
                  <span className="stat-label">Distance</span>
                  <span className="stat-value">45 km</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Dénivelé</span>
                  <span className="stat-value">650 m</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Durée estimée</span>
                  <span className="stat-value">2h30</span>
                </div>
              </div>
              <p>Parcours équilibré avec un bon mélange de plat et de montées modérées.</p>
              <div className="route-actions">
                <button className="action-button">Détails</button>
                <button className="action-button">Sélectionner</button>
              </div>
            </div>
          </div>
          
          <div className="route-card">
            <div className="route-info">
              <h3>Itinéraire Panoramique</h3>
              <div className="route-stats">
                <div className="stat-item">
                  <span className="stat-label">Distance</span>
                  <span className="stat-value">52 km</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Dénivelé</span>
                  <span className="stat-value">850 m</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Durée estimée</span>
                  <span className="stat-value">3h15</span>
                </div>
              </div>
              <p>Parcours plus long mais offrant des vues spectaculaires et des routes tranquilles.</p>
              <div className="route-actions">
                <button className="action-button">Détails</button>
                <button className="action-button">Sélectionner</button>
              </div>
            </div>
          </div>
          
          <div className="route-card">
            <div className="route-info">
              <h3>Itinéraire Rapide</h3>
              <div className="route-stats">
                <div className="stat-item">
                  <span className="stat-label">Distance</span>
                  <span className="stat-value">38 km</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Dénivelé</span>
                  <span className="stat-value">450 m</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Durée estimée</span>
                  <span className="stat-value">1h50</span>
                </div>
              </div>
              <p>Le parcours le plus direct avec un minimum de dénivelé pour un trajet rapide.</p>
              <div className="route-actions">
                <button className="action-button">Détails</button>
                <button className="action-button">Sélectionner</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedRouteAlternatives;
