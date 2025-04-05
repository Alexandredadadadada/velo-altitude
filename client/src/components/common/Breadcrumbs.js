import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Breadcrumbs as MUIBreadcrumbs, Typography, Link as MUILink } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import TerrainIcon from '@mui/icons-material/Terrain';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MapIcon from '@mui/icons-material/Map';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import BugReportIcon from '@mui/icons-material/BugReport';

// Configuration des routes pour les breadcrumbs
const routeConfig = {
  '/': { label: 'Accueil', icon: <HomeIcon fontSize="small" /> },
  '/cols': { label: 'Cols', icon: <TerrainIcon fontSize="small" /> },
  '/training': { label: 'Entraînement', icon: <DirectionsBikeIcon fontSize="small" /> },
  '/nutrition': { label: 'Nutrition', icon: <RestaurantIcon fontSize="small" /> },
  '/routes': { label: 'Parcours', icon: <MapIcon fontSize="small" /> },
  '/social': { label: 'Communauté', icon: <PeopleIcon fontSize="small" /> },
  '/profile': { label: 'Profil', icon: <PersonIcon fontSize="small" /> },
  '/settings': { label: 'Paramètres', icon: <SettingsIcon fontSize="small" /> },
  '/error-demo': { label: 'Démo Gestion d\'Erreurs', icon: <BugReportIcon fontSize="small" /> },
};

// Configuration des segments spécifiques pour les sous-routes
const segmentConfig = {
  'catalog': { label: 'Catalogue' },
  'explorer': { label: 'Explorateur' },
  'detail': { label: 'Détails' },
  'stats': { label: 'Statistiques' },
  'calendar': { label: 'Calendrier' },
  'programs': { label: 'Programmes' },
  'planner': { label: 'Planificateur' },
  'community': { label: 'Communauté' },
  'achievements': { label: 'Réussites' }
};

/**
 * Composant Breadcrumbs pour la navigation hiérarchique
 * Affiche le chemin de navigation actuel avec des liens interactifs
 */
const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  
  // Fonction pour générer le libellé à partir d'un segment d'URL
  const getSegmentLabel = (segment) => {
    // Vérifier si c'est un segment connu
    if (segmentConfig[segment]) {
      return segmentConfig[segment].label;
    }
    
    // Vérifier si c'est un ID numérique ou alphanumérique
    if (/^\d+$/.test(segment) || /^[a-zA-Z0-9\-_]+$/.test(segment)) {
      return `#${segment}`;
    }
    
    // Formater le segment en titre lisible
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
  };
  
  // Fonction pour générer le chemin complet jusqu'à un segment
  const getPathUpTo = (index) => {
    return '/' + pathnames.slice(0, index + 1).join('/');
  };
  
  return (
    <div className="breadcrumbs-container">
      <MUIBreadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="navigation hiérarchique"
      >
        {/* Lien d'accueil toujours affiché */}
        <MUILink 
          component={Link} 
          to="/"
          color="inherit"
          display="flex"
          alignItems="center"
          className="breadcrumb-link"
        >
          <HomeIcon fontSize="small" style={{ marginRight: '4px' }} />
          Accueil
        </MUILink>
        
        {/* Liens pour chaque segment du chemin */}
        {pathnames.map((segment, index) => {
          const path = getPathUpTo(index);
          const routeInfo = routeConfig[path] || {};
          const isLast = index === pathnames.length - 1;
          
          // Pour le dernier élément, afficher un texte non cliquable
          if (isLast) {
            return (
              <Typography 
                key={path}
                color="textPrimary"
                display="flex"
                alignItems="center"
                className="breadcrumb-current"
              >
                {routeInfo.icon || null}
                {routeInfo.label || getSegmentLabel(segment)}
              </Typography>
            );
          }
          
          // Pour les autres éléments, afficher un lien
          return (
            <MUILink
              key={path}
              component={Link}
              to={path}
              color="inherit"
              display="flex"
              alignItems="center"
              className="breadcrumb-link"
            >
              {routeInfo.icon || null}
              {routeInfo.label || getSegmentLabel(segment)}
            </MUILink>
          );
        })}
      </MUIBreadcrumbs>
    </div>
  );
};

export default Breadcrumbs;
