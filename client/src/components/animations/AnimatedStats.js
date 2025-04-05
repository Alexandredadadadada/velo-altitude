import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Box,
  Typography,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  EmojiEvents as TrophyIcon,
  Terrain as MountainIcon,
  DirectionsBike as BikeIcon,
  Groups as CommunityIcon,
  Timeline as GraphIcon,
  PedalBike as PedalBikeIcon
} from '@mui/icons-material';

// Styles
const StatContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(8, 0),
  backgroundColor: alpha(theme.palette.primary.main, 0.03),
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(6),
  marginBottom: theme.spacing(6),
}));

const StatPaper = styled(Paper)(({ theme, color }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  borderTop: `4px solid ${theme.palette[color || 'primary'].main}`,
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
  },
}));

const IconWrapper = styled(Box)(({ theme, color }) => ({
  width: 60,
  height: 60,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  backgroundColor: alpha(theme.palette[color || 'primary'].main, 0.1),
  color: theme.palette[color || 'primary'].main,
  margin: theme.spacing(0, 'auto', 2),
}));

const AnimatedValue = ({ value, duration = 2, valueType = 'number', ...props }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.5 });

  useEffect(() => {
    if (inView) {
      let startTime;
      let step = 0;
      let targetValue = parseInt(value, 10);

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        if (valueType === 'percentage') {
          step = Math.floor(progress * targetValue);
          setDisplayValue(Math.min(step, targetValue));
        } else {
          // Plus smooth animation for regular numbers with easing
          const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
          step = Math.floor(easeOutQuart(progress) * targetValue);
          setDisplayValue(Math.min(step, targetValue));
        }

        if (progress < 1) {
          window.requestAnimationFrame(animate);
        }
      };

      window.requestAnimationFrame(animate);
      controls.start({ opacity: 1, y: 0 });
    }
  }, [inView, value, duration, valueType, controls]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
      transition={{
        duration: 0.5,
        ease: "easeOut"
      }}
      {...props}
    >
      <Typography 
        variant="h3" 
        component="div" 
        sx={{ 
          fontWeight: 700,
          mb: 0.5,
          color: 'text.primary',
          fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
        }}
      >
        {displayValue}
        {valueType === 'percentage' ? '%' : valueType === 'plus' ? '+' : ''}
      </Typography>
    </motion.div>
  );
};

/**
 * AnimatedStats - Composant pour afficher des statistiques animées
 * 
 * @param {Object} props
 * @param {Array} props.stats - Liste des stats à afficher
 * @param {string} props.title - Titre de la section (optionnel)
 * @param {string} props.subtitle - Sous-titre de la section (optionnel)
 * @param {string} props.backgroundColor - Couleur de fond personnalisée (optionnel)
 * @param {Object} props.sx - Styles supplémentaires (optionnel)
 */
const AnimatedStats = ({ 
  stats = [],
  title = "Nos chiffres clés",
  subtitle = "Découvrez ce qui fait de notre plateforme le choix préféré des cyclistes",
  backgroundColor,
  sx = {} 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Stats par défaut si aucune n'est fournie
  const defaultStats = [
    {
      id: 'cols',
      value: 240,
      label: 'Cols européens documentés',
      description: 'Des plus célèbres aux plus secrets',
      icon: <MountainIcon fontSize="large" />,
      color: 'primary'
    },
    {
      id: 'cyclists',
      value: 15750,
      label: 'Cyclistes actifs',
      description: 'Une communauté passionnée',
      icon: <BikeIcon fontSize="large" />,
      color: 'secondary'
    },
    {
      id: 'routes',
      value: 1280,
      label: 'Itinéraires partagés',
      description: 'À travers toute l\'Europe',
      icon: <PedalBikeIcon fontSize="large" />,
      color: 'info'
    },
    {
      id: 'elevation',
      value: 4810,
      label: 'Mètres d\'altitude max',
      description: 'Du niveau de la mer au Mont Blanc',
      icon: <GraphIcon fontSize="large" />,
      color: 'warning'
    },
    {
      id: 'events',
      value: 125,
      label: 'Événements organisés',
      description: 'Challenges et compétitions',
      icon: <TrophyIcon fontSize="large" />,
      color: 'success'
    },
    {
      id: 'community',
      value: 98,
      label: 'Satisfaction utilisateurs',
      description: 'Des retours exceptionnels',
      icon: <CommunityIcon fontSize="large" />,
      valueType: 'percentage',
      color: 'error'
    }
  ];
  
  const displayStats = stats.length > 0 ? stats : defaultStats;
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <StatContainer 
      ref={ref}
      sx={{ 
        backgroundColor: backgroundColor || alpha(theme.palette.primary.main, 0.03),
        ...sx 
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
        {(title || subtitle) && (
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            {title && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
              >
                <Typography 
                  variant="h3" 
                  component="h2" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 700,
                    fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                    mb: 2
                  }}
                >
                  {title}
                </Typography>
              </motion.div>
            )}
            
            {subtitle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Typography 
                  variant="h6" 
                  color="textSecondary"
                  sx={{ 
                    maxWidth: 800, 
                    mx: 'auto',
                    fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' }
                  }}
                >
                  {subtitle}
                </Typography>
              </motion.div>
            )}
          </Box>
        )}
        
        <Grid container spacing={3}>
          {displayStats.map((stat, index) => (
            <Grid 
              item 
              xs={12} 
              sm={6} 
              md={isMobile ? 12 : isTablet ? 6 : displayStats.length > 4 ? 4 : 12 / Math.min(displayStats.length, 4)} 
              key={stat.id || index}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ 
                  duration: 0.6,
                  delay: 0.1 + (index * 0.1),
                  ease: "easeOut"
                }}
              >
                <StatPaper color={stat.color}>
                  <IconWrapper color={stat.color}>
                    {stat.icon}
                  </IconWrapper>
                  
                  <AnimatedValue 
                    value={stat.value} 
                    valueType={stat.valueType} 
                    duration={1.5 + (index * 0.1)}
                  />
                  
                  <Typography 
                    variant="h6" 
                    component="div"
                    sx={{ 
                      fontWeight: 600,
                      mb: 1,
                      color: theme.palette[stat.color || 'primary'].main
                    }}
                  >
                    {stat.label}
                  </Typography>
                  
                  {stat.description && (
                    <Typography 
                      variant="body2" 
                      color="textSecondary"
                    >
                      {stat.description}
                    </Typography>
                  )}
                </StatPaper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Box>
    </StatContainer>
  );
};

export default AnimatedStats;
