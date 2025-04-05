import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Rating, 
  Avatar, 
  Button, 
  Chip,
  CircularProgress,
  Pagination,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  ThumbUp, 
  ThumbUpOutlined, 
  Flag, 
  Sort, 
  FilterList,
  AccessTime
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';
import { useSnackbar } from 'notistack';
import ReviewSortMenu from './ReviewSortMenu';
import ReviewFilterMenu from './ReviewFilterMenu';
import ReviewReportDialog from './ReviewReportDialog';
import { motion, AnimatePresence } from 'framer-motion';
import useReviewApi from '../../hooks/useReviewApi';

/**
 * Composant pour afficher la liste des avis sur un itinéraire
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.routeId - ID de l'itinéraire
 * @param {Function} props.onAddReview - Fonction appelée lorsque l'utilisateur souhaite ajouter un avis
 * @param {boolean} props.showAddButton - Afficher le bouton d'ajout d'avis
 * @param {number} props.maxItems - Nombre maximum d'avis à afficher (pagination côté client)
 * @param {boolean} props.compact - Mode compact pour l'affichage dans des cartes
 */
const RouteReviewList = ({ 
  routeId, 
  onAddReview, 
  showAddButton = true, 
  maxItems = 5,
  compact = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { 
    getRouteReviews, 
    likeReview, 
    reportReview 
  } = useReviewApi();
  
  // État local
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('date_desc');
  const [filters, setFilters] = useState({
    minRating: 0,
    maxRating: 5,
    hasComments: false
  });
  
  // État pour les menus et dialogues
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // Animations
  const listVariants = {
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
   * Charge les avis pour l'itinéraire
   */
  const loadReviews = useCallback(async () => {
    if (!routeId) return;
    
    setLoading(true);
    try {
      // Préparer les paramètres de requête
      const params = {
        page,
        limit: maxItems,
        sort: sortBy,
        ...filters
      };
      
      const result = await getRouteReviews(routeId, params);
      
      if (result.success) {
        setReviews(result.data);
        setTotalPages(Math.ceil(result.pagination.total / maxItems));
      } else {
        setError('Impossible de charger les avis');
        enqueueSnackbar('Erreur lors du chargement des avis', { variant: 'error' });
      }
    } catch (err) {
      setError('Erreur lors du chargement des avis');
      enqueueSnackbar('Erreur lors du chargement des avis', { variant: 'error' });
      console.error('Erreur lors du chargement des avis:', err);
    } finally {
      setLoading(false);
    }
  }, [routeId, page, maxItems, sortBy, filters, getRouteReviews, enqueueSnackbar]);

  // Charger les avis au montage et lorsque les dépendances changent
  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  /**
   * Gère le clic sur le bouton "J'aime"
   */
  const handleLike = async (reviewId) => {
    if (!user) {
      enqueueSnackbar('Vous devez être connecté pour aimer un avis', { variant: 'warning' });
      return;
    }
    
    try {
      const result = await likeReview(reviewId);
      
      if (result.success) {
        // Mettre à jour l'état local
        setReviews(reviews.map(review => 
          review._id === reviewId 
            ? { 
                ...review, 
                likes: result.data.likes,
                liked: result.data.liked
              } 
            : review
        ));
        
        // Afficher un message de confirmation
        const action = result.data.liked ? 'ajouté' : 'retiré';
        enqueueSnackbar(`J'aime ${action} avec succès`, { variant: 'success' });
      } else {
        enqueueSnackbar('Erreur lors de l\'ajout du j\'aime', { variant: 'error' });
      }
    } catch (err) {
      enqueueSnackbar('Erreur lors de l\'ajout du j\'aime', { variant: 'error' });
      console.error('Erreur lors de l\'ajout du j\'aime:', err);
    }
  };

  /**
   * Ouvre le dialogue de signalement
   */
  const handleOpenReportDialog = (review) => {
    if (!user) {
      enqueueSnackbar('Vous devez être connecté pour signaler un avis', { variant: 'warning' });
      return;
    }
    
    setSelectedReview(review);
    setReportDialogOpen(true);
  };

  /**
   * Soumet un signalement
   */
  const handleSubmitReport = async (reason) => {
    if (!selectedReview) return;
    
    try {
      const result = await reportReview(selectedReview._id, reason);
      
      if (result.success) {
        enqueueSnackbar('Avis signalé avec succès', { variant: 'success' });
        
        // Si l'avis a été modéré automatiquement, le masquer
        if (result.data.moderated) {
          setReviews(reviews.filter(review => review._id !== selectedReview._id));
        }
      } else {
        enqueueSnackbar(result.message || 'Erreur lors du signalement', { 
          variant: result.message.includes('déjà signalé') ? 'info' : 'error' 
        });
      }
    } catch (err) {
      enqueueSnackbar('Erreur lors du signalement', { variant: 'error' });
      console.error('Erreur lors du signalement:', err);
    } finally {
      setReportDialogOpen(false);
      setSelectedReview(null);
    }
  };

  /**
   * Gère le changement de page
   */
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  /**
   * Ouvre le menu de tri
   */
  const handleOpenSortMenu = (event) => {
    setSortMenuAnchor(event.currentTarget);
  };

  /**
   * Ferme le menu de tri
   */
  const handleCloseSortMenu = () => {
    setSortMenuAnchor(null);
  };

  /**
   * Applique un tri
   */
  const handleApplySort = (sortValue) => {
    setSortBy(sortValue);
    setSortMenuAnchor(null);
  };

  /**
   * Ouvre le menu de filtres
   */
  const handleOpenFilterMenu = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  /**
   * Ferme le menu de filtres
   */
  const handleCloseFilterMenu = () => {
    setFilterMenuAnchor(null);
  };

  /**
   * Applique des filtres
   */
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setFilterMenuAnchor(null);
    setPage(1); // Réinitialiser la pagination
  };

  /**
   * Rendu d'un avis individuel
   */
  const renderReview = (review) => {
    const isUserReview = user && review.user._id === user.userId;
    const formattedDate = formatDistanceToNow(new Date(review.createdAt), { 
      addSuffix: true, 
      locale: fr 
    });
    
    return (
      <motion.div
        key={review._id}
        variants={itemVariants}
        layout
      >
        <Paper 
          elevation={compact ? 0 : 1} 
          sx={{ 
            p: compact ? 1 : 2, 
            mb: 2, 
            borderRadius: 2,
            backgroundColor: compact ? 'transparent' : 'background.paper',
            border: compact ? 'none' : `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <Avatar 
              src={review.user.profilePicture} 
              alt={`${review.user.firstName} ${review.user.lastName}`}
              sx={{ mr: 2, width: compact ? 32 : 40, height: compact ? 32 : 40 }}
            >
              {review.user.firstName.charAt(0)}{review.user.lastName.charAt(0)}
            </Avatar>
            
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography 
                  variant={compact ? "body2" : "body1"} 
                  component="span" 
                  fontWeight="bold"
                  sx={{ mr: 1 }}
                >
                  {review.user.firstName} {review.user.lastName}
                </Typography>
                
                {isUserReview && (
                  <Chip 
                    label="Votre avis" 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ mr: 1, height: 20 }}
                  />
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                  <Tooltip title={new Date(review.createdAt).toLocaleString()}>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', fontSize: compact ? 12 : 14 }}>
                      <AccessTime fontSize="small" sx={{ mr: 0.5, fontSize: compact ? 14 : 16 }} />
                      {formattedDate}
                    </Box>
                  </Tooltip>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, mb: 1 }}>
                <Rating 
                  value={review.rating} 
                  readOnly 
                  size={compact ? "small" : "medium"}
                  precision={0.5}
                />
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ ml: 1 }}
                >
                  {review.rating.toFixed(1)}
                </Typography>
              </Box>
              
              {review.comment && (
                <Typography 
                  variant={compact ? "body2" : "body1"} 
                  color="text.primary"
                  sx={{ 
                    mt: 1,
                    mb: 1,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line'
                  }}
                >
                  {review.comment}
                </Typography>
              )}
              
              {!compact && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  {review.difficultyRating && (
                    <Chip 
                      label={`Difficulté: ${review.difficultyRating}/5`} 
                      size="small" 
                      color="default"
                      variant="outlined"
                    />
                  )}
                  {review.sceneryRating && (
                    <Chip 
                      label={`Paysage: ${review.sceneryRating}/5`} 
                      size="small" 
                      color="default"
                      variant="outlined"
                    />
                  )}
                  {review.surfaceRating && (
                    <Chip 
                      label={`Surface: ${review.surfaceRating}/5`} 
                      size="small" 
                      color="default"
                      variant="outlined"
                    />
                  )}
                  {review.trafficRating && (
                    <Chip 
                      label={`Trafic: ${review.trafficRating}/5`} 
                      size="small" 
                      color="default"
                      variant="outlined"
                    />
                  )}
                </Box>
              )}
            </Box>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: compact ? 1 : 2
          }}>
            <Button
              size="small"
              startIcon={review.liked ? <ThumbUp /> : <ThumbUpOutlined />}
              onClick={() => handleLike(review._id)}
              color={review.liked ? "primary" : "default"}
              variant="text"
              sx={{ 
                minWidth: compact ? 'auto' : undefined,
                fontSize: compact ? 12 : undefined
              }}
            >
              {review.likes > 0 && review.likes}
            </Button>
            
            {!isUserReview && (
              <Button
                size="small"
                startIcon={<Flag />}
                onClick={() => handleOpenReportDialog(review)}
                color="default"
                variant="text"
                sx={{ 
                  minWidth: compact ? 'auto' : undefined,
                  fontSize: compact ? 12 : undefined
                }}
              >
                {compact ? '' : 'Signaler'}
              </Button>
            )}
          </Box>
        </Paper>
      </motion.div>
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant={compact ? "h6" : "h5"} component="h2">
          Avis {reviews.length > 0 && `(${reviews.length})`}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!compact && (
            <>
              <Tooltip title="Trier les avis">
                <IconButton 
                  size="small" 
                  onClick={handleOpenSortMenu}
                  color={sortMenuAnchor ? "primary" : "default"}
                >
                  <Sort />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Filtrer les avis">
                <IconButton 
                  size="small" 
                  onClick={handleOpenFilterMenu}
                  color={filterMenuAnchor ? "primary" : "default"}
                >
                  <FilterList />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          {showAddButton && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={onAddReview}
              size={compact || isMobile ? "small" : "medium"}
            >
              Ajouter un avis
            </Button>
          )}
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }} 
            onClick={loadReviews}
          >
            Réessayer
          </Button>
        </Paper>
      ) : reviews.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
          <Typography>Aucun avis pour le moment</Typography>
          {showAddButton && (
            <Button 
              variant="outlined" 
              sx={{ mt: 2 }} 
              onClick={onAddReview}
            >
              Soyez le premier à donner votre avis
            </Button>
          )}
        </Paper>
      ) : (
        <>
          <AnimatePresence>
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {reviews.map(renderReview)}
            </motion.div>
          </AnimatePresence>
          
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange}
                color="primary"
                size={compact || isMobile ? "small" : "medium"}
              />
            </Box>
          )}
        </>
      )}
      
      {/* Menus et dialogues */}
      <ReviewSortMenu 
        anchorEl={sortMenuAnchor}
        onClose={handleCloseSortMenu}
        onApply={handleApplySort}
        currentSort={sortBy}
      />
      
      <ReviewFilterMenu 
        anchorEl={filterMenuAnchor}
        onClose={handleCloseFilterMenu}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />
      
      <ReviewReportDialog 
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        onSubmit={handleSubmitReport}
        reviewId={selectedReview?._id}
      />
    </Box>
  );
};

export default RouteReviewList;
