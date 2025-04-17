/**
 * Composant de contenu connexe pour Velo-Altitude
 * 
 * Ce composant implémente un système intelligent de suggestions de contenu connexe
 * qui analyse automatiquement les relations entre les contenus et propose des liens
 * pertinents pour améliorer le maillage interne du site.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Box,
  Divider,
  Button
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import LinkIcon from '@material-ui/icons/Link';

// Services et utilitaires
import { fetchRelatedContent } from '../../services/dataService';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
  },
  title: {
    marginBottom: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: theme.spacing(1),
    },
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[4],
    },
  },
  media: {
    height: 0,
    paddingTop: '56.25%', // 16:9
  },
  content: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  itemTitle: {
    fontWeight: 500,
    marginBottom: theme.spacing(1),
  },
  itemDescription: {
    color: theme.palette.text.secondary,
    display: '-webkit-box',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
  },
  itemCategory: {
    marginTop: 'auto',
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    color: theme.palette.primary.main,
    fontWeight: 500,
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    fontWeight: 500,
  },
  seeMore: {
    marginTop: theme.spacing(2),
    textAlign: 'right',
  },
  relatedTypeTitle: {
    marginBottom: theme.spacing(2),
    fontWeight: 500,
  },
  contextualLink: {
    marginBottom: theme.spacing(2),
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      fontWeight: 500,
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  },
}));

/**
 * Composant principal de contenu connexe
 */
const RelatedContent = ({
  category,
  subcategory,
  currentItemId,
  language = 'fr',
  maxItems = 6,
}) => {
  const classes = useStyles();
  const [relatedItems, setRelatedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Charger les contenus connexes
  useEffect(() => {
    const loadRelatedContent = async () => {
      setLoading(true);
      
      try {
        // Récupérer les contenus connexes via l'API
        const data = await fetchRelatedContent(category, subcategory, currentItemId, language);
        setRelatedItems(data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des contenus connexes:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadRelatedContent();
  }, [category, subcategory, currentItemId, language]);
  
  // Fonction pour construire l'URL d'un item
  const getItemUrl = (item) => {
    // Construire l'URL en fonction du type de contenu
    const itemCategory = item.category || category;
    let baseUrl = `/${itemCategory}`;
    
    // Ajouter la sous-catégorie si elle existe
    if (item.subcategory) {
      baseUrl += `/${item.subcategory}`;
    }
    
    // Ajouter l'identifiant ou le slug
    return `${baseUrl}/${item.slug || item.id}`;
  };
  
  // Obtenir l'URL d'image pour un item
  const getImageUrl = (item, size = 'thumbnail') => {
    if (!item.image) {
      // Image par défaut selon la catégorie
      const itemCategory = item.category || category;
      return `/images/defaults/${itemCategory}-default.jpg`;
    }
    
    // Si l'URL est déjà complète
    if (item.image.startsWith('http')) {
      return item.image;
    }
    
    // Sinon, construire l'URL
    const itemCategory = item.category || category;
    const basePath = item.image.replace(/\.(jpg|jpeg|png|webp)$/, '');
    const extension = item.image.split('.').pop();
    
    return `/images/${itemCategory}/${basePath}-${size}.${extension}`;
  };
  
  // Fonction pour obtenir un extrait de description
  const getExcerpt = (item) => {
    const description = 
      typeof item.description === 'object' 
        ? item.description[language] 
        : item.description;
    
    if (!description) return '';
    
    return description.length > 80 
      ? `${description.substring(0, 80)}...` 
      : description;
  };
  
  // Obtenir le titre traduit
  const getItemTitle = (item) => {
    return typeof item.name === 'object' ? item.name[language] : item.name;
  };
  
  // Obtenir le label de catégorie traduit
  const getCategoryLabel = (categoryKey) => {
    const categoryMap = {
      cols: { fr: 'Cols', en: 'Mountain Passes' },
      programs: { fr: 'Programmes d\'entraînement', en: 'Training Programs' },
      nutrition: { fr: 'Nutrition', en: 'Nutrition' },
      challenges: { fr: 'Défis', en: 'Challenges' },
      articles: { fr: 'Articles', en: 'Articles' },
      routes: { fr: 'Itinéraires', en: 'Routes' },
    };
    
    return categoryMap[categoryKey]?.[language] || categoryKey;
  };
  
  // Obtenir la description du type de relation
  const getRelationTypeLabel = (relationType) => {
    const relationLabels = {
      same_region: {
        fr: 'Dans la même région',
        en: 'In the same region',
      },
      similar_difficulty: {
        fr: 'Difficulté similaire',
        en: 'Similar difficulty',
      },
      complementary_training: {
        fr: 'Programmes d\'entraînement complémentaires',
        en: 'Complementary training programs',
      },
      nearby_cols: {
        fr: 'Cols à proximité',
        en: 'Nearby mountain passes',
      },
      related_nutrition: {
        fr: 'Nutrition recommandée',
        en: 'Recommended nutrition',
      },
      similar_challenge: {
        fr: 'Défis similaires',
        en: 'Similar challenges',
      },
      recommended_challenges: {
        fr: 'Défis recommandés',
        en: 'Recommended challenges',
      },
      training_for_col: {
        fr: 'Entraînements pour ce col',
        en: 'Training for this pass',
      },
      popular: {
        fr: 'Populaires',
        en: 'Popular',
      },
      recommended: {
        fr: 'Recommandés',
        en: 'Recommended',
      },
      recent: {
        fr: 'Récents',
        en: 'Recent',
      },
    };
    
    return relationLabels[relationType]?.[language] || relationType;
  };
  
  // Si en cours de chargement ou erreur, ne rien afficher
  if (loading || error || Object.keys(relatedItems).length === 0) {
    return null;
  }
  
  return (
    <div className={classes.root}>
      <Typography variant="h5" component="h2" className={classes.title}>
        <LinkIcon color="primary" />
        {language === 'fr' ? 'Contenus connexes' : 'Related Content'}
      </Typography>
      
      <Divider className={classes.divider} />
      
      {/* Afficher les différents types de relations */}
      {Object.entries(relatedItems).map(([relationType, items]) => {
        if (!items || items.length === 0) return null;
        
        return (
          <div key={relationType}>
            <Typography variant="h6" className={classes.relatedTypeTitle}>
              {getRelationTypeLabel(relationType)}
            </Typography>
            
            <Grid container spacing={3}>
              {items.slice(0, maxItems).map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Card className={classes.card} elevation={1}>
                    <CardActionArea component={Link} to={getItemUrl(item)}>
                      <CardMedia
                        className={classes.media}
                        image={getImageUrl(item)}
                        title={getItemTitle(item)}
                        loading="lazy"
                      />
                      <CardContent className={classes.content}>
                        <Typography 
                          variant="subtitle1" 
                          component="h3" 
                          className={classes.itemTitle}
                        >
                          {getItemTitle(item)}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          className={classes.itemDescription}
                        >
                          {getExcerpt(item)}
                        </Typography>
                        
                        <Typography 
                          variant="caption" 
                          className={classes.itemCategory}
                        >
                          {getCategoryLabel(item.category)}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Lien "Voir plus" si plus de maxItems items */}
            {items.length > maxItems && (
              <Box className={classes.seeMore}>
                <Button 
                  component={Link} 
                  to={`/${category}/${relationType}`}
                  color="primary"
                  size="small"
                >
                  {language === 'fr' ? 'Voir plus' : 'See more'}
                </Button>
              </Box>
            )}
            
            <Divider className={classes.divider} />
          </div>
        );
      })}
      
      {/* Liens contextuels (en bas de page) */}
      <Typography variant="h6" className={classes.sectionTitle}>
        {language === 'fr' ? 'Vous pourriez aussi être intéressé par' : 'You might also be interested in'}
      </Typography>
      
      <div className={classes.contextualLinks}>
        {category === 'cols' && (
          <>
            <Typography paragraph className={classes.contextualLink}>
              <Link to="/programs/col-specific">
                {language === 'fr' 
                  ? 'Programmes d\'entraînement spécifiques pour les cols' 
                  : 'Specific training programs for mountain passes'}
              </Link> - {language === 'fr'
                ? 'Préparez-vous efficacement à gravir les cols les plus difficiles.'
                : 'Effectively prepare to climb the most challenging mountain passes.'}
            </Typography>
            <Typography paragraph className={classes.contextualLink}>
              <Link to="/nutrition/cycling-specific">
                {language === 'fr'
                  ? 'Nutrition adaptée pour l\'ascension des cols'
                  : 'Nutrition tailored for climbing mountain passes'}
              </Link> - {language === 'fr'
                ? 'Découvrez les meilleures stratégies nutritionnelles pour optimiser vos performances en montagne.'
                : 'Discover the best nutritional strategies to optimize your performance in the mountains.'}
            </Typography>
          </>
        )}
        
        {category === 'programs' && (
          <>
            <Typography paragraph className={classes.contextualLink}>
              <Link to="/nutrition/training-specific">
                {language === 'fr'
                  ? 'Plans nutritionnels pour accompagner votre entraînement'
                  : 'Nutritional plans to support your training'}
              </Link> - {language === 'fr'
                ? 'Maximisez les bénéfices de votre entraînement avec une nutrition adaptée.'
                : 'Maximize the benefits of your training with adapted nutrition.'}
            </Typography>
            <Typography paragraph className={classes.contextualLink}>
              <Link to="/cols/featured">
                {language === 'fr'
                  ? 'Cols mythiques pour mettre en pratique votre entraînement'
                  : 'Mythical mountain passes to apply your training'}
              </Link> - {language === 'fr'
                ? 'Testez votre forme sur les cols les plus emblématiques d\'Europe.'
                : 'Test your fitness on Europe\'s most iconic mountain passes.'}
            </Typography>
          </>
        )}
        
        {category === 'nutrition' && (
          <>
            <Typography paragraph className={classes.contextualLink}>
              <Link to="/programs/recovery">
                {language === 'fr'
                  ? 'Programmes de récupération pour compléter votre nutrition'
                  : 'Recovery programs to complement your nutrition'}
              </Link> - {language === 'fr'
                ? 'Associez une bonne nutrition à des programmes de récupération efficaces.'
                : 'Combine good nutrition with effective recovery programs.'}
            </Typography>
            <Typography paragraph className={classes.contextualLink}>
              <Link to="/articles/nutrition-science">
                {language === 'fr'
                  ? 'Articles sur la science de la nutrition pour cyclistes'
                  : 'Articles on nutrition science for cyclists'}
              </Link> - {language === 'fr'
                ? 'Approfondissez vos connaissances avec nos articles détaillés sur la nutrition spécifique au cyclisme.'
                : 'Deepen your knowledge with our detailed articles on cycling-specific nutrition.'}
            </Typography>
          </>
        )}
        
        {category === 'challenges' && (
          <>
            <Typography paragraph className={classes.contextualLink}>
              <Link to="/programs/challenge-specific">
                {language === 'fr'
                  ? 'Programmes d\'entraînement pour se préparer aux défis'
                  : 'Training programs to prepare for challenges'}
              </Link> - {language === 'fr'
                ? 'Préparez-vous de manière optimale pour relever ces défis exigeants.'
                : 'Prepare optimally to take on these demanding challenges.'}
            </Typography>
            <Typography paragraph className={classes.contextualLink}>
              <Link to="/cols/challenge-included">
                {language === 'fr'
                  ? 'Découvrez en détail les cols inclus dans ce défi'
                  : 'Discover in detail the mountain passes included in this challenge'}
              </Link> - {language === 'fr'
                ? 'Explorez les caractéristiques complètes de chaque col de ce défi.'
                : 'Explore the complete characteristics of each pass in this challenge.'}
            </Typography>
          </>
        )}
        
        {/* Liens génériques pour toutes les catégories */}
        <Typography paragraph className={classes.contextualLink}>
          <Link to="/articles/latest">
            {language === 'fr'
              ? 'Derniers articles sur le cyclisme de montagne'
              : 'Latest articles on mountain cycling'}
          </Link> - {language === 'fr'
            ? 'Restez informé des dernières tendances et conseils pour le cyclisme de montagne.'
            : 'Stay informed about the latest trends and tips for mountain cycling.'}
        </Typography>
      </div>
    </div>
  );
};

export default RelatedContent;
