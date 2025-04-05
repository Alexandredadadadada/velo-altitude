import React from 'react';
import './TrainingModule.css';

const TrainingModule = () => {
  return (
    <div className="training-module-container">
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
