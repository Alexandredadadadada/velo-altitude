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
  Tab
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
  EmojiPeople as PeopleIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ChallengeDetail from './ChallengeDetail';
import UserChallengeProgress from './UserChallengeProgress';
import { getColDetailById } from '../../services/colsService';
import { useAuth } from '../../contexts/AuthContext';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

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
    if (!challenges || challenges.length === 0) return [];
    
    switch (currentTab) {
      case 0: // Tous les défis
        return challenges;
      case 1: // Défis en cours
        if (!isAuthenticated) return [];
        return challenges.filter(challenge => 
          userProgress[challenge.id] && 
          calculateProgress(challenge.id) > 0 && 
          calculateProgress(challenge.id) < 100
        );
      case 2: // Défis terminés
        if (!isAuthenticated) return [];
        return challenges.filter(challenge => 
          userProgress[challenge.id] && 
          calculateProgress(challenge.id) === 100
        );
      case 3: // Défis par difficulté
        return [...challenges].sort((a, b) => {
          const difficultyOrder = { "Modérée": 1, "Difficile": 2, "Très difficile": 3, "Extrême": 4 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        });
      case 4: // Défis régionaux
        return challenges.filter(challenge => challenge.category === "Régional");
      default:
        return challenges;
    }
  };

  // Obtenir la couleur correspondant à la difficulté
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Modérée":
        return theme.palette.success.main;
      case "Difficile":
        return theme.palette.warning.main;
      case "Très difficile":
        return theme.palette.error.light;
      case "Extrême":
        return theme.palette.error.dark;
      default:
        return theme.palette.info.main;
    }
  };

  // Composant pour afficher une carte de défi
  const ChallengeCard = ({ challenge }) => (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: 6
        }
      }}
    >
      <CardActionArea onClick={() => handleOpenDetail(challenge)}>
        <CardMedia
          component="img"
          height="140"
          image={challenge.badgeImage || "/assets/default-challenge.jpg"}
          alt={challenge.name}
          sx={{ objectFit: "cover" }}
        />
        
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography gutterBottom variant="h6" component="div" noWrap>
            {challenge.name}
          </Typography>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Chip 
              size="small" 
              icon={<TerrainIcon />}
              label={challenge.difficulty} 
              sx={{ 
                bgcolor: `${getDifficultyColor(challenge.difficulty)}20`, 
                color: getDifficultyColor(challenge.difficulty),
                fontWeight: 'bold'
              }} 
            />
            
            <Chip 
              size="small" 
              icon={<FlagIcon />}
              label={challenge.category} 
              color="primary" 
              variant="outlined"
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            mb: 1
          }}>
            {challenge.description}
          </Typography>
          
          <Box display="flex" alignItems="center" mt={1}>
            <TrophyIcon 
              fontSize="small" 
              color="primary" 
              sx={{ mr: 0.5 }} 
            />
            <Typography variant="body2" color="primary">
              {challenge.rewards.points} points
            </Typography>
          </Box>
          
          {isAuthenticated && userProgress[challenge.id] && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Progression:
              </Typography>
              
              <Box display="flex" alignItems="center" mt={0.5}>
                <Box sx={{ position: 'relative', display: 'inline-flex', mr: 1 }}>
                  <CircularProgress
                    variant="determinate"
                    value={calculateProgress(challenge.id)}
                    size={30}
                    thickness={6}
                    sx={{
                      color: calculateProgress(challenge.id) === 100 
                        ? theme.palette.success.main 
                        : theme.palette.primary.main
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" component="div" color="text.secondary" fontWeight="bold">
                      {`${calculateProgress(challenge.id)}%`}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {userProgress[challenge.id]?.completedCols?.length || 0}/{challenge.cols?.length || 0} cols
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );

  // Afficher un chargement pendant le chargement des données
  if (isLoading) {
    return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/challengesdashboard"
        }
      </script>
      <EnhancedMetaTags
        title="Défis Cyclistes | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress />
      </Box>
    );
  }

  // Afficher un message d'erreur en cas d'erreur
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Réessayer
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* En-tête de la page */}
      <Box 
        sx={{ 
          mb: 4, 
          p: 3, 
          borderRadius: 2, 
          backgroundColor: 'background.paper',
          boxShadow: 2
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle' }} />
          Défis Cyclistes
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Repoussez vos limites avec nos défis cyclistes en montagne. Gravissez les cols les plus emblématiques d'Europe et devenez une légende du cyclisme.
        </Typography>
        
        {!isAuthenticated && (
          <Button 
            component={Link} 
            to="/login" 
            variant="contained" 
            color="primary" 
            startIcon={<PeopleIcon />}
          >
            Connectez-vous pour suivre votre progression
          </Button>
        )}
      </Box>
      
      {/* Mise en avant du défi principal */}
      {challenges.length > 0 && challenges.find(c => c.id === 'seven-majors-challenge') && (
        <Box 
          sx={{ 
            mb: 4, 
            p: 0,
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 3,
            background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.8)), url('/assets/backgrounds/seven-cols.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: 'white'
          }}
        >
          <Box sx={{ p: { xs: 3, md: 5 } }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Box>
                  <Chip 
                    label="DÉFI MAJEUR" 
                    color="error" 
                    size="small" 
                    sx={{ mb: 2, fontWeight: 'bold' }} 
                  />
                  
                  <Typography variant="h3" component="h2" gutterBottom fontWeight="bold">
                    Le Défi des 7 Cols Majeurs
                  </Typography>
                  
                  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    {challenges.find(c => c.id === 'seven-majors-challenge').description}
                  </Typography>
                  
                  <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
                    <Chip 
                      icon={<TerrainIcon />} 
                      label="Difficulté: Extrême" 
                      sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} 
                    />
                    <Chip 
                      icon={<TimelineIcon />} 
                      label="Estimé: 1 an minimum" 
                      sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} 
                    />
                    <Chip 
                      icon={<TrophyIcon />} 
                      label="7000 points" 
                      sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} 
                    />
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    size="large"
                    color="error"
                    onClick={() => handleOpenDetail(challenges.find(c => c.id === 'seven-majors-challenge'))}
                    sx={{ mr: 2 }}
                  >
                    Découvrir le défi
                  </Button>
                  
                  {isAuthenticated && (
                    <Button 
                      variant="outlined" 
                      size="large"
                      sx={{ color: 'white', borderColor: 'white' }}
                      onClick={() => handleOpenDetail(challenges.find(c => c.id === 'seven-majors-challenge'))}
                    >
                      {userProgress['seven-majors-challenge'] ? 'Voir ma progression' : 'Commencer le défi'}
                    </Button>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  bgcolor: 'rgba(0, 0, 0, 0.5)', 
                  p: 2, 
                  borderRadius: 2,
                  height: '100%'
                }}>
                  <Typography variant="h6" gutterBottom>
                    Les 7 Cols Majeurs:
                  </Typography>
                  
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body1" gutterBottom>
                      Col du Tourmalet (2115m)
                    </Typography>
                    <Typography component="li" variant="body1" gutterBottom>
                      Alpe d'Huez (1860m)
                    </Typography>
                    <Typography component="li" variant="body1" gutterBottom>
                      Stelvio Pass (2758m)
                    </Typography>
                    <Typography component="li" variant="body1" gutterBottom>
                      Mont Ventoux (1909m)
                    </Typography>
                    <Typography component="li" variant="body1" gutterBottom>
                      Col du Galibier (2642m)
                    </Typography>
                    <Typography component="li" variant="body1" gutterBottom>
                      Col d'Aubisque (1709m)
                    </Typography>
                    <Typography component="li" variant="body1" gutterBottom>
                      Passo di Mortirolo (1852m)
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}
      
      {/* Onglets pour filtrer les défis */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<ListIcon />} label="Tous les défis" />
          
          {isAuthenticated && (
            <>
              <Tab icon={<BikeIcon />} label="Mes défis en cours" />
              <Tab icon={<FlagIcon />} label="Défis complétés" />
            </>
          )}
          
          <Tab icon={<TerrainIcon />} label="Par difficulté" />
          <Tab icon={<MountainIcon />} label="Régionaux" />
        </Tabs>
      </Box>
      
      {/* Liste des défis */}
      <Box sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {getFilteredChallenges().map((challenge) => (
            <Grid item key={challenge.id} xs={12} sm={6} md={4} lg={3}>
              <ChallengeCard challenge={challenge} />
            </Grid>
          ))}
          
          {getFilteredChallenges().length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
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
              </Box>
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
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {selectedChallenge?.name || ''}
          </Typography>
          
          <IconButton onClick={handleCloseDetail}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          {selectedChallenge && (
            <ChallengeDetail 
              challenge={selectedChallenge} 
              colsData={colsData}
              userProgress={userProgress[selectedChallenge.id] || null}
            />
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDetail} color="primary">
            Fermer
          </Button>
          
          {isAuthenticated && selectedChallenge && (
            userProgress[selectedChallenge.id] ? (
              <Button 
                variant="contained" 
                color="primary" 
                component={Link}
                to={`/dashboard/challenges/${selectedChallenge.id}`}
              >
                Gérer ma progression
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                component={Link}
                to={`/dashboard/challenges/${selectedChallenge.id}`}
              >
                Commencer ce défi
              </Button>
            )
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChallengesDashboard;
