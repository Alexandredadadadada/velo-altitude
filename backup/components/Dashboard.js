import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <h1>Tableau de Bord</h1>
      <p>Votre espace personnalisé pour suivre vos activités et performances</p>
      
      <div className="dashboard-widgets">
        <div className="widget">
          <h2>Résumé d'Activités</h2>
          <div className="widget-content">
            <p>Connectez-vous pour voir vos activités récentes</p>
          </div>
        </div>
        
        <div className="widget">
          <h2>Cols Favoris</h2>
          <div className="widget-content">
            <p>Vos cols préférés apparaîtront ici</p>
          </div>
        </div>
        
        <div className="widget">
          <h2>Progression d'Entraînement</h2>
          <div className="widget-content">
            <p>Suivez votre progression ici</p>
          </div>
        </div>
        
        <div className="widget">
          <h2>Météo Locale</h2>
          <div className="widget-content">
            <p>Chargement des données météo...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
