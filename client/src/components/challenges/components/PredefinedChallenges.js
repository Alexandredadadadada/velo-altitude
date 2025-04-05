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
  Divider
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Public as GlobeIcon,
  Terrain as TerrainIcon,
  Star as StarIcon
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
        {t('challenges.seven_majors.no_predefined')}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {t('challenges.seven_majors.predefined_intro')}
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {challenges.map(challenge => (
          <Grid item key={challenge.id} xs={12} md={6}>
            <Card elevation={3}>
              <CardMedia
                component="img"
                height="160"
                image={challenge.image || '/images/challenges/placeholder.jpg'}
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
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('challenges.seven_majors.difficulty')}:
                  </Typography>
                  <Chip 
                    label={challenge.difficulty} 
                    color={
                      challenge.difficulty === 'Expert' ? 'error' :
                      challenge.difficulty === 'Avancé' ? 'warning' :
                      challenge.difficulty === 'Intermédiaire' ? 'success' : 'info'
                    }
                    size="small"
                  />
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  {t('challenges.seven_majors.included_cols')}:
                </Typography>
                
                <Grid container spacing={1}>
                  {challenge.cols.map(col => (
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
                            {col.region}, {col.country} • {col.altitude}m
                          </Typography>
                        </Box>
                        
                        <Tooltip title={t('common.view_details')}>
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
                </Grid>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => onLoadChallenge(challenge)}
                >
                  {t('challenges.seven_majors.load_challenge')}
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
