/**
 * EnhancedMetaTags.js
 * 
 * Composant React pour gérer toutes les balises meta SEO
 * Ce composant centralise la gestion des métadonnées pour le référencement,
 * y compris les balises Open Graph, Twitter Cards et les liens canoniques.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCanonicalUrl, getAlternateUrls } from '../../utils/urlManager';

/**
 * Composant EnhancedMetaTags pour gérer les métadonnées SEO
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.title - Titre de la page
 * @param {string} props.description - Description de la page
 * @param {string} props.image - URL de l'image principale (pour OG et Twitter)
 * @param {string} props.type - Type de contenu (article, website, etc.)
 * @param {Array} props.keywords - Mots-clés pour la balise meta keywords
 * @param {string} props.author - Auteur du contenu
 * @param {string} props.publishedTime - Date de publication (format ISO)
 * @param {string} props.modifiedTime - Date de modification (format ISO)
 * @param {Array} props.alternateLanguages - Langues alternatives disponibles
 * @param {boolean} props.noindex - Empêcher l'indexation par les moteurs de recherche
 * @param {boolean} props.nofollow - Empêcher le suivi des liens par les moteurs de recherche
 * @param {string} props.canonicalUrl - URL canonique (si différente de l'URL actuelle)
 * @param {Object} props.twitter - Configuration spécifique pour Twitter Cards
 * @param {Object} props.facebook - Configuration spécifique pour Open Graph
 */
const EnhancedMetaTags = ({
  title,
  description,
  image,
  type = 'website',
  keywords = [],
  author,
  publishedTime,
  modifiedTime,
  alternateLanguages = ['fr', 'en'],
  noindex = false,
  nofollow = false,
  canonicalUrl,
  twitter = {},
  facebook = {}
}) => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'fr';
  
  // Construit l'URL canonique
  const currentPath = location.pathname.startsWith('/') 
    ? location.pathname.substring(1) 
    : location.pathname;
  
  const canonical = canonicalUrl || getCanonicalUrl(currentPath);
  
  // Génère les URLs alternatives pour l'internationalisation
  const alternateUrls = getAlternateUrls(currentPath, alternateLanguages);
  
  // Construit la balise robots
  const robotsContent = [];
  if (noindex) robotsContent.push('noindex');
  else robotsContent.push('index');
  if (nofollow) robotsContent.push('nofollow');
  else robotsContent.push('follow');
  
  // Configuration Twitter Cards
  const twitterCard = twitter.card || 'summary_large_image';
  const twitterSite = twitter.site || '@veloaltitude';
  const twitterCreator = twitter.creator || '@veloaltitude';
  
  // Configuration Open Graph
  const ogType = facebook.type || type;
  const ogSiteName = facebook.siteName || 'Velo-Altitude';
  const ogLocale = facebook.locale || currentLang;
  const ogImage = image || 'https://www.velo-altitude.com/images/default-share.jpg';
  
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/enhancedmetatags"
        }
      </script>
    <Helmet>
      {/* Balises meta de base */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <meta name="robots" content={robotsContent.join(', ')} />
      {author && <meta name="author" content={author} />}
      
      {/* URL canonique */}
      <link rel="canonical" href={canonical} />
      
      {/* Balises hreflang pour l'internationalisation */}
      {alternateUrls.map(({ lang, url }) => (
        <link 
          key={lang} 
          rel="alternate" 
          hrefLang={lang} 
          href={url} 
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={getCanonicalUrl('')} />
      
      {/* Open Graph (Facebook) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={ogSiteName} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      
      {/* Open Graph - Article spécifique */}
      {ogType === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {ogType === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={twitterCreator} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Autres balises meta importantes */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="theme-color" content="#1976d2" />
      
      {/* Preconnect pour améliorer les performances */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
    </Helmet>
  );
};

EnhancedMetaTags.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  image: PropTypes.string,
  type: PropTypes.string,
  keywords: PropTypes.arrayOf(PropTypes.string),
  author: PropTypes.string,
  publishedTime: PropTypes.string,
  modifiedTime: PropTypes.string,
  alternateLanguages: PropTypes.arrayOf(PropTypes.string),
  noindex: PropTypes.bool,
  nofollow: PropTypes.bool,
  canonicalUrl: PropTypes.string,
  twitter: PropTypes.shape({
    card: PropTypes.string,
    site: PropTypes.string,
    creator: PropTypes.string
  }),
  facebook: PropTypes.shape({
    type: PropTypes.string,
    siteName: PropTypes.string,
    locale: PropTypes.string
  })
};

export default EnhancedMetaTags;
