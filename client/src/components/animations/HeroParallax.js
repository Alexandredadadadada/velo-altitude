import React, { useEffect, useRef } from 'react';
import { Box, Typography, Container, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion, useAnimation, useScroll, useTransform } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import ExploreIcon from '@mui/icons-material/Explore';

// Styled components
const HeroContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: '85vh',
  maxHeight: 800,
  width: '100%',
  overflow: 'hidden',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'white',
  marginBottom: theme.spacing(6),
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1
  }
}));

const BackgroundImage = styled(motion.div)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  zIndex: 0
}));

const ContentContainer = styled(Container)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
}));

const ScrollIndicator = styled(motion.div)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(4),
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 3,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  cursor: 'pointer',
}));

const ScrollIcon = styled(motion.div)(({ theme }) => ({
  width: '30px',
  height: '50px',
  border: `2px solid white`,
  borderRadius: '20px',
  marginBottom: theme.spacing(1),
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '8px',
    left: '50%',
    width: '6px',
    height: '6px',
    backgroundColor: 'white',
    borderRadius: '50%',
    transform: 'translateX(-50%)',
  }
}));

const HeroParallax = ({ backgroundImage, title, subtitle, ctaText, ctaLink }) => {
  const controls = useAnimation();
  const { scrollY } = useScroll();
  const containerRef = useRef(null);
  
  // Parallax effect
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  
  // Fade in animation on mount
  useEffect(() => {
    controls.start({ opacity: 1, y: 0, transition: { duration: 1 } });
  }, [controls]);
  
  // Scroll down handler
  const handleScrollDown = () => {
    const nextSection = containerRef.current.nextElementSibling;
    if (nextSection) {
      window.scrollTo({
        top: nextSection.offsetTop,
        behavior: 'smooth'
      });
    }
  };
  
  return (
    <HeroContainer ref={containerRef}>
      <BackgroundImage 
        style={{ y, backgroundImage: `url(${backgroundImage})` }}
      />
      
      <ContentContainer maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
        >
          <Typography 
            variant="h1" 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              mb: 2,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            {title}
          </Typography>
          
          <Typography 
            variant="h4" 
            component="p" 
            sx={{ 
              mb: 4,
              maxWidth: '800px',
              mx: 'auto',
              fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
              textShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}
          >
            {subtitle}
          </Typography>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              component={RouterLink} 
              to={ctaLink}
              variant="contained" 
              size="large"
              endIcon={<ExploreIcon />}
              sx={{ 
                py: 1.5, 
                px: 4,
                fontSize: '1.1rem',
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 6px 20px rgba(33,150,243,0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #00B8D4 90%)',
                  boxShadow: '0 8px 20px rgba(33,150,243,0.4)',
                }
              }}
            >
              {ctaText}
            </Button>
          </motion.div>
        </motion.div>
      </ContentContainer>
      
      <ScrollIndicator
        onClick={handleScrollDown}
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <ScrollIcon />
        <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
          Découvrir
        </Typography>
      </ScrollIndicator>
    </HeroContainer>
  );
};

export default HeroParallax;
