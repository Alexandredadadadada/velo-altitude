import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Box, Typography, Paper, Grid, CircularProgress, LinearProgress, Button, Chip, Avatar } from '@mui/material';
import { Challenge, Certification, Badge, UserRanking } from '../../types';
import { APIOrchestrator } from '../../api/orchestration/APIOrchestrator';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TerrainIcon from '@mui/icons-material/Terrain';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ShareIcon from '@mui/icons-material/Share';

const apiOrchestrator = new APIOrchestrator();

/**
 * Affiche le tableau de bord de progression de l'utilisateur pour ses défis Seven Majors
 */
const UserProgressDashboard: React.FC = () => {
  const { user } = useAuth();
  const [userChallenges, setUserChallenges] = useState<Challenge[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userRankings, setUserRankings] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sharingCertId, setSharingCertId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.id) return;

      try {
        setLoading(true);
        
        // Récupération parallèle des données utilisateur
        const [challenges, certs, userBadges] = await Promise.all([
          apiOrchestrator.getUserChallenges(user.id),
          apiOrchestrator.getUserCertifications(user.id),
          apiOrchestrator.getUserBadges(user.id)
        ]);
        
        setUserChallenges(challenges);
        setCertifications(certs);
        setBadges(userBadges);
        
        // Récupération des classements de l'utilisateur pour ses défis complétés
        const completedChallengeIds = certs
          .filter(cert => cert.status === 'verified')
          .map(cert => cert.challengeId);
        
        if (completedChallengeIds.length > 0) {
          const rankings = await Promise.all(
            completedChallengeIds.map(challengeId => 
              apiOrchestrator.getUserRankingForChallenge(user.id, challengeId)
            )
          );
          
          setUserRankings(rankings.filter(Boolean));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);
  
  // Calcul du nombre total de cols dans tous les défis
  const totalColsInChallenges = userChallenges.reduce((total, challenge) => 
    total + challenge.cols.length, 0);
  
  // Calcul du nombre total de cols complétés
  const completedChallengesIds = certifications
    .filter(cert => cert.status === 'verified')
    .map(cert => cert.challengeId);
  
  const completedChallenges = userChallenges.filter(challenge => 
    completedChallengesIds.includes(challenge.id));
  
  const totalCompletedCols = completedChallenges.reduce((total, challenge) => 
    total + challenge.cols.length, 0);
  
  // Calcul du pourcentage total de progression
  const totalProgressPercentage = totalColsInChallenges > 0 
    ? Math.round((totalCompletedCols / totalColsInChallenges) * 100)
    : 0;
  
  const handleShareCertification = async (certificationId: string) => {
    try {
      setSharingCertId(certificationId);
      
      // Génération de l'image de partage
      const imageUrl = await apiOrchestrator.generateSharingImage(certificationId, {
        template: 'standard',
        includeMap: true,
        includeElevation: true,
        includeStats: true
      });
      
      // Ouvrir la boîte de dialogue de partage (à implémenter dans un composant séparé)
      // Pour l'instant, on simule un partage sur Twitter
      await apiOrchestrator.shareAchievement(certificationId, 'twitter');
      
      setSharingCertId(null);
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      setSharingCertId(null);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ my: 4, px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Tableau de Bord Seven Majors
      </Typography>
      
      {/* Résumé progression */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Progression Globale
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={totalProgressPercentage} 
                sx={{ height: 10, borderRadius: 5, mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {totalCompletedCols} cols sur {totalColsInChallenges} ({totalProgressPercentage}%)
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FlightTakeoffIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    {completedChallenges.length} défi{completedChallenges.length > 1 ? 's' : ''} terminé{completedChallenges.length > 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TerrainIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    {totalCompletedCols} cols gravis
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmojiEventsIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    {badges.length} badge{badges.length > 1 ? 's' : ''} obtenu{badges.length > 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocalFireDepartmentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    {userRankings.filter(r => r.rank <= 10).length} top 10
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Badges Récents
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {badges.slice(0, 6).map(badge => (
                <Chip
                  key={badge.id}
                  avatar={<Avatar alt={badge.name} src={badge.imageUrl} />}
                  label={badge.name}
                  color={
                    badge.difficulty === 'bronze' ? 'default' :
                    badge.difficulty === 'silver' ? 'primary' :
                    badge.difficulty === 'gold' ? 'warning' : 'success'
                  }
                  variant="outlined"
                  sx={{ m: 0.5 }}
                />
              ))}
              {badges.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Relevez des défis pour gagner des badges !
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Défis en cours */}
      <Typography variant="h5" gutterBottom>
        Défis en Cours
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {userChallenges
          .filter(challenge => !completedChallengesIds.includes(challenge.id))
          .map(challenge => {
            // Calcul de la progression pour ce défi
            const progressPercentage = 0; // À calculer en fonction de l'avancement réel
            
            return (
              <Grid item xs={12} sm={6} md={4} key={challenge.id}>
                <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" noWrap>{challenge.name}</Typography>
                  <Box sx={{ my: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={progressPercentage} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {progressPercentage}% complété
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 'auto' }}>
                    <Typography variant="body2" color="text.secondary">
                      {challenge.cols.length} cols • {challenge.totalDistance.toFixed(1)} km • {challenge.totalElevation.toFixed(0)} m D+
                    </Typography>
                    <Button variant="outlined" size="small" sx={{ mt: 1 }}>
                      Voir les détails
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        {userChallenges.filter(challenge => !completedChallengesIds.includes(challenge.id)).length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" sx={{ py: 2 }}>
              Aucun défi en cours. Créez ou rejoignez un nouveau défi !
            </Typography>
          </Grid>
        )}
      </Grid>
      
      {/* Défis complétés */}
      <Typography variant="h5" gutterBottom>
        Défis Complétés
      </Typography>
      <Grid container spacing={3}>
        {completedChallenges.map(challenge => {
          const certification = certifications.find(
            cert => cert.challengeId === challenge.id && cert.status === 'verified'
          );
          
          const ranking = userRankings.find(
            rank => rank.challengeId === challenge.id
          );
          
          return (
            <Grid item xs={12} sm={6} md={4} key={challenge.id}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Badge de complétion */}
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 10, 
                    right: 10,
                    bgcolor: 'success.main',
                    borderRadius: '50%',
                    width: 30,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckCircleIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                
                <Typography variant="h6" noWrap>{challenge.name}</Typography>
                
                <Box sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Complété le {certification && new Date(certification.completionDate).toLocaleDateString()}
                  </Typography>
                  
                  {ranking && (
                    <Chip 
                      size="small"
                      label={`Classement: ${ranking.rank}${ranking.rank <= 3 ? ' 🏆' : ''}`}
                      color={ranking.rank <= 3 ? 'primary' : 'default'}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
                
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                  >
                    Voir les détails
                  </Button>
                  
                  {certification && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ShareIcon />}
                      onClick={() => handleShareCertification(certification.id)}
                      disabled={sharingCertId === certification.id}
                    >
                      {sharingCertId === certification.id ? 'Partage...' : 'Partager'}
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
        {completedChallenges.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" sx={{ py: 2 }}>
              Aucun défi complété pour l'instant. Continuez vos efforts !
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default UserProgressDashboard;
