/**
 * Pagination optimisée SEO pour Velo-Altitude
 * 
 * Ce composant implémente un système de pagination respectant les meilleures pratiques SEO :
 * - Utilisation d'URLs canoniques pour chaque page
 * - Implémentation des balises rel="prev" et rel="next"
 * - Pagination accessible par URL (/page/1, /page/2, etc.)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Pagination, PaginationItem } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import { Helmet } from 'react-helmet';

const useStyles = makeStyles((theme) => ({
  root: {
    '& .MuiPaginationItem-root': {
      margin: theme.spacing(0, 0.5),
    },
  },
}));

/**
 * Composant de pagination optimisé pour le SEO
 * @param {Object} props - Les propriétés du composant
 * @param {number} props.currentPage - La page courante
 * @param {number} props.totalItems - Le nombre total d'items
 * @param {number} props.pageSize - Le nombre d'items par page
 * @param {function} props.onPageChange - Fonction appelée lors du changement de page
 * @param {string} props.baseUrl - L'URL de base pour les liens de pagination
 * @param {string} props.category - La catégorie courante
 * @param {string} props.subcategory - La sous-catégorie courante (optionnelle)
 * @param {string} props.language - La langue courante (fr/en)
 */
const SEOPagination = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  baseUrl,
  category,
  subcategory,
  language = 'fr'
}) => {
  const classes = useStyles();
  
  // Calculer le nombre total de pages
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Si une seule page, ne pas afficher la pagination
  if (totalPages <= 1) {
    return null;
  }
  
  // Construire l'URL pour une page donnée
  const getPageUrl = (page) => {
    // Extraire l'URL de base sans les paramètres de requête
    const baseUrlWithoutQuery = baseUrl.split('?')[0];
    
    // Pour la première page, ne pas ajouter de paramètre page
    if (page === 1) {
      return baseUrlWithoutQuery;
    }
    
    return `${baseUrlWithoutQuery}?page=${page}`;
  };
  
  // Traduire les labels de pagination
  const getPaginationLabels = () => {
    if (language === 'en') {
      return {
        previous: 'Previous',
        next: 'Next',
        page: 'Page'
      };
    }
    
    return {
      previous: 'Précédent',
      next: 'Suivant',
      page: 'Page'
    };
  };
  
  const labels = getPaginationLabels();
  
  // Balises SEO pour la pagination
  const getPaginationSeoTags = () => {
    const tags = [];
    
    // URL canonique pour la page courante
    const canonicalUrl = `https://velo-altitude.com${getPageUrl(currentPage)}`;
    tags.push(
      <link key="canonical" rel="canonical" href={canonicalUrl} />
    );
    
    // Balise prev pour la pagination
    if (currentPage > 1) {
      const prevUrl = `https://velo-altitude.com${getPageUrl(currentPage - 1)}`;
      tags.push(
        <link key="prev" rel="prev" href={prevUrl} />
      );
    }
    
    // Balise next pour la pagination
    if (currentPage < totalPages) {
      const nextUrl = `https://velo-altitude.com${getPageUrl(currentPage + 1)}`;
      tags.push(
        <link key="next" rel="next" href={nextUrl} />
      );
    }
    
    return tags;
  };
  
  return (
    <>
      {/* Balises SEO pour la pagination */}
      <Helmet>
        {getPaginationSeoTags()}
      </Helmet>
      
      {/* Composant de pagination */}
      <Pagination
        className={classes.root}
        count={totalPages}
        page={currentPage}
        onChange={(event, page) => onPageChange(page)}
        color="primary"
        siblingCount={1}
        boundaryCount={1}
        showFirstButton
        showLastButton
        renderItem={(item) => {
          // Personnaliser les items de pagination pour utiliser React Router
          const pageUrl = getPageUrl(item.page);
          
          // Ajouter des attributs ARIA pour l'accessibilité
          const ariaProps = {};
          if (item.type === 'previous') {
            ariaProps['aria-label'] = labels.previous;
          } else if (item.type === 'next') {
            ariaProps['aria-label'] = labels.next;
          } else if (item.type === 'page') {
            ariaProps['aria-label'] = `${labels.page} ${item.page}`;
            if (item.selected) {
              ariaProps['aria-current'] = 'page';
            }
          }
          
          return (
            <PaginationItem
              component={Link}
              to={pageUrl}
              {...item}
              {...ariaProps}
            />
          );
        }}
      />
      
      {/* Texte de pagination pour les lecteurs d'écran et les moteurs de recherche */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        {currentPage > 1 && (
          <Link to={getPageUrl(currentPage - 1)}>
            {labels.previous}
          </Link>
        )}
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <Link 
            key={page} 
            to={getPageUrl(page)}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {labels.page} {page}
          </Link>
        ))}
        
        {currentPage < totalPages && (
          <Link to={getPageUrl(currentPage + 1)}>
            {labels.next}
          </Link>
        )}
      </div>
    </>
  );
};

export default SEOPagination;
