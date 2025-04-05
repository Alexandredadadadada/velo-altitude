import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Fade,
  Tooltip,
  Grow,
  useTheme,
  alpha 
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// SVG des différents systèmes corporels
const cardioSystem = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50,30 C40,10 10,10 10,40 C10,75 50,90 50,90 C50,90 90,75 90,40 C90,10 60,10 50,30 Z" 
          fill="currentColor" stroke="none" />
  </svg>
`;

const muscleSystem = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="40" rx="25" ry="30" fill="currentColor" />
    <rect x="40" y="70" width="20" height="40" rx="5" fill="currentColor" />
  </svg>
`;

const respiratorySystem = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M40,20 L60,20 L60,40 C70,40 80,50 80,60 C80,70 70,80 60,80 L40,80 C30,80 20,70 20,60 C20,50 30,40 40,40 L40,20" 
          fill="currentColor" stroke="none" />
  </svg>
`;

const energySystem = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50,10 L35,50 L60,50 L50,90 L65,50 L40,50 Z" 
          fill="currentColor" stroke="none" />
  </svg>
`;

/**
 * Composant de visualisation des effets physiologiques selon les zones d'entraînement
 * Fournit des animations dynamiques montrant l'impact sur les différents systèmes du corps
 */
const PhysiologicalEffectsVisualizer = ({ zone, animated = true }) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const svgRefs = {
    cardio: useRef(),
    muscle: useRef(),
    respiratory: useRef(),
    energy: useRef()
  };

  // Effets physiologiques par zone
  const physiologicalEffects = {
    1: {
      cardio: { impact: 0.2, description: "Légère augmentation du rythme cardiaque (50-60% FCmax)" },
      muscle: { impact: 0.15, description: "Minimal, principalement fibres lentes (type I)" },
      respiratory: { impact: 0.2, description: "Respiration légèrement accélérée, conversation facile" },
      energy: { impact: 0.3, description: "Métabolisme aérobie, utilisation des graisses prédominante (>70%)" }
    },
    2: {
      cardio: { impact: 0.4, description: "Augmentation modérée du rythme cardiaque (60-70% FCmax)" },
      muscle: { impact: 0.3, description: "Développement endurance fibres type I" },
      respiratory: { impact: 0.35, description: "Respiration contrôlée, conversation possible" },
      energy: { impact: 0.5, description: "Équilibre utilisation graisses/glycogène, système aérobie" }
    },
    3: {
      cardio: { impact: 0.55, description: "Rythme cardiaque soutenu (70-80% FCmax)" },
      muscle: { impact: 0.5, description: "Recrutement des fibres type I et début type IIa" },
      respiratory: { impact: 0.5, description: "Respiration profonde, conversation limitée" },
      energy: { impact: 0.65, description: "Début shift vers glycogène, toujours aérobie" }
    },
    4: {
      cardio: { impact: 0.75, description: "Rythme cardiaque élevé (80-90% FCmax)" },
      muscle: { impact: 0.7, description: "Fibres type I et IIa pleinement recrutées" },
      respiratory: { impact: 0.7, description: "Respiration rapide, parler difficile" },
      energy: { impact: 0.8, description: "Seuil lactique, équilibre production/élimination" }
    },
    5: {
      cardio: { impact: 0.9, description: "Proche FCmax (90-95% FCmax)" },
      muscle: { impact: 0.85, description: "Recrutement fibres type IIa et début IIx" },
      respiratory: { impact: 0.85, description: "Hyperventilation, parole très difficile" },
      energy: { impact: 0.9, description: "Métabolisme principalement anaérobie lactique" }
    },
    6: {
      cardio: { impact: 0.95, description: "Quasi-maximal (95-100% FCmax)" },
      muscle: { impact: 0.95, description: "Toutes fibres recrutées (I, IIa, IIx)" },
      respiratory: { impact: 0.95, description: "Ventilation maximale" },
      energy: { impact: 0.95, description: "Système anaérobie lactique prédominant" }
    },
    7: {
      cardio: { impact: 1, description: "Maximal (100% FCmax)" },
      muscle: { impact: 1, description: "Recrutement maximal, focus fibres IIx" },
      respiratory: { impact: 1, description: "VO2 Max / ventilation maximale" },
      energy: { impact: 1, description: "Système ATP-CP (phosphagène), très court terme" }
    }
  };

  // Activer les animations avec un délai pour permettre un effet séquentiel
  useEffect(() => {
    if (!animated) {
      setVisible(true);
      return;
    }
    setVisible(false);
    const timer = setTimeout(() => {
      setVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [zone, animated]);

  // Injecter les SVG dans les références
  useEffect(() => {
    if (svgRefs.cardio.current) {
      svgRefs.cardio.current.innerHTML = cardioSystem;
    }
    if (svgRefs.muscle.current) {
      svgRefs.muscle.current.innerHTML = muscleSystem;
    }
    if (svgRefs.respiratory.current) {
      svgRefs.respiratory.current.innerHTML = respiratorySystem;
    }
    if (svgRefs.energy.current) {
      svgRefs.energy.current.innerHTML = energySystem;
    }
  }, [visible]);

  // Animation pour les systèmes
  const getAnimationProps = (system) => {
    const impact = physiologicalEffects[zone.id]?.[system]?.impact || 0;
    const delay = {
      cardio: 0,
      respiratory: 0.2,
      muscle: 0.4,
      energy: 0.6
    }[system];
    
    return {
      initial: { scale: 0.8, opacity: 0 },
      animate: { 
        scale: 0.8 + (impact * 0.4), 
        opacity: 0.2 + (impact * 0.8) 
      },
      transition: { 
        duration: 0.8, 
        delay: delay,
        ease: "easeOut"
      }
    };
  };

  // Obtenir la couleur en fonction de l'impact
  const getImpactColor = (system) => {
    const impact = physiologicalEffects[zone.id]?.[system]?.impact || 0;
    
    if (impact < 0.3) return theme.palette.success.main;
    if (impact < 0.6) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Rendu des systèmes physiologiques
  const renderSystem = (system, title, svgRef) => {
    const effect = physiologicalEffects[zone.id]?.[system] || { impact: 0, description: "Aucun effet" };
    
    return (
      <Grid item xs={6} sm={3}>
        <Box sx={{ textAlign: 'center', px: 1, py: 2 }}>
          <Tooltip 
            title={
              <Box>
                <Typography variant="subtitle2">{title}</Typography>
                <Typography variant="body2">{effect.description}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  Impact: {Math.round(effect.impact * 100)}%
                </Typography>
              </Box>
            } 
            arrow
          >
            <Box sx={{ position: 'relative', mb: 1, height: 80, mx: 'auto' }}>
              <motion.div
                {...(animated ? getAnimationProps(system) : {})}
                style={{ 
                  height: '100%', 
                  color: getImpactColor(system),
                  position: 'relative',
                  zIndex: 2
                }}
              >
                <Grow in={visible} timeout={600}>
                  <Box 
                    ref={svgRef} 
                    sx={{ 
                      height: '100%', 
                      width: '100%', 
                      color: 'currentColor',
                      '& svg': { 
                        height: '100%', 
                        width: '100%' 
                      }
                    }} 
                  />
                </Grow>
              </motion.div>
              
              {/* Pulsation effect */}
              {animated && effect.impact > 0.5 && (
                <Box
                  component={motion.div}
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut"
                  }}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: '50%',
                    backgroundColor: getImpactColor(system),
                    zIndex: 1
                  }}
                />
              )}
            </Box>
          </Tooltip>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
          <Box 
            sx={{ 
              height: 4, 
              width: '100%', 
              bgcolor: alpha(theme.palette.grey[300], 0.5),
              borderRadius: 2,
              mt: 1
            }}
          >
            <Fade in={visible} timeout={1000}>
              <Box 
                sx={{ 
                  height: '100%', 
                  width: `${(physiologicalEffects[zone.id]?.[system]?.impact || 0) * 100}%`, 
                  bgcolor: getImpactColor(system),
                  borderRadius: 2,
                  transition: 'width 1s ease-out'
                }} 
              />
            </Fade>
          </Box>
        </Box>
      </Grid>
    );
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        bgcolor: alpha(zone.color, 0.05),
        mb: 3
      }}
    >
      <Typography 
        variant="h6" 
        component="h3" 
        sx={{ 
          mb: 2, 
          textAlign: 'center',
          fontWeight: 'bold'
        }}
      >
        Impact Physiologique - {zone.name}
      </Typography>
      
      <Grid container>
        {renderSystem('cardio', 'Système Cardiovasculaire', svgRefs.cardio)}
        {renderSystem('respiratory', 'Système Respiratoire', svgRefs.respiratory)}
        {renderSystem('muscle', 'Système Musculaire', svgRefs.muscle)}
        {renderSystem('energy', 'Métabolisme Énergétique', svgRefs.energy)}
      </Grid>
    </Paper>
  );
};

export default PhysiologicalEffectsVisualizer;
