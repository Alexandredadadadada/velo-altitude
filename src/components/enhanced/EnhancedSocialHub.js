import React from 'react';
import './EnhancedSocialHub.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';
import OptimizedImage from '../common/OptimizedImage';

const EnhancedSocialHub = () => {
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/enhancedsocialhub"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <div className="enhanced-social-hub">
      <div className="social-header">
        <h1>Hub Social</h1>
        <p>Connectez-vous avec d'autres cyclistes et partagez vos expériences</p>
      </div>
      
      <article className="social-content">
        <div className="social-feed">
          <h2>Fil d'Activités</h2>
          
          <div className="activity-filters">
            <button className="filter-button active">Tous</button>
            <button className="filter-button">Amis</button>
            <button className="filter-button">Groupes</button>
            <button className="filter-button">Événements</button>
            <button className="filter-button">Défis</button>
          </div>
          
          <div className="activity-list">
            <div className="activity-card">
              <div className="activity-header">
                <div className="user-avatar">
                  <OptimizedImage src="/images/avatar-placeholder.jpg" alt="Avatar utilisateur" />
                </div>
                <div className="activity-info">
                  <h3>Jean Dupont</h3>
                  <span className="activity-time">Il y a 2 heures</span>
                </div>
              </div>
              <article className="activity-content">
                <p>J'ai gravi le Col du Galibier aujourd'hui ! Une montée difficile mais quelle vue au sommet !</p>
                <div className="activity-image">
                  <OptimizedImage src="/images/activity-placeholder.jpg" alt="Col du Galibier" />
                </div>
              </div>
              <div className="activity-stats">
                <div className="stat-item">
                  <span className="stat-label">Distance</span>
                  <span className="stat-value">85 km</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Dénivelé</span>
                  <span className="stat-value">2100 m</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Durée</span>
                  <span className="stat-value">4h30</span>
                </div>
              </div>
              <div className="activity-actions">
                <button className="action-button">
                  <span className="action-icon like-icon"></span>
                  <span>J'aime</span>
                </button>
                <button className="action-button">
                  <span className="action-icon comment-icon"></span>
                  <span>Commenter</span>
                </button>
                <button className="action-button">
                  <span className="action-icon share-icon"></span>
                  <span>Partager</span>
                </button>
              </div>
            </div>
            
            <div className="activity-card">
              <div className="activity-header">
                <div className="user-avatar">
                  <OptimizedImage src="/images/avatar-placeholder-2.jpg" alt="Avatar utilisateur" />
                </div>
                <div className="activity-info">
                  <h3>Marie Martin</h3>
                  <span className="activity-time">Hier</span>
                </div>
              </div>
              <article className="activity-content">
                <p>Qui serait partant pour une sortie dimanche matin dans les Vosges ? Départ 8h de Strasbourg, parcours de 120km.</p>
              </div>
              <div className="activity-actions">
                <button className="action-button">
                  <span className="action-icon like-icon"></span>
                  <span>J'aime</span>
                </button>
                <button className="action-button">
                  <span className="action-icon comment-icon"></span>
                  <span>Commenter</span>
                </button>
                <button className="action-button">
                  <span className="action-icon share-icon"></span>
                  <span>Partager</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="social-sidebar">
          <div className="sidebar-section">
            <h3>Événements à venir</h3>
            <div className="event-list">
              <div className="event-item">
                <div className="event-date">
                  <span className="event-day">15</span>
                  <span className="event-month">Avr</span>
                </div>
                <div className="event-details">
                  <h4>Randonnée des Cols Vosgiens</h4>
                  <p>Parcours de 150km avec 6 cols</p>
                </div>
              </div>
              <div className="event-item">
                <div className="event-date">
                  <span className="event-day">22</span>
                  <span className="event-month">Avr</span>
                </div>
                <div className="event-details">
                  <h4>Sortie Club Grand Est</h4>
                  <p>Parcours découverte autour de Nancy</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Défis Populaires</h3>
            <div className="challenge-list">
              <div className="challenge-item">
                <h4>Défi des 5 Cols</h4>
                <div className="challenge-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '60%'}}></div>
                  </div>
                  <span className="progress-text">3/5 cols</span>
                </div>
              </div>
              <div className="challenge-item">
                <h4>1000km en Avril</h4>
                <div className="challenge-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '25%'}}></div>
                  </div>
                  <span className="progress-text">250/1000 km</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Groupes Recommandés</h3>
            <div className="group-list">
              <div className="group-item">
                <h4>Cyclistes Grand Est</h4>
                <p>1250 membres</p>
                <button className="join-button">Rejoindre</button>
              </div>
              <div className="group-item">
                <h4>Grimpeurs des Vosges</h4>
                <p>780 membres</p>
                <button className="join-button">Rejoindre</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSocialHub;
