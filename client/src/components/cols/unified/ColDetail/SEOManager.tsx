import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ColData } from './types';

interface SEOManagerProps {
  colData: ColData | null;
  config?: {
    siteName?: string;
    baseUrl?: string;
    imageBaseUrl?: string;
  }
}

/**
 * Composant gérant le SEO pour la page de détail d'un col
 * Optimise les meta-tags, titres et descriptions pour améliorer le référencement
 */
export const SEOManager: React.FC<SEOManagerProps> = ({ 
  colData, 
  config = {
    siteName: 'Velo-Altitude',
    baseUrl: 'https://velo-altitude.com',
    imageBaseUrl: 'https://velo-altitude.com/images/cols'
  }
}) => {
  if (!colData) return null;
  
  // Construction du titre formaté pour le SEO
  const title = `${colData.name} - Col des Vosges (${colData.stats.elevation}m, ${colData.stats.length}km) | ${config.siteName}`;
  
  // Construction de la description optimisée pour le SEO
  const description = `Découvrez le Col ${colData.name} en vélo : ${colData.stats.length}km, dénivelé ${colData.stats.elevation}m, pente moyenne ${colData.stats.avgGradient}%. Profil, visualisation 3D, météo et conseils d'ascension.`;
  
  // URL canonique
  const canonicalUrl = `${config.baseUrl}/cols/${colData.id}`;
  
  // Image principale pour les partages sociaux
  const mainImage = colData.images && colData.images.length > 0 
    ? `${config.imageBaseUrl}/${colData.id}/${colData.images[0]}`
    : `${config.imageBaseUrl}/default.jpg`;

  return (
    <Helmet>
      {/* Meta tags de base */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Meta tags Open Graph pour Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={mainImage} />
      <meta property="og:site_name" content={config.siteName} />
      
      {/* Meta tags Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={mainImage} />
      
      {/* Meta tags spécifiques pour les cols */}
      <meta name="keywords" content={`col, vélo, cyclisme, ${colData.name}, ${colData.location.region}, ascension, dénivelé, pente, montagne`} />
      <meta name="geo.position" content={`${colData.location.lat},${colData.location.lng}`} />
      <meta name="geo.placename" content={`${colData.name}, ${colData.location.region}`} />
      <meta name="geo.region" content={colData.location.country} />
      
      {/* Données structurées pour Google (Schema.org) */}
      <script type="application/ld+json">{`
        {
          "@context": "https://schema.org",
          "@type": "SportsActivity",
          "name": "Ascension du ${colData.name}",
          "description": "${description}",
          "location": {
            "@type": "Place",
            "name": "${colData.name}",
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": ${colData.location.lat},
              "longitude": ${colData.location.lng},
              "elevation": ${colData.stats.elevation}
            },
            "address": {
              "@type": "PostalAddress",
              "addressRegion": "${colData.location.region}",
              "addressCountry": "${colData.location.country}"
            }
          },
          "sportsActivityLocation": {
            "@type": "SportsActivityLocation",
            "name": "${colData.name}",
            "description": "Col cycliste de ${colData.stats.length}km avec un dénivelé de ${colData.stats.elevation}m"
          },
          "distance": {
            "@type": "Distance",
            "name": "Distance",
            "value": ${colData.stats.length},
            "unitCode": "KMT"
          }
        }
      `}</script>
    </Helmet>
  );
};

export default SEOManager;
