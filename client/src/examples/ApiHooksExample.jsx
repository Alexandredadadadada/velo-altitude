/**
 * Exemple d'utilisation des hooks API
 * 
 * Ce composant montre comment utiliser les hooks API avec React Query
 * pour remplacer les données mockées par des appels API réels.
 */

import React, { useState } from 'react';
import { useGetAllCols, useGetColById } from '../hooks/api/useColsApi';
import { useGetUserProfile } from '../hooks/api/useUsersApi';
import { useGetColWeather } from '../hooks/api/useWeatherApi';

const ApiHooksExample = () => {
  const [selectedColId, setSelectedColId] = useState(null);
  const userId = 'user-123'; // Normalement récupéré depuis l'authentification
  
  // Utiliser les hooks React Query pour récupérer les données
  const { 
    data: cols, 
    isLoading: colsLoading, 
    error: colsError 
  } = useGetAllCols();
  
  const { 
    data: selectedCol, 
    isLoading: colLoading 
  } = useGetColById(selectedColId);
  
  const { 
    data: userProfile, 
    isLoading: profileLoading 
  } = useGetUserProfile(userId);
  
  const { 
    data: colWeather, 
    isLoading: weatherLoading 
  } = useGetColWeather(selectedColId);
  
  // Fonction pour sélectionner un col
  const handleSelectCol = (id) => {
    setSelectedColId(id);
  };
  
  // Afficher un message de chargement si les données sont en cours de chargement
  if (colsLoading) {
    return <div>Chargement des cols...</div>;
  }
  
  // Afficher un message d'erreur s'il y a une erreur
  if (colsError) {
    return <div>Erreur lors du chargement des cols: {colsError.message}</div>;
  }
  
  return (
    <div className="api-hooks-example">
      <h1>Exemple d'utilisation des hooks API</h1>
      
      {/* Profil utilisateur */}
      <div className="user-profile">
        <h2>Profil utilisateur</h2>
        {profileLoading ? (
          <p>Chargement du profil...</p>
        ) : userProfile ? (
          <div>
            <p><strong>Nom:</strong> {userProfile.username}</p>
            <p><strong>Email:</strong> {userProfile.email}</p>
            <p><strong>Niveau:</strong> {userProfile.stats.level}</p>
          </div>
        ) : (
          <p>Aucun profil trouvé</p>
        )}
      </div>
      
      {/* Liste des cols */}
      <div className="cols-list">
        <h2>Liste des cols</h2>
        <ul>
          {cols && cols.map(col => (
            <li key={col.id} onClick={() => handleSelectCol(col.id)}>
              <strong>{col.name}</strong> - {col.region} ({col.elevation}m)
              {selectedColId === col.id && <span> ✓</span>}
            </li>
          ))}
        </ul>
      </div>
      
      {/* Détails d'un col sélectionné */}
      {selectedColId && (
        <div className="col-details">
          <h2>Détails du col</h2>
          {colLoading ? (
            <p>Chargement des détails...</p>
          ) : selectedCol ? (
            <div>
              <h3>{selectedCol.name}</h3>
              <p><strong>Altitude:</strong> {selectedCol.elevation}m</p>
              <p><strong>Région:</strong> {selectedCol.region}</p>
              <p><strong>Description:</strong> {selectedCol.description}</p>
              <p><strong>Difficulté:</strong> {selectedCol.difficulty}</p>
              
              {/* Afficher la météo du col */}
              <div className="col-weather">
                <h4>Météo actuelle</h4>
                {weatherLoading ? (
                  <p>Chargement de la météo...</p>
                ) : colWeather ? (
                  <div>
                    <p><strong>Température:</strong> {colWeather.current.temperature}°C</p>
                    <p><strong>Ressenti:</strong> {colWeather.current.feelsLike}°C</p>
                    <p><strong>Conditions:</strong> {colWeather.current.conditions}</p>
                    <p><strong>Vent:</strong> {colWeather.current.windSpeed} km/h</p>
                  </div>
                ) : (
                  <p>Aucune donnée météo disponible</p>
                )}
              </div>
            </div>
          ) : (
            <p>Aucun col sélectionné</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiHooksExample;
