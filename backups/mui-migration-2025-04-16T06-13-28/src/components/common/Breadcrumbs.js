/**
 * Système de fil d'Ariane (Breadcrumbs) pour Velo-Altitude
 * 
 * Ce composant implémente un système de breadcrumbs :
 * - Cohérent avec la nouvelle structure d'URL
 * - Intégrant le balisage Schema.org pour les breadcrumbs
 * - Optimisé pour l'affichage mobile et desktop
 * - Automatiquement généré en fonction de l'URL courante
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Breadcrumbs as MUIBreadcrumbs, Typography, Container, useMediaQuery } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import HomeIcon from '@material-ui/icons/Home';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import { Helmet } from 'react-helmet';

// Styles personnalisés
const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(1, 0),
    backgroundColor: theme.palette.grey[100],
    marginBottom: theme.spacing(2),
  },
  breadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    '& a': {
      textDecoration: 'none',
      color: theme.palette.primary.main,
      display: 'flex',
      alignItems: 'center',
    },
    '& .MuiBreadcrumbs-separator': {
      margin: theme.spacing(0, 0.5),
    },
  },
  icon: {
    marginRight: theme.spacing(0.5),
    width: 20,
    height: 20,
  },
  currentPage: {
    color: theme.palette.text.primary,
    fontWeight: 500,
  },
  mobileBreadcrumb: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
}));

// Mapping des routes pour les noms lisibles et traductions
const routeMapping = {
  'cols': {
    fr: 'Cols',
    en: 'Mountain Passes'
  },
  'france': {
    fr: 'France',
    en: 'France'
  },
  'italie': {
    fr: 'Italie',
    en: 'Italy'
  },
  'espagne': {
    fr: 'Espagne',
    en: 'Spain'
  },
  'suisse': {
    fr: 'Suisse',
    en: 'Switzerland'
  },
  'autres': {
    fr: 'Autres pays',
    en: 'Other countries'
  },
  'entrainement': {
    fr: 'Entraînement',
    en: 'Training'
  },
  'debutant': {
    fr: 'Débutant',
    en: 'Beginner'
  },
  'intermediaire': {
    fr: 'Intermédiaire',
    en: 'Intermediate'
  },
  'avance': {
    fr: 'Avancé',
    en: 'Advanced'
  },
  'nutrition': {
    fr: 'Nutrition',
    en: 'Nutrition'
  },
  'recettes': {
    fr: 'Recettes',
    en: 'Recipes'
  },
  'plans': {
    fr: 'Plans nutritionnels',
    en: 'Nutrition Plans'
  },
  'guides': {
    fr: 'Guides',
    en: 'Guides'
  },
  'defis': {
    fr: 'Défis',
    en: 'Challenges'
  },
  '7-majeurs': {
    fr: '7 Majeurs',
    en: '7 Majors'
  },
  'saisonniers': {
    fr: 'Saisonniers',
    en: 'Seasonal'
  },
  'thematiques': {
    fr: 'Thématiques',
    en: 'Thematic'
  },
  'visualisation-3d': {
    fr: 'Visualisation 3D',
    en: '3D Visualization'
  },
  'communaute': {
    fr: 'Communauté',
    en: 'Community'
  },
  'evenements': {
    fr: 'Événements',
    en: 'Events'
  },
  'sorties': {
    fr: 'Sorties',
    en: 'Rides'
  },
  'groupes': {
    fr: 'Groupes',
    en: 'Groups'
  }
};

/**
 * Composant BreadcrumbsSchema pour générer le balisage JSON-LD
 * @param {Array} items - Les éléments du fil d'Ariane
 */
const BreadcrumbsSchema = ({ items }) => {
  // Créer un schéma JSON-LD pour les breadcrumbs
  const schemaItems = items.map((item, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'name': item.label,
    'item': `https://velo-altitude.com${item.path}`
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': schemaItems
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

/**
 * Composant principal de fil d'Ariane
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.currentPageTitle - Titre optionnel pour la page courante
 * @param {string} props.language - Langue courante (fr ou en)
 */
const Breadcrumbs = ({ currentPageTitle = null, language = 'fr' }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  
  // Extraire les segments du chemin
  const pathSegments = location.pathname.split('/').filter(segment => segment);
  
  // Construire les éléments du fil d'Ariane
  const breadcrumbItems = [];
  
  // Ajouter l'accueil
  breadcrumbItems.push({
    label: language === 'fr' ? 'Accueil' : 'Home',
    path: '/',
    icon: <HomeIcon className={classes.icon} />
  });
  
  // Ajouter les segments intermédiaires
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Si c'est le dernier segment et qu'on a un titre spécifique
    if (index === pathSegments.length - 1 && currentPageTitle) {
      breadcrumbItems.push({
        label: currentPageTitle,
        path: currentPath,
        isLast: true
      });
    }
    // Si c'est un segment intermédiaire ou le dernier sans titre spécifique
    else {
      // Utiliser la traduction si disponible
      const label = routeMapping[segment] 
        ? routeMapping[segment][language] 
        : segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      breadcrumbItems.push({
        label,
        path: currentPath,
        isLast: index === pathSegments.length - 1
      });
    }
  });
  
  // Version mobile : n'afficher que l'accueil et le dernier élément
  const mobileBreadcrumbItems = isMobile 
    ? [breadcrumbItems[0], breadcrumbItems[breadcrumbItems.length - 1]] 
    : breadcrumbItems;
  
  return (
    <div className={classes.root} role="navigation" aria-label="breadcrumb">
      <Container maxWidth="lg">
        <MUIBreadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="breadcrumb"
          className={classes.breadcrumbs}
        >
          {mobileBreadcrumbItems.map((item, index) => {
            // Pour le dernier élément, afficher du texte simple
            if (item.isLast) {
              return (
                <Typography 
                  key={index} 
                  className={`${classes.currentPage} ${isMobile ? classes.mobileBreadcrumb : ''}`}
                  color="textPrimary"
                >
                  {item.label}
                </Typography>
              );
            }
            
            // Pour les autres éléments, afficher un lien
            return (
              <Link to={item.path} key={index}>
                {item.icon && item.icon}
                <span className={isMobile ? classes.mobileBreadcrumb : ''}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </MUIBreadcrumbs>
      </Container>
      
      {/* Ajouter le balisage Schema.org */}
      <BreadcrumbsSchema items={breadcrumbItems} />
    </div>
  );
};

export default Breadcrumbs;
