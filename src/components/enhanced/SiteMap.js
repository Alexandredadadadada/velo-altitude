import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Container, 
  Typography, 
  Box, 
  Breadcrumbs, 
  Paper, 
  Grid, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MapIcon from '@mui/icons-material/Map';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TerrainIcon from '@mui/icons-material/Terrain';
import PeopleIcon from '@mui/icons-material/People';
import InfoIcon from '@mui/icons-material/Info';
import SEOHead from './SEOHead';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Composant SiteMap - Plan du site HTML pour les utilisateurs et les moteurs de recherche
 * Ce composant affiche une structure organisée de toutes les pages du site
 */
const SiteMap = () => {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const currentLang = i18n.language || 'fr';
  
  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };
  
  // Structure du site
  const siteStructure = {
    home: {
      title: t('sitemap.home'),
      path: '/',
      icon: <MapIcon />,
    },
    cols: {
      title: t('sitemap.cols.title'),
      path: '/cols',
      icon: <TerrainIcon />,
      subpages: [
        { title: t('sitemap.cols.all'), path: '/cols' },
        { title: t('sitemap.cols.bonette'), path: '/cols/bonette' },
        { title: t('sitemap.cols.galibier'), path: '/cols/galibier' },
        { title: t('sitemap.cols.stelvio'), path: '/cols/stelvio' },
        { title: t('sitemap.cols.tourmalet'), path: '/cols/tourmalet' },
        { title: t('sitemap.cols.izoard'), path: '/cols/izoard' },
        { title: t('sitemap.cols.angliru'), path: '/cols/angliru' },
        { title: t('sitemap.cols.mortirolo'), path: '/cols/mortirolo' },
        // Autres cols...
      ]
    },
    training: {
      title: t('sitemap.training.title'),
      path: '/training',
      icon: <FitnessCenterIcon />,
      subpages: [
        { title: t('sitemap.training.all'), path: '/training' },
        { title: t('sitemap.training.plan_haute_montagne'), path: '/training/plan-haute-montagne' },
        { title: t('sitemap.training.prep_montagne'), path: '/training/prep-montagne' },
        { title: t('sitemap.training.haute_altitude'), path: '/training/haute-altitude' },
        { title: t('sitemap.training.col_crusher'), path: '/training/programs/col-crusher' },
        { title: t('sitemap.training.endurance_builder'), path: '/training/programs/endurance-builder' },
        { title: t('sitemap.training.alpine_climber'), path: '/training/programs/alpine-climber' },
        { title: t('sitemap.training.power_intervals'), path: '/training/programs/power-intervals' },
        // Autres programmes...
      ]
    },
    nutrition: {
      title: t('sitemap.nutrition.title'),
      path: '/nutrition',
      icon: <RestaurantIcon />,
      subpages: [
        { title: t('sitemap.nutrition.all'), path: '/nutrition' },
        { title: t('sitemap.nutrition.plan_endurance'), path: '/nutrition/nutrition-plan-endurance' },
        { title: t('sitemap.nutrition.plan_gran_fondo'), path: '/nutrition/nutrition-plan-gran-fondo' },
        { title: t('sitemap.nutrition.plan_mountain'), path: '/nutrition/nutrition-plan-mountain' },
        { title: t('sitemap.nutrition.energy_oatmeal'), path: '/nutrition/recipes/energy-oatmeal' },
        { title: t('sitemap.nutrition.recovery_smoothie'), path: '/nutrition/recipes/recovery-smoothie' },
        { title: t('sitemap.nutrition.protein_pasta'), path: '/nutrition/recipes/protein-pasta' },
        { title: t('sitemap.nutrition.energy_bars'), path: '/nutrition/recipes/homemade-energy-bars' },
        { title: t('sitemap.nutrition.hydration_drink'), path: '/nutrition/recipes/hydration-drink' },
        // Autres recettes...
      ]
    },
    sevenMajors: {
      title: t('sitemap.seven_majors.title'),
      path: '/seven-majors',
      icon: <DirectionsBikeIcon />,
      subpages: [
        { title: t('sitemap.seven_majors.create'), path: '/seven-majors/create' },
        { title: t('sitemap.seven_majors.explore'), path: '/seven-majors/explore' },
        { title: t('sitemap.seven_majors.community'), path: '/seven-majors/community' },
      ]
    },
    community: {
      title: t('sitemap.community.title'),
      path: '/social',
      icon: <PeopleIcon />,
      subpages: [
        { title: t('sitemap.community.challenges'), path: '/challenges' },
        { title: t('sitemap.community.above_2500'), path: '/challenges/above-2500-challenge' },
        { title: t('sitemap.community.alpes_giants'), path: '/challenges/alpes-giants-challenge' },
      ]
    },
    about: {
      title: t('sitemap.about.title'),
      path: '/about',
      icon: <InfoIcon />,
      subpages: [
        { title: t('sitemap.about.team'), path: '/about/team' },
        { title: t('sitemap.about.contact'), path: '/about/contact' },
        { title: t('sitemap.about.privacy'), path: '/about/privacy' },
        { title: t('sitemap.about.terms'), path: '/about/terms' },
      ]
    }
  };
  
  // Métadonnées SEO pour la page du plan du site
  const siteMapMetadata = {
    fr: {
      title: "Plan du Site | Velo-Altitude",
      description: "Consultez le plan du site Velo-Altitude pour naviguer facilement à travers notre contenu sur le cyclisme de montagne, les cols, les programmes d'entraînement et les recettes.",
      keywords: "plan du site, navigation, velo-altitude, cyclisme montagne, cols, entraînement, nutrition",
      canonical: "https://www.velo-altitude.com/sitemap",
      ogImage: "https://www.velo-altitude.com/images/sitemap-og-image.jpg",
    },
    en: {
      title: "Site Map | Velo-Altitude",
      description: "View the Velo-Altitude site map to easily navigate through our content on mountain cycling, passes, training programs and recipes.",
      keywords: "site map, navigation, velo-altitude, mountain cycling, passes, training, nutrition",
      canonical: "https://www.velo-altitude.com/en/sitemap",
      ogImage: "https://www.velo-altitude.com/images/sitemap-og-image.jpg",
    }
  };
  
  // Schéma structuré pour la page du plan du site
  const siteMapSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": currentLang === 'fr' ? "Plan du Site Velo-Altitude" : "Velo-Altitude Site Map",
    "description": currentLang === 'fr' 
      ? "Plan du site complet de Velo-Altitude, la référence du cyclisme de montagne" 
      : "Complete site map of Velo-Altitude, the mountain cycling reference",
    "url": currentLang === 'fr' ? "https://www.velo-altitude.com/sitemap" : "https://www.velo-altitude.com/en/sitemap",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": currentLang === 'fr' ? "Accueil" : "Home",
          "item": currentLang === 'fr' ? "https://www.velo-altitude.com" : "https://www.velo-altitude.com/en"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": currentLang === 'fr' ? "Plan du Site" : "Site Map",
          "item": currentLang === 'fr' ? "https://www.velo-altitude.com/sitemap" : "https://www.velo-altitude.com/en/sitemap"
        }
      ]
    }
  };
  
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/sitemap"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <SEOHead 
        metadata={siteMapMetadata[currentLang]}
        schema={siteMapSchema}
      />
      
      <Box mb={4}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            {t('breadcrumbs.home')}
          </Link>
          <Typography color="text.primary">{t('breadcrumbs.sitemap')}</Typography>
        </Breadcrumbs>
      </Box>
      
      <Paper elevation={1} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <MapIcon fontSize="large" sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            {currentLang === 'fr' ? "Plan du Site" : "Site Map"}
          </Typography>
        </Box>
        
        <Typography variant="body1" paragraph>
          {t('sitemap.description')}
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Grid container spacing={3}>
          {/* Section principale */}
          <Grid item xs={12}>
            <List component="nav" aria-label="main site sections">
              <ListItem button component={Link} to={siteStructure.home.path}>
                <ListItemText 
                  primary={
                    <Box display="flex" alignItems="center">
                      {siteStructure.home.icon}
                      <Typography variant="h6" sx={{ ml: 2 }}>{siteStructure.home.title}</Typography>
                    </Box>
                  } 
                />
              </ListItem>
            </List>
          </Grid>
          
          {/* Sections avec sous-pages */}
          {Object.keys(siteStructure).filter(key => key !== 'home').map((sectionKey) => {
            const section = siteStructure[sectionKey];
            return (
              <Grid item xs={12} md={6} key={sectionKey}>
                <Accordion 
                  expanded={expanded === sectionKey} 
                  onChange={handleChange(sectionKey)}
                  sx={{ mb: 2 }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`${sectionKey}-content`}
                    id={`${sectionKey}-header`}
                  >
                    <Box display="flex" alignItems="center">
                      {section.icon}
                      <Typography variant="h6" sx={{ ml: 2 }}>{section.title}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {section.subpages && section.subpages.map((subpage, index) => (
                        <ListItem 
                          button 
                          component={Link} 
                          to={subpage.path} 
                          key={index}
                          sx={{ pl: 4 }}
                        >
                          <ListItemText primary={subpage.title} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
      
      <Box textAlign="center" mt={4}>
        <Typography variant="body2" color="text.secondary">
          {t('sitemap.last_updated')}: {new Date().toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US')}
        </Typography>
      </Box>
    </Container>
  );
};

export default SiteMap;
