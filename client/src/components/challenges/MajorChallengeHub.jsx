import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Grid, 
  Button, 
  Card, 
  CardContent, 
  CardMedia, 
  IconButton, 
  Chip,
  Avatar,
  Stack,
  Tooltip,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Divider,
  Badge,
  Container,
  Paper
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AddIcon from '@mui/icons-material/Add';
import ShareIcon from '@mui/icons-material/Share';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import HeightIcon from '@mui/icons-material/Height';
import PlaceIcon from '@mui/icons-material/Place';
import LandscapeIcon from '@mui/icons-material/Landscape';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import { motion } from 'framer-motion';

import ColsGallery from './ColsGallery';
import CompareView from './CompareView';
import ChallengeForm from './ChallengeForm';
import ShareModal from '../common/ShareModal';
import { useBatteryStatus } from '../../hooks/useBatteryStatus';
import ColVisualization3D from '../visualization/ColVisualization3D';
import UserChallengeProgress from './UserChallengeProgress';
import SelectedColsView from './SelectedColsView';

/**
 * Hub central pour le défi "Les 7 Majeurs"
 * Permet aux utilisateurs de:
 * - Créer leur propre défi en sélectionnant 7 cols parmi 50+
 * - Visualiser et comparer les profils des cols sélectionnés
 * - Partager leur défi avec la communauté
 * - Exporter les parcours au format GPX
 * - Suivre les progrès de leurs défis
 */
const MajorChallengeHub = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { batteryStatus } = useBatteryStatus();
  
  // Références
  const compareViewRef = useRef(null);
  
  // États
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCols, setSelectedCols] = useState([]);
  const [availableCols, setAvailableCols] = useState([]);
  const [userChallenges, setUserChallenges] = useState([]);
  const [featuredChallenges, setFeaturedChallenges] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  
  // Chargement des données
  useEffect(() => {
    // Simuler le chargement des cols disponibles
    const fetchData = async () => {
      try {
        // Ici on utiliserait une vraie requête API
        // fetch('/api/cols').then(...)
        
        // Données simulées pour la démonstration
        const mockCols = [
          { 
            id: 'bonette', 
            name: 'Col de la Bonette', 
            altitude: 2802, 
            location: { country: 'France', region: 'Alpes' },
            images: { 
              main: '/images/cols/bonette.jpg',
              thumbnail: '/images/cols/thumbnails/bonette.jpg'
            },
            elevation: 1260,
            averageGradient: 6.4,
            length: 24,
            difficulty: 4
          },
          { 
            id: 'stelvio', 
            name: 'Passo dello Stelvio', 
            altitude: 2758, 
            location: { country: 'Italie', region: 'Alpes italiennes' },
            images: { 
              main: '/images/cols/stelvio.jpg',
              thumbnail: '/images/cols/thumbnails/stelvio.jpg'
            },
            elevation: 1808,
            averageGradient: 7.4,
            length: 24.3,
            difficulty: 5
          },
          { 
            id: 'galibier', 
            name: 'Col du Galibier', 
            altitude: 2642, 
            location: { country: 'France', region: 'Alpes' },
            images: { 
              main: '/images/cols/galibier.jpg',
              thumbnail: '/images/cols/thumbnails/galibier.jpg'
            },
            elevation: 1245,
            averageGradient: 7.3,
            length: 17,
            difficulty: 4
          },
          // ...et bien d'autres cols
        ];
        
        const mockUserChallenges = [
          {
            id: 'user-challenge-1',
            name: 'Mon Grand Tour Alpin',
            description: 'Ma sélection personnelle des plus beaux cols alpins',
            cols: ['bonette', 'galibier', 'iseran', 'izoard', 'croix-de-fer', 'telegraphe', 'cormet-de-roselend'],
            progress: 43,
            createdAt: '2025-01-15T10:30:00Z',
            isPublic: true,
            likes: 24
          }
        ];
        
        const mockFeaturedChallenges = [
          {
            id: 'featured-1',
            name: 'Tour de France Legacy',
            description: 'Les 7 cols les plus emblématiques du Tour de France',
            cols: ['tourmalet', 'galibier', 'ventoux', 'alpe-dhuez', 'aubisque', 'izoard', 'peyresourde'],
            participants: 1458,
            creator: { name: 'Équipe Velo-Altitude', avatar: '/images/avatars/team.jpg' },
            difficulty: 'Expert'
          },
          {
            id: 'featured-2',
            name: 'Défi Italien',
            description: 'Les plus beaux cols d\'Italie',
            cols: ['stelvio', 'gavia', 'mortirolo', 'giau', 'fedaia', 'pordoi', 'zoncolan'],
            participants: 967,
            creator: { name: 'Club Alpino', avatar: '/images/avatars/club-alpino.jpg' },
            difficulty: 'Extrême'
          }
        ];
        
        setAvailableCols(mockCols);
        setUserChallenges(mockUserChallenges);
        setFeaturedChallenges(mockFeaturedChallenges);
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Gestion des onglets
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Gestion de la sélection des cols
  const handleColSelect = (col) => {
    if (selectedCols.some(c => c.id === col.id)) {
      // Désélectionner le col
      setSelectedCols(selectedCols.filter(c => c.id !== col.id));
    } else if (selectedCols.length < 7) {
      // Sélectionner le col (max 7)
      setSelectedCols([...selectedCols, col]);
    }
  };
  
  // Chargement d'un défi
  const loadChallenge = (challenge) => {
    // Filtrer pour obtenir les cols complets
    const challengeCols = challenge.cols
      .map(colId => availableCols.find(c => c.id === colId))
      .filter(Boolean);
      
    setSelectedCols(challengeCols);
    setCurrentChallenge(challenge);
    setActiveTab(0); // Revenir à l'onglet principal
  };
  
  // Sauvegarde d'un défi
  const saveChallenge = (challengeData) => {
    const newChallenge = {
      id: `user-challenge-${Date.now()}`,
      cols: selectedCols.map(col => col.id),
      progress: 0,
      createdAt: new Date().toISOString(),
      isPublic: challengeData.isPublic,
      ...challengeData
    };
    
    setUserChallenges([newChallenge, ...userChallenges]);
    setCurrentChallenge(newChallenge);
    
    // Ici on sauvegarderait en base de données
    // fetch('/api/challenges', { method: 'POST', body: JSON.stringify(newChallenge) })
    
    return newChallenge;
  };
  
  // Partage d'un défi
  const shareChallenge = () => {
    setShareModalOpen(true);
  };
  
  // Export GPX
  const exportGpx = () => {
    // Logique d'export GPX
    console.log("Export GPX pour", selectedCols.map(c => c.name).join(", "));
    // Simuler un téléchargement
    alert("Export GPX en cours pour " + selectedCols.length + " cols");
  };
  
  // Rendu du contenu principal selon l'onglet actif
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Mon Défi actuel
        return (
          <Box>
            {/* Visualisation 3D des cols sélectionnés - section immersive */}
            {selectedCols.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Box sx={{ mb: 4, mt: 2 }}>
                  <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <ViewInArIcon sx={{ mr: 1 }} /> Visualisation immersive
                  </Typography>
                  
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      borderRadius: 3,
                      bgcolor: 'background.paper',
                      boxShadow: theme.shadows[3],
                      overflow: 'hidden'
                    }}
                  >
                    <Grid container spacing={isMobile ? 2 : 4}>
                      <Grid item xs={12} md={8}>
                        {/* Col principal en affichage 3D */}
                        <Box sx={{ height: { xs: 250, sm: 300, md: 400 }, mb: 2, position: 'relative' }}>
                          <ColVisualization3D 
                            colData={selectedCols[0]} 
                            height="100%" 
                            width="100%"
                            enableRotation={true}
                          />
                          <Box 
                            sx={{ 
                              position: 'absolute', 
                              bottom: 16, 
                              right: 16, 
                              display: 'flex',
                              alignItems: 'center',
                              bgcolor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              borderRadius: 1.5,
                              px: 1.5,
                              py: 0.5,
                              backdropFilter: 'blur(4px)'
                            }}
                          >
                            <Badge 
                              color="primary" 
                              badgeContent={1} 
                              sx={{ mr: 1 }}
                            >
                              <LandscapeIcon />
                            </Badge>
                            <Typography variant="body2">
                              Premier col de votre défi
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        {/* Miniatures des autres cols */}
                        <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                          Autres cols de votre défi:
                        </Typography>
                        
                        <Grid container spacing={2}>
                          {selectedCols.slice(1, 4).map((col, idx) => (
                            <Grid item xs={6} sm={4} md={12} key={col.id}>
                              <Card 
                                sx={{ 
                                  position: 'relative',
                                  overflow: 'hidden',
                                  borderRadius: 2,
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s',
                                  '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: theme.shadows[10]
                                  },
                                  height: { xs: 100, md: 90 }
                                }}
                              >
                                <Box 
                                  sx={{ 
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 1,
                                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6))'
                                  }}
                                />
                                <Box 
                                  component="img"
                                  src={col.images?.thumbnail || '/images/cols/placeholder.jpg'}
                                  alt={col.name}
                                  sx={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover',
                                    filter: 'brightness(0.9)'
                                  }}
                                />
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    p: 1,
                                    zIndex: 2,
                                    width: '100%'
                                  }}
                                >
                                  <Typography 
                                    variant="caption" 
                                    component="p" 
                                    sx={{ 
                                      color: 'white', 
                                      fontWeight: 500,
                                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {col.name}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    component="p" 
                                    sx={{ 
                                      color: 'white', 
                                      opacity: 0.9,
                                      display: 'flex',
                                      alignItems: 'center',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    <HeightIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                                    {col.altitude}m
                                  </Typography>
                                </Box>
                                <Badge 
                                  color="primary" 
                                  badgeContent={idx + 2} 
                                  sx={{ 
                                    position: 'absolute', 
                                    top: 8, 
                                    right: 8,
                                    zIndex: 2 
                                  }}
                                />
                              </Card>
                            </Grid>
                          ))}
                          
                          {selectedCols.length > 4 && (
                            <Grid item xs={6} sm={4} md={12}>
                              <Card 
                                sx={{ 
                                  position: 'relative',
                                  overflow: 'hidden',
                                  borderRadius: 2,
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s',
                                  '&:hover': {
                                    transform: 'translateY(-4px)'
                                  },
                                  bgcolor: 'action.hover',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: { xs: 100, md: 90 }
                                }}
                              >
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ 
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center' 
                                  }}
                                >
                                  +{selectedCols.length - 4} col(s)
                                </Typography>
                              </Card>
                            </Grid>
                          )}
                        </Grid>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              </motion.div>
            )}
          
            {/* Sélection des cols */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3
              }}
            >
              {/* Utiliser SelectedColsView qui a déjà le système drag-and-drop */}
              <Box sx={{ flex: 1 }}>
                <SelectedColsView
                  selectedCols={selectedCols}
                  onRemoveCol={(col) => handleColSelect(col)}
                  onReorderCols={(newOrder) => {
                    setCols(newOrder);
                    // Ici vous pourriez ajouter une logique pour sauvegarder l'ordre
                  }}
                  maxSelection={7}
                />
              </Box>
              
              {/* Statistiques et progression */}
              <Box sx={{ width: { xs: '100%', md: '380px' } }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    boxShadow: theme.shadows[3]
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmojiEventsIcon sx={{ mr: 1 }} /> Progression & Récompenses
                  </Typography>
                  
                  {selectedCols.length > 0 ? (
                    <Box>
                      {/* Indicateur de progression */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Votre progression dans ce défi
                        </Typography>
                        
                        <Box sx={{ position: 'relative', height: 8, bgcolor: 'action.hover', borderRadius: 4, mb: 1 }}>
                          <Box 
                            sx={{ 
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              height: '100%',
                              width: '30%', // Simulation de progression
                              bgcolor: 'primary.main',
                              borderRadius: 4,
                            }}
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.primary">
                          2 cols complétés sur {selectedCols.length}
                        </Typography>
                      </Box>
                      
                      {/* Badges gagnés */}
                      <Typography variant="subtitle2" gutterBottom>
                        Badges à débloquer
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                        {[
                          { name: 'Premier Col', unlocked: true },
                          { name: 'Mi-Parcours', unlocked: false },
                          { name: 'Défi Complété', unlocked: false },
                          { name: 'Expert Alpin', unlocked: false }
                        ].map((badge, idx) => (
                          <Chip
                            key={idx}
                            label={badge.name}
                            variant={badge.unlocked ? 'filled' : 'outlined'}
                            color={badge.unlocked ? 'primary' : 'default'}
                            icon={badge.unlocked ? <EmojiEventsIcon /> : undefined}
                            sx={{ 
                              opacity: badge.unlocked ? 1 : 0.6,
                              '& .MuiChip-icon': { fontSize: '1rem' }
                            }}
                          />
                        ))}
                      </Box>
                      
                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          variant="contained" 
                          startIcon={<ShareIcon />}
                          fullWidth
                          onClick={shareChallenge}
                        >
                          Partager
                        </Button>
                        <Button 
                          variant="outlined"
                          startIcon={<FileDownloadIcon />}
                          fullWidth
                          onClick={exportGpx}
                        >
                          Exporter GPX
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Typography color="text.secondary" variant="body2" sx={{ textAlign: 'center', py: 3 }}>
                      Sélectionnez des cols pour commencer votre défi et suivre votre progression
                    </Typography>
                  )}
                </Paper>
              </Box>
            </Box>
            
            {/* Outils et visualisations */}
            {selectedCols.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    boxShadow: theme.shadows[3]
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Comparer les cols de votre défi
                  </Typography>
                  
                  <Button
                    variant={compareMode ? "contained" : "outlined"}
                    startIcon={<CompareArrowsIcon />}
                    onClick={() => setCompareMode(!compareMode)}
                    sx={{ mb: 3 }}
                  >
                    {compareMode ? "Masquer la comparaison" : "Comparer les cols"}
                  </Button>
                  
                  {compareMode && (
                    <CompareView 
                      cols={selectedCols}
                      ref={compareViewRef}
                    />
                  )}
                </Paper>
              </Box>
            )}
            
            {/* Actions principales */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => setActiveTab(1)}
                startIcon={<SearchIcon />}
              >
                Explorer le catalogue
              </Button>
              
              {selectedCols.length > 0 && (
                <Button
                  variant="contained"
                  onClick={() => setActiveTab(3)}
                  startIcon={<SaveIcon />}
                >
                  Sauvegarder mon défi
                </Button>
              )}
            </Box>
          </Box>
        );
        
      case 1: // Catalogue des cols
        return (
          <ColsGallery 
            cols={availableCols} 
            selectedCols={selectedCols} 
            onColSelect={handleColSelect}
            maxSelection={7}
          />
        );
        
      case 2: // Défis communautaires
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Défis officiels
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 6 }}>
              {featuredChallenges.map((challenge) => (
                <Grid item xs={12} md={6} key={challenge.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          src={challenge.creator.avatar} 
                          alt={challenge.creator.name}
                          sx={{ mr: 2 }}
                        />
                        <Box>
                          <Typography variant="h6">{challenge.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Par {challenge.creator.name}
                          </Typography>
                        </Box>
                        <Chip 
                          label={challenge.difficulty}
                          size="small"
                          color={
                            challenge.difficulty === 'Expert' ? 'warning' : 
                            challenge.difficulty === 'Extrême' ? 'error' : 'default'
                          }
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                      
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {challenge.description}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 0.5,
                        mb: 2
                      }}>
                        {challenge.cols.slice(0, 4).map((colId, index) => {
                          const col = availableCols.find(c => c.id === colId);
                          return col ? (
                            <Chip 
                              key={colId}
                              label={col.name}
                              size="small"
                              variant="outlined"
                            />
                          ) : null;
                        })}
                        {challenge.cols.length > 4 && (
                          <Chip 
                            label={`+${challenge.cols.length - 4}`}
                            size="small"
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {challenge.participants} participants
                      </Typography>
                      
                      <Button 
                        variant="contained" 
                        fullWidth
                        onClick={() => loadChallenge(challenge)}
                      >
                        Charger ce défi
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Typography variant="h5" gutterBottom>
              Mes défis sauvegardés
            </Typography>
            
            <Grid container spacing={3}>
              {userChallenges.length > 0 ? (
                userChallenges.map((challenge) => (
                  <Grid item xs={12} md={6} key={challenge.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{challenge.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Créé le {new Date(challenge.createdAt).toLocaleDateString()}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {challenge.description}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Progression
                          </Typography>
                          <Box sx={{ 
                            height: 8,
                            bgcolor: 'grey.200',
                            borderRadius: 4,
                            overflow: 'hidden'
                          }}>
                            <Box sx={{ 
                              height: '100%',
                              width: `${challenge.progress}%`,
                              bgcolor: 'success.main',
                              transition: 'width 1s ease-in-out'
                            }} />
                          </Box>
                          <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                            {challenge.progress}% complété
                          </Typography>
                        </Box>
                        
                        <Stack direction="row" spacing={1}>
                          <Button 
                            variant="contained" 
                            fullWidth
                            onClick={() => loadChallenge(challenge)}
                          >
                            Continuer
                          </Button>
                          <IconButton color="primary">
                            <ShareIcon />
                          </IconButton>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    bgcolor: 'background.paper',
                    borderRadius: 2
                  }}>
                    <Typography variant="body1" color="text.secondary">
                      Vous n'avez pas encore de défis sauvegardés.
                    </Typography>
                    <Button 
                      variant="contained" 
                      sx={{ mt: 2 }}
                      onClick={() => setActiveTab(0)}
                    >
                      Créer mon premier défi
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        );
        
      case 3: // Sauvegarde/création de défi
        return (
          <ChallengeForm 
            selectedCols={selectedCols}
            currentChallenge={currentChallenge}
            onSave={saveChallenge}
            onCancel={() => setActiveTab(0)}
          />
        );
        
      default:
        return null;
    }
  };
  
  // Afficher un chargement si nécessaire
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '50vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, pb: 8 }}>
      <Box sx={{ 
        py: 5, 
        textAlign: { xs: 'center', md: 'left' },
        background: `linear-gradient(to right, ${theme.palette.primary.main}10, ${theme.palette.primary.light}10)`,
        borderRadius: 3,
        px: 3,
        mb: 4
      }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Les 7 Majeurs
        </Typography>
        <Typography variant="h6" component="p" sx={{ maxWidth: 800 }}>
          Créez votre propre défi en sélectionnant 7 cols emblématiques et rejoignez les cyclistes qui se lancent dans cette aventure unique.
        </Typography>
      </Box>
      
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        variant={isMobile ? "scrollable" : "standard"}
        scrollButtons={isMobile ? "auto" : false}
        allowScrollButtonsMobile
        sx={{ 
          mb: 4,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            minWidth: isMobile ? 'auto' : 160,
          }
        }}
      >
        <Tab label="Mon Défi" />
        <Tab label="Catalogue des Cols" />
        <Tab label="Défis Communautaires" />
        <Tab label="Sauvegarder" sx={{ display: 'none' }} /> {/* Onglet caché, accessible uniquement via un bouton */}
      </Tabs>
      
      {renderTabContent()}
      
      {/* Modales */}
      <ShareModal 
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title={currentChallenge?.name || "Mon défi des 7 Majeurs"}
        description={currentChallenge?.description || `Un défi personnalisé avec ${selectedCols.length} cols sélectionnés.`}
        url={`https://velo-altitude.com/challenges/shared/${currentChallenge?.id || 'preview'}`}
        image={selectedCols[0]?.images?.main || '/images/share-default.jpg'}
      />
    </Box>
  );
};

export default MajorChallengeHub;
