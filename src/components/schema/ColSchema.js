/**
 * ColSchema.js
 * Générateur de Schema.org JSON-LD pour les pages de cols cyclistes
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

/**
 * Composant générant les données structurées pour un col cycliste
 * @param {Object} props - Propriétés du col
 * @returns {JSX.Element} Helmet contenant le script JSON-LD
 */
const ColSchema = ({ col }) => {
  if (!col) return null;
  
  const {
    name,
    slug,
    description,
    altitude,
    length,
    avgGradient,
    maxGradient,
    difficulty,
    region,
    country,
    coordinates,
    images
  } = col;
  
  // Construction du schéma JSON-LD pour le col
  const colSchema = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    '@id': `https://www.velo-altitude.com/cols/${slug}`,
    name: name,
    description: description || `Col ${name} - Informations cyclisme`,
    additionalType: 'Mountain',
    sportsActivityLocation: {
      '@type': 'Mountain',
      name: name,
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Altitude',
          value: altitude,
          unitCode: 'MTR'
        },
        {
          '@type': 'PropertyValue',
          name: 'Length',
          value: length,
          unitCode: 'KMT'
        },
        {
          '@type': 'PropertyValue',
          name: 'Average Gradient',
          value: avgGradient,
          unitCode: 'P1'
        },
        {
          '@type': 'PropertyValue',
          name: 'Maximum Gradient',
          value: maxGradient,
          unitCode: 'P1'
        },
        {
          '@type': 'PropertyValue',
          name: 'Difficulty',
          value: difficulty
        }
      ]
    },
    geo: coordinates ? {
      '@type': 'GeoCoordinates',
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      elevation: altitude
    } : undefined,
    address: {
      '@type': 'PostalAddress',
      addressRegion: region,
      addressCountry: country
    }
  };
  
  // Ajouter les images si disponibles
  if (images && images.length > 0) {
    colSchema.image = images.map(img => ({
      '@type': 'ImageObject',
      url: img.url,
      caption: img.caption || `${name} - ${img.alt || 'Vue du col'}`,
      width: img.width || '1200',
      height: img.height || '800'
    }));
  }
  
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(colSchema)}
      </script>
    </Helmet>
  );
};

ColSchema.propTypes = {
  col: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    description: PropTypes.string,
    altitude: PropTypes.number,
    length: PropTypes.number,
    avgGradient: PropTypes.number,
    maxGradient: PropTypes.number,
    difficulty: PropTypes.string,
    region: PropTypes.string,
    country: PropTypes.string,
    coordinates: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
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

export default ColSchema;
