import React, { useEffect } from 'react';
import styled from 'styled-components';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';

// Material UI
import {
  Box,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Typography,
  Chip,
  LinearProgress,
  IconButton
} from '@mui/material';

// Icons
import {
  FilterHdr,
  Cloud,
  FitnessCenter,
  Restaurant,
  WbSunny,
  People,
  AccountCircle,
  ThreeDRotation,
  ArrowForward,
  CheckCircle,
  Speed
} from '@mui/icons-material';

const ModulesSection = ({ animationComplexity = 'high' }) => {
  // Modules data with completion status
  const modules = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: <Speed />,
      description: 'Vue d\'ensemble complète de votre profil cycliste et des informations clés.',
      status: 100,
      path: '/dashboard',
      color: '#1976d2',
      users: 2758,
      features: 7
    },
    {
      id: '7majeurs',
      name: 'Les 7 Majeurs',
      icon: <FilterHdr />,
      description: 'Relevez le défi des cols mythiques et suivez votre progression.',
      status: 100,
      path: '/7-majeurs',
      color: '#e65100',
      users: 1982,
      features: 6
    },
    {
      id: 'cols',
      name: 'Module Cols',
      icon: <FilterHdr />,
      description: 'Base de données complète des cols cyclables du monde entier.',
      status: 100,
      path: '/cols',
      color: '#2e7d32',
      users: 3105,
      features: 8
    },
    {
      id: 'entrainement',
      name: 'Module d\'Entraînement',
      icon: <FitnessCenter />,
      description: 'Plans d\'entraînement personnalisés pour progresser efficacement.',
      status: 100,
      path: '/entrainement',
      color: '#d32f2f',
      users: 1843,
      features: 9
    },
    {
      id: 'nutrition',
      name: 'Module Nutrition',
      icon: <Restaurant />,
      description: 'Conseils et planification nutritionnelle adaptés au cyclisme.',
      status: 95,
      path: '/nutrition',
      color: '#7b1fa2',
      users: 1356,
      features: 6
    },
    {
      id: 'meteo',
      name: 'Dashboard Météo',
      icon: <WbSunny />,
      description: 'Prévisions météo précises pour vos zones d\'entraînement et cols favoris.',
      status: 100,
      path: '/meteo',
      color: '#0288d1',
      users: 2489,
      features: 5
    },
    {
      id: 'communaute',
      name: 'Section Communauté',
      icon: <People />,
      description: 'Échangez avec d\'autres cyclistes, partagez vos expériences et participez à des événements.',
      status: 100,
      path: '/communaute',
      color: '#f57c00',
      users: 1723,
      features: 8
    },
    {
      id: 'profil',
      name: 'Profil Utilisateur',
      icon: <AccountCircle />,
      description: 'Gérez votre profil, vos objectifs et vos paramètres personnalisés.',
      status: 95,
      path: '/profil',
      color: '#5d4037',
      users: 2874,
      features: 7
    },
    {
      id: '3d',
      name: 'Visualisation 3D',
      icon: <ThreeDRotation />,
      description: 'Explorez les cols en 3D pour mieux préparer vos ascensions.',
      status: 90,
      path: '/visualisation-3d',
      color: '#00695c',
      users: 1245,
      features: 4
    },
  ];

  // Animation controls
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });
  
  const controls = useAnimation();
  
  useEffect(() => {
    if (inView) {
      controls.start('visible');
    } else {
      if (animationComplexity !== 'low') {
        controls.start('hidden');
      }
    }
  }, [controls, inView, animationComplexity]);
  
  // Animation variants
  const containerVariants = {
    hidden: {},
    visible: {
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
        duration: 0.5
      }
    }
  };
  
  // Stats for completed modules
  const completedModules = modules.filter(module => module.status === 100).length;
  const totalModules = modules.length;
  const completionPercentage = Math.round((completedModules / totalModules) * 100);
  
  return (
    <SectionWrapper id="modules">
      <Container>
        <SectionTitle>
          <Typography 
            variant="h2" 
            component="h2" 
            sx={{ 
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 700,
              mb: 1
            }}
          >
            Modules Fonctionnels
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 400,
              color: 'text.secondary',
              maxWidth: '800px',
              margin: '0 auto',
              mb: 3
            }}
          >
            Une plateforme complète avec des modules spécialisés pour couvrir tous les aspects du cyclisme de montagne.
          </Typography>
          
          <Box sx={{ mb: 6, mt: 4 }}>
            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} sm={4}>
                <StatCard>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: '#1976d2' }}>
                    {completedModules}/{totalModules}
                  </Typography>
                  <Typography variant="body1">Modules Terminés</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={completionPercentage} 
                    sx={{ 
                      mt: 2, 
                      height: 8, 
                      borderRadius: 5,
                      backgroundColor: 'rgba(25, 118, 210, 0.2)'
                    }}
                  />
                </StatCard>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <StatCard>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                    45+
                  </Typography>
                  <Typography variant="body1">Outils Disponibles</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary">
                    Des outils spécifiques pour le cyclisme de montagne
                  </Typography>
                </StatCard>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <StatCard>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: '#f57c00' }}>
                    98%
                  </Typography>
                  <Typography variant="body1">Maturité Globale</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary">
                    Prêt pour le déploiement
                  </Typography>
                </StatCard>
              </Grid>
            </Grid>
          </Box>
        </SectionTitle>
        
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={controls}
        >
          <Grid container spacing={3}>
            {modules.map((module) => (
              <Grid item xs={12} sm={6} md={4} key={module.id}>
                <motion.div variants={itemVariants}>
                  <ModuleCard status={module.status} $color={module.color}>
                    <CardContent>
                      <ModuleIconWrapper $color={module.color}>
                        {module.icon}
                      </ModuleIconWrapper>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                          {module.name}
                        </Typography>
                        <StatusChip status={module.status} />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: '60px' }}>
                        {module.description}
                      </Typography>
                      
                      <ModuleStats>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Utilisateurs
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {module.users.toLocaleString()}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Fonctionnalités
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {module.features}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <IconButton 
                            component={Link} 
                            to={module.path} 
                            size="small"
                            aria-label={`Explorer ${module.name}`}
                            sx={{ 
                              color: module.color,
                              '&:hover': {
                                backgroundColor: `${module.color}20`
                              } 
                            }}
                          >
                            <ArrowForward />
                          </IconButton>
                        </Box>
                      </ModuleStats>
                    </CardContent>
                  </ModuleCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </SectionWrapper>
  );
};

// Status chip component
const StatusChip = ({ status }) => {
  if (status === 100) {
    return (
      <Chip 
        icon={<CheckCircle fontSize="small" />}
        label="100% Complet" 
        color="success" 
        size="small"
        variant="outlined"
      />
    );
  }
  
  return (
    <Chip 
      label={`${status}% Complet`} 
      color="primary" 
      size="small"
      variant="outlined"
    />
  );
};

// Styled Components
const SectionWrapper = styled.section`
  padding: 120px 0;
  background-color: #f9f9f9;
`;

const SectionTitle = styled.div`
  text-align: center;
  margin-bottom: 60px;
`;

const ModuleCard = styled(Card)`
  height: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-top: 4px solid ${props => props.$color};
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
  }
  
  ${props => props.status === 100 ? `
    &:after {
      content: '';
      position: absolute;
      top: 10px;
      right: 10px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #4caf50;
    }
  ` : ''}
`;

const ModuleIconWrapper = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  background-color: ${props => `${props.$color}15`};
  color: ${props => props.$color};
  
  & > svg {
    font-size: 28px;
  }
`;

const ModuleStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
`;

const StatCard = styled(Card)`
  padding: 24px;
  text-align: center;
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
`;

export default ModulesSection;
