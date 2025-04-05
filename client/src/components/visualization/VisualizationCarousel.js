import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  useTheme,
  useMediaQuery,
  Button,
  Skeleton,
  alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ArrowBackIos as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
  FiberManualRecord as DotIcon
} from '@mui/icons-material';
import VisualizationCard from './VisualizationCard';

// Styled components
const CarouselContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  padding: theme.spacing(2, 0),
  marginBottom: theme.spacing(6),
}));

const SlideContainer = styled(motion.div)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(0, 2),
  width: '100%',
  height: '100%',
}));

const NavigationArrow = styled(IconButton)(({ theme, direction }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 10,
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  color: theme.palette.text.primary,
  boxShadow: theme.shadows[2],
  '&:hover': {
    backgroundColor: theme.palette.background.paper,
  },
  ...(direction === 'left' && {
    left: theme.spacing(1),
  }),
  ...(direction === 'right' && {
    right: theme.spacing(1),
  }),
}));

const DotsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginTop: theme.spacing(2),
}));

const DotButton = styled(IconButton)(({ theme, active }) => ({
  padding: theme.spacing(0.5),
  color: active ? theme.palette.primary.main : theme.palette.text.disabled,
  transform: active ? 'scale(1.2)' : 'scale(1)',
  transition: theme.transitions.create(['transform', 'color'], {
    duration: 300,
  }),
}));

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    '& > *:not(:last-child)': {
      marginBottom: theme.spacing(2),
    },
  },
}));

// Animation variants
const fadeVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

/**
 * VisualizationCarousel - Composant de carrousel pour visualisations
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Array} props.items - Liste des éléments à afficher dans le carrousel
 * @param {string} props.title - Titre du carrousel
 * @param {boolean} props.loading - État de chargement
 * @param {boolean} props.autoPlay - Activer le défilement automatique
 * @param {number} props.autoPlayInterval - Intervalle de défilement automatique en ms
 * @param {boolean} props.showDots - Afficher les points de navigation
 * @param {boolean} props.showArrows - Afficher les flèches de navigation
 * @param {boolean} props.loop - Activer la lecture en boucle
 * @param {string} props.variant - Variante du carrousel (compact ou expanded)
 * @param {string} props.viewAllUrl - URL pour voir tous les éléments
 * @param {Function} props.onFavoriteToggle - Fonction appelée lors du clic sur le bouton favori
 * @param {Function} props.onBookmarkToggle - Fonction appelée lors du clic sur le bouton enregistrement
 * @param {Function} props.onShare - Fonction appelée lors du clic sur le bouton partage
 */
const VisualizationCarousel = ({
  items = [],
  title = 'Visualisations recommandées',
  loading = false,
  autoPlay = true,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  loop = true,
  variant = 'compact',
  viewAllUrl,
  onFavoriteToggle,
  onBookmarkToggle,
  onShare,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const autoPlayRef = useRef(null);
  
  // Reset index when items change
  useEffect(() => {
    setCurrentIndex(0);
  }, [items]);
  
  // Gestion du défilement automatique
  useEffect(() => {
    if (autoPlay && items.length > 1) {
      autoPlayRef.current = setInterval(() => {
        if (currentIndex === items.length - 1 && !loop) {
          clearInterval(autoPlayRef.current);
        } else {
          goToNext();
        }
      }, autoPlayInterval);
    }
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, currentIndex, items.length, loop, autoPlayInterval]);
  
  const goToPrevious = () => {
    setDirection(-1);
    if (currentIndex === 0) {
      if (loop) {
        setCurrentIndex(items.length - 1);
      }
    } else {
      setCurrentIndex((prev) => prev - 1);
    }
  };
  
  const goToNext = () => {
    setDirection(1);
    if (currentIndex === items.length - 1) {
      if (loop) {
        setCurrentIndex(0);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };
  
  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };
  
  // Skeletons pour le chargement
  const renderSkeletons = () => (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Box sx={{ width: isMobile ? '100%' : '80%', maxWidth: 700 }}>
        <Skeleton variant="rectangular" height={250} sx={{ borderRadius: theme.shape.borderRadius }} />
        <Skeleton variant="text" height={40} sx={{ mt: 2 }} />
        <Skeleton variant="text" height={20} width="60%" />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Skeleton variant="text" width={80} height={40} />
          <Skeleton variant="text" width={80} height={40} />
        </Box>
      </Box>
    </Box>
  );
  
  return (
    <Box>
      <HeaderContainer>
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            fontWeight: 700,
            borderBottom: `3px solid ${theme.palette.primary.main}`,
            paddingBottom: theme.spacing(0.5),
            display: 'inline-block'
          }}
        >
          {title}
        </Typography>
        
        {viewAllUrl && (
          <Button 
            component="a" 
            href={viewAllUrl} 
            color="primary"
            endIcon={<ArrowForwardIcon />}
          >
            Voir tout
          </Button>
        )}
      </HeaderContainer>
      
      <CarouselContainer>
        {loading ? (
          renderSkeletons()
        ) : items.length > 0 ? (
          <>
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <SlideContainer
                key={currentIndex}
                custom={direction}
                variants={fadeVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
              >
                <Box 
                  sx={{ 
                    width: isMobile ? '100%' : variant === 'compact' ? '70%' : '85%',
                    maxWidth: variant === 'compact' ? 500 : 900
                  }}
                >
                  <VisualizationCard
                    id={items[currentIndex].id}
                    title={items[currentIndex].title}
                    subtitle={items[currentIndex].subtitle}
                    image={items[currentIndex].image}
                    type={items[currentIndex].type}
                    location={items[currentIndex].location}
                    stats={items[currentIndex].stats}
                    details={items[currentIndex].details}
                    detailsUrl={items[currentIndex].detailsUrl}
                    variant={variant}
                    isFavorite={items[currentIndex].isFavorite}
                    isBookmarked={items[currentIndex].isBookmarked}
                    onFavoriteToggle={onFavoriteToggle}
                    onBookmarkToggle={onBookmarkToggle}
                    onShare={onShare}
                  />
                </Box>
              </SlideContainer>
            </AnimatePresence>
            
            {showArrows && items.length > 1 && (
              <>
                <NavigationArrow
                  direction="left"
                  onClick={goToPrevious}
                  aria-label="Précédent"
                  disabled={currentIndex === 0 && !loop}
                >
                  <ArrowBackIcon />
                </NavigationArrow>
                
                <NavigationArrow
                  direction="right"
                  onClick={goToNext}
                  aria-label="Suivant"
                  disabled={currentIndex === items.length - 1 && !loop}
                >
                  <ArrowForwardIcon />
                </NavigationArrow>
              </>
            )}
            
            {showDots && items.length > 1 && (
              <DotsContainer>
                {items.map((_, index) => (
                  <DotButton
                    key={index}
                    active={index === currentIndex ? 1 : 0}
                    onClick={() => goToSlide(index)}
                    aria-label={`Aller à la diapositive ${index + 1}`}
                    size="small"
                  >
                    <DotIcon fontSize="small" />
                  </DotButton>
                ))}
              </DotsContainer>
            )}
          </>
        ) : (
          <Paper
            sx={{
              padding: theme.spacing(3),
              textAlign: 'center',
              backgroundColor: theme.palette.background.paper,
            }}
            elevation={1}
          >
            <Typography variant="body1" color="textSecondary">
              Aucune visualisation disponible.
            </Typography>
          </Paper>
        )}
      </CarouselContainer>
    </Box>
  );
};

export default VisualizationCarousel;
