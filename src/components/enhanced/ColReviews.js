import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Rating, 
  Avatar, 
  Paper, 
  Divider,
  List,
  ListItem,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from '@mui/material';
import { 
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Composant pour afficher et gérer les avis sur un col
 */
const ColReviews = ({ colId, initialReviews = [] }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'success' });
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  
  // Charger les avis si pas fournis initialement
  useEffect(() => {
    if (initialReviews.length === 0) {
      fetchReviews();
    }
  }, [colId, initialReviews]);
  
  // Récupérer les avis et commentaires
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/passes/cols/${colId}/reviews`);
      setReviews(response.data.reviews || []);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des avis:', err);
      setError('Impossible de charger les avis. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };
  
  // Mettre à jour le contenu du nouveau commentaire
  const handleCommentChange = (event) => {
    setNewReview(prev => ({ ...prev, comment: event.target.value }));
  };
  
  // Mettre à jour la note
  const handleRatingChange = (event, newValue) => {
    setNewReview(prev => ({ ...prev, rating: newValue }));
  };
  
  // Soumettre un nouvel avis
  const handleSubmitReview = async () => {
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      setLoginDialogOpen(true);
      return;
    }
    
    // Vérifier si l'avis est valide
    if (!newReview.rating) {
      setNotification({
        open: true,
        message: 'Veuillez attribuer une note avant de soumettre',
        type: 'error'
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const reviewData = {
        rating: newReview.rating,
        comment: newReview.comment.trim() || null
      };
      
      const response = await axios.post(`/api/passes/cols/${colId}/reviews`, reviewData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      // Ajouter le nouvel avis à la liste
      setReviews(prev => [response.data.review, ...prev]);
      
      // Réinitialiser le formulaire
      setNewReview({ rating: 0, comment: '' });
      
      // Afficher une notification
      setNotification({
        open: true,
        message: 'Votre avis a été publié avec succès',
        type: 'success'
      });
    } catch (err) {
      console.error('Erreur lors de la soumission de l\'avis:', err);
      setNotification({
        open: true,
        message: 'Erreur lors de la publication de votre avis',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Fermer la boîte de dialogue de connexion
  const handleCloseLoginDialog = () => {
    setLoginDialogOpen(false);
  };
  
  // Calculer la note moyenne
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;
  
  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Générer le résumé des notes
  const renderRatingSummary = () => {
    const ratingCounts = [0, 0, 0, 0, 0]; // Index 0 = 1 étoile, 4 = 5 étoiles
    
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingCounts[review.rating - 1]++;
      }
    });
    
    return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "SportsActivity",
          "name": "{col.name}",
          "description": "{col.description}",
          "url": "https://velo-altitude.com/colreviews"
        }
      </script>
      <EnhancedMetaTags
        title="Détail du Col | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Box textAlign="center">
            <Typography variant="h3" component="span">
              {averageRating}
            </Typography>
            <Typography variant="h6" component="span" color="text.secondary">
              /5
            </Typography>
          </Box>
          
          <Box>
            <Rating 
              value={parseFloat(averageRating)} 
              precision={0.1} 
              readOnly 
              sx={{ mb: 0.5 }}
            />
            <Typography variant="body2" color="text.secondary">
              Basé sur {reviews.length} avis
            </Typography>
          </Box>
        </Stack>
        
        <Stack spacing={0.5}>
          {[5, 4, 3, 2, 1].map(rating => {
            const count = ratingCounts[rating - 1];
            const percentage = reviews.length > 0 
              ? Math.round((count / reviews.length) * 100) 
              : 0;
            
            return (
              <Stack 
                key={rating} 
                direction="row" 
                spacing={1} 
                alignItems="center"
              >
                <Typography variant="body2" sx={{ width: 20 }}>
                  {rating}
                </Typography>
                <StarIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                <Box 
                  sx={{ 
                    flexGrow: 1, 
                    bgcolor: 'background.paper',
                    height: 8,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box 
                    sx={{ 
                      width: `${percentage}%`, 
                      bgcolor: 'warning.main',
                      height: '100%',
                      borderRadius: '4px 0 0 4px',
                      transition: 'width 0.5s ease-in-out'
                    }} 
                  />
                </Box>
                <Typography variant="body2" sx={{ minWidth: 36 }}>
                  {percentage}%
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Box>
    );
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      {/* Résumé des notes */}
      {renderRatingSummary()}
      
      {/* Formulaire pour ajouter un avis */}
      <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Partagez votre expérience
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Votre note *
          </Typography>
          <Rating
            name="rating"
            value={newReview.rating}
            onChange={handleRatingChange}
            precision={1}
            size="large"
            emptyIcon={<StarBorderIcon fontSize="inherit" />}
          />
        </Box>
        
        <TextField
          label="Votre commentaire (optionnel)"
          placeholder="Partagez votre expérience et vos conseils pour ce col..."
          multiline
          rows={4}
          fullWidth
          variant="outlined"
          value={newReview.comment}
          onChange={handleCommentChange}
          sx={{ mb: 2 }}
        />
        
        <Button
          variant="contained"
          color="primary"
          endIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          onClick={handleSubmitReview}
          disabled={submitting}
        >
          {submitting ? 'Envoi en cours...' : 'Publier'}
        </Button>
      </Paper>
      
      {/* Liste des avis */}
      <Typography variant="h6" gutterBottom>
        {reviews.length} avis
      </Typography>
      
      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {!loading && reviews.length === 0 && (
        <Paper 
          elevation={0} 
          variant="outlined" 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            bgcolor: 'background.default'
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Aucun avis pour l'instant. Soyez le premier à partager votre expérience !
          </Typography>
        </Paper>
      )}
      
      <List sx={{ mt: 1 }}>
        {reviews.map((review, index) => (
          <React.Fragment key={review.id || index}>
            <ListItem 
              alignItems="flex-start" 
              sx={{ 
                px: 0, 
                py: 2,
                flexDirection: 'column'
              }}
            >
              <Box display="flex" width="100%" mb={1}>
                <Avatar 
                  src={review.userAvatar} 
                  alt={review.userName || 'Utilisateur'}
                  sx={{ mr: 2 }}
                >
                  {(review.userName || 'U')[0].toUpperCase()}
                </Avatar>
                
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {review.userName || 'Utilisateur anonyme'}
                  </Typography>
                  
                  <Box display="flex" alignItems="center">
                    <Rating 
                      value={review.rating} 
                      readOnly 
                      size="small" 
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(review.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {review.comment && (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    pl: 7, 
                    pr: 2,
                    whiteSpace: 'pre-line'
                  }}
                >
                  {review.comment}
                </Typography>
              )}
            </ListItem>
            
            {index < reviews.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
      
      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.type}
          elevation={6} 
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
      
      {/* Dialogue pour se connecter */}
      <Dialog
        open={loginDialogOpen}
        onClose={handleCloseLoginDialog}
      >
        <DialogTitle>Connexion requise</DialogTitle>
        <DialogContent>
          <Typography>
            Vous devez être connecté pour publier un avis.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLoginDialog}>Annuler</Button>
          <Button 
            variant="contained"
            color="primary"
            component="a"
            href="/login"
          >
            Se connecter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ColReviews;
