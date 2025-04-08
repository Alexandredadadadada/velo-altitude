import React, { useState } from 'react';
import './Dashboard.css';
import AIChatbox from '../components/dashboard/AIChatbox';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [chatboxVisible, setChatboxVisible] = useState(true);

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
      
      {/* AI Chatbox integration */}
      {chatboxVisible && (
        <AIChatbox
          position="fixed"
          bottom={isMobile ? 0 : 20}
          right={isMobile ? 0 : 20}
          width={isMobile ? '100%' : '350px'}
          height={isMobile ? '70vh' : '500px'}
        />
      )}
      
      {/* Chat toggle button for mobile */}
      {isMobile && !chatboxVisible && (
        <button 
          className="chat-toggle-button"
          onClick={() => setChatboxVisible(true)}
          aria-label="Ouvrir l'assistant IA"
        >
          <span className="chat-icon">💬</span>
        </button>
      )}
    </div>
  );
};

export default Dashboard;
