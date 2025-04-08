/**
 * RouteSchema.js
 * Générateur de Schema.org JSON-LD pour les itinéraires cyclistes
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

/**
 * Composant générant les données structurées pour un itinéraire cycliste
 * @param {Object} props - Propriétés de l'itinéraire
 * @returns {JSX.Element} Helmet contenant le script JSON-LD
 */
const RouteSchema = ({ route }) => {
  if (!route) return null;
  
  const {
    name,
    slug,
    description,
    distance,
    elevationGain,
    difficulty,
    estimatedTime,
    region,
    country,
    waypoints,
    images,
    startPoint,
    endPoint
  } = route;
  
  // Construction du schéma JSON-LD pour l'itinéraire
  const routeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Trip',
    '@id': `https://www.velo-altitude.com/routes/${slug}`,
    name: name,
    description: description || `Itinéraire cycliste : ${name}`,
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: waypoints ? waypoints.length : 0,
      itemListElement: waypoints ? waypoints.map((point, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Place',
          name: point.name,
          geo: {
            '@type': 'GeoCoordinates',
            latitude: point.coordinates.lat,
            longitude: point.coordinates.lng,
            elevation: point.elevation
          }
        }
      })) : []
    },
    tripOrigin: startPoint ? {
      '@type': 'Place',
      name: startPoint.name,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: startPoint.coordinates.lat,
        longitude: startPoint.coordinates.lng
      }
    } : undefined,
    tripDestination: endPoint ? {
      '@type': 'Place',
      name: endPoint.name,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: endPoint.coordinates.lat,
        longitude: endPoint.coordinates.lng
      }
    } : undefined,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Distance',
        value: distance,
        unitCode: 'KMT'
      },
      {
        '@type': 'PropertyValue',
        name: 'Elevation Gain',
        value: elevationGain,
        unitCode: 'MTR'
      },
      {
        '@type': 'PropertyValue',
        name: 'Difficulty',
        value: difficulty
      },
      {
        '@type': 'PropertyValue',
        name: 'Estimated Time',
        value: estimatedTime,
        unitCode: 'HUR'
      }
    ],
    touristType: ['Cyclist', 'SportsActivityParticipant'],
    location: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressRegion: region,
        addressCountry: country
      }
    }
  };
  
  // Ajouter les images si disponibles
  if (images && images.length > 0) {
    routeSchema.image = images.map(img => ({
      '@type': 'ImageObject',
      url: img.url,
      caption: img.caption || `${name} - ${img.alt || 'Vue de l\'itinéraire'}`,
      width: img.width || '1200',
      height: img.height || '800'
    }));
  }
  
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(routeSchema)}
      </script>
    </Helmet>
  );
};

RouteSchema.propTypes = {
  route: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    description: PropTypes.string,
    distance: PropTypes.number,
    elevationGain: PropTypes.number,
    difficulty: PropTypes.string,
    estimatedTime: PropTypes.number,
    region: PropTypes.string,
    country: PropTypes.string,
    waypoints: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        coordinates: PropTypes.shape({
          lat: PropTypes.number,
          lng: PropTypes.number
        }),
        elevation: PropTypes.number
      })
    ),
    startPoint: PropTypes.shape({
      name: PropTypes.string,
      coordinates: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number
      })
    }),
    endPoint: PropTypes.shape({
      name: PropTypes.string,
      coordinates: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number
      })
    }),
    images: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string.isRequired,
        alt: PropTypes.string,
        caption: PropTypes.string,
        width: PropTypes.string,
        height: PropTypes.string
      })
    )
  }).isRequired
};

export default RouteSchema;
