import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { FaMountain } from 'react-icons/fa';
import { createIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Composant de carte optimisé pour le chargement paresseux
 * Extrait de EnhancedColDetail pour améliorer les performances
 */
const MapComponent = ({ center, zoom, colData, selectedSide, elevationProfile }) => {
  // Correction pour l'icône Leaflet
  const MountainIcon = createIcon({
    iconUrl: '/images/summits/mountain-marker.svg',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: null,
    shadowSize: null,
    shadowAnchor: null,
    // Gestion des erreurs pour l'icône
    iconRetinaUrl: '/images/summits/mountain-marker.svg',
    className: 'leaflet-mountain-icon',
  });

  // Fallback si l'icône personnalisée échoue
  const handleIconError = () => {
    console.warn('Icône de montagne non chargée, utilisation de l\'icône par défaut');
    return null; // Leaflet utilisera l'icône par défaut
  };

  return (
    <div className="map-wrapper">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '400px', width: '100%' }}
        whenCreated={(map) => {
          // Amélioration de performance : désactiver le zoom lors du scroll
          map.scrollWheelZoom.disable();
          // Ajouter un bouton pour activer/désactiver le zoom au scroll
          const zoomControl = L.control({ position: 'topright' });
          zoomControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-control-zoom-toggle');
            div.innerHTML = '<button class="btn btn-sm btn-primary">Activer le zoom</button>';
            div.onclick = () => {
              if (map.scrollWheelZoom.enabled()) {
                map.scrollWheelZoom.disable();
                div.innerHTML = '<button class="btn btn-sm btn-primary">Activer le zoom</button>';
              } else {
                map.scrollWheelZoom.enable();
                div.innerHTML = '<button class="btn btn-sm btn-secondary">Désactiver le zoom</button>';
              }
            };
            return div;
          };
          zoomControl.addTo(map);
        }}
      >
        <TileLayer 
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          // Optimisation des performances
          updateWhenIdle={true}
          updateWhenZooming={false}
          maxZoom={18}
        />
        
        <Marker 
          position={center} 
          icon={MountainIcon}
          eventHandlers={{
            error: handleIconError
          }}
        >
          <Popup>
            <div className="col-popup">
              <h5>{colData.name}</h5>
              <p>{colData.altitude}m - {colData.difficulty}/5</p>
              {selectedSide && (
                <p>{colData.climbData[selectedSide].length}km, {colData.climbData[selectedSide].gradientAvg}%</p>
              )}
            </div>
          </Popup>
        </Marker>
        
        {/* Afficher le tracé du col si disponible */}
        {elevationProfile && elevationProfile.path && (
          <Polyline 
            positions={elevationProfile.path.map(point => [point.lat, point.lng])}
            color="#007bff"
            weight={5}
            opacity={0.7}
          />
        )}
      </MapContainer>
      
      <div className="map-attribution mt-2">
        <small>Données cartographiques : OpenStreetMap | Tracés : Grand Est Cyclisme</small>
      </div>
    </div>
  );
};

export default MapComponent;
