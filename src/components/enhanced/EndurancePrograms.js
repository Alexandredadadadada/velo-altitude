import React from 'react';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

const EndurancePrograms = () => {
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/enduranceprograms"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <div className="endurance-programs">
      <div className="programs-header">
        <h2>Programmes d'Endurance</h2>
        <p>Développez votre endurance avec des programmes adaptés à votre niveau</p>
      </div>
      
      <article className="programs-content">
        <div className="programs-filter">
          <h3>Filtrer les Programmes</h3>
          
          <div className="filter-options">
            <div className="filter-group">
              <label>Niveau</label>
              <select>
                <option value="all">Tous les niveaux</option>
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Durée</label>
              <select>
                <option value="all">Toutes les durées</option>
                <option value="4-weeks">4 semaines</option>
                <option value="8-weeks">8 semaines</option>
                <option value="12-weeks">12 semaines</option>
                <option value="16-weeks">16 semaines</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Objectif</label>
              <select>
                <option value="all">Tous les objectifs</option>
                <option value="base">Endurance de base</option>
                <option value="century">Préparation 100km</option>
                <option value="gran-fondo">Gran Fondo</option>
                <option value="ultra">Ultra-endurance</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="programs-list">
          <div className="program-card">
            <div className="program-header">
              <h3>Fondation d'Endurance</h3>
              <div className="program-badges">
                <span className="badge beginner">Débutant</span>
                <span className="badge weeks-8">8 semaines</span>
              </div>
            </div>
            
            <div className="program-description">
              <p>Programme idéal pour développer une base d'endurance solide. Parfait pour les cyclistes débutants ou ceux qui reprennent après une longue pause.</p>
            </div>
            
            <div className="program-details">
              <div className="detail-item">
                <span className="detail-label">Heures/semaine</span>
                <span className="detail-value">4-6</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Focus</span>
                <span className="detail-value">Zone 2</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Sorties longues</span>
                <span className="detail-value">1-2h → 3-4h</span>
              </div>
            </div>
            
            <div className="program-actions">
              <button className="view-button">Voir le détail</button>
              <button className="start-button">Commencer</button>
            </div>
          </div>
          
          <div className="program-card">
            <div className="program-header">
              <h3>Préparation Century Ride</h3>
              <div className="program-badges">
                <span className="badge intermediate">Intermédiaire</span>
                <span className="badge weeks-12">12 semaines</span>
              </div>
            </div>
            
            <div className="program-description">
              <p>Préparez-vous à réaliser votre premier 100km ou 100 miles avec ce programme progressif qui développe l'endurance et la résistance.</p>
            </div>
            
            <div className="program-details">
              <div className="detail-item">
                <span className="detail-label">Heures/semaine</span>
                <span className="detail-value">6-8</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Focus</span>
                <span className="detail-value">Zone 2-3</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Sorties longues</span>
                <span className="detail-value">2-3h → 5-6h</span>
              </div>
            </div>
            
            <div className="program-actions">
              <button className="view-button">Voir le détail</button>
              <button className="start-button">Commencer</button>
            </div>
          </div>
          
          <div className="program-card">
            <div className="program-header">
              <h3>Endurance Avancée</h3>
              <div className="program-badges">
                <span className="badge advanced">Avancé</span>
                <span className="badge weeks-16">16 semaines</span>
              </div>
            </div>
            
            <div className="program-description">
              <p>Programme d'endurance avancé pour les cyclistes expérimentés visant des événements de longue distance ou des courses par étapes.</p>
            </div>
            
            <div className="program-details">
              <div className="detail-item">
                <span className="detail-label">Heures/semaine</span>
                <span className="detail-value">10-14</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Focus</span>
                <span className="detail-value">Zone 2-4</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Sorties longues</span>
                <span className="detail-value">4h → 7-8h</span>
              </div>
            </div>
            
            <div className="program-actions">
              <button className="view-button">Voir le détail</button>
              <button className="start-button">Commencer</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="endurance-tips">
        <h3>Conseils pour Développer votre Endurance</h3>
        
        <div className="tips-list">
          <div className="tip-item">
            <h4>Progression graduelle</h4>
            <p>Augmentez votre volume d'entraînement de 5-10% par semaine maximum pour éviter le surentraînement.</p>
          </div>
          
          <div className="tip-item">
            <h4>Polarisation</h4>
            <p>Passez 80% de votre temps en zone 1-2 (facile) et 20% en zone 4-5 (difficile) pour optimiser les adaptations.</p>
          </div>
          
          <div className="tip-item">
            <h4>Nutrition</h4>
            <p>Pour les sorties longues, visez 60-90g de glucides par heure et restez bien hydraté.</p>
          </div>
          
          <div className="tip-item">
            <h4>Récupération</h4>
            <p>Intégrez des semaines de récupération avec 30-40% de volume en moins toutes les 3-4 semaines.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndurancePrograms;
