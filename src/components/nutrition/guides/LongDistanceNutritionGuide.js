/**
 * LongDistanceNutritionGuide - Guide nutritionnel pour les événements longue distance
 * 
 * Ce composant présente un guide complet sur la nutrition pour les événements cyclistes
 * de longue distance, y compris les randonnées, les brevets et les courses d'endurance.
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Tabs, Tab, Paper, Divider, 
  Accordion, AccordionSummary, AccordionDetails, Chip, Button,
  List, ListItem, ListItemIcon, ListItemText, Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  ExpandMore, WaterDrop, LocalFireDepartment, Schedule, 
  Restaurant, EmojiEvents, Print, Share, Bookmark, CheckCircle
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

// Imports des sous-composants
import BeforeEventSection from './longDistance/BeforeEventSection';
import DuringEventSection from './longDistance/DuringEventSection';
import RecoverySection from './longDistance/RecoverySection';
import CommonProblems from './longDistance/CommonProblems';
import FoodList from './longDistance/FoodList';

// Import des services
import { trackSEOInteraction } from '../../../services/analyticsService';
import { fetchGuideContent } from '../../../services/dataService';
import Breadcrumbs from '../../common/Breadcrumbs';

// Styles personnalisés
const GuideHeader = styled(Box)(({ theme }) => ({
  background: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5)), url('/images/nutrition/long-distance-header.jpg')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: 'white',
  padding: theme.spacing(10, 2),
  textAlign: 'center',
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(4)
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`tabpanel-${index}`}
    aria-labelledby={`tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ py: 3 }}>
        {children}
      </Box>
    )}
  </div>
);

/**
 * Guide complet de nutrition pour les événements longue distance
 */
const LongDistanceNutritionGuide = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [guideContent, setGuideContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const location = useLocation();
  
  // Définir le breadcrumb
  const breadcrumbItems = [
    { label: t('home'), link: '/' },
    { label: t('nutrition'), link: '/nutrition' },
    { label: t('guides'), link: '/nutrition/guides' },
    { label: t('longDistanceNutrition'), link: location.pathname }
  ];

  useEffect(() => {
    const loadGuideContent = async () => {
      try {
        const content = await fetchGuideContent('long-distance');
        setGuideContent(content);
        
        // Tracking SEO pour l'analyse
        trackSEOInteraction('nutrition', 'guide_view', 'long-distance');
      } catch (error) {
        console.error('Erreur lors du chargement du guide:', error);
        // Contenu de secours en cas d'erreur
        setGuideContent({
          title: "Guide de nutrition pour les événements longue distance",
          intro: "Optimisez votre alimentation pour performer sur les longues distances...",
          keyPoints: [
            "Planification des repas avant, pendant et après l'événement",
            "Stratégies d'hydratation personnalisées",
            "Résolution des problèmes digestifs courants"
          ],
          sections: {
            before: { /* données de la section pré-événement */ },
            during: { /* données de la section pendant l'événement */ },
            recovery: { /* données de la section récupération */ },
            problems: { /* données de la section problèmes communs */ }
          },
          recommendations: {
            foods: [/* liste des aliments recommandés */],
            supplements: [/* liste des suppléments */]
          }
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadGuideContent();
    
    // Scroll en haut de la page au chargement
    window.scrollTo(0, 0);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Tracking SEO des interactions avec les onglets
    const tabNames = ['before', 'during', 'recovery', 'problems', 'foods'];
    trackSEOInteraction('nutrition', 'guide_tab', tabNames[newValue]);
  };
  
  const handlePrint = () => {
    window.print();
    trackSEOInteraction('nutrition', 'guide_print', 'long-distance');
  };
  
  const handleSave = () => {
    // Logique pour sauvegarder le guide dans le compte utilisateur
    alert('Guide sauvegardé dans votre bibliothèque!');
    trackSEOInteraction('nutrition', 'guide_save', 'long-distance');
  };
  
  const handleShare = () => {
    // Partage sur les réseaux sociaux
    if (navigator.share) {
      navigator.share({
        title: 'Guide nutrition longue distance',
        text: 'Découvrez ce guide complet pour optimiser votre nutrition sur les événements cyclistes longue distance.',
        url: window.location.href,
      });
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API Web Share
      alert('Lien copié dans le presse-papier!');
    }
    trackSEOInteraction('nutrition', 'guide_share', 'long-distance');
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box py={4} textAlign="center">
          <Typography variant="h5" gutterBottom>
            Chargement du guide...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Breadcrumbs items={breadcrumbItems} />
      
      {/* En-tête du guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GuideHeader>
          <Typography variant="h3" component="h1" gutterBottom>
            {guideContent.title}
          </Typography>
          <Typography variant="subtitle1" sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
            {guideContent.intro}
          </Typography>
          <Box display="flex" justifyContent="center" flexWrap="wrap" gap={1}>
            {guideContent.keyPoints.map((point, idx) => (
              <Chip 
                key={idx}
                icon={<CheckCircle />}
                label={point}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', mb: 1 }}
              />
            ))}
          </Box>
        </GuideHeader>
      </motion.div>
      
      {/* Actions du guide */}
      <Paper elevation={0} sx={{ mb: 4, p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          startIcon={<Print />}
          onClick={handlePrint}
          size="small"
        >
          Imprimer
        </Button>
        <Button
          startIcon={<Bookmark />}
          onClick={handleSave}
          size="small"
        >
          Sauvegarder
        </Button>
        <Button
          startIcon={<Share />}
          onClick={handleShare}
          size="small"
          color="primary"
        >
          Partager
        </Button>
      </Paper>
      
      {/* Navigation par onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="Avant l'événement" icon={<Schedule />} iconPosition="start" />
          <Tab label="Pendant l'effort" icon={<LocalFireDepartment />} iconPosition="start" />
          <Tab label="Récupération" icon={<EmojiEvents />} iconPosition="start" />
          <Tab label="Problèmes courants" icon={<WaterDrop />} iconPosition="start" />
          <Tab label="Aliments recommandés" icon={<Restaurant />} iconPosition="start" />
        </Tabs>
      </Box>
      
      {/* Contenu des onglets */}
      <TabPanel value={activeTab} index={0}>
        <BeforeEventSection content={guideContent.sections.before} />
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        <DuringEventSection content={guideContent.sections.during} />
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        <RecoverySection content={guideContent.sections.recovery} />
      </TabPanel>
      
      <TabPanel value={activeTab} index={3}>
        <CommonProblems content={guideContent.sections.problems} />
      </TabPanel>
      
      <TabPanel value={activeTab} index={4}>
        <FoodList recommendations={guideContent.recommendations} />
      </TabPanel>
    </Container>
  );
};

export default LongDistanceNutritionGuide;
