import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Skeleton,
  Button,
  Tabs,
  Tab,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  TrendingUp,
  Whatshot,
  Star,
  StarBorder,
  LocalOffer,
  Refresh,
  FilterAlt
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import useRecommendationApi from '../../hooks/useRecommendationApi';
import { useAuth } from '../../hooks/useAuth';
import { useSnackbar } from 'notistack';
import RecommendationFilterDialog from './RecommendationFilterDialog';

/**
 * Composant affichant les itinéraires recommandés
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.userId - ID de l'utilisateur (optionnel)
 * @param {number} props.limit - Nombre maximum d'itinéraires à afficher
 * @param {boolean} props.showTabs - Afficher les onglets de catégories
 * @param {boolean} props.showFilters - Afficher les filtres
 * @param {string} props.initialTab - Onglet initial à afficher
 * @param {Function} props.onRouteClick - Fonction appelée lors du clic sur un itinéraire
 */
const RouteRecommendations = ({
  userId,
  limit = 6,
  showTabs = true,
  showFilters = true,
  initialTab = 'personalized',
  onRouteClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const {
    getPersonalizedRecommendations,
    getTrendingRoutes,
    getSeasonalRecommendations,
    getFavoriteRoutes,
    toggleFavorite
  } = useRecommendationApi();

  // État local
  const [activeTab, setActiveTab] = useState(initialTab);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: [],
    distance: { min: 0, max: 200 },
    elevation: { min: 0, max: 3000 },
    surface: []
  });

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12
      }
    }
  };

  /**
   * Charge les itinéraires recommandés
   */
  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      setError(null);

      try {
        let result;

        switch (activeTab) {
          case 'personalized':
            result = await getPersonalizedRecommendations({
              userId: userId || (user ? user.userId : null),
              limit,
              ...filters
            });
            break;
          case 'trending':
            result = await getTrendingRoutes({
              limit,
              ...filters
            });
            break;
          case 'seasonal':
            result = await getSeasonalRecommendations({
              limit,
              ...filters
            });
            break;
          case 'favorites':
            result = await getFavoriteRoutes({
              userId: userId || (user ? user.userId : null),
              limit,
              ...filters
            });
            break;
          default:
            result = await getPersonalizedRecommendations({
              userId: userId || (user ? user.userId : null),
              limit,
              ...filters
            });
        }

        if (result.success) {
          setRoutes(result.data);
        } else {
          setError(result.message || 'Erreur lors du chargement des recommandations');
          enqueueSnackbar('Erreur lors du chargement des recommandations', { variant: 'error' });
        }
      } catch (err) {
        console.error('Erreur lors du chargement des recommandations:', err);
        setError('Erreur lors du chargement des recommandations');
        enqueueSnackbar('Erreur lors du chargement des recommandations', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [
    activeTab,
    limit,
    userId,
    user,
    filters,
    getPersonalizedRecommendations,
    getTrendingRoutes,
    getSeasonalRecommendations,
    getFavoriteRoutes,
    enqueueSnackbar
  ]);

  /**
   * Gère le changement d'onglet
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  /**
   * Gère le clic sur le bouton de favoris
   */
  const handleToggleFavorite = async (event, routeId) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      enqueueSnackbar('Vous devez être connecté pour ajouter un itinéraire aux favoris', { variant: 'warning' });
      return;
    }

    try {
      const result = await toggleFavorite(routeId);

      if (result.success) {
        // Mettre à jour l'état local
        setRoutes(routes.map(route =>
          route._id === routeId
            ? { ...route, isFavorite: !route.isFavorite }
            : route
        ));

        // Afficher un message de confirmation
        const action = result.data.isFavorite ? 'ajouté aux' : 'retiré des';
        enqueueSnackbar(`Itinéraire ${action} favoris`, { variant: 'success' });
      } else {
        enqueueSnackbar('Erreur lors de la modification des favoris', { variant: 'error' });
      }
    } catch (err) {
      console.error('Erreur lors de la modification des favoris:', err);
      enqueueSnackbar('Erreur lors de la modification des favoris', { variant: 'error' });
    }
  };

  /**
   * Gère l'ouverture du dialogue de filtres
   */
  const handleOpenFilterDialog = () => {
    setFilterDialogOpen(true);
  };

  /**
   * Gère la fermeture du dialogue de filtres
   */
  const handleCloseFilterDialog = () => {
    setFilterDialogOpen(false);
  };

  /**
   * Applique les filtres
   */
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setFilterDialogOpen(false);
  };

  /**
   * Réinitialise les filtres
   */
  const handleResetFilters = () => {
    setFilters({
      difficulty: [],
      distance: { min: 0, max: 200 },
      elevation: { min: 0, max: 3000 },
      surface: []
    });
  };

  /**
   * Vérifie si des filtres sont actifs
   */
  const hasActiveFilters = () => {
    return (
      filters.difficulty.length > 0 ||
      filters.surface.length > 0 ||
      filters.distance.min > 0 ||
      filters.distance.max < 200 ||
      filters.elevation.min > 0 ||
      filters.elevation.max < 3000
    );
  };

  /**
   * Rendu d'une carte d'itinéraire
   */
  const renderRouteCard = (route, index) => {
    return (
      <Grid item xs={12} sm={6} md={4} key={route._id}>
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          layout
        >
          <Card
            elevation={2}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
              }
            }}
          >
            <CardActionArea
              component={Link}
              to={`/routes/${route._id}`}
              onClick={() => onRouteClick && onRouteClick(route)}
              sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
            >
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="160"
                  image={route.imageUrl || '/images/default-route.jpg'}
                  alt={route.name}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1
                  }}
                >
                  <IconButton
                    aria-label="ajouter aux favoris"
                    onClick={(e) => handleToggleFavorite(e, route._id)}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.9)'
                      }
                    }}
                  >
                    {route.isFavorite ? (
                      <Favorite color="error" />
                    ) : (
                      <FavoriteBorder />
                    )}
                  </IconButton>
                </Box>
                {route.isNew && (
                  <Chip
                    label="Nouveau"
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      fontWeight: 'bold'
                    }}
                  />
                )}
                {route.isTrending && (
                  <Chip
                    label="Tendance"
                    icon={<TrendingUp fontSize="small" />}
                    color="secondary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: route.isNew ? 40 : 8,
                      left: 8,
                      fontWeight: 'bold'
                    }}
                  />
                )}
              </Box>

              <CardContent sx={{ flexGrow: 1, pb: 2 }}>
                <Typography variant="h6" component="h3" gutterBottom noWrap>
                  {route.name}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {route.averageRating ? (
                      <>
                        <Star sx={{ color: theme.palette.warning.main, mr: 0.5, fontSize: 18 }} />
                        <Typography variant="body2" component="span" fontWeight="medium">
                          {route.averageRating.toFixed(1)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                          ({route.reviewCount})
                        </Typography>
                      </>
                    ) : (
                      <>
                        <StarBorder sx={{ color: 'text.disabled', mr: 0.5, fontSize: 18 }} />
                        <Typography variant="body2" color="text.secondary">
                          Aucun avis
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                  <Chip
                    label={`${route.distance} km`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`${route.elevation} m`}
                    size="small"
                    variant="outlined"
                  />
                  {route.difficulty && (
                    <Chip
                      label={route.difficulty}
                      size="small"
                      variant="outlined"
                      color={
                        route.difficulty === 'Facile' ? 'success' :
                        route.difficulty === 'Modéré' ? 'info' :
                        route.difficulty === 'Difficile' ? 'warning' : 'error'
                      }
                    />
                  )}
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    mb: 1
                  }}
                >
                  {route.description}
                </Typography>

                {route.tags && route.tags.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {route.tags.slice(0, 3).map((tag, i) => (
                      <Chip
                        key={i}
                        label={tag}
                        size="small"
                        icon={<LocalOffer fontSize="small" />}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                    {route.tags.length > 3 && (
                      <Chip
                        label={`+${route.tags.length - 3}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                )}

                {route.reasonForRecommendation && (
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="caption" color="primary.main" fontStyle="italic">
                      {route.reasonForRecommendation}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        </motion.div>
      </Grid>
    );
  };

  /**
   * Rendu d'une carte de squelette pendant le chargement
   */
  const renderSkeletonCard = (index) => {
    return (
      <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
        <Card sx={{ height: '100%', borderRadius: 2 }}>
          <Skeleton variant="rectangular" height={160} />
          <CardContent>
            <Skeleton variant="text" height={32} width="80%" />
            <Skeleton variant="text" height={24} width="40%" sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <Skeleton variant="rounded" height={24} width={60} />
              <Skeleton variant="rounded" height={24} width={60} />
              <Skeleton variant="rounded" height={24} width={70} />
            </Box>
            <Skeleton variant="text" height={20} />
            <Skeleton variant="text" height={20} />
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
              <Skeleton variant="rounded" height={20} width={50} />
              <Skeleton variant="rounded" height={20} width={60} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box sx={{ mb: 4 }}>
      {showTabs && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
              sx={{
                '& .MuiTab-root': {
                  minWidth: isMobile ? 'auto' : 120,
                  px: isMobile ? 1 : 2
                }
              }}
            >
              <Tab
                value="personalized"
                label="Pour vous"
                icon={<Whatshot />}
                iconPosition="start"
                disabled={!user && !userId}
              />
              <Tab
                value="trending"
                label="Tendances"
                icon={<TrendingUp />}
                iconPosition="start"
              />
              <Tab
                value="seasonal"
                label="Saisonniers"
                icon={<LocalOffer />}
                iconPosition="start"
              />
              <Tab
                value="favorites"
                label="Favoris"
                icon={<Favorite />}
                iconPosition="start"
                disabled={!user && !userId}
              />
            </Tabs>

            {showFilters && (
              <Box>
                {hasActiveFilters() && (
                  <Tooltip title="Réinitialiser les filtres">
                    <IconButton
                      size="small"
                      onClick={handleResetFilters}
                      sx={{ mr: 1 }}
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                )}
                <Button
                  variant={hasActiveFilters() ? "contained" : "outlined"}
                  size="small"
                  startIcon={<FilterAlt />}
                  onClick={handleOpenFilterDialog}
                  color={hasActiveFilters() ? "primary" : "inherit"}
                >
                  Filtres
                  {hasActiveFilters() && (
                    <Chip
                      label={
                        filters.difficulty.length +
                        filters.surface.length +
                        (filters.distance.min > 0 || filters.distance.max < 200 ? 1 : 0) +
                        (filters.elevation.min > 0 || filters.elevation.max < 3000 ? 1 : 0)
                      }
                      size="small"
                      color="primary"
                      sx={{
                        ml: 1,
                        height: 20,
                        minWidth: 20,
                        fontSize: '0.75rem',
                        bgcolor: 'background.paper',
                        color: 'primary.main'
                      }}
                    />
                  )}
                </Button>
              </Box>
            )}
          </Box>
          <Divider />
        </Box>
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          <Grid container spacing={3}>
            {[...Array(limit)].map((_, index) => renderSkeletonCard(index))}
          </Grid>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => setActiveTab(activeTab)}
              sx={{ mt: 2 }}
            >
              Réessayer
            </Button>
          </Box>
        ) : routes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {activeTab === 'favorites'
                ? "Vous n'avez pas encore d'itinéraires favoris"
                : activeTab === 'personalized'
                  ? "Nous n'avons pas encore de recommandations personnalisées pour vous"
                  : "Aucun itinéraire trouvé"}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {activeTab === 'favorites'
                ? "Ajoutez des itinéraires à vos favoris pour les retrouver ici"
                : activeTab === 'personalized'
                  ? "Explorez et notez des itinéraires pour recevoir des recommandations adaptées à vos préférences"
                  : hasActiveFilters()
                    ? "Essayez de modifier vos filtres pour voir plus de résultats"
                    : "Revenez plus tard pour découvrir de nouveaux itinéraires"}
            </Typography>
            {hasActiveFilters() && (
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleResetFilters}
                sx={{ mt: 1 }}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </Box>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <Grid container spacing={3}>
              {routes.map(renderRouteCard)}
            </Grid>
          </motion.div>
        )}
      </AnimatePresence>

      <RecommendationFilterDialog
        open={filterDialogOpen}
        onClose={handleCloseFilterDialog}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />
    </Box>
  );
};

export default RouteRecommendations;
