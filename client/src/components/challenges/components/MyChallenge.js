import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  Tooltip,
  LinearProgress,
  TextField,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  CalendarMonth as CalendarIcon,
  EmojiEvents as TrophyIcon,
  Terrain as TerrainIcon,
  Share as ShareIcon,
  Public as GlobeIcon,
  StarRate as StarIcon
} from '@mui/icons-material';

/**
 * Composant pour afficher et gérer le défi de l'utilisateur
 */
const MyChallenge = ({ 
  selectedCols,
  challengeName,
  onChallengeTitleChange,
  onRemoveCol,
  onViewCol,
  onSaveChallenge,
  onMarkAsCompleted,
  onScheduleAscent,
  onShareChallenge,
  isPublic,
  onTogglePublic,
  isAuthenticated,
  completedCols,
  scheduledAscents
}) => {
  const { t } = useTranslation();
  
  // Statistiques du défi
  const stats = useMemo(() => {
    if (!selectedCols || selectedCols.length === 0) return null;
    
    const totalAltitude = selectedCols.reduce((sum, col) => sum + col.altitude, 0);
    const totalLength = selectedCols.reduce((sum, col) => sum + col.length, 0);
    
    // Calculer la difficulté moyenne (convertir en numérique)
    const difficultyMap = { 'HC': 5, '1': 4, '2': 3, '3': 2, '4': 1 };
    const totalDifficulty = selectedCols.reduce((sum, col) => {
      return sum + (difficultyMap[col.difficulty] || 3);
    }, 0);
    const avgDifficulty = totalDifficulty / selectedCols.length;
    
    // Convertir la difficulté moyenne en catégorie
    let avgDifficultyCategory;
    if (avgDifficulty >= 4.5) avgDifficultyCategory = 'HC';
    else if (avgDifficulty >= 3.5) avgDifficultyCategory = '1';
    else if (avgDifficulty >= 2.5) avgDifficultyCategory = '2';
    else if (avgDifficulty >= 1.5) avgDifficultyCategory = '3';
    else avgDifficultyCategory = '4';
    
    return {
      totalAltitude,
      totalLength,
      avgDifficulty: avgDifficultyCategory,
      avgGradient: selectedCols.reduce((sum, col) => sum + col.gradient, 0) / selectedCols.length
    };
  }, [selectedCols]);
  
  // Calculer le pourcentage de complétion
  const completionPercentage = useMemo(() => {
    if (!selectedCols || selectedCols.length === 0) return 0;
    const completed = selectedCols.filter(col => completedCols.includes(col.id)).length;
    return (completed / selectedCols.length) * 100;
  }, [selectedCols, completedCols]);
  
  return (
    <Box>
      {/* En-tête du défi */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('challenges.seven_majors.challenge_name')}
              value={challengeName}
              onChange={onChallengeTitleChange}
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 2 }}>
              {isAuthenticated && (
                <>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={isPublic} 
                        onChange={onTogglePublic} 
                        color="primary"
                      />
                    }
                    label={t('challenges.seven_majors.public_challenge')}
                  />
                  
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={onSaveChallenge}
                    disabled={selectedCols.length === 0}
                  >
                    {t('common.save')}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<ShareIcon />}
                    onClick={onShareChallenge}
                    disabled={selectedCols.length === 0}
                  >
                    {t('common.share')}
                  </Button>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Progression du défi */}
      {selectedCols.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              <TrophyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              {t('challenges.seven_majors.progress')}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={completionPercentage} 
              color="success"
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {t('challenges.seven_majors.completed')}: {selectedCols.filter(col => completedCols.includes(col.id)).length}/{selectedCols.length}
            </Typography>
          </Box>
          
          {stats && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('cols.total_altitude')}
                </Typography>
                <Typography variant="h6">
                  {stats.totalAltitude} m
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('cols.total_length')}
                </Typography>
                <Typography variant="h6">
                  {stats.totalLength} km
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('cols.avg_difficulty')}
                </Typography>
                <Typography variant="h6">
                  {stats.avgDifficulty}
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('cols.avg_gradient')}
                </Typography>
                <Typography variant="h6">
                  {stats.avgGradient.toFixed(1)}%
                </Typography>
              </Grid>
            </Grid>
          )}
        </Paper>
      )}
      
      {/* Liste des cols sélectionnés */}
      {selectedCols.length > 0 ? (
        <Grid container spacing={3}>
          {selectedCols.map(col => (
            <Grid item key={col.id} xs={12} sm={6} md={4}>
              <Card elevation={3}>
                <CardMedia
                  component="img"
                  height="140"
                  image={col.image || '/images/cols/placeholder.jpg'}
                  alt={col.name}
                  sx={{ 
                    objectFit: 'cover',
                    filter: completedCols.includes(col.id) ? 'grayscale(0%)' : 'grayscale(40%)'
                  }}
                />
                
                {completedCols.includes(col.id) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      bgcolor: 'success.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CheckCircleIcon />
                  </Box>
                )}
                
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {col.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <GlobeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {col.region}, {col.country}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TerrainIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {col.altitude}m • {col.length}km • {col.gradient}%
                    </Typography>
                  </Box>
                  
                  {scheduledAscents[col.id] && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
                      <Typography variant="body2" color="primary.main">
                        {t('challenges.seven_majors.scheduled_for')}: {new Date(scheduledAscents[col.id]).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Box>
                    <Tooltip title={t('common.view_details')}>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => onViewCol(col)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={t('common.remove')}>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => onRemoveCol(col.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Box>
                    {isAuthenticated && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<CalendarIcon />}
                          onClick={() => onScheduleAscent(col.id)}
                          sx={{ mr: 1 }}
                        >
                          {t('challenges.seven_majors.schedule')}
                        </Button>
                        
                        <Button
                          size="small"
                          variant="contained"
                          color={completedCols.includes(col.id) ? "success" : "primary"}
                          startIcon={completedCols.includes(col.id) ? <CheckCircleIcon /> : null}
                          onClick={() => onMarkAsCompleted(col.id)}
                        >
                          {completedCols.includes(col.id) 
                            ? t('challenges.seven_majors.completed') 
                            : t('challenges.seven_majors.mark_completed')}
                        </Button>
                      </>
                    )}
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
          
          {/* Cases restantes pour atteindre 7 cols */}
          {Array.from({ length: Math.max(0, 7 - selectedCols.length) }).map((_, index) => (
            <Grid item key={`empty-${index}`} xs={12} sm={6} md={4}>
              <Paper 
                elevation={1} 
                sx={{ 
                  height: '100%', 
                  minHeight: 320, 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 3,
                  border: '2px dashed',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom align="center">
                  {t('challenges.seven_majors.add_more_cols')}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {t('challenges.seven_majors.cols_remaining', { count: 7 - selectedCols.length })}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('challenges.seven_majors.empty_challenge')}
        </Alert>
      )}
    </Box>
  );
};

export default MyChallenge;
