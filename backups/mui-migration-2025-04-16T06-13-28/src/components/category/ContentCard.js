/**
 * Composant de carte de contenu riche pour Velo-Altitude
 * 
 * Ce composant affiche une carte de contenu avec :
 * - Images optimisées (lazy loading, srcset)
 * - Données structurées Schema.org
 * - Informations condensées et pertinentes
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardActionArea, 
  CardContent, 
  CardMedia, 
  Typography, 
  Box, 
  Chip,
  Divider 
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Helmet } from 'react-helmet';

// Icônes pour différents types de contenus
import PlaceIcon from '@material-ui/icons/Place';
import FitnessCenterIcon from '@material-ui/icons/FitnessCenter';
import RestaurantIcon from '@material-ui/icons/Restaurant';
import EmojiEventsIcon from '@material-ui/icons/EmojiEvents';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: theme.shadows[8],
    },
  },
  media: {
    height: 0,
    paddingTop: '56.25%', // 16:9
    position: 'relative',
  },
  content: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  description: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
    display: '-webkit-box',
    '-webkit-line-clamp': 3,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
  },
  metadata: {
    marginTop: 'auto',
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      margin: theme.spacing(0.5, 0.5, 0, 0),
    },
  },
  tag: {
    marginRight: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
  },
  levelBadge: {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    color: 'white',
    fontWeight: 'bold',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  categoryBadge: {
    position: 'absolute',
    top: theme.spacing(1),
    left: theme.spacing(1),
    color: 'white',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.primary.main,
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(1),
    padding: theme.spacing(1, 0),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  statValue: {
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
  },
}));

/**
 * Composant de carte de contenu
 */
const ContentCard = ({ 
  item, 
  category,
  subcategory,
  language = 'fr',
}) => {
  const classes = useStyles();
  
  // Fonction pour déterminer le chemin vers la page détaillée
  const getItemUrl = () => {
    let baseUrl = `/${category}`;
    
    // Ajouter la sous-catégorie si elle existe
    if (subcategory) {
      baseUrl += `/${subcategory}`;
    }
    
    // Ajouter l'identifiant de l'item
    return `${baseUrl}/${item.slug || item.id}`;
  };
  
  // Obtenir l'URL d'image optimisée pour différentes tailles
  const getImageUrl = (size = 'medium') => {
    if (!item.image) {
      // Image par défaut selon la catégorie
      return `/images/defaults/${category}-default.jpg`;
    }
    
    // Si l'URL est déjà complète (commence par http)
    if (item.image.startsWith('http')) {
      return item.image;
    }
    
    // Sinon, construire l'URL en fonction de la taille
    const basePath = item.image.replace(/\.(jpg|jpeg|png|webp)$/, '');
    const extension = item.image.split('.').pop();
    
    return `/images/${category}/${basePath}-${size}.${extension}`;
  };
  
  // Fonction pour obtenir un extrait de la description
  const getExcerpt = () => {
    const description = 
      typeof item.description === 'object' 
        ? item.description[language] 
        : item.description;
    
    if (!description) return '';
    
    return description.length > 100 
      ? `${description.substring(0, 100)}...` 
      : description;
  };
  
  // Calculer les propriétés spécifiques en fonction du type de contenu
  const renderItemSpecificProps = () => {
    switch (category) {
      case 'cols':
        return (
          <div className={classes.stats}>
            <div className={classes.statItem}>
              <Typography className={classes.statValue}>
                {item.altitude || '-'} m
              </Typography>
              <Typography className={classes.statLabel}>Altitude</Typography>
            </div>
            <div className={classes.statItem}>
              <Typography className={classes.statValue}>
                {item.length || '-'} km
              </Typography>
              <Typography className={classes.statLabel}>Distance</Typography>
            </div>
            <div className={classes.statItem}>
              <Typography className={classes.statValue}>
                {item.gradient || '-'}%
              </Typography>
              <Typography className={classes.statLabel}>Pente moy.</Typography>
            </div>
          </div>
        );
      
      case 'programs':
        return (
          <div className={classes.stats}>
            <div className={classes.statItem}>
              <Typography className={classes.statValue}>
                {item.duration || '-'} {language === 'fr' ? 'sem.' : 'weeks'}
              </Typography>
              <Typography className={classes.statLabel}>
                {language === 'fr' ? 'Durée' : 'Duration'}
              </Typography>
            </div>
            <div className={classes.statItem}>
              <Typography className={classes.statValue}>
                {item.sessions || '-'}
              </Typography>
              <Typography className={classes.statLabel}>
                {language === 'fr' ? 'Séances' : 'Sessions'}
              </Typography>
            </div>
            <div className={classes.statItem}>
              <Typography className={classes.statValue}>
                {item.intensity || '-'}/5
              </Typography>
              <Typography className={classes.statLabel}>
                {language === 'fr' ? 'Intensité' : 'Intensity'}
              </Typography>
            </div>
          </div>
        );
      
      case 'nutrition':
        return (
          <div className={classes.stats}>
            <div className={classes.statItem}>
              <Typography className={classes.statValue}>
                {item.prepTime || '-'} min
              </Typography>
              <Typography className={classes.statLabel}>
                {language === 'fr' ? 'Préparation' : 'Prep Time'}
              </Typography>
            </div>
            <div className={classes.statItem}>
              <Typography className={classes.statValue}>
                {item.calories || '-'} kcal
              </Typography>
              <Typography className={classes.statLabel}>Calories</Typography>
            </div>
            <div className={classes.statItem}>
              <Typography className={classes.statValue}>
                {item.complexity || '-'}/5
              </Typography>
              <Typography className={classes.statLabel}>
                {language === 'fr' ? 'Difficulté' : 'Difficulty'}
              </Typography>
            </div>
          </div>
        );
      
      case 'challenges':
        return (
          <div className={classes.stats}>
            <div className={classes.statItem}>
              <Typography className={classes.statValue}>
                {item.colCount || '-'}
              </Typography>
              <Typography className={classes.statLabel}>
                {language === 'fr' ? 'Cols' : 'Passes'}
              </Typography>
            </div>
            <div className={classes.statItem}>
              <Typography className={classes.statValue}>
                {item.totalDistance || '-'} km
              </Typography>
              <Typography className={classes.statLabel}>
                {language === 'fr' ? 'Distance' : 'Distance'}
              </Typography>
            </div>
            <div className={classes.statItem}>
              <Typography className={classes.statValue}>
                {item.totalElevation || '-'} m
              </Typography>
              <Typography className={classes.statLabel}>
                {language === 'fr' ? 'Dénivelé' : 'Elevation'}
              </Typography>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // Déterminer l'icône à afficher selon la catégorie
  const getCategoryIcon = () => {
    switch (category) {
      case 'cols':
        return <PlaceIcon fontSize="small" />;
      case 'programs':
        return <FitnessCenterIcon fontSize="small" />;
      case 'nutrition':
        return <RestaurantIcon fontSize="small" />;
      case 'challenges':
        return <EmojiEventsIcon fontSize="small" />;
      default:
        return null;
    }
  };
  
  // Générer les données structurées Schema.org selon le type de contenu
  const getSchemaOrgData = () => {
    // URL complète
    const itemUrl = `https://velo-altitude.com${getItemUrl()}`;
    const name = typeof item.name === 'object' ? item.name[language] : item.name;
    const description = typeof item.description === 'object' 
      ? item.description[language] 
      : item.description;
    
    let schemaData = {};
    
    switch (category) {
      case 'cols':
        schemaData = {
          '@context': 'https://schema.org',
          '@type': 'Place',
          name,
          description,
          url: itemUrl,
          geo: {
            '@type': 'GeoCoordinates',
            latitude: item.latitude,
            longitude: item.longitude,
            elevation: `${item.altitude}m`,
          },
          photo: item.image ? `https://velo-altitude.com${getImageUrl('large')}` : undefined,
        };
        break;
      
      case 'programs':
        schemaData = {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name,
          description,
          url: itemUrl,
          provider: {
            '@type': 'Organization',
            name: 'Velo-Altitude',
            url: 'https://velo-altitude.com',
          },
          timeRequired: `P${item.duration || 0}W`,
          educationalLevel: `Level ${item.level || 1}`,
          image: item.image ? `https://velo-altitude.com${getImageUrl('large')}` : undefined,
        };
        break;
      
      case 'nutrition':
        schemaData = {
          '@context': 'https://schema.org',
          '@type': 'Recipe',
          name,
          description,
          url: itemUrl,
          author: {
            '@type': 'Organization',
            name: 'Velo-Altitude',
            url: 'https://velo-altitude.com',
          },
          prepTime: `PT${item.prepTime || 0}M`,
          cookTime: `PT${item.cookTime || 0}M`,
          totalTime: `PT${(item.prepTime || 0) + (item.cookTime || 0)}M`,
          nutrition: {
            '@type': 'NutritionInformation',
            calories: `${item.calories || 0} kcal`,
            proteinContent: `${item.proteinGrams || 0} g`,
            carbohydrateContent: `${item.carbsGrams || 0} g`,
            fatContent: `${item.fatGrams || 0} g`,
          },
          recipeYield: `${item.servings || 1}`,
          image: item.image ? `https://velo-altitude.com${getImageUrl('large')}` : undefined,
        };
        break;
      
      case 'challenges':
        schemaData = {
          '@context': 'https://schema.org',
          '@type': 'SportsEvent',
          name,
          description,
          url: itemUrl,
          location: {
            '@type': 'Place',
            name: item.region || 'Multiple Locations',
            address: {
              '@type': 'PostalAddress',
              addressCountry: item.country || 'FR',
            },
          },
          image: item.image ? `https://velo-altitude.com${getImageUrl('large')}` : undefined,
          sport: 'Cycling',
          competitor: {
            '@type': 'SportsTeam',
            name: 'Individual',
          },
        };
        break;
      
      default:
        schemaData = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          name,
          description,
          url: itemUrl,
          image: item.image ? `https://velo-altitude.com${getImageUrl('large')}` : undefined,
        };
    }
    
    return JSON.stringify(schemaData);
  };
  
  return (
    <>
      {/* Données structurées Schema.org */}
      <Helmet>
        <script type="application/ld+json">
          {getSchemaOrgData()}
        </script>
      </Helmet>
      
      <Card className={classes.root} elevation={2}>
        <CardActionArea component={Link} to={getItemUrl()}>
          <CardMedia
            className={classes.media}
            image={getImageUrl('medium')}
            title={typeof item.name === 'object' ? item.name[language] : item.name}
            loading="lazy"
          >
            {/* Badge de niveau/difficulté */}
            {item.level && (
              <div className={classes.levelBadge}>
                {language === 'fr' ? 'Niveau' : 'Level'} {item.level}
              </div>
            )}
            
            {/* Badge de catégorie */}
            <div className={classes.categoryBadge}>
              {getCategoryIcon()}
              <span style={{ marginLeft: '4px' }}>
                {typeof subcategory === 'object' 
                  ? subcategory[language] 
                  : subcategory || category}
              </span>
            </div>
          </CardMedia>
          
          <CardContent className={classes.content}>
            <Typography variant="h6" component="h3" className={classes.title}>
              {typeof item.name === 'object' ? item.name[language] : item.name}
            </Typography>
            
            <Typography variant="body2" className={classes.description}>
              {getExcerpt()}
            </Typography>
            
            {/* Métadonnées (tags, régions, etc.) */}
            <div className={classes.metadata}>
              {item.region && (
                <Chip 
                  size="small" 
                  label={item.region} 
                  className={classes.tag}
                  variant="outlined"
                />
              )}
              
              {item.tags && item.tags.slice(0, 3).map((tag) => (
                <Chip 
                  key={tag} 
                  size="small" 
                  label={tag} 
                  className={classes.tag}
                  variant="outlined"
                />
              ))}
            </div>
            
            {/* Informations spécifiques au type de contenu */}
            {renderItemSpecificProps()}
          </CardContent>
        </CardActionArea>
      </Card>
    </>
  );
};

export default ContentCard;
