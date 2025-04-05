/**
 * Composant d'en-tête pour les pages de catégorie
 * 
 * Ce composant fournit une introduction riche et optimisée pour le SEO
 * à chaque page de catégorie, avec une structure de titres et de contenu
 * adaptée aux bonnes pratiques de référencement.
 */

import React from 'react';
import { 
  Typography, 
  Box, 
  Divider, 
  Breadcrumbs as MUIBreadcrumbs,
  Link as MUILink
} from '@material-ui/core';
import { Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Helmet } from 'react-helmet';

// Configuration des catégories (textes et métadonnées)
import { getCategoryConfig } from '../../utils/categoryConfig';

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(4),
  },
  title: {
    marginBottom: theme.spacing(2),
    fontWeight: 700,
  },
  introduction: {
    marginBottom: theme.spacing(3),
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
  breadcrumbs: {
    marginBottom: theme.spacing(2),
  },
  countBadge: {
    display: 'inline-block',
    padding: theme.spacing(0.5, 1.5),
    borderRadius: 20,
    backgroundColor: theme.palette.grey[200],
    marginLeft: theme.spacing(1),
    fontSize: '0.875rem',
  },
  subtitle: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1),
    fontWeight: 600,
  },
}));

/**
 * Composant d'en-tête pour les pages de catégorie
 */
const CategoryHeader = ({
  category,
  subcategory,
  language = 'fr',
  itemCount = 0
}) => {
  const classes = useStyles();
  const config = getCategoryConfig(category);
  
  // S'il n'y a pas de configuration pour cette catégorie, afficher un en-tête minimal
  if (!config) {
    return (
      <div className={classes.root}>
        <Typography variant="h4" component="h1" className={classes.title}>
          {category.charAt(0).toUpperCase() + category.slice(1)}
          {itemCount > 0 && (
            <span className={classes.countBadge}>{itemCount}</span>
          )}
        </Typography>
        <Divider className={classes.divider} />
      </div>
    );
  }
  
  // Obtenir le nom de la catégorie
  const categoryName = config.label[language];
  
  // Obtenir le nom de la sous-catégorie si applicable
  let subcategoryName = '';
  if (subcategory && config.subcategories) {
    const subCat = config.subcategories.find(sub => sub.key === subcategory);
    if (subCat) {
      subcategoryName = subCat.label[language];
    }
  }
  
  // Construire le titre de la page
  const pageTitle = subcategoryName 
    ? `${categoryName} - ${subcategoryName}` 
    : categoryName;
  
  // Construire la description de la page pour les métadonnées
  const getPageDescription = () => {
    // Description spécifique à la sous-catégorie
    if (subcategory && config.subcategories) {
      const subCat = config.subcategories.find(sub => sub.key === subcategory);
      if (subCat && subCat.description && subCat.description[language]) {
        return subCat.description[language];
      }
    }
    
    // Description générale de la catégorie
    return config.description?.[language] || '';
  };
  
  // Obtenir l'introduction de la page
  const getIntroduction = () => {
    // Texte spécifique à la sous-catégorie
    if (subcategory && config.subcategories) {
      const subCat = config.subcategories.find(sub => sub.key === subcategory);
      if (subCat && subCat.introduction && subCat.introduction[language]) {
        return subCat.introduction[language];
      }
    }
    
    // Texte d'introduction général de la catégorie
    if (config.introduction && config.introduction[language]) {
      return config.introduction[language];
    }
    
    // Texte par défaut selon la catégorie
    const defaultIntros = {
      cols: {
        fr: `Découvrez notre sélection complète de cols à travers l'Europe. Que vous recherchiez les légendaires ascensions des grands tours ou des joyaux cachés, vous trouverez ici des informations détaillées sur plus de 50 cols, avec profils d'élévation, difficultés, conseils et points d'intérêt.`,
        en: `Discover our comprehensive collection of mountain passes across Europe. Whether you're looking for legendary Tour climbs or hidden gems, you'll find detailed information on over 50 passes, including elevation profiles, difficulties, tips, and points of interest.`
      },
      programs: {
        fr: `Nos programmes d'entraînement spécialisés pour le cyclisme de montagne vous aideront à préparer efficacement vos défis d'altitude. Développés par des experts, ces programmes ciblent spécifiquement les compétences nécessaires pour exceller dans les ascensions difficiles.`,
        en: `Our specialized training programs for mountain cycling will help you effectively prepare for your altitude challenges. Developed by experts, these programs specifically target the skills needed to excel in difficult climbs.`
      },
      nutrition: {
        fr: `Une alimentation adaptée est essentielle pour performer en montagne. Découvrez nos recettes et plans nutritionnels spécialement conçus pour les cyclistes affrontant des cols. De la préparation à la récupération, optimisez votre alimentation pour maximiser vos performances.`,
        en: `Proper nutrition is essential for mountain performance. Discover our recipes and nutritional plans specially designed for cyclists facing mountain passes. From preparation to recovery, optimize your diet to maximize your performance.`
      },
      challenges: {
        fr: `Relevez des défis exceptionnels à travers les plus beaux cols d'Europe. De notre concept unique "Les 7 Majeurs" aux challenges régionaux, trouvez l'aventure qui vous correspond et repoussez vos limites en haute altitude.`,
        en: `Take on exceptional challenges through Europe's most beautiful mountain passes. From our unique "The 7 Majors" concept to regional challenges, find the adventure that suits you and push your limits at high altitude.`
      }
    };
    
    return defaultIntros[category]?.[language] || '';
  };
  
  // Obtenir le contenu de l'encadré d'information
  const getInfoBoxContent = () => {
    // Contenu spécifique à la sous-catégorie
    if (subcategory && config.subcategories) {
      const subCat = config.subcategories.find(sub => sub.key === subcategory);
      if (subCat && subCat.infoBox && subCat.infoBox[language]) {
        return subCat.infoBox[language];
      }
    }
    
    // Contenu général de la catégorie
    if (config.infoBox && config.infoBox[language]) {
      return config.infoBox[language];
    }
    
    return null;
  };
  
  return (
    <div className={classes.root}>
      {/* Métadonnées SEO */}
      <Helmet>
        <title>{pageTitle} | Velo-Altitude</title>
        <meta name="description" content={getPageDescription()} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${pageTitle} | Velo-Altitude`} />
        <meta property="og:description" content={getPageDescription()} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://velo-altitude.com/${category}${subcategory ? '/' + subcategory : ''}`} />
        <meta property="og:image" content={`https://velo-altitude.com/images/og/${category}.jpg`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${pageTitle} | Velo-Altitude`} />
        <meta name="twitter:description" content={getPageDescription()} />
        <meta name="twitter:image" content={`https://velo-altitude.com/images/og/${category}.jpg`} />
        
        {/* Balise canonical */}
        <link rel="canonical" href={`https://velo-altitude.com/${category}${subcategory ? '/' + subcategory : ''}`} />
      </Helmet>
      
      {/* Titre de la page */}
      <Typography variant="h4" component="h1" className={classes.title}>
        {pageTitle}
        {itemCount > 0 && (
          <span className={classes.countBadge}>{itemCount}</span>
        )}
      </Typography>
      
      {/* Introduction */}
      <Typography 
        variant="body1" 
        component="div" 
        className={classes.introduction}
        dangerouslySetInnerHTML={{ __html: getIntroduction() }}
      />
      
      {/* Sous-catégories si on est sur une page de catégorie principale */}
      {!subcategory && config.subcategories && config.subcategories.length > 0 && (
        <>
          <Typography variant="h6" className={classes.subtitle}>
            {language === 'fr' ? 'Parcourir par catégorie' : 'Browse by category'}
          </Typography>
          
          <Box display="flex" flexWrap="wrap" mb={3}>
            {config.subcategories.map((subCat) => (
              <Box key={subCat.key} mr={2} mb={1}>
                <MUILink 
                  component={Link} 
                  to={`/${category}/${subCat.key}`}
                  color="primary"
                >
                  {subCat.label[language]}
                </MUILink>
              </Box>
            ))}
          </Box>
        </>
      )}
      
      {/* Encadré d'information si disponible */}
      {getInfoBoxContent() && (
        <Box 
          p={2} 
          mb={3} 
          bgcolor="primary.light" 
          color="primary.contrastText"
          borderRadius="borderRadius"
        >
          <Typography 
            variant="body2" 
            component="div"
            dangerouslySetInnerHTML={{ __html: getInfoBoxContent() }}
          />
        </Box>
      )}
      
      <Divider className={classes.divider} />
    </div>
  );
};

export default CategoryHeader;
