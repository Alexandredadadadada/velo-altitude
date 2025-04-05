/**
 * SeoLink.js
 * 
 * Composant React pour générer des liens optimisés pour le SEO
 * Ce composant utilise le gestionnaire d'URL pour créer des liens cohérents
 * et ajoute automatiquement les attributs nécessaires pour le SEO.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import * as urlManager from '../../utils/urlManager';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Composant SeoLink pour générer des liens optimisés pour le SEO
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.type - Type de lien (col, training, recipe, etc.)
 * @param {string} props.slug - Slug de l'élément
 * @param {string} props.subsection - Sous-section (pour certains types)
 * @param {Object} props.params - Paramètres d'URL (optionnel)
 * @param {string} props.className - Classes CSS (optionnel)
 * @param {string} props.title - Titre pour l'attribut title (optionnel)
 * @param {boolean} props.external - Si le lien est externe (optionnel)
 * @param {string} props.lang - Code de langue (optionnel)
 * @param {React.ReactNode} props.children - Contenu du lien
 */
const SeoLink = ({
  type,
  slug,
  subsection,
  params,
  className,
  title,
  external = false,
  lang,
  children,
  ...rest
}) => {
  const { i18n } = useTranslation();
  const currentLang = lang || i18n.language || urlManager.URL_CONFIG.DEFAULT_LANG;
  
  // Génère l'URL en fonction du type
  const generateUrl = () => {
    switch (type) {
      case 'col':
        return urlManager.getColUrl(slug, currentLang);
      case 'training':
        return urlManager.getTrainingProgramUrl(slug, currentLang);
      case 'recipe':
        return urlManager.getRecipeUrl(slug, currentLang);
      case 'nutrition-plan':
        return urlManager.getNutritionPlanUrl(slug, currentLang);
      case 'seven-majors':
        return urlManager.getSevenMajorsUrl(slug, currentLang);
      case 'community':
        return urlManager.getCommunityUrl(subsection, slug, currentLang);
      case 'about':
        return urlManager.getAboutUrl(subsection, currentLang);
      case 'filtered-list':
        return urlManager.getFilteredListUrl(slug, subsection, params, currentLang);
      case 'external':
        return slug; // Pour les liens externes, slug est l'URL complète
      default:
        return slug; // Fallback sur le slug directement
    }
  };
  
  const url = generateUrl();
  
  // Pour les liens externes
  if (external) {
    return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/seolink"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
      <a
        href={url}
        className={className}
        title={title}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
    );
  }
  
  // Pour les liens internes
  return (
    <Link
      to={url}
      className={className}
      title={title}
      {...rest}
    >
      {children}
    </Link>
  );
};

SeoLink.propTypes = {
  type: PropTypes.oneOf([
    'col',
    'training',
    'recipe',
    'nutrition-plan',
    'seven-majors',
    'community',
    'about',
    'filtered-list',
    'external'
  ]).isRequired,
  slug: PropTypes.string.isRequired,
  subsection: PropTypes.string,
  params: PropTypes.object,
  className: PropTypes.string,
  title: PropTypes.string,
  external: PropTypes.bool,
  lang: PropTypes.string,
  children: PropTypes.node.isRequired
};

export default SeoLink;
