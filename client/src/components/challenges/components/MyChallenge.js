import React, { useMemo, useState } from 'react';
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
  Alert,
  Stack,
  CircularProgress,
  Chip,
  Avatar
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
  StarRate as StarIcon,
  RouteOutlined as RouteIcon,
  Speed as SpeedIcon,
  Group as GroupIcon,
  AddCircle as AddCircleIcon,
  PhotoCamera as PhotoCameraIcon,
  EmojiFlags as EmojiFlagsIcon,
  Timeline as TimelineIcon,
  ShowChart as ShowChartIcon
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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedColForStats, setSelectedColForStats] = useState(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  
  // Ouvrir/fermer le dialogue de partage
  const handleOpenShareDialog = () => setShareDialogOpen(true);
  const handleCloseShareDialog = () => setShareDialogOpen(false);
  
  // Ouvrir/fermer la modal des statistiques détaillées
  const handleOpenStatsModal = (col) => {
    setSelectedColForStats(col);
    setStatsModalOpen(true);
  };
  const handleCloseStatsModal = () => {
    setStatsModalOpen(false);
    setSelectedColForStats(null);
  };
  
  // Statistiques du défi
  const stats = useMemo(() => {
    if (!selectedCols || selectedCols.length === 0) return null;
    
    const totalElevation = selectedCols.reduce((sum, col) => sum + col.elevation, 0);
    const totalDistance = selectedCols.reduce((sum, col) => sum + col.distance, 0);
    const maxAltitude = Math.max(...selectedCols.map(col => col.altitude));
    
    // Calculer la difficulté moyenne (convertir en numérique)
    const difficultyMap = { 'extreme': 4, 'hard': 3, 'medium': 2, 'easy': 1 };
    const totalDifficulty = selectedCols.reduce((sum, col) => {
      return sum + (difficultyMap[col.difficulty] || 2);
    }, 0);
    const avgDifficulty = totalDifficulty / selectedCols.length;
    
    // Convertir la difficulté moyenne en catégorie
    let avgDifficultyCategory;
    if (avgDifficulty >= 3.5) avgDifficultyCategory = 'extreme';
    else if (avgDifficulty >= 2.5) avgDifficultyCategory = 'hard';
    else if (avgDifficulty >= 1.5) avgDifficultyCategory = 'medium';
    else avgDifficultyCategory = 'easy';
    
    return {
      totalElevation,
      totalDistance,
      maxAltitude,
      avgDifficulty: avgDifficultyCategory,
      avgGradient: selectedCols.reduce((sum, col) => sum + col.avgGradient, 0) / selectedCols.length,
      estimatedCompletionTime: totalDistance / 10 // Estimation basée sur une vitesse moyenne de 10km/h en montée
    };
  }, [selectedCols]);
  
  // Calculer le pourcentage de complétion
  const completionPercentage = useMemo(() => {
    if (!selectedCols || selectedCols.length === 0) return 0;
    const completed = selectedCols.filter(col => completedCols.includes(col.id)).length;
    return (completed / selectedCols.length) * 100;
  }, [selectedCols, completedCols]);
  
  // Composant pour afficher le résumé du défi avec progression avancée
  const ChallengeSummary = () => (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TrophyIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
        <Typography variant="h5" fontWeight="bold">
          {challengeName || t('challenges.seven_majors.unnamed_challenge', 'Mon Défi des 7 Majeurs')}
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3, position: 'relative' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              {t('challenges.seven_majors.progress_summary', 'Progression du défi')}
            </Typography>
            
            <Box sx={{ position: 'relative', my: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={completionPercentage} 
                sx={{ 
                  height: 12, 
                  borderRadius: 6,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 6,
                    background: `linear-gradient(90deg, #2196f3 0%, #4caf50 ${completionPercentage}%)`,
                  }
                }}
              />
              <Box sx={{ 
                position: 'absolute', 
                top: -30, 
                left: `calc(${completionPercentage}% - 20px)`, 
                display: completionPercentage > 0 ? 'block' : 'none' 
              }}>
                <Chip 
                  label={`${Math.round(completionPercentage)}%`} 
                  color="primary" 
                  size="small" 
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('challenges.seven_majors.cols_completed', 'Cols terminés')}: {completedCols.length}/{selectedCols.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('challenges.seven_majors.cols_scheduled', 'Cols planifiés')}: {scheduledAscents.length}
              </Typography>
            </Box>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              sx={{ mt: 3 }}
              divider={<Divider orientation="vertical" flexItem />}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('challenges.seven_majors.total_distance', 'Distance')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <RouteIcon color="primary" sx={{ mr: 0.5, fontSize: 18 }} />
                  <Typography variant="h6" fontWeight="bold">
                    {stats?.totalDistance.toFixed(0)} km
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('challenges.seven_majors.total_elevation', 'Dénivelé')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TerrainIcon color="primary" sx={{ mr: 0.5, fontSize: 18 }} />
                  <Typography variant="h6" fontWeight="bold">
                    {stats?.totalElevation.toFixed(0)} m
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('challenges.seven_majors.avg_gradient', 'Pente moyenne')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ShowChartIcon color="primary" sx={{ mr: 0.5, fontSize: 18 }} />
                  <Typography variant="h6" fontWeight="bold">
                    {stats?.avgGradient.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {t('challenges.seven_majors.estimated_time', 'Temps estimé')}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress 
                    variant="determinate" 
                    value={completionPercentage} 
                    size={60} 
                    thickness={5}
                    sx={{ color: '#4caf50' }}
                  />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {stats?.estimatedCompletionTime.toFixed(1)}h
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('challenges.seven_majors.estimated_hours', 'heures d\'ascension')}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  {t('challenges.seven_majors.community_stats', 'Communauté')}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip 
                    icon={<GroupIcon />} 
                    label={t('challenges.seven_majors.users_with_same', '23 utilisateurs')} 
                    color="primary" 
                    variant="outlined" 
                    size="small" 
                  />
                  <Chip 
                    icon={<EmojiFlagsIcon />} 
                    label={t('challenges.seven_majors.recent_completion', '5 récents')} 
                    color="success" 
                    variant="outlined" 
                    size="small" 
                  />
                </Stack>
              </Box>
              
              <Box sx={{ width: '100%', mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  startIcon={<TimelineIcon />} 
                  sx={{ mr: 1 }}
                  onClick={() => {/* Fonction pour afficher les statistiques détaillées */}}
                >
                  {t('challenges.seven_majors.advanced_stats', 'Stats avancées')}
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<ShareIcon />}
                  onClick={handleOpenShareDialog}
                >
                  {t('challenges.seven_majors.share_challenge', 'Partager')}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
  
  // Dialogue de partage sur la communauté
  const ShareChallengeDialog = () => (
    <Dialog open={shareDialogOpen} onClose={handleCloseShareDialog} maxWidth="sm" fullWidth>
      <DialogTitle>{t('challenges.seven_majors.share_your_challenge', 'Partagez votre défi')}</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t('challenges.seven_majors.share_options', 'Options de partage')}
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<GlobeIcon />}
                onClick={() => {
                  onShareChallenge('community');
                  handleCloseShareDialog();
                }}
              >
                {t('challenges.seven_majors.share_to_community', 'Publier dans la communauté')}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<PhotoCameraIcon />}
                onClick={() => {
                  onShareChallenge('social');
                  handleCloseShareDialog();
                }}
              >
                {t('challenges.seven_majors.share_to_social', 'Partager sur les réseaux sociaux')}
              </Button>
            </Grid>
          </Grid>
          
          <Typography variant="subtitle1" gutterBottom>
            {t('challenges.seven_majors.join_group', 'Rejoindre un groupe')}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('challenges.seven_majors.join_group_description', 'Rejoignez d\'autres cyclistes qui relèvent le même défi pour partager vos expériences et vous motiver mutuellement.')}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip 
              avatar={<Avatar>12</Avatar>} 
              label="Les Grimpeurs du Dimanche" 
              onClick={() => {/* Rejoint le groupe */}}
              color="primary"
              variant="outlined"
            />
            <Chip 
              avatar={<Avatar>8</Avatar>} 
              label="Team Cyclisme Grand Est" 
              onClick={() => {/* Rejoint le groupe */}}
              color="primary"
              variant="outlined"
            />
            <Chip 
              avatar={<Avatar>5</Avatar>} 
              label="Club Alpine Adrenaline" 
              onClick={() => {/* Rejoint le groupe */}}
              color="primary"
              variant="outlined"
            />
          </Box>
          
          <Button 
            startIcon={<AddCircleIcon />}
            variant="outlined"
            onClick={() => {/* Crée un nouveau groupe */}}
          >
            {t('challenges.seven_majors.create_group', 'Créer un nouveau groupe')}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseShareDialog}>
          {t('common.close', 'Fermer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  return (
    <Box>
      {/* Dialogue de partage sur la communauté */}
      <ShareChallengeDialog />
      
      {/* En-tête du défi */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('challenges.seven_majors.challenge_name', 'Nom du défi')}
              value={challengeName}
              onChange={(e) => onChallengeTitleChange(e.target.value)}
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
                        onChange={() => onTogglePublic(!isPublic)} 
                        color="primary"
                      />
                    }
                    label={t('challenges.seven_majors.public_challenge', 'Défi public')}
                  />
                  
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={onSaveChallenge}
                  >
                    {t('common.save', 'Enregistrer')}
                  </Button>
                </>
              )}
              
              <Button
                variant="contained"
                startIcon={<ShareIcon />}
                onClick={handleOpenShareDialog}
                disabled={!selectedCols || selectedCols.length === 0}
              >
                {t('common.share', 'Partager')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Afficher le résumé si des cols sont sélectionnés */}
      {selectedCols && selectedCols.length > 0 && <ChallengeSummary />}
      
      {/* Liste des cols sélectionnés */}
      {selectedCols && selectedCols.length > 0 ? (
        <Grid container spacing={3}>
          {selectedCols.map(col => (
            <Grid item key={col.id} xs={12} sm={6} md={4}>
              <Card elevation={2} sx={{ 
                position: 'relative',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}>
                {completedCols.includes(col.id) && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: -12, 
                    right: -12, 
                    zIndex: 2,
                    bgcolor: 'success.main',
                    color: 'white',
                    borderRadius: '50%',
                    p: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircleIcon fontSize="medium" />
                  </Box>
                )}
                
                <CardMedia
                  component="img"
                  height="140"
                  image={col.imageUrl || '/assets/cols/default-col.jpg'}
                  alt={col.name}
                  sx={{ objectFit: 'cover' }}
                />
                
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {col.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {col.location?.region || ''}{col.location?.country ? `, ${col.location.country}` : ''}
                  </Typography>
                  
                  <Grid container spacing={1} sx={{ mt: 1 }}>
                    <Grid item xs={4}>
                      <Tooltip title={t('cols.altitude', 'Altitude')}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            ALT
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {col.altitude}m
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                    
                    <Grid item xs={4}>
                      <Tooltip title={t('cols.distance', 'Distance')}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            DIST
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {col.distance}km
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                    
                    <Grid item xs={4}>
                      <Tooltip title={t('cols.average_gradient', 'Pente moyenne')}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            PENTE
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {col.avgGradient}%
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Box>
                    <Tooltip title={t('common.view_details', 'Voir les détails')}>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => onViewCol(col)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={t('common.remove', 'Retirer')}>
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
                          onClick={() => onScheduleAscent(col.id, col.name)}
                          sx={{ mr: 1 }}
                        >
                          {t('challenges.seven_majors.schedule', 'Planifier')}
                        </Button>
                        
                        <Button
                          size="small"
                          variant="contained"
                          color={completedCols.includes(col.id) ? "success" : "primary"}
                          startIcon={completedCols.includes(col.id) ? <CheckCircleIcon /> : null}
                          onClick={() => onMarkAsCompleted(col.id)}
                        >
                          {completedCols.includes(col.id) 
                            ? t('challenges.seven_majors.completed', 'Terminé') 
                            : t('challenges.seven_majors.mark_completed', 'Marquer comme terminé')}
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
                  {t('challenges.seven_majors.add_more_cols', 'Ajoutez plus de cols')}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {t('challenges.seven_majors.cols_remaining', { count: 7 - selectedCols.length }, 'Il vous reste {{count}} cols à ajouter pour compléter votre défi')}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('challenges.seven_majors.empty_challenge', 'Votre défi est vide. Cherchez et ajoutez des cols dans l\'onglet "Recherche de cols".')}
        </Alert>
      )}
    </Box>
  );
};

export default MyChallenge;
