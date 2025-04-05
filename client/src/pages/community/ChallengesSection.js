import React, { memo } from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, Button, Chip,
  LinearProgress, Divider, Alert, Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrophy, faBicycle, faMountain, faClock, 
  faUsers, faAward, faFire, faCalendarCheck 
} from '@fortawesome/free-solid-svg-icons';
import { useCommunity } from '../../contexts/CommunityContext';
import { useNotification } from '../../components/common/NotificationSystem';
import { useFeatureFlags } from '../../services/featureFlags';

// Données de démonstration pour les défis
const mockChallenges = [
  {
    id: 'challenge1',
    title: 'Tour des Cols Vosgiens',
    description: 'Gravissez 5 cols majeurs des Vosges en un mois',
    progress: 60,
    type: 'regional',
    difficulty: 'hard',
    participants: 87,
    deadline: '2025-05-30',
    rewards: ['Badge Col Master', '500 points'],
    completed: false
  },
  {
    id: 'challenge2',
    title: 'Défi Mensuel de Kilométrage',
    description: 'Parcourez 500km ce mois-ci',
    progress: 35,
    type: 'monthly',
    difficulty: 'medium',
    participants: 124,
    deadline: '2025-04-30',
    rewards: ['Badge Kilomètre', '300 points'],
    completed: false
  },
  {
    id: 'challenge3',
    title: 'Les 7 Cols Mythiques',
    description: 'Gravissez les 7 cols les plus célèbres du Grand Est',
    progress: 100,
    type: 'achievement',
    difficulty: 'extreme',
    participants: 42,
    deadline: null,
    rewards: ['Badge Légende', '1000 points', 'Maillot exclusif'],
    completed: true
  },
  {
    id: 'challenge4',
    title: 'Régularité Printanière',
    description: 'Faites au moins 3 sorties par semaine pendant 4 semaines',
    progress: 75,
    type: 'seasonal',
    difficulty: 'easy',
    participants: 156,
    deadline: '2025-06-21',
    rewards: ['Badge Régularité', '200 points'],
    completed: false
  }
];

// Styles personnalisés
const StyledCardHeader = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default
}));

const ChallengeCard = styled(Card)(({ theme, completed }) => ({
  marginBottom: theme.spacing(3),
  position: 'relative',
  border: completed ? `1px solid ${theme.palette.success.main}` : `1px solid ${theme.palette.divider}`,
  '&:hover': {
    boxShadow: theme.shadows[3]
  },
  '&::before': completed ? {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    backgroundColor: theme.palette.success.main
  } : {}
}));

// Composant pour afficher un défi
const ChallengeItem = memo(({ challenge }) => {
  const { notify } = useNotification();
  const difficultyColors = {
    easy: 'success',
    medium: 'info',
    hard: 'warning',
    extreme: 'error'
  };
  
  const typeIcons = {
    regional: faMountain,
    monthly: faCalendarCheck,
    achievement: faAward,
    seasonal: faClock
  };
  
  const joinChallenge = () => {
    notify.success(`Vous avez rejoint le défi "${challenge.title}"`);
  };
  
  return (
    <ChallengeCard completed={challenge.completed}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" component="h3" gutterBottom>
              {challenge.title}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Chip 
                icon={<FontAwesomeIcon icon={typeIcons[challenge.type] || faTrophy} />} 
                label={challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1)} 
                size="small" 
                color="primary"
                variant="outlined"
              />
              <Chip 
                label={challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)} 
                size="small" 
                color={difficultyColors[challenge.difficulty]}
                variant="outlined"
              />
            </Box>
            
            <Typography variant="body2" paragraph>
              {challenge.description}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 2 }}>
            <Box sx={{ position: 'relative', width: 60, height: 60 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  border: '4px solid #eee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -4,
                    left: -4,
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    border: '4px solid',
                    borderColor: challenge.completed ? 'success.main' : 'primary.main',
                    borderTopColor: 'transparent',
                    transform: `rotate(${challenge.progress * 3.6}deg)`,
                    transition: 'all .5s ease'
                  }
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {challenge.progress}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <FontAwesomeIcon icon={faUsers} style={{ marginRight: '4px' }} />
              {challenge.participants}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Progression
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={challenge.progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: challenge.completed ? 'success.main' : 'primary.main'
              }
            }} 
          />
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ width: '100%' }}>
            Récompenses:
          </Typography>
          {challenge.rewards.map((reward, index) => (
            <Chip
              key={index}
              icon={<FontAwesomeIcon icon={index === 0 ? faAward : faFire} />}
              label={reward}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {challenge.deadline ? (
            <Typography variant="body2" color="text.secondary">
              <FontAwesomeIcon icon={faClock} style={{ marginRight: '4px' }} />
              Expire le: {new Date(challenge.deadline).toLocaleDateString()}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Pas de date limite
            </Typography>
          )}
          
          {challenge.completed ? (
            <Chip 
              label="Complété" 
              color="success" 
              icon={<FontAwesomeIcon icon={faAward} />} 
            />
          ) : (
            <Button 
              variant="outlined" 
              color="primary"
              onClick={joinChallenge}
              disabled={challenge.progress > 0}
            >
              {challenge.progress > 0 ? 'En cours' : 'Rejoindre'}
            </Button>
          )}
        </Box>
      </CardContent>
    </ChallengeCard>
  );
});

// Section Défis complète
const ChallengesSection = () => {
  const { communityStats } = useCommunity();
  const { isFeatureEnabled } = useCommunity();
  const { isEnabled } = useFeatureFlags();
  
  const challenges = mockChallenges;
  
  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Card>
          <StyledCardHeader 
            title={
              <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faTrophy} style={{ marginRight: '8px' }} />
                Défis cyclistes
              </Typography>
            }
          />
          <CardContent>
            {isEnabled('enableSevenMajorsChallenge') && (
              <Box sx={{ mb: 3 }}>
                <Alert 
                  severity="info"
                  action={
                    <Button color="inherit" size="small">
                      En savoir plus
                    </Button>
                  }
                >
                  Nouveau défi disponible : Les 7 Cols Mythiques du Grand Est !
                </Alert>
              </Box>
            )}
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Statistiques
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <FontAwesomeIcon icon={faTrophy} size="2x" style={{ color: '#ff9800', marginBottom: '8px' }} />
                    <Typography variant="h6">{communityStats?.activeChallenges || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Défis actifs</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <FontAwesomeIcon icon={faAward} size="2x" style={{ color: '#f44336', marginBottom: '8px' }} />
                    <Typography variant="h6">{communityStats?.yourChallenges || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Vos défis</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <FontAwesomeIcon icon={faUsers} size="2x" style={{ color: '#3f51b5', marginBottom: '8px' }} />
                    <Typography variant="h6">{communityStats?.totalMembers || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Participants</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <FontAwesomeIcon icon={faBicycle} size="2x" style={{ color: '#4caf50', marginBottom: '8px' }} />
                    <Typography variant="h6">{communityStats?.totalChallenges || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Total des défis</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Défis disponibles
            </Typography>
            
            {challenges.length > 0 ? (
              <div>
                {challenges.map((challenge) => (
                  <ChallengeItem key={challenge.id} challenge={challenge} />
                ))}
              </div>
            ) : (
              <Alert severity="info">
                Aucun défi n'est actuellement disponible. Revenez bientôt pour découvrir de nouveaux défis !
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ChallengesSection;
