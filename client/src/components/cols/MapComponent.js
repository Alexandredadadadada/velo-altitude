import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { FaMountain } from 'react-icons/fa';
import { createIcon } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Composant de carte optimisé pour le chargement paresseux
 * Extrait de EnhancedColDetail pour améliorer les performances
 */
const MapComponent = ({ center, zoom, colData, selectedSide, elevationProfile }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    try {
      // Vérifier si la référence DOM existe
      if (!mapRef.current) {
        return;
      }

      // Vérifier si Leaflet est accessible
      if (!L) {
        throw new Error("La bibliothèque Leaflet n'est pas disponible");
      }

      // Nettoyer la carte existante
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Créer la nouvelle instance de carte
      const mapInstance = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        dragging: true,
        scrollWheelZoom: true,
        attributionControl: true
      });

      // Ajouter le fond de carte avec gestion d'erreur
      try {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
          maxZoom: 18
        }).addTo(mapInstance);
      } catch (err) {
        console.warn("Erreur lors du chargement du fond de carte:", err);
        // Utiliser un fond de carte alternatif en cas d'échec
        try {
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 18
          }).addTo(mapInstance);
        } catch (fallbackErr) {
          console.error("Erreur critique avec les fonds de carte:", fallbackErr);
          setError("Impossible de charger les fonds de carte");
        }
      }

      // Référencer l'instance pour nettoyage ultérieur
      mapInstanceRef.current = mapInstance;

      // Ajouter un bouton pour activer/désactiver le zoom au scroll
      const zoomControl = L.control({ position: 'topright' });
      zoomControl.onAdd = () => {
        const div = L.DomUtil.create('div', 'leaflet-control-zoom-toggle');
        div.innerHTML = '<button class="btn btn-sm btn-primary">Activer le zoom</button>';
        div.onclick = () => {
          if (mapInstance.scrollWheelZoom.enabled()) {
            mapInstance.scrollWheelZoom.disable();
            div.innerHTML = '<button class="btn btn-sm btn-primary">Activer le zoom</button>';
          } else {
            mapInstance.scrollWheelZoom.enable();
            div.innerHTML = '<button class="btn btn-sm btn-secondary">Désactiver le zoom</button>';
          }
        };
        return div;
      };
      zoomControl.addTo(mapInstance);

      // Ajouter le marqueur
      try {
        const mapMarker = L.marker(center, { icon: MountainIcon })
          .addTo(mapInstance);

        // Ajouter un popup
        mapMarker.bindPopup(`
          <div className="col-popup">
            <h5>${colData.name}</h5>
            <p>${colData.altitude}m - ${colData.difficulty}/5</p>
            ${selectedSide && (
              `<p>${colData.climbData[selectedSide].length}km, ${colData.climbData[selectedSide].gradientAvg}%</p>`
            )}
          </div>
        `);

        // Ajouter un gestionnaire d'événement de clic
        mapMarker.on('click', () => console.log('Marker clicked'));
      } catch (markersErr) {
        console.error("Erreur lors de l'ajout du marqueur:", markersErr);
      }

      // Ajouter le tracé du col si disponible
      if (elevationProfile && elevationProfile.path) {
        try {
          L.polyline(elevationProfile.path.map(point => [point.lat, point.lng]), {
            color: "#007bff",
            weight: 5,
            opacity: 0.7
          }).addTo(mapInstance);
        } catch (pathsErr) {
          console.error("Erreur lors de l'ajout du tracé du col:", pathsErr);
        }
      }

    } catch (err) {
      console.error("Erreur critique d'initialisation de la carte:", err);
      setError("Impossible d'initialiser la carte. Veuillez réessayer.");
    }

    // Nettoyage au démontage
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          console.warn("Erreur lors du nettoyage de la carte:", err);
        }
      }
    };
  }, [center, zoom, colData, selectedSide, elevationProfile]);

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <div
        style={{
          height: '400px',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          padding: '1rem',
          textAlign: 'center',
          color: '#dc3545'
        }}
      >
        <div>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-wrapper">
      <div ref={mapRef} style={{ height: '400px', width: '100%' }} />
      <div className="map-attribution mt-2">
        <small>Données cartographiques : OpenStreetMap | Tracés : Grand Est Cyclisme</small>
      </div>
    </div>
  );
};

export default MapComponent;
