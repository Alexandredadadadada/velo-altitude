import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActionArea,
  Button, 
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tabs,
  Tab,
  Skeleton,
  LinearProgress,
  Paper,
  Badge,
  Container,
  Avatar,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Alert
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  Flag as FlagIcon,
  DirectionsBike as BikeIcon,
  Landscape as MountainIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Star as StarIcon,
  FormatListBulleted as ListIcon,
  Terrain as TerrainIcon,
  EmojiPeople as PeopleIcon,
  AccessTime as TimeIcon,
  Celebration as CelebrationIcon,
  Group as GroupIcon,
  PhotoCamera as PhotoCameraIcon,
  EmojiFlags as EmojiFlagsIcon,
  HowToReg as HowToRegIcon,
  Chat as ChatIcon,
  Leaderboard as LeaderboardIcon,
  Diamond as DiamondIcon,
  Forum as ForumIcon,
  AddAPhoto as AddAPhotoIcon
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ChallengeDetail from './ChallengeDetail';
import UserChallengeProgress from './UserChallengeProgress';
import { getColDetailById } from '../../services/colsService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Composant principal pour afficher et gérer les défis cyclistes
 */
const ChallengesDashboard = () => {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [colsData, setColsData] = useState({});
  const [userProgress, setUserProgress] = useState({});
  const [communityView, setCommunityView] = useState('popular'); // 'popular', 'recent', 'friends'
  
  const theme = useTheme();
  const { isAuthenticated, user } = useAuth();

  // Charger les défis au chargement du composant
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setIsLoading(true);
        // Récupérer les défis depuis l'API
        const response = await axios.get('/api/challenges');
        setChallenges(response.data.challenges || []);
        
        // Si l'utilisateur est authentifié, récupérer sa progression
        if (isAuthenticated && user) {
          const progressResponse = await axios.get(`/api/users/${user.id}/challenge-progress`);
          setUserProgress(progressResponse.data || {});
        }
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des défis:', err);
        setError('Impossible de charger les défis. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenges();
  }, [isAuthenticated, user]);

  // Charger les détails des cols lorsqu'un défi est sélectionné
  useEffect(() => {
    const loadColsData = async () => {
      if (selectedChallenge && selectedChallenge.cols && selectedChallenge.cols.length > 0) {
        try {
          const colsDataObj = {};
          
          // Récupérer les détails de chaque col
          for (const colId of selectedChallenge.cols) {
            const colDetail = await getColDetailById(colId);
            if (colDetail) {
              colsDataObj[colId] = colDetail;
            }
          }
          
          setColsData(colsDataObj);
        } catch (err) {
          console.error('Erreur lors du chargement des détails des cols:', err);
        }
      }
    };

    if (selectedChallenge) {
      loadColsData();
    }
  }, [selectedChallenge]);

  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Ouvrir la boîte de dialogue des détails
  const handleOpenDetail = (challenge) => {
    setSelectedChallenge(challenge);
    setShowDetailDialog(true);
  };

  // Fermer la boîte de dialogue des détails
  const handleCloseDetail = () => {
    setShowDetailDialog(false);
  };

  // Calculer le niveau de progression pour un défi
  const calculateProgress = (challengeId) => {
    if (!isAuthenticated || !userProgress[challengeId]) {
      return 0;
    }
    
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || !challenge.cols || challenge.cols.length === 0) {
      return 0;
    }
    
    const completedCols = userProgress[challengeId]?.completedCols || [];
    return Math.round((completedCols.length / challenge.cols.length) * 100);
  };

  // Filtrer les défis selon l'onglet actif
  const getFilteredChallenges = () => {
    if (isLoading || !challenges) {
      return [];
    }
    
    switch (currentTab) {
      case 1: // Mes défis en cours
        if (!isAuthenticated) return [];
        return challenges.filter(challenge => {
          const progress = calculateProgress(challenge.id);
          return progress > 0 && progress < 100;
        });
        
      case 2: // Défis complétés
        if (!isAuthenticated) return [];
        return challenges.filter(challenge => {
          const progress = calculateProgress(challenge.id);
          return progress === 100;
        });
        
      case 3: // Par difficulté
        return [...challenges].sort((a, b) => {
          const diffA = a.difficulty || 0;
          const diffB = b.difficulty || 0;
          return diffB - diffA;
        });
        
      case 4: // Régionaux
        return challenges.filter(challenge => challenge.region === 'Europe');
        
      default: // Tous les défis
        return challenges;
    }
  };

  // Obtenir la couleur correspondant à la difficulté
  const getDifficultyColor = (difficulty) => {
    if (!difficulty && difficulty !== 0) {
      return theme.palette.grey[500];
    }
    
    // Utiliser les couleurs du thème pour les différentes difficultés
    if (difficulty >= 8) {
      return theme.palette.difficulty.hc;
    } else if (difficulty >= 6) {
      return theme.palette.difficulty.cat1;
    } else if (difficulty >= 4) {
      return theme.palette.difficulty.cat2;
    } else if (difficulty >= 2) {
      return theme.palette.difficulty.cat3;
    } else {
      return theme.palette.difficulty.cat4;
    }
  };

  // Composant pour afficher une carte de défi
  const ChallengeCard = ({ challenge }) => {
    const progress = calculateProgress(challenge.id);
    const difficultyColor = getDifficultyColor(challenge.difficulty);
    
    return (
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          },
          position: 'relative',
          overflow: 'visible'
        }}
      >
        {isAuthenticated && progress === 100 && (
          <Badge
            sx={{
              position: 'absolute',
              top: -15,
              right: -15,
              zIndex: 1,
              '& .MuiBadge-badge': {
                backgroundColor: theme.palette.success.main,
                color: theme.palette.success.contrastText,
                width: 30,
                height: 30,
                borderRadius: '50%',
              }
            }}
            badgeContent={
              <CelebrationIcon 
                fontSize="small" 
                sx={{ color: 'white' }} 
              />
            }
          />
        )}
        
        <CardActionArea 
          onClick={() => handleOpenDetail(challenge)}
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%' }}
          aria-label={`Voir les détails du défi: ${challenge.name}`}
        >
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="140"
              image={challenge.image_url || '/images/challenges/default-challenge.jpg'}
              alt={challenge.name}
              sx={{ objectFit: 'cover' }}
            />
            
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 8, 
                left: 8, 
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                borderRadius: 2,
                px: 1,
                py: 0.5,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <TerrainIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="caption" fontWeight="bold">
                {challenge.cols ? challenge.cols.length : 0} cols
              </Typography>
            </Box>
            
            <Chip
              icon={<StarIcon />}
              label={`Difficulté: ${challenge.difficulty ? challenge.difficulty : 'N/A'}/10`}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                bgcolor: difficultyColor,
                color: '#fff',
                fontWeight: 'bold',
                '& .MuiChip-icon': {
                  color: '#fff'
                }
              }}
            />
          </Box>
          
          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography 
              variant="h6" 
              component="h3" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.3,
                mb: 1
              }}
            >
              {challenge.name}
            </Typography>
            
            <Box 
              sx={{ 
                mt: 1,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <TimeIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">
                {challenge.estimated_time || 'N/A'}
              </Typography>
            </Box>
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flexGrow: 1
              }}
            >
              {challenge.description}
            </Typography>
            
            {isAuthenticated && (
              <Box sx={{ mt: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Progression:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {progress}%
                  </Typography>
                </Box>
                
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      backgroundColor: progress === 100 
                        ? theme.palette.success.main 
                        : theme.palette.primary.main,
                    }
                  }}
                  aria-label={`Progression du défi: ${progress}%`}
                />
              </Box>
            )}
          </CardContent>
        </CardActionArea>
      </Card>
    );
  };

  // Générer des cartes de squelette pour l'état de chargement
  const SkeletonCards = () => {
    return Array(8).fill().map((_, index) => (
      <Grid item key={`skeleton-${index}`} xs={12} sm={6} md={4} lg={3}>
        <Card sx={{ height: '100%' }}>
          <Skeleton variant="rectangular" height={140} animation="wave" />
          <CardContent>
            <Skeleton variant="text" height={32} width="80%" animation="wave" />
            <Skeleton variant="text" height={20} width="40%" animation="wave" sx={{ mt: 1 }} />
            <Box sx={{ mt: 1 }}>
              <Skeleton variant="text" height={60} animation="wave" />
            </Box>
            <Box sx={{ mt: 1 }}>
              <Skeleton variant="text" height={24} animation="wave" />
              <Skeleton variant="rectangular" height={8} width="100%" animation="wave" sx={{ mt: 1, borderRadius: 4 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ));
  };

  // Composant pour l'onglet Communauté des défis
  const ChallengeCommunityTab = ({ onJoinChallenge, viewType, onChangeViewType }) => {
    const [loading, setLoading] = useState(false);
    const [communityDefis, setCommunityDefis] = useState([]);
    
    // Simuler le chargement des données
    useEffect(() => {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
        setCommunityDefis([
          {
            id: 'comm-1',
            title: 'Challenge des Grimpeurs - Alpes 2025',
            author: {
              name: 'Marie Dupont',
              avatar: '/assets/avatars/user1.jpg'
            },
            participants: 27,
            type: 'alpes-challenge',
            completions: 8,
            createdAt: '2025-02-15T12:00:00Z',
            imageUrl: '/assets/challenges/alpes-challenge.jpg',
            difficulty: 4
          },
          {
            id: 'comm-2',
            title: 'Tour des Pyrénées en 7 étapes',
            author: {
              name: 'Jean Cycliste',
              avatar: '/assets/avatars/user2.jpg'
            },
            participants: 15,
            type: 'pyrenees-challenge',
            completions: 3,
            createdAt: '2025-03-12T14:30:00Z',
            imageUrl: '/assets/challenges/pyrenees-challenge.jpg',
            difficulty: 3
          },
          {
            id: 'comm-3',
            title: 'Défi Club VTT Strasbourg - Edition 2025',
            author: {
              name: 'Club VTT Strasbourg',
              avatar: '/assets/avatars/club1.jpg'
            },
            participants: 42,
            type: 'vosges-jura-challenge',
            completions: 15,
            createdAt: '2025-03-28T09:15:00Z',
            imageUrl: '/assets/challenges/vosges-jura-challenge.jpg',
            difficulty: 2
          },
          {
            id: 'comm-4',
            title: 'Conquérants des Dolomites',
            author: {
              name: 'Paolo Bianchi',
              avatar: '/assets/avatars/user3.jpg'
            },
            participants: 19,
            type: 'dolomites-challenge',
            completions: 4,
            createdAt: '2025-04-01T16:45:00Z',
            imageUrl: '/assets/challenges/dolomites-challenge.jpg',
            difficulty: 5
          }
        ]);
      }, 1500);
      
      return () => clearTimeout(timer);
    }, [viewType]);
    
    // Filtrer les défis selon le type de vue
    const filteredDefis = communityDefis.filter(defi => viewType === 'popular' ? defi.participants > 10 : viewType === 'recent' ? new Date(defi.createdAt) > new Date('2025-03-01T00:00:00Z') : true);
    
    // Rendu des actions rapides flottantes
    const quickActions = [
      { icon: <AddAPhotoIcon />, name: 'Créer un défi', action: () => console.log('Créer un défi') },
      { icon: <ForumIcon />, name: 'Forum des défis', action: () => console.log('Ouvrir le forum') },
      { icon: <LeaderboardIcon />, name: 'Classements', action: () => console.log('Voir classements') },
    ];
    
    const getDifficultyColor = (level) => {
      switch(level) {
        case 1: return 'success';
        case 2: return 'info';
        case 3: return 'primary';
        case 4: return 'warning';
        case 5: return 'error';
        default: return 'primary';
      }
    };
    
    // Conversion de timestamp en texte relatif
    const getRelativeTime = (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return 'Aujourd\'hui';
      if (diffInDays === 1) return 'Hier';
      if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
      if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `Il y a ${weeks} semaines`;
      }
      return date.toLocaleDateString();
    };
    
    return (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <GroupIcon color="primary" sx={{ mr: 1 }} />
          Défis de la Communauté
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Rejoignez d'autres cyclistes, partagez vos aventures et découvrez de nouveaux défis créés par la communauté. Relevez le défi ensemble!
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Tabs 
            value={viewType} 
            onChange={(e, newValue) => onChangeViewType(newValue)}
            aria-label="community view tabs"
          >
            <Tab 
              value="popular" 
              label="Populaires" 
              icon={<DiamondIcon fontSize="small" />} 
              iconPosition="start"
            />
            <Tab 
              value="recent" 
              label="Récents" 
              icon={<TimelineIcon fontSize="small" />} 
              iconPosition="start"
            />
            <Tab 
              value="friends" 
              label="Amis" 
              icon={<HowToRegIcon fontSize="small" />} 
              iconPosition="start"
            />
          </Tabs>
          
          <Button
            variant="outlined"
            startIcon={<ChatIcon />}
            href="/community/forum/challenges"
          >
            Discussions
          </Button>
        </Box>
        
        {/* Liste des défis communautaires */}
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map(item => (
              <Grid item key={item} xs={12} sm={6} md={4} lg={3}>
                <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 1 }} />
                <Skeleton variant="text" height={30} sx={{ mt: 1 }} />
                <Skeleton variant="text" height={20} width="60%" />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : viewType === 'friends' ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Aucun défi partagé par vos amis pour le moment. Suivez plus de cyclistes pour voir leurs défis ici.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredDefis.map(defi => (
              <Grid item key={defi.id} xs={12} sm={6} md={4} lg={3}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height={160}
                      image={defi.imageUrl}
                      alt={defi.title}
                    />
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: 10, 
                        right: 10, 
                        bgcolor: 'rgba(0,0,0,0.6)', 
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <GroupIcon sx={{ color: 'white', fontSize: 16, mr: 0.5 }} />
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {defi.participants}
                      </Typography>
                    </Box>
                    
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                        p: 1.5,
                        pt: 3
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {defi.title}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar 
                        src={defi.author.avatar} 
                        alt={defi.author.name}
                        sx={{ width: 28, height: 28, mr: 1 }}
                      />
                      <Typography variant="body2">
                        {defi.author.name}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={`Niveau ${defi.difficulty}`}
                        size="small"
                        color={getDifficultyColor(defi.difficulty)}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {getRelativeTime(defi.createdAt)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <EmojiFlagsIcon color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="caption" color="text.secondary">
                        {defi.completions} cyclistes ont terminé
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={() => onJoinChallenge(defi.id)}
                      startIcon={<HowToRegIcon />}
                    >
                      Rejoindre
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        
        {/* Actions rapides flottantes */}
        <SpeedDial
          ariaLabel="Actions rapides pour les défis"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          {quickActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.action}
            />
          ))}
        </SpeedDial>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" component="section" aria-labelledby="challenges-title">
      <Box 
        sx={{ 
          py: 4,
          position: 'relative'
        }}
      >
        {/* En-tête avec titre et description */}
        <Box 
          sx={{ 
            mb: 4,
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 2, md: 4 },
              backgroundImage: 'linear-gradient(to right, rgba(21, 101, 192, 0.8), rgba(66, 165, 245, 0.6))',
              color: '#fff',
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography 
                    variant="h4" 
                    component="h1" 
                    id="challenges-title"
                    gutterBottom
                    sx={{ 
                      fontWeight: 700,
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    Défis & Challenges Cyclistes Européens
                  </Typography>
                  
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Relevez des défis cyclistes à travers l'Europe et testez vos capacités sur les plus beaux cols.
                  </Typography>
                  
                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button 
                      variant="contained" 
                      color="secondary"
                      startIcon={<BikeIcon />}
                      sx={{ 
                        fontWeight: 600,
                        px: 3,
                        boxShadow: theme.shadows[4]
                      }}
                      onClick={() => setCurrentTab(0)}
                    >
                      Explorer les défis
                    </Button>
                    
                    {isAuthenticated && (
                      <Button 
                        variant="outlined" 
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: '#fff',
                          borderColor: '#fff',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.3)',
                            borderColor: '#fff'
                          }
                        }}
                        startIcon={<TrophyIcon />}
                        onClick={() => setCurrentTab(2)}
                      >
                        Mes trophées
                      </Button>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Box 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Paper 
                      elevation={3}
                      sx={{ 
                        p: 2,
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        width: '100%',
                        borderRadius: 2,
                        transform: 'rotate(2deg)'
                      }}
                    >
                      <Typography variant="subtitle2" component="h3" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                        <MountainIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Défi en vedette
                      </Typography>
                      
                      <Box 
                        sx={{ 
                          mt: 1,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <TimelineIcon 
                          sx={{ 
                            fontSize: 40,
                            color: theme.palette.difficulty.cat1,
                            mr: 1.5
                          }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            Les Grands Cols Alpins
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            8 cols, difficulté 8/10
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          mt: 2
                        }}
                      >
                        <Typography variant="caption" component="p" sx={{ display: 'flex', alignItems: 'center' }}>
                          <InfoIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.info.main }} />
                          Incluant le mythique:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          Col du Galibier (2642m)
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>
      
        {/* Onglets pour filtrer les défis */}
        <Box 
          sx={{ 
            mb: 3, 
            borderBottom: 1, 
            borderColor: 'divider',
            position: 'sticky',
            top: 64, // Ajuster selon la hauteur de votre barre de navigation
            bgcolor: 'background.paper',
            zIndex: 10,
            px: 1
          }}
        >
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Filtres des défis cyclistes"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                minHeight: 48
              }
            }}
          >
            <Tab 
              icon={<ListIcon />} 
              label="Tous les défis" 
              id="challenge-tab-0"
              aria-controls="challenge-tabpanel-0"
              iconPosition="start"
            />
            
            {isAuthenticated && (
              <>
                <Tab 
                  icon={<BikeIcon />} 
                  label="Mes défis en cours" 
                  id="challenge-tab-1"
                  aria-controls="challenge-tabpanel-1"
                  iconPosition="start"
                />
                <Tab 
                  icon={<FlagIcon />} 
                  label="Défis complétés"
                  id="challenge-tab-2"
                  aria-controls="challenge-tabpanel-2"
                  iconPosition="start"
                />
              </>
            )}
            
            <Tab 
              icon={<TerrainIcon />} 
              label="Par difficulté"
              id="challenge-tab-3"
              aria-controls="challenge-tabpanel-3"
              iconPosition="start"
            />
            <Tab 
              icon={<MountainIcon />} 
              label="Régionaux"
              id="challenge-tab-4"
              aria-controls="challenge-tabpanel-4"
              iconPosition="start"
            />
            <Tab 
              icon={<GroupIcon />} 
              label="Communauté"
              id="challenge-tab-5"
              aria-controls="challenge-tabpanel-5"
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        {/* Indicateur de chargement global */}
        {isLoading && (
          <Box sx={{ width: '100%', mb: 4 }}>
            <LinearProgress />
          </Box>
        )}
        
        {/* Message d'erreur */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}
        
        {/* Liste des défis */}
        <Box 
          sx={{ mt: 3 }}
          role="tabpanel"
          id={`challenge-tabpanel-${currentTab}`}
          aria-labelledby={`challenge-tab-${currentTab}`}
        >
          <Grid container spacing={3}>
            {isLoading ? (
              <SkeletonCards />
            ) : (
              getFilteredChallenges().map((challenge) => (
                <Grid item key={challenge.id} xs={12} sm={6} md={4} lg={3}>
                  <ChallengeCard challenge={challenge} />
                </Grid>
              ))
            )}
            
            {!isLoading && getFilteredChallenges().length === 0 && (
              <Grid item xs={12}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {currentTab === 1 ? 
                      "Vous n'avez pas encore commencé de défi. Trouvez-en un qui vous inspire !" : 
                      currentTab === 2 ? 
                      "Vous n'avez pas encore terminé de défi. Continuez vos efforts !" :
                      "Aucun défi ne correspond à ces critères."}
                  </Typography>
                  
                  {(currentTab === 1 || currentTab === 2) && (
                    <Button 
                      variant="contained" 
                      sx={{ mt: 2 }}
                      onClick={() => setCurrentTab(0)}
                    >
                      Voir tous les défis
                    </Button>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
        
        {/* Boîte de dialogue pour les détails du défi */}
        <Dialog 
          open={showDetailDialog} 
          onClose={handleCloseDetail}
          fullWidth
          maxWidth="md"
          scroll="paper"
          aria-labelledby="challenge-detail-title"
        >
          <DialogTitle 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: `1px solid ${theme.palette.divider}`,
              pb: 1
            }}
          >
            <Typography 
              variant="h6" 
              component="h2"
              id="challenge-detail-title"
            >
              {selectedChallenge?.name || ''}
            </Typography>
            
            <IconButton 
              onClick={handleCloseDetail}
              aria-label="Fermer le dialogue"
              edge="end"
              color="inherit"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent dividers>
            {selectedChallenge ? (
              <ChallengeDetail 
                challenge={selectedChallenge} 
                colsData={colsData}
                userProgress={userProgress[selectedChallenge.id] || null}
              />
            ) : (
              <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgress />
                <Typography>Chargement des détails...</Typography>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseDetail} color="inherit">
              Fermer
            </Button>
            
            {isAuthenticated && selectedChallenge && (
              userProgress[selectedChallenge.id] ? (
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link}
                  to={`/dashboard/challenges/${selectedChallenge.id}`}
                  startIcon={<BikeIcon />}
                >
                  Gérer ma progression
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  color="secondary" 
                  component={Link}
                  to={`/dashboard/challenges/${selectedChallenge.id}`}
                  startIcon={<FlagIcon />}
                >
                  Commencer ce défi
                </Button>
              )
            )}
          </DialogActions>
        </Dialog>
        
        {/* Onglet Communauté */}
        {currentTab === 5 && (
          <ChallengeCommunityTab 
            onJoinChallenge={() => console.log('Rejoindre le défi')}
            viewType={communityView}
            onChangeViewType={(view) => setCommunityView(view)}
          />
        )}
      </Box>
    </Container>
  );
};

export default ChallengesDashboard;
