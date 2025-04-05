import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  useTheme, 
  useMediaQuery,
  IconButton
} from '@mui/material';
import { 
  KeyboardArrowLeft, 
  KeyboardArrowRight 
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const HeroCarousel = ({ images }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Changement automatique d'image toutes les 6 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 6000);
    
    return () => clearInterval(interval);
  }, [currentIndex]);

  // Gestion des transitions
  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrevious = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  // Variantes d'animation
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0
    })
  };

  // Variantes pour le texte
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        delay: 0.3,
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <Box 
      sx={{ 
        position: 'relative', 
        height: { xs: 400, sm: 500, md: 600 },
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '30%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
          zIndex: 1
        }
      }}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.4 }
          }}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%'
          }}
        >
          <Box
            sx={{
              backgroundImage: `url(${images[currentIndex].url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              width: '100%',
              height: '100%',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
              }
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                bottom: { xs: '20%', md: '25%' },
                left: { xs: '5%', md: '10%' },
                width: { xs: '90%', md: '60%' },
                color: 'white',
                zIndex: 2
              }}
            >
              <motion.div
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                <Typography 
                  variant={isMobile ? "h4" : "h2"} 
                  component="h1" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}
                >
                  {images[currentIndex].title}
                </Typography>
                
                <Typography 
                  variant={isMobile ? "body1" : "h5"} 
                  gutterBottom
                  sx={{ 
                    mb: 3,
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                  }}
                >
                  {images[currentIndex].subtitle}
                </Typography>
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  size={isMobile ? "medium" : "large"}
                  sx={{ mr: 2 }}
                >
                  Découvrir
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="inherit"
                  size={isMobile ? "medium" : "large"}
                  sx={{ 
                    borderColor: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  En savoir plus
                </Button>
              </motion.div>
            </Box>
          </Box>
        </motion.div>
      </AnimatePresence>

      {/* Contrôles du carousel */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          zIndex: 2
        }}
      >
        {images.map((_, index) => (
          <Box
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              mx: 0.5,
              backgroundColor: index === currentIndex ? 'primary.main' : 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </Box>

      {/* Boutons de navigation */}
      <IconButton
        onClick={handlePrevious}
        sx={{
          position: 'absolute',
          left: { xs: 10, md: 20 },
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          },
          zIndex: 2
        }}
      >
        <KeyboardArrowLeft />
      </IconButton>
      
      <IconButton
        onClick={handleNext}
        sx={{
          position: 'absolute',
          right: { xs: 10, md: 20 },
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          },
          zIndex: 2
        }}
      >
        <KeyboardArrowRight />
      </IconButton>
    </Box>
  );
};

export default HeroCarousel;
