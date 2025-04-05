import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  Stack
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Public as GlobeIcon,
  Terrain as TerrainIcon,
  Star as StarIcon,
  RouteOutlined as RouteIcon,
  AvTimer as TimeIcon,
  TrendingUp as ElevationIcon
} from '@mui/icons-material';

/**
 * Composant pour afficher et charger les défis prédéfinis
 */
const PredefinedChallenges = ({ 
  challenges, 
  loading, 
  error, 
  onLoadChallenge,
  onViewColDetails
}) => {
  const { t } = useTranslation();
  
  // Fonction utilitaire pour convertir la difficulté numérique (1-5) en niveau textuel
  const getDifficultyLabel = (difficultyLevel) => {
    switch(difficultyLevel) {
      case 1: return 'Facile';
      case 2: return 'Modéré';
      case 3: return 'Intermédiaire';
      case 4: return 'Difficile';
      case 5: return 'Expert';
      default: return 'Intermédiaire';
    }
  };
  
  // Fonction pour obtenir la couleur de la difficulté
  const getDifficultyColor = (difficultyLevel) => {
    switch(difficultyLevel) {
      case 1: return 'success';
      case 2: return 'info';
      case 3: return 'primary';
      case 4: return 'warning';
      case 5: return 'error';
      default: return 'primary';
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }
  
  if (!challenges || challenges.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {t('challenges.seven_majors.no_predefined', 'Aucun défi prédéfini disponible pour le moment.')}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
        {t('challenges.seven_majors.predefined_intro', 'Choisissez parmi nos défis prédéfinis pour commencer votre aventure des "7 Majeurs". Chaque défi a été soigneusement conçu pour offrir une expérience unique et mémorable.')}
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {challenges.map(challenge => (
          <Grid item key={challenge.id} xs={12} md={6}>
            <Card elevation={3}>
              <CardMedia
                component="img"
                height="160"
                image={challenge.imageUrl || '/assets/challenges/default-challenge.jpg'}
                alt={challenge.name}
                sx={{ objectFit: 'cover' }}
              />
              
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrophyIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h5">
                    {challenge.name}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {challenge.description}
                </Typography>
                
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('challenges.seven_majors.difficulty', 'Difficulté')}:
                    </Typography>
                    <Chip 
                      label={getDifficultyLabel(challenge.difficulty)} 
                      color={getDifficultyColor(challenge.difficulty)}
                      size="small"
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('challenges.seven_majors.region', 'Région')}:
                    </Typography>
                    <Chip 
                      icon={<GlobeIcon />}
                      label={challenge.region} 
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Stack>
                
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <RouteIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {challenge.totalDistance} km
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ElevationIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {challenge.totalElevationGain}m D+
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      ~{challenge.estimatedCompletionTime}h
                    </Typography>
                  </Box>
                </Stack>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  {t('challenges.seven_majors.included_cols', 'Cols inclus')}:
                </Typography>
                
                <Grid container spacing={1}>
                  {challenge.cols.slice(0, 3).map(col => (
                    <Grid item key={col.id} xs={12}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1,
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <Box>
                          <Typography variant="body2">
                            {col.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {col.location?.region || ''} • {col.altitude}m • {col.avgGradient}%
                          </Typography>
                        </Box>
                        
                        <Tooltip title={t('common.view_details', 'Voir les détails')}>
                          <IconButton 
                            size="small" 
                            onClick={() => onViewColDetails(col)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>
                  ))}
                  
                  {challenge.cols.length > 3 && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 1 }}>
                        {t('challenges.seven_majors.and_x_more', 'Et {{count}} autres cols...', { count: challenge.cols.length - 3 })}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('challenges.seven_majors.completions', '{{count}} cyclistes ont relevé ce défi', { count: challenge.completions })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StarIcon fontSize="small" sx={{ color: 'warning.main', mr: 0.5 }} />
                    <Typography variant="caption" fontWeight="bold">
                      {challenge.likes}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => onLoadChallenge(challenge)}
                >
                  {t('challenges.seven_majors.load_challenge', 'Charger ce défi')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PredefinedChallenges;
