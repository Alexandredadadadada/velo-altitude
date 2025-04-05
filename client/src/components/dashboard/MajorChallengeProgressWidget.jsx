import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Grid,
  Chip,
  Avatar,
  Button,
  IconButton,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
  Tooltip
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TerrainIcon from '@mui/icons-material/Terrain';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import FlagIcon from '@mui/icons-material/Flag';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LandscapeIcon from '@mui/icons-material/Landscape';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * Widget affichant la progression des défis "7 Majeurs"
 * Montre les défis en cours, les badges débloqués et la progression globale
 */
const MajorChallengeProgressWidget = ({ challenges = [], currentUser = null }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [badgesCount, setBadgesCount] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  
  // Traiter les données des défis
  useEffect(() => {
    // Filtrer les défis actifs
    const active = challenges.filter(c => c.status === 'active' || c.status === 'in-progress');
    setActiveChallenges(active.slice(0, 3)); // Limiter à 3 défis actifs dans le widget
    
    // Calculer le nombre total de badges débloqués
    const badgesUnlocked = challenges.reduce((total, challenge) => {
      return total + (challenge.badges?.filter(b => b.unlocked)?.length || 0);
    }, 0);
    setBadgesCount(badgesUnlocked);
    
    // Calculer la progression globale (pourcentage moyen de tous les défis)
    if (challenges.length > 0) {
      const avgProgress = challenges.reduce((sum, challenge) => {
        return sum + (challenge.progress || 0);
      }, 0) / challenges.length;
      
      setTotalProgress(Math.round(avgProgress));
    }
  }, [challenges]);
  
  // Traitement des badges
  const renderBadges = () => {
    // Collecter tous les badges débloqués à travers tous les défis
    const allBadges = challenges
      .flatMap(challenge => challenge.badges || [])
      .filter(badge => badge.unlocked)
      .slice(0, 4); // Limiter l'affichage à 4 badges
    
    return (
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
        {allBadges.map((badge, index) => (
          <Tooltip key={index} title={badge.description || badge.name}>
            <Chip
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <EmojiEventsIcon fontSize="small" />
                </Avatar>
              }
              label={badge.name}
              size="small"
              sx={{ 
                borderRadius: '20px',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontWeight: 500,
                mb: 0.5
              }}
            />
          </Tooltip>
        ))}
        
        {badgesCount > 4 && (
          <Chip
            icon={<MoreHorizIcon fontSize="small" />}
            label={`+${badgesCount - 4} autres`}
            size="small"
            variant="outlined"
            sx={{ 
              borderRadius: '20px',
              mb: 0.5,
              cursor: 'pointer'
            }}
            onClick={() => navigate('/challenges/badges')}
          />
        )}
        
        {badgesCount === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
            Aucun badge débloqué pour le moment
          </Typography>
        )}
      </Stack>
    );
  };
  
  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };
  
  // Si aucun défi n'est disponible
  if (!challenges || challenges.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[1],
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200
        }}
      >
        <EmojiEventsIcon sx={{ color: alpha(theme.palette.primary.main, 0.3), fontSize: 40, mb: 2 }} />
        <Typography variant="body1" color="text.secondary" align="center">
          Aucun défi "7 Majeurs" en cours
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          size="small" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/challenges/seven-majors')}
        >
          Créer mon premier défi
        </Button>
      </Paper>
    );
  }
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: theme.shadows[1],
        height: '100%'
      }}
    >
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
          <TerrainIcon sx={{ mr: 1, fontSize: '1.2rem', color: 'primary.main' }} />
          Progression "7 Majeurs"
        </Typography>
        <Tooltip title="Voir tous mes défis">
          <IconButton size="small" color="primary" onClick={() => navigate('/challenges')}>
            <ArrowForwardIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Barre de progression globale */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="body2">Progression globale</Typography>
          <Typography variant="body2" fontWeight="medium">{totalProgress}%</Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={totalProgress} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: theme.palette.primary.main,
            }
          }}
        />
      </Box>
      
      {/* Défis actifs */}
      <Typography variant="subtitle2" gutterBottom>
        Défis en cours
      </Typography>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={2}>
          {activeChallenges.map((challenge, index) => (
            <Grid item xs={12} key={challenge.id}>
              <motion.div variants={itemVariants}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.primary.main, 0.1) 
                      : alpha(theme.palette.primary.light, 0.1),
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.primary.main, 0.15) 
                        : alpha(theme.palette.primary.light, 0.15),
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => navigate(`/challenges/seven-majors/${challenge.id}`)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" noWrap sx={{ maxWidth: '80%' }}>
                      {challenge.name}
                    </Typography>
                    
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        bgcolor: alpha(theme.palette.background.paper, 0.5),
                        px: 1,
                        py: 0.5,
                        borderRadius: 1
                      }}
                    >
                      <LandscapeIcon sx={{ fontSize: '0.8rem', mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {challenge.completedCols || 0}/{challenge.totalCols || 7}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Box sx={{ flex: 1, mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={challenge.progress || 0} 
                        sx={{ 
                          height: 5, 
                          borderRadius: 5,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1)
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {challenge.progress || 0}%
                    </Typography>
                  </Box>
                  
                  {/* Prochaine étape du défi */}
                  {challenge.nextStep && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <FlagIcon sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                      Prochaine étape: {challenge.nextStep}
                    </Typography>
                  )}
                </Paper>
              </motion.div>
            </Grid>
          ))}
          
          {activeChallenges.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Aucun défi actif pour le moment
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small" 
                  sx={{ mt: 1 }}
                  onClick={() => navigate('/challenges/seven-majors')}
                >
                  Créer un défi
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </motion.div>
      
      {/* Badges débloqués */}
      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
        Badges débloqués ({badgesCount})
      </Typography>
      
      {renderBadges()}
    </Paper>
  );
};

export default MajorChallengeProgressWidget;
