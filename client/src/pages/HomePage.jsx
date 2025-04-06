import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Button, 
  Card, 
  CardContent, 
  CardMedia,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  DirectionsBike, 
  Terrain, 
  TrendingUp, 
  ArrowForward 
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import MainLayout from '../layouts/MainLayout';
import RouteRecommendations from '../components/recommendations/RouteRecommendations';
import AnimatedHeroSection from '../components/home/AnimatedHeroSection';
import { useAuth } from '../hooks/useAuthCentral';

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);

const HomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  // Fonctionnalités mises en avant
  const features = [
    {
      icon: <DirectionsBike fontSize="large" color="primary" />,
      title: 'Itinéraires personnalisés',
      description: 'Découvrez des parcours adaptés à votre niveau et à vos préférences'
    },
    {
      icon: <Terrain fontSize="large" color="primary" />,
      title: 'Cols et montées',
      description: 'Explorez les cols mythiques de la région avec toutes les informations nécessaires'
    },
    {
      icon: <TrendingUp fontSize="large" color="primary" />,
      title: 'Suivi de progression',
      description: 'Suivez votre évolution et relevez de nouveaux défis'
    }
  ];
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12
      }
    }
  };
  
  return (
    <MainLayout>
      {/* Animated Hero Section */}
      <AnimatedHeroSection />
      
      {/* Features section */}
      <Container maxWidth="lg" sx={{ mt: { xs: 8, md: 12 }, mb: 6 }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: 1200,
            mx: 'auto'
          }}
        >
          <MotionPaper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Grid container spacing={3} alignItems="center">
              {features.map((feature, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 2 }}>{feature.icon}</Box>
                    <Box>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </MotionPaper>
        </Box>
        
        {/* Section de recommandations */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3 
          }}>
            <Typography variant="h4" component="h2" gutterBottom>
              Découvrez nos itinéraires
            </Typography>
            
            <Button 
              component={Link} 
              to="/routes" 
              endIcon={<ArrowForward />}
              variant="outlined"
              color="primary"
            >
              Voir tous
            </Button>
          </Box>
          
          <RouteRecommendations 
            limit={6} 
            showTabs={true} 
            showFilters={true}
            initialTab={user ? "personalized" : "trending"}
          />
        </Box>
        
        <Divider sx={{ my: 6 }} />
        
        {/* Section "À propos" */}
        <MotionBox
          component="section"
          sx={{ mb: 6 }}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Typography variant="h4" component="h2" gutterBottom>
            À propos de Grand Est Cyclisme
          </Typography>
          
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <MotionBox variants={itemVariants}>
                <Typography variant="body1" paragraph>
                  Grand Est Cyclisme est la plateforme de référence pour tous les passionnés de vélo dans la région Grand Est. 
                  Notre mission est de vous faire découvrir les plus beaux itinéraires cyclistes, 
                  de vous aider à progresser et de créer une communauté active de cyclistes.
                </Typography>
                
                <Typography variant="body1" paragraph>
                  Que vous soyez débutant ou cycliste confirmé, vous trouverez sur notre plateforme 
                  des ressources adaptées à votre niveau et à vos objectifs.
                </Typography>
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  component={Link}
                  to="/about"
                  sx={{ mt: 2 }}
                >
                  En savoir plus
                </Button>
              </MotionBox>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <MotionBox 
                variants={itemVariants}
                sx={{
                  height: { xs: 250, md: 350 },
                  position: 'relative',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <img 
                  src="/images/about/cycling-group.jpg" 
                  alt="Groupe de cyclistes" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }} 
                />
              </MotionBox>
            </Grid>
          </Grid>
        </MotionBox>
        
        {/* Section "Rejoignez-nous" */}
        {!user && (
          <MotionPaper
            elevation={3}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 2,
              bgcolor: theme.palette.primary.main,
              color: 'white',
              textAlign: 'center',
              mb: 6
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h4" component="h2" gutterBottom>
              Rejoignez notre communauté
            </Typography>
            
            <Typography variant="body1" paragraph sx={{ maxWidth: 700, mx: 'auto', mb: 4 }}>
              Créez un compte gratuitement pour accéder à toutes les fonctionnalités : 
              itinéraires personnalisés, suivi de progression, avis et bien plus encore.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                color="secondary" 
                size="large"
                component={Link}
                to="/register"
              >
                S'inscrire
              </Button>
              
              <Button 
                variant="outlined" 
                color="inherit" 
                size="large"
                component={Link}
                to="/login"
              >
                Se connecter
              </Button>
            </Box>
          </MotionPaper>
        )}
        
        {/* Section "Derniers articles" */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3 
          }}>
            <Typography variant="h4" component="h2" gutterBottom>
              Actualités et conseils
            </Typography>
            
            <Button 
              component={Link} 
              to="/blog" 
              endIcon={<ArrowForward />}
              variant="outlined"
              color="primary"
            >
              Tous les articles
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {[1, 2, 3].map((item) => (
              <Grid item xs={12} md={4} key={item}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                    }
                  }}
                  component={Link}
                  to={`/blog/article-${item}`}
                  style={{ textDecoration: 'none' }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={`/images/blog/article${item}.jpg`}
                    alt={`Article ${item}`}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="overline" color="text.secondary">
                      {item === 1 ? 'Entraînement' : item === 2 ? 'Nutrition' : 'Équipement'}
                    </Typography>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {item === 1 
                        ? 'Comment préparer une sortie longue distance' 
                        : item === 2 
                          ? 'Nutrition : les aliments à privilégier pour récupérer' 
                          : 'Guide d\'achat : choisir son vélo de route'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item === 1 
                        ? 'Découvrez nos conseils pour préparer et réussir vos sorties longue distance...' 
                        : item === 2 
                          ? 'Une bonne récupération passe par une alimentation adaptée. Voici les aliments à privilégier...' 
                          : 'Comment choisir le vélo de route qui correspond à vos besoins et à votre budget...'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </MainLayout>
  );
};

export default HomePage;
