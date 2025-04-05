import React from 'react';
import './EnhancedCyclingCoach.css';

const EnhancedCyclingCoach = () => {
  return (
    <div className="enhanced-cycling-coach">
      <div className="coach-header">
        <h1>Coach Cyclisme</h1>
        <p>Votre assistant personnel pour progresser en cyclisme</p>
      </div>
      
      <div className="coach-content">
        <div className="coach-interaction">
          <div className="coach-avatar">
            <img src="/images/coach-avatar.svg" alt="Coach virtuel" />
          </div>
          
          <div className="coach-dialog">
            <div className="coach-message">
              <p>Bonjour ! Je suis votre coach cyclisme personnel. Comment puis-je vous aider aujourd'hui ?</p>
            </div>
            
            <div className="user-input">
              <input 
                type="text" 
                placeholder="Posez une question ou demandez un conseil..." 
              />
              <button className="send-button">Envoyer</button>
            </div>
          </div>
        </div>
        
        <div className="coach-suggestions">
          <h2>Suggestions</h2>
          <div className="suggestion-buttons">
            <button className="suggestion-button">Améliorer mon endurance</button>
            <button className="suggestion-button">Préparer une course</button>
            <button className="suggestion-button">Optimiser ma nutrition</button>
            <button className="suggestion-button">Analyser ma technique</button>
            <button className="suggestion-button">Planifier ma récupération</button>
          </div>
        </div>
      </div>
      
      <div className="coach-features">
        <div className="feature-card">
          <h3>Analyse de Performance</h3>
          <p>Obtenez des analyses détaillées de vos performances et des recommandations personnalisées</p>
        </div>
        
        <div className="feature-card">
          <h3>Plans d'Entraînement</h3>
          <p>Recevez des plans d'entraînement adaptés à vos objectifs et votre niveau</p>
        </div>
        
        <div className="feature-card">
          <h3>Conseils Nutritionnels</h3>
          <p>Découvrez comment optimiser votre alimentation pour améliorer vos performances</p>
        </div>
        
        <div className="feature-card">
          <h3>Assistance Technique</h3>
          <p>Obtenez des conseils sur votre technique, votre position et votre matériel</p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCyclingCoach;
