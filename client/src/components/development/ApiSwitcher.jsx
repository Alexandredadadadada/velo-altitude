/**
 * Composant de bascule entre API réelle et MSW (Mock Service Worker)
 * 
 * Ce composant permet aux développeurs de basculer facilement entre l'utilisation
 * des API réelles et des mocks MSW pendant le développement.
 * Il n'est visible qu'en mode développement.
 */

import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notification/notificationService';

// Styles pour le bouton flottant
const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  indicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginRight: '8px'
  },
  panel: {
    marginBottom: '10px',
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '4px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    width: '250px'
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px'
  },
  checkbox: {
    marginRight: '8px'
  }
};

const ApiSwitcher = () => {
  // Afficher uniquement en mode développement
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // État pour le mode API (mock MSW ou réel)
  const [useMswMocks, setUseMswMocks] = useState(
    localStorage.getItem('velo-altitude-use-msw') !== 'false' // Par défaut activé en dev
  );
  
  // État pour le panneau d'options
  const [showPanel, setShowPanel] = useState(false);
  
  // Options de latence
  const [simulateLatency, setSimulateLatency] = useState(
    localStorage.getItem('velo-altitude-simulate-latency') === 'true' || false
  );
  
  // Options d'erreurs
  const [simulateErrors, setSimulateErrors] = useState(
    localStorage.getItem('velo-altitude-simulate-errors') === 'true' || false
  );

  // Gestion des changements de configuration de MSW
  useEffect(() => {
    localStorage.setItem('velo-altitude-use-msw', useMswMocks);
    
    // Mise à jour de la configuration MSW
    if (window.mswWorker) {
      if (useMswMocks) {
        window.mswWorker.start();
      } else {
        window.mswWorker.stop();
      }
    }
    
    // Notifier l'utilisateur du changement
    notificationService.showInfo(
      `Mode API : ${useMswMocks ? 'Mocks MSW' : 'API réelles'}`,
      { 
        title: 'Configuration développeur',
        autoClose: 2000
      }
    );
  }, [useMswMocks]);
  
  // Sauvegarder les autres options
  useEffect(() => {
    localStorage.setItem('velo-altitude-simulate-latency', simulateLatency);
    localStorage.setItem('velo-altitude-simulate-errors', simulateErrors);
    
    // Mettre à jour la configuration MSW pour la latence et les erreurs
    if (window.mswConfig) {
      window.mswConfig.simulateLatency = simulateLatency;
      window.mswConfig.simulateErrors = simulateErrors;
    }
  }, [simulateLatency, simulateErrors]);

  // Fonction pour basculer l'utilisation de MSW
  const toggleMswMocks = () => {
    setUseMswMocks(!useMswMocks);
  };
  
  // Fonction pour basculer le panneau d'options
  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  return (
    <div style={styles.container}>
      {showPanel && (
        <div style={styles.panel}>
          <h3 style={{ margin: '0 0 15px 0' }}>Options API</h3>
          
          <div style={styles.option}>
            <input
              type="checkbox"
              id="useMswMocks"
              checked={useMswMocks}
              onChange={toggleMswMocks}
              style={styles.checkbox}
            />
            <label htmlFor="useMswMocks">Utiliser MSW (Mock Service Worker)</label>
          </div>
          
          <div style={styles.option}>
            <input
              type="checkbox"
              id="simulateLatency"
              checked={simulateLatency}
              onChange={() => setSimulateLatency(!simulateLatency)}
              style={styles.checkbox}
            />
            <label htmlFor="simulateLatency">Simuler une latence réseau</label>
          </div>
          
          <div style={styles.option}>
            <input
              type="checkbox"
              id="simulateErrors"
              checked={simulateErrors}
              onChange={() => setSimulateErrors(!simulateErrors)}
              style={styles.checkbox}
            />
            <label htmlFor="simulateErrors">Simuler des erreurs aléatoires</label>
          </div>
          
          <button 
            onClick={() => {
              window.location.reload();
              notificationService.showInfo('Rechargement de l\'application...', { 
                title: 'Configuration développeur'
              });
            }}
            style={{
              padding: '8px 12px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px',
              width: '100%'
            }}
          >
            Appliquer et recharger
          </button>
        </div>
      )}
      
      <button onClick={togglePanel} style={styles.button}>
        <span 
          style={{
            ...styles.indicator,
            backgroundColor: useMswMocks ? '#4caf50' : '#f44336'
          }}
        />
        {useMswMocks ? 'Mode Mock MSW' : 'Mode API Réelles'}
      </button>
    </div>
  );
};

export default ApiSwitcher;
