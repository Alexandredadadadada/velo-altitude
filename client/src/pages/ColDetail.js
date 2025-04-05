import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Grid, 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Divider, 
  Chip, 
  Button, 
  IconButton,
  Paper, 
  Tabs, 
  Tab,
  CircularProgress,
  Alert,
  AlertTitle,
  useMediaQuery
} from '@mui/material';
import { 
  Terrain as TerrainIcon,
  DirectionsBike as BikeIcon,
  Straighten as LengthIcon, 
  Speed as SpeedIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Star as StarIcon,
  Image as ImageIcon,
  Comment as CommentIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Map as MapIcon,
  Cloud as CloudIcon,
  Navigation as NavigationIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getColDetailById, getColWeather } from '../services/colsService';
import ColReviews from '../components/cols/ColReviews';
import ColGallery from '../components/cols/ColGallery';
import ColWeather from '../components/cols/ColWeather';
import ColMap from '../components/cols/ColMap';
import { useAuth } from '../contexts/AuthContext';

/**
 * Page de détail d'un col cycliste
 */
const ColDetail = () => {
  const { colId } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Référence pour le scroll vers les sections
  const reviewsRef = useRef(null);
  const galleryRef = useRef(null);
  const weatherRef = useRef(null);
  const mapRef = useRef(null);
  
  // États pour les données du col
  const [col, setCol] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Charger les détails du col
  useEffect(() => {
    const fetchColDetails = async () => {
      try {
        setLoading(true);
        
        // Récupérer les détails du col
        const colData = await getColDetailById(colId);
        setCol(colData);
        
        // Récupérer les données météo
        const weatherData = await getColWeather(colId);
        setWeather(weatherData);
        
        // Vérifier si le col est dans les favoris de l'utilisateur
        if (user && user.favoritesCols) {
          setIsFavorite(user.favoritesCols.includes(colId));
        }
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des détails du col:', err);
        setError('Impossible de charger les détails du col. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    if (colId) {
      fetchColDetails();
    }
  }, [colId, user]);
  
  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Ajouter/Retirer des favoris
  const toggleFavorite = async () => {
    if (!user) {
      // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
      navigate('/login', { state: { from: `/cols/${colId}` } });
      return;
    }
    
    try {
      // Appel à l'API pour ajouter/retirer le col des favoris
      const response = await fetch(`/api/users/${user.id}/favorites/cols/${colId}`, {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        setIsFavorite(!isFavorite);
      } else {
        console.error('Erreur lors de la mise à jour des favoris');
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour des favoris:', err);
    }
  };
  
  // Formater l'affichage de la difficulté
  const renderDifficultyStars = (difficulty) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <StarIcon 
          key={i} 
          fontSize="small" 
          sx={{ 
            color: i <= difficulty ? 'warning.main' : 'text.disabled'
          }} 
        />
      );
    }
    return (
      <Box display="flex" alignItems="center">
        {stars}
      </Box>
    );
  };
  
  // Obtenir la couleur correspondant à la difficulté
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 1:
        return theme.palette.success.main;
      case 2:
        return theme.palette.success.dark;
      case 3:
        return theme.palette.warning.main;
      case 4:
        return theme.palette.warning.dark;
      case 5:
        return theme.palette.error.main;
      default:
        return theme.palette.info.main;
    }
  };
  
  // Scroll vers une section
  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress />
      </Box>
    );
  }
  
  // Afficher un message d'erreur si nécessaire
  if (error || !col) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          <AlertTitle>Erreur</AlertTitle>
          {error || "Col introuvable"}
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/cols')}
        >
          Retour au catalogue
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête du col */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        mb={4}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom>
              {col.name}
            </Typography>
            
            <Box display="flex" alignItems="center" mb={1} flexWrap="wrap">
              {renderDifficultyStars(col.difficulty)}
              <Chip 
                label={`${col.difficulty}/5`} 
                size="small" 
                sx={{ 
                  ml: 1, 
                  bgcolor: getDifficultyColor(col.difficulty),
                  color: 'white'
                }} 
              />
              
              <Box display="flex" alignItems="center" ml={2}>
                <Typography variant="body2" color="text.secondary">
                  {col.location?.region}, {col.location?.country}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
              <Button 
                variant="outlined" 
                startIcon={isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                onClick={toggleFavorite}
              >
                {isFavorite ? 'Favori' : 'Ajouter aux favoris'}
              </Button>
              
              <Button 
                variant="outlined" 
                startIcon={<ShareIcon />}
                onClick={() => {
                  navigator.share && navigator.share({
                    title: `Col du ${col.name}`,
                    text: `Découvrez le col du ${col.name} sur Dashboard Cycliste Européen`,
                    url: window.location.href
                  })
                }}
              >
                Partager
              </Button>
              
              <Button 
                variant="outlined" 
                startIcon={<NavigationIcon />}
                href={`https://www.google.com/maps/dir/?api=1&destination=${col.location?.coordinates?.latitude},${col.location?.coordinates?.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Itinéraire
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box display="flex" justifyContent={isMobile ? 'flex-start' : 'flex-end'}>
              <Card elevation={3} sx={{ width: '100%', maxWidth: 400 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Statistiques clés
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center">
                        <TerrainIcon sx={{ color: 'primary.main', mr: 1 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Altitude
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {col.statistics.summit_elevation} m
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center">
                        <LengthIcon sx={{ color: 'primary.main', mr: 1 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Longueur
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {col.statistics.length} km
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center">
                        <BikeIcon sx={{ color: 'primary.main', mr: 1 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Dénivelé
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {col.statistics.elevation_gain} m
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center">
                        <SpeedIcon sx={{ color: 'primary.main', mr: 1 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Pente moyenne
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {col.statistics.avg_gradient}%
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {/* Navigation par onglets pour mobile et tablette */}
      {(isMobile || isTablet) && (
        <Box sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="col details tabs"
          >
            <Tab icon={<InfoIcon />} label="Infos" />
            <Tab icon={<MapIcon />} label="Carte" />
            <Tab icon={<ImageIcon />} label="Photos" />
            <Tab icon={<CommentIcon />} label="Avis" />
            <Tab icon={<CloudIcon />} label="Météo" />
          </Tabs>
        </Box>
      )}
      
      {/* Contenu principal */}
      <Grid container spacing={4}>
        {/* Affichage sur desktop: colonne gauche (70%) */}
        {!isMobile && !isTablet && (
          <Grid item xs={12} md={8}>
            {/* Description et infos générales */}
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Description
              </Typography>
              
              <Typography variant="body1" paragraph>
                {col.description || "Pas de description disponible pour ce col."}
              </Typography>
              
              {col.history && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Histoire et faits marquants
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    {col.history}
                  </Typography>
                </>
              )}
              
              {col.tipsAndAdvice && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Conseils pratiques
                  </Typography>
                  
                  <Typography variant="body1">
                    {col.tipsAndAdvice}
                  </Typography>
                </>
              )}
            </Paper>
            
            {/* Carte */}
            <Box ref={mapRef} id="map-section">
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Carte et profil d'élévation
                </Typography>
                
                <ColMap col={col} />
              </Paper>
            </Box>
            
            {/* Galerie photos */}
            <Box ref={galleryRef} id="gallery-section">
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Galerie photos
                </Typography>
                
                <ColGallery colId={col.id} initialPhotos={col.images || []} />
              </Paper>
            </Box>
            
            {/* Avis et commentaires */}
            <Box ref={reviewsRef} id="reviews-section">
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Avis et commentaires
                </Typography>
                
                <ColReviews colId={col.id} initialReviews={col.reviews || []} />
              </Paper>
            </Box>
          </Grid>
        )}
        
        {/* Affichage mobile/tablette: contenu en fonction de l'onglet actif */}
        {(isMobile || isTablet) && (
          <Grid item xs={12}>
            {activeTab === 0 && (
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Description
                </Typography>
                
                <Typography variant="body1" paragraph>
                  {col.description || "Pas de description disponible pour ce col."}
                </Typography>
                
                {col.history && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Histoire et faits marquants
                    </Typography>
                    
                    <Typography variant="body1" paragraph>
                      {col.history}
                    </Typography>
                  </>
                )}
                
                {col.tipsAndAdvice && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Conseils pratiques
                    </Typography>
                    
                    <Typography variant="body1">
                      {col.tipsAndAdvice}
                    </Typography>
                  </>
                )}
              </Paper>
            )}
            
            {activeTab === 1 && (
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Carte et profil d'élévation
                </Typography>
                
                <ColMap col={col} />
              </Paper>
            )}
            
            {activeTab === 2 && (
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Galerie photos
                </Typography>
                
                <ColGallery colId={col.id} initialPhotos={col.images || []} />
              </Paper>
            )}
            
            {activeTab === 3 && (
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Avis et commentaires
                </Typography>
                
                <ColReviews colId={col.id} initialReviews={col.reviews || []} />
              </Paper>
            )}
            
            {activeTab === 4 && (
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Météo
                </Typography>
                
                <ColWeather colId={col.id} weatherData={weather} />
              </Paper>
            )}
          </Grid>
        )}
        
        {/* Affichage sur desktop: colonne droite (30%) */}
        {!isMobile && !isTablet && (
          <Grid item xs={12} md={4}>
            {/* Carte de météo */}
            <Box ref={weatherRef} id="weather-section">
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Météo
                </Typography>
                
                <ColWeather colId={col.id} weatherData={weather} />
              </Paper>
            </Box>
            
            {/* Informations pratiques */}
            {col.practicalInfo && (
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Informations pratiques
                </Typography>
                
                <Grid container spacing={2}>
                  {col.practicalInfo.bestTimeToVisit && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Meilleure période
                      </Typography>
                      <Typography variant="body2">
                        {col.practicalInfo.bestTimeToVisit}
                      </Typography>
                      <Divider sx={{ my: 1.5 }} />
                    </Grid>
                  )}
                  
                  {col.practicalInfo.road_condition && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        État de la route
                      </Typography>
                      <Typography variant="body2">
                        {col.practicalInfo.road_condition}
                      </Typography>
                      <Divider sx={{ my: 1.5 }} />
                    </Grid>
                  )}
                  
                  {col.practicalInfo.traffic_level && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Niveau de trafic
                      </Typography>
                      <Typography variant="body2">
                        {col.practicalInfo.traffic_level}
                      </Typography>
                      <Divider sx={{ my: 1.5 }} />
                    </Grid>
                  )}
                  
                  {col.practicalInfo.water_sources && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Points d'eau
                      </Typography>
                      <Typography variant="body2">
                        {col.practicalInfo.water_sources}
                      </Typography>
                      <Divider sx={{ my: 1.5 }} />
                    </Grid>
                  )}
                  
                  {col.practicalInfo.restaurants && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Restauration
                      </Typography>
                      <Typography variant="body2">
                        {col.practicalInfo.restaurants}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            )}
            
            {/* Segments */}
            {col.segments && col.segments.length > 0 && (
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Segments
                </Typography>
                
                {col.segments.map((segment, index) => (
                  <Box key={index} sx={{ mb: index < col.segments.length - 1 ? 2 : 0 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {segment.name}
                    </Typography>
                    
                    <Grid container spacing={1} sx={{ mt: 0.5 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Distance:
                        </Typography>
                        <Typography variant="body2">
                          {segment.length} km
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Dénivelé:
                        </Typography>
                        <Typography variant="body2">
                          {segment.elevation_gain} m
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Pente moy:
                        </Typography>
                        <Typography variant="body2">
                          {segment.avg_gradient}%
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Pente max:
                        </Typography>
                        <Typography variant="body2">
                          {segment.max_gradient}%
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {index < col.segments.length - 1 && <Divider sx={{ my: 2 }} />}
                  </Box>
                ))}
              </Paper>
            )}
            
            {/* Navigation rapide pour desktop */}
            <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 24 }}>
              <Typography variant="h6" gutterBottom>
                Navigation rapide
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={1}>
                <Button 
                  variant="text" 
                  startIcon={<MapIcon />} 
                  onClick={() => scrollToSection(mapRef)}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Carte
                </Button>
                
                <Button 
                  variant="text" 
                  startIcon={<ImageIcon />} 
                  onClick={() => scrollToSection(galleryRef)}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Photos
                </Button>
                
                <Button 
                  variant="text" 
                  startIcon={<CommentIcon />} 
                  onClick={() => scrollToSection(reviewsRef)}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Avis et commentaires
                </Button>
                
                <Button 
                  variant="text" 
                  startIcon={<CloudIcon />} 
                  onClick={() => scrollToSection(weatherRef)}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Météo
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default ColDetail;
