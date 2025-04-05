import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Container, useTheme, useMediaQuery, Fade } from '@mui/material';
import { motion, useAnimation, useInView } from 'framer-motion';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import TerrainIcon from '@mui/icons-material/Terrain';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Link } from 'react-router-dom';
import { useBatteryStatus } from '../../hooks/useBatteryStatus';

// Composant d'animation de montagne stylisée
const AnimatedMountain = ({ index, delay, color, height, width }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  
  useEffect(() => {
    if (isInView) {
      controls.start({
        y: 0,
        opacity: 1,
        transition: { 
          duration: 0.8, 
          delay: delay,
          ease: [0.215, 0.61, 0.355, 1] // Ease out cubic
        }
      });
    }
  }, [isInView, controls, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ y: 100, opacity: 0 }}
      animate={controls}
      style={{
        position: 'absolute',
        bottom: 0,
        left: `${index * 15}%`,
        zIndex: 10 - index
      }}
    >
      <Box
        sx={{
          width: 0,
          height: 0,
          borderLeft: `${width/2}px solid transparent`,
          borderRight: `${width/2}px solid transparent`,
          borderBottom: `${height}px solid ${color}`,
          filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.15))',
          transform: 'translateZ(0)', // Performance optimization
        }}
      />
      
      {/* Sommet enneigé */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: width * 0.2,
          height: width * 0.1,
          borderRadius: '50%',
          backgroundColor: 'white',
          filter: 'blur(5px)',
          opacity: 0.8
        }}
      />
    </motion.div>
  );
};

// Nuage animé
const AnimatedCloud = ({ top, left, size, delay, duration }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: [0, 0.8, 0.6],
        transition: { 
          duration: 1.5, 
          delay: delay,
          ease: "easeOut"
        }
      }}
      style={{
        position: 'absolute',
        top: `${top}%`,
        left: `${left}%`,
      }}
    >
      <motion.div
        animate={{
          x: ['0%', '5%', '0%', '-5%', '0%'],
          transition: {
            duration: duration,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: "easeInOut"
          }
        }}
      >
        <Box
          sx={{
            width: size,
            height: size * 0.6,
            borderRadius: '50%',
            background: `linear-gradient(to bottom, ${theme.palette.grey[100]}, ${theme.palette.grey[300]})`,
            boxShadow: `0 10px 30px ${theme.palette.mode === 'dark' 
              ? 'rgba(0,0,0,0.3)' 
              : 'rgba(0,0,0,0.1)'
            }`,
            opacity: 0.7,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-40%',
              left: '20%',
              width: '60%',
              height: '100%',
              borderRadius: '50%',
              background: `linear-gradient(to bottom, ${theme.palette.grey[100]}, ${theme.palette.grey[200]})`,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '-20%',
              right: '20%',
              width: '40%',
              height: '80%',
              borderRadius: '50%',
              background: `linear-gradient(to bottom, ${theme.palette.grey[100]}, ${theme.palette.grey[200]})`,
            }
          }}
        />
      </motion.div>
    </motion.div>
  );
};

// Cycliste animé
const AnimatedCyclist = ({ delay }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        transition: { 
          duration: 0.8, 
          delay: delay + 0.5,
          ease: "easeOut"
        }
      }}
      style={{
        position: 'absolute',
        bottom: '10%',
        left: '15%',
        zIndex: 20
      }}
    >
      <motion.div
        animate={{
          y: [0, -3, 0],
          transition: {
            duration: 1,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: "easeInOut"
          }
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 70,
            height: 70,
          }}
        >
          <DirectionsBikeIcon 
            sx={{ 
              fontSize: 70, 
              color: theme.palette.primary.main,
              filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.2))'
            }} 
          />
        </Box>
      </motion.div>
    </motion.div>
  );
};

// Composant principal de la section héro animée
const AnimatedHeroSection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const { batteryStatus } = useBatteryStatus();
  const [reduceAnimations, setReduceAnimations] = useState(false);
  
  // Effet pour réduire les animations si la batterie est faible
  useEffect(() => {
    if (batteryStatus === 'low') {
      setReduceAnimations(true);
    } else {
      setReduceAnimations(false);
    }
  }, [batteryStatus]);
  
  // Calculer le nombre d'éléments à afficher selon la taille d'écran
  const getMountainsCount = () => {
    if (isMobile) return 3;
    if (isTablet) return 5;
    return 7;
  };
  
  const getCloudCount = () => {
    if (isMobile) return 2;
    if (isTablet) return 3;
    return 4;
  };
  
  // Génération des montagnes
  const mountains = [];
  const mountainColors = [
    theme.palette.primary.dark,
    theme.palette.primary.main,
    theme.palette.secondary.dark,
    theme.palette.primary.light,
    theme.palette.secondary.main,
    theme.palette.primary.main,
    theme.palette.primary.dark
  ];
  
  const mountainCount = getMountainsCount();
  
  for (let i = 0; i < mountainCount; i++) {
    const height = 300 - (i * 40);
    const width = 300 - (i * 20);
    mountains.push(
      <AnimatedMountain 
        key={`mountain-${i}`}
        index={i}
        delay={i * 0.15}
        color={mountainColors[i % mountainColors.length]}
        height={height}
        width={width}
      />
    );
  }
  
  // Génération des nuages si les animations ne sont pas réduites
  const clouds = [];
  const cloudCount = getCloudCount();
  
  if (!reduceAnimations) {
    for (let i = 0; i < cloudCount; i++) {
      clouds.push(
        <AnimatedCloud 
          key={`cloud-${i}`}
          top={20 + (i * 15)}
          left={10 + (i * 20)}
          size={80 - (i * 10)}
          delay={1 + (i * 0.2)}
          duration={15 + (i * 5)}
        />
      );
    }
  }
  
  // Animations pour le texte
  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2 + 0.5,
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1]
      }
    })
  };
  
  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: '90vh', md: '100vh' },
        overflow: 'hidden',
        background: `linear-gradient(180deg, ${theme.palette.mode === 'dark' 
          ? '#1A1A2E 0%, #16213E 100%' 
          : '#E6F2FF 0%, #99CCFF 100%'
        })`,
      }}
    >
      {/* Fond de montagnes */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '70%',
          pointerEvents: 'none'
        }}
      >
        {mountains}
        {clouds}
        {!isMobile && !reduceAnimations && <AnimatedCyclist delay={1.5} />}
      </Box>
      
      {/* Contenu texte */}
      <Container
        maxWidth="lg"
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 30,
          pt: { xs: 8, md: 0 }
        }}
      >
        <Box sx={{ maxWidth: { xs: '100%', md: '60%' } }}>
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={textVariants}
          >
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4.5rem' },
                fontWeight: 800,
                mb: 1,
                letterSpacing: '-0.02em',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
              }}
            >
              Velo-Altitude
            </Typography>
          </motion.div>
          
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={textVariants}
          >
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.25rem', lg: '2.75rem' },
                fontWeight: 700,
                mb: 3,
                color: theme.palette.text.primary,
              }}
            >
              Le plus grand dashboard vélo d'Europe
            </Typography>
          </motion.div>
          
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={textVariants}
          >
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                fontWeight: 500,
                mb: 4,
                color: theme.palette.text.secondary,
                maxWidth: { xs: '100%', md: '80%' }
              }}
            >
              Découvrez, planifiez et conquérez les plus beaux cols d'Europe avec une expérience immersive unique.
            </Typography>
          </motion.div>
          
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={textVariants}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mt: 2
              }}
            >
              <Button
                component={Link}
                to="/challenges"
                variant="contained"
                size="large"
                startIcon={<TerrainIcon />}
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: '30px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: theme.shadows[4],
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-2px)',
                  },
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                Découvrir 7 Majeurs
              </Button>
              
              <Button
                component={Link}
                to="/cols"
                variant="outlined"
                size="large"
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: '30px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'transform 0.2s',
                }}
              >
                Explorer les cols
              </Button>
            </Box>
          </motion.div>
        </Box>
      </Container>
      
      {/* Indicateur de défilement */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          textAlign: 'center',
          display: { xs: 'none', md: 'block' }
        }}
      >
        <motion.div
          animate={{
            y: [0, 10, 0],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'loop'
          }}
        >
          <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
            Découvrir plus
          </Typography>
          <KeyboardArrowDownIcon color="action" />
        </motion.div>
      </Box>
    </Box>
  );
};

export default AnimatedHeroSection;
