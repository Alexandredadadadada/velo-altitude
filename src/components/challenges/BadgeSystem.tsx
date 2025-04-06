import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
} from '@mui/material';
import { Badge, Achievement } from '../../types';
import { APIOrchestrator } from '../../api/orchestration/APIOrchestrator';
import { useAuth } from '../../hooks/useAuth';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ShareIcon from '@mui/icons-material/Share';
import TerrainIcon from '@mui/icons-material/Terrain';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import StarIcon from '@mui/icons-material/Star';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const apiOrchestrator = new APIOrchestrator();

interface BadgeSystemProps {
  userId?: string;
  challengeId?: string;
  showAllBadges?: boolean;
}

const BadgeSystem: React.FC<BadgeSystemProps> = ({ 
  userId, 
  challengeId, 
  showAllBadges = false
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [progressData, setProgressData] = useState<{ [key: string]: number }>({});
  
  const targetUserId = userId || (user ? user.id : '');

  useEffect(() => {
    const fetchBadgesData = async () => {
      if (!targetUserId && !challengeId && !showAllBadges) return;
      
      setLoading(true);
      try {
        let userBadgesData: Badge[] = [];
        let allBadgesData: Badge[] = [];
        let achievementsData: Achievement[] = [];
        
        // Récupérer les badges de l'utilisateur
        if (targetUserId) {
          userBadgesData = await apiOrchestrator.getUserBadges(targetUserId);
          setUserBadges(userBadgesData);
          
          // Récupérer les achievements de l'utilisateur
          achievementsData = await apiOrchestrator.getUserAchievements(targetUserId);
          setAchievements(achievementsData);
        }
        
        // Récupérer tous les badges disponibles
        if (showAllBadges) {
          allBadgesData = await apiOrchestrator.getAllBadges();
        } else if (challengeId) {
          // Récupérer les badges spécifiques à un défi
          allBadgesData = await apiOrchestrator.getChallengeBadges(challengeId);
        }
        
        setAvailableBadges(allBadgesData);
        
        // Récupérer les données de progression pour chaque badge
        if (targetUserId) {
          const progressDataTemp: { [key: string]: number } = {};
          
          // Pour chaque badge disponible, récupérer la progression de l'utilisateur
          for (const badge of allBadgesData) {
            if (!userBadgesData.some(userBadge => userBadge.id === badge.id)) {
              try {
                const progress = await apiOrchestrator.getBadgeProgress(targetUserId, badge.id);
                progressDataTemp[badge.id] = progress;
              } catch (error) {
                console.error(`Erreur lors de la récupération de la progression pour le badge ${badge.id}:`, error);
                progressDataTemp[badge.id] = 0;
              }
            }
          }
          
          setProgressData(progressDataTemp);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données de badges:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBadgesData();
  }, [targetUserId, challengeId, showAllBadges, user]);

  const handleOpenBadgeDetails = (badge: Badge) => {
    setSelectedBadge(badge);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const getBadgeIcon = (category: string) => {
    switch (category) {
      case 'seven-majors': return <EmojiEventsIcon />;
      case 'elevation': return <TerrainIcon />;
      case 'distance': return <DirectionsRunIcon />;
      case 'cols': return <TrendingUpIcon />;
      case 'special': return <StarIcon />;
      default: return <EmojiEventsIcon />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'platinum': return '#E5E4E2';
      default: return '#9E9E9E';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const isUserBadge = (badge: Badge) => {
    return userBadges.some(userBadge => userBadge.id === badge.id);
  };

  const getUserProgress = (badge: Badge) => {
    if (isUserBadge(badge)) return 100;
    return progressData[badge.id] || 0;
  };

  const getRequirementText = (badge: Badge) => {
    const req = badge.requirements;
    const parts = [];

    if (req.challengeId) parts.push("Compléter un défi spécifique");
    if (req.minElevation) parts.push(`${req.minElevation}m de dénivelé`);
    if (req.minDistance) parts.push(`${req.minDistance}km parcourus`);
    if (req.minCols) parts.push(`${req.minCols} cols gravis`);
    if (req.minGradient) parts.push(`Pente moyenne de ${req.minGradient}%`);
    if (req.specificRegion) parts.push(`Région: ${req.specificRegion}`);
    if (req.specificSeason) parts.push(`Saison: ${req.specificSeason}`);
    if (req.time) {
      const hours = Math.floor(req.time / 3600);
      const minutes = Math.floor((req.time % 3600) / 60);
      parts.push(`Temps: ${hours}h${minutes.toString().padStart(2, '0')}`);
    }

    return parts.join(', ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Tri des badges: d'abord ceux que l'utilisateur possède, puis par difficulté
  const sortedBadges = [...availableBadges].sort((a, b) => {
    const userHasA = isUserBadge(a);
    const userHasB = isUserBadge(b);
    
    if (userHasA && !userHasB) return -1;
    if (!userHasA && userHasB) return 1;
    
    const difficultyOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
    return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - 
           difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
  });

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Typography variant="h4" gutterBottom>
        {targetUserId 
          ? (targetUserId === (user ? user.id : '') ? 'Mes badges' : 'Badges de l\'utilisateur')
          : (challengeId ? 'Badges du défi' : 'Tous les badges')}
      </Typography>
      
      {/* Résumé des badges obtenus (si vue utilisateur) */}
      {targetUserId && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Résumé des accomplissements
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="primary">
                  {userBadges.length}
                </Typography>
                <Typography variant="body2">Badges obtenus</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="primary">
                  {userBadges.filter(badge => badge.difficulty === 'gold' || badge.difficulty === 'platinum').length}
                </Typography>
                <Typography variant="body2">Badges Or/Platine</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="primary">
                  {userBadges.filter(badge => badge.category === 'seven-majors').length}
                </Typography>
                <Typography variant="body2">Badges Seven Majors</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="primary">
                  {Math.round((userBadges.length / availableBadges.length) * 100) || 0}%
                </Typography>
                <Typography variant="body2">Progression totale</Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/* Derniers badges obtenus */}
          {achievements.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Derniers accomplissements
              </Typography>
              <List>
                {achievements.slice(0, 3).map(achievement => (
                  <ListItem key={achievement.id} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar src={achievement.imageUrl} alt={achievement.name}>
                        <EmojiEventsIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={achievement.name}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {achievement.description}
                          </Typography>
                          {` — Obtenu le ${formatDate(achievement.earnedAt)}`}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      )}
      
      {/* Grille de badges */}
      <Grid container spacing={3}>
        {sortedBadges.map((badge) => {
          const owned = isUserBadge(badge);
          const progress = getUserProgress(badge);
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={badge.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  opacity: owned ? 1 : 0.8,
                  transition: 'transform 0.2s, opacity 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    opacity: 1
                  }
                }}
              >
                {/* Indicateur de badge obtenu */}
                {owned && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      zIndex: 1,
                      bgcolor: 'success.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <LockOpenIcon fontSize="small" />
                  </Box>
                )}
                
                {/* Image du badge */}
                <CardMedia
                  component="img"
                  sx={{
                    height: 160,
                    objectFit: 'contain',
                    p: 2,
                    filter: owned ? 'none' : 'grayscale(50%)'
                  }}
                  image={badge.imageUrl}
                  alt={badge.name}
                />
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    {getBadgeIcon(badge.category)}
                    <Typography variant="h6" noWrap>
                      {badge.name}
                    </Typography>
                  </Box>
                  
                  <Chip
                    label={getDifficultyLabel(badge.difficulty)}
                    size="small"
                    sx={{
                      mb: 1,
                      bgcolor: getDifficultyColor(badge.difficulty),
                      color: badge.difficulty === 'bronze' || badge.difficulty === 'gold' ? 'black' : 'white'
                    }}
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {badge.description.length > 75 
                      ? `${badge.description.substring(0, 75)}...` 
                      : badge.description}
                  </Typography>
                  
                  {/* Barre de progression */}
                  {!owned && targetUserId && (
                    <Box sx={{ width: '100%', mt: 'auto' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Progression
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {progress}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: '100%',
                          height: 6,
                          bgcolor: 'background.paper',
                          borderRadius: 3,
                          position: 'relative'
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: `${progress}%`,
                            bgcolor: 'primary.main',
                            borderRadius: 3
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                  
                  {owned && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
                      <Button 
                        size="small"
                        startIcon={<ShareIcon />}
                        onClick={() => {/* Implémenter le partage */}}
                      >
                        Partager
                      </Button>
                    </Box>
                  )}
                  
                  {!owned && !targetUserId && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
                      <LockIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        À débloquer
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                <Box sx={{ p: 1, pt: 0 }}>
                  <Button
                    fullWidth
                    size="small"
                    startIcon={<InfoIcon />}
                    onClick={() => handleOpenBadgeDetails(badge)}
                  >
                    Détails
                  </Button>
                </Box>
              </Card>
            </Grid>
          );
        })}
        
        {sortedBadges.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                {targetUserId 
                  ? 'Aucun badge obtenu pour le moment.'
                  : 'Aucun badge disponible pour le moment.'}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      {/* Dialogue de détails du badge */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {selectedBadge && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getBadgeIcon(selectedBadge.category)}
                {selectedBadge.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box 
                    component="img"
                    src={selectedBadge.imageUrl}
                    alt={selectedBadge.name}
                    sx={{ 
                      width: '100%', 
                      maxHeight: 200, 
                      objectFit: 'contain',
                      filter: isUserBadge(selectedBadge) ? 'none' : 'grayscale(50%)'
                    }}
                  />
                  
                  <Chip
                    label={getDifficultyLabel(selectedBadge.difficulty)}
                    size="small"
                    sx={{
                      mt: 2,
                      bgcolor: getDifficultyColor(selectedBadge.difficulty),
                      color: selectedBadge.difficulty === 'bronze' || selectedBadge.difficulty === 'gold' ? 'black' : 'white'
                    }}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12} sm={8}>
                  <Typography variant="body1" paragraph>
                    {selectedBadge.description}
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Exigences:
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {getRequirementText(selectedBadge)}
                  </Typography>
                  
                  {isUserBadge(selectedBadge) && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Obtenu le:
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(
                          achievements.find(a => a.referenceId === selectedBadge.id)?.earnedAt || 
                          selectedBadge.createdAt
                        )}
                      </Typography>
                    </>
                  )}
                  
                  {!isUserBadge(selectedBadge) && targetUserId && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Votre progression:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          {getUserProgress(selectedBadge)}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: '100%',
                          height: 10,
                          bgcolor: 'background.paper',
                          borderRadius: 5,
                          position: 'relative',
                          border: '1px solid #ddd'
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: `${getUserProgress(selectedBadge)}%`,
                            bgcolor: 'primary.main',
                            borderRadius: 5
                          }}
                        />
                      </Box>
                    </>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Fermer</Button>
              
              {isUserBadge(selectedBadge) && (
                <Button 
                  color="primary" 
                  startIcon={<ShareIcon />}
                  onClick={() => {/* Implémenter le partage */}}
                >
                  Partager
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default BadgeSystem;
