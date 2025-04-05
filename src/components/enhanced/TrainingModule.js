import React from 'react';
import './TrainingModule.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

const TrainingModule = () => {
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ExercisePlan",
          "name": "Programme d'Entraînement Cycliste",
          "description": "Plans d'entraînement spécifiques pour préparer les ascensions de cols.",
          "url": "https://velo-altitude.com/trainingmodule"
        }
      </script>
      <EnhancedMetaTags
        title="Programmes d'Entraînement | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
    <main className="training-module-container">
      <h1>Module d'Entraînement</h1>
      <p>Améliorez vos performances avec nos programmes d'entraînement personnalisés</p>
      
      <div className="training-sections">
        <div className="training-section">
          <h2>Calculateur FTP</h2>
          <p>Déterminez vos zones d'entraînement basées sur votre seuil fonctionnel de puissance</p>
          <button className="training-button">Accéder au calculateur</button>
        </div>
        
        <div className="training-section">
          <h2>Programmes HIIT</h2>
          <p>Séances d'entraînement par intervalles à haute intensité pour améliorer votre puissance</p>
          <button className="training-button">Créer un programme HIIT</button>
        </div>
        
        <div className="training-section">
          <h2>Programmes d'Endurance</h2>
          <p>Développez votre endurance avec des programmes adaptés à votre niveau</p>
          <button className="training-button">Explorer les programmes</button>
        </div>
        
        <div className="training-section">
          <h2>Générateur de Plans</h2>
          <p>Créez un plan d'entraînement complet sur mesure pour atteindre vos objectifs</p>
          <button className="training-button">Générer un plan</button>
        </div>
      </div>
    </div>
  );
};

export default TrainingModule;
