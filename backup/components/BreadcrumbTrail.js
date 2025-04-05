/**
 * BreadcrumbTrail.js
 * 
 * Composant de fil d'Ariane optimisé pour le SEO
 * Génère un fil d'Ariane structuré avec balisage Schema.org
 * pour améliorer la compréhension des moteurs de recherche.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumbs, Typography, Link as MuiLink } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import { parseUrl } from '../../utils/urlManager';

/**
 * Composant BreadcrumbTrail pour générer un fil d'Ariane optimisé SEO
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Array} props.items - Liste des éléments du fil d'Ariane (optionnel)
 * @param {boolean} props.autoGenerate - Générer automatiquement à partir de l'URL (par défaut: true)
 * @param {string} props.className - Classes CSS (optionnel)
 */
const BreadcrumbTrail = ({ items, autoGenerate = true, className }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'fr';
  
  // Génère les éléments du fil d'Ariane à partir de l'URL actuelle
  const generateBreadcrumbItems = () => {
    if (items && items.length > 0) {
      return items;
    }
    
    if (!autoGenerate) {
      return [];
    }
    
    const { section, subsection, slug } = parseUrl(window.location.pathname);
    const breadcrumbItems = [
      {
        label: <HomeIcon fontSize="small" />,
        path: '/',
        title: t('home')
      }
    ];
    
    // Ajoute la section principale
    if (section) {
      breadcrumbItems.push({
        label: t(`sections.${section}`),
        path: `/${section}`,
        title: t(`sections.${section}`)
      });
    }
    
    // Ajoute la sous-section
    if (subsection) {
      breadcrumbItems.push({
        label: t(`subsections.${section}.${subsection}`),
        path: `/${section}/${subsection}`,
        title: t(`subsections.${section}.${subsection}`)
      });
    }
    
    // Ajoute l'élément courant
    if (slug) {
      // Le label de l'élément courant peut être passé en prop ou récupéré dynamiquement
      // Dans cet exemple, on utilise le slug formaté
      const formattedSlug = slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      breadcrumbItems.push({
        label: formattedSlug,
        path: `/${section}/${subsection ? subsection + '/' : ''}${slug}`,
        title: formattedSlug,
        current: true
      });
    }
    
    return breadcrumbItems;
  };
  
  const breadcrumbItems = generateBreadcrumbItems();
  
  // Génère le balisage JSON-LD pour le fil d'Ariane
  const generateJsonLd = () => {
    const itemListElement = breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": typeof item.label === 'string' ? item.label : item.title,
      "item": `${window.location.origin}${item.path}`
    }));
    
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": itemListElement
    };
  };
  
  return (
    <>
      {/* Balisage JSON-LD pour les moteurs de recherche */}
      <script type="application/ld+json">
        {JSON.stringify(generateJsonLd())}
      </script>
      
      {/* Fil d'Ariane visible pour les utilisateurs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        className={className}
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          if (isLast) {
            return (
              <Typography key={index} color="textPrimary" aria-current="page">
                {item.label}
              </Typography>
            );
          }
          
          return (
            <Link 
              key={index} 
              to={item.path}
              component={MuiLink}
              color="inherit"
              title={item.title}
              underline="hover"
            >
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </>
  );
};

BreadcrumbTrail.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      path: PropTypes.string.isRequired,
      title: PropTypes.string,
      current: PropTypes.bool
    })
  ),
  autoGenerate: PropTypes.bool,
  className: PropTypes.string
};

export default BreadcrumbTrail;
