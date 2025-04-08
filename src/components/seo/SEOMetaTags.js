/**
 * SEOMetaTags.js
 * Composant réutilisable pour la gestion des balises méta SEO sur toutes les pages
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

/**
 * Génère l'ensemble des balises méta pour le SEO d'une page
 * @param {Object} props - Propriétés SEO pour la page
 * @returns {JSX.Element} Helmet contenant toutes les balises méta
 */
const SEOMetaTags = ({
  title,
  description,
  canonical,
  image,
  type = 'website',
  twitterCard = 'summary_large_image',
  keywords = [],
  noIndex = false,
  locale = 'fr_FR'
}) => {
  // Valeurs par défaut
  const metaTitle = title || 'Velo-Altitude - Grand Est Cyclisme';
  const metaDescription = description || 'Découvrez les plus beaux cols du Grand Est et planifiez vos sorties vélo avec Velo-Altitude';
  const metaImage = image || 'https://www.velo-altitude.com/images/share-image.jpg';
  const metaUrl = canonical || 'https://www.velo-altitude.com';
  
  return (
    <Helmet>
      {/* Balises méta essentielles */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <link rel="canonical" href={metaUrl} />
      
      {/* Balises méta pour les robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Balises méta OpenGraph */}
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:locale" content={locale} />
      <meta property="og:site_name" content="Velo-Altitude" />
      
      {/* Balises méta Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      
      {/* Métadonnées supplémentaires */}
      <meta name="application-name" content="Velo-Altitude" />
      <meta name="apple-mobile-web-app-title" content="Velo-Altitude" />
      <meta name="theme-color" content="#1A4977" />
      
      {/* Métadonnées géographiques (pertinentes pour une application de cyclisme) */}
      <meta name="geo.region" content="FR-44" />
      <meta name="geo.placename" content="Grand Est" />
    </Helmet>
  );
};

SEOMetaTags.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  canonical: PropTypes.string,
  image: PropTypes.string,
  type: PropTypes.string,
  twitterCard: PropTypes.string,
  keywords: PropTypes.arrayOf(PropTypes.string),
  noIndex: PropTypes.bool,
  locale: PropTypes.string
};

export default SEOMetaTags;
