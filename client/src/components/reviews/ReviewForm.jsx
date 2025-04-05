import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Rating,
  TextField,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Slide,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentSatisfied,
  SentimentSatisfiedAlt,
  SentimentVerySatisfied,
  DirectionsBike,
  Landscape,
  Traffic,
  Terrain
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../hooks/useAuth';
import useReviewApi from '../../hooks/useReviewApi';

// Style pour les icônes de notation
const StyledRating = styled(Rating)(({ theme }) => ({
  '& .MuiRating-iconFilled': {
    color: theme.palette.primary.main,
  },
  '& .MuiRating-iconEmpty': {
    color: theme.palette.action.disabled,
  },
}));

// Labels pour les étoiles d'évaluation générale
const labels = {
  1: 'Très déçu',
  2: 'Déçu',
  3: 'Correct',
  4: 'Satisfait',
  5: 'Très satisfait',
};

// Composant pour la transition du dialogue
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Formulaire d'ajout ou de modification d'un avis
 * 
 * @param {Object} props - Propriétés du composant
 * @param {boolean} props.open - Indique si le dialogue est ouvert
 * @param {Function} props.onClose - Fonction appelée à la fermeture du dialogue
 * @param {Function} props.onSubmitSuccess - Fonction appelée après soumission réussie
 * @param {string} props.routeId - ID de l'itinéraire concerné
 * @param {Object} props.review - Avis existant (pour modification)
 * @param {string} props.routeName - Nom de l'itinéraire (optionnel)
 */
const ReviewForm = ({
  open,
  onClose,
  onSubmitSuccess,
  routeId,
  review,
  routeName
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { addReview, updateReview } = useReviewApi();

  // État du formulaire
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    difficultyRating: 0,
    sceneryRating: 0,
    surfaceRating: 0,
    trafficRating: 0,
    completedRoute: false
  });

  // État pour la gestion des erreurs et du chargement
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const maxCharCount = 1000;

  // Initialiser le formulaire avec les données de l'avis existant (si disponible)
  useEffect(() => {
    if (review) {
      setFormData({
        rating: review.rating || 0,
        comment: review.comment || '',
        difficultyRating: review.difficultyRating || 0,
        sceneryRating: review.sceneryRating || 0,
        surfaceRating: review.surfaceRating || 0,
        trafficRating: review.trafficRating || 0,
        completedRoute: review.completedRoute || false
      });
      setCharCount(review.comment ? review.comment.length : 0);
    } else {
      // Réinitialiser le formulaire
      setFormData({
        rating: 0,
        comment: '',
        difficultyRating: 0,
        sceneryRating: 0,
        surfaceRating: 0,
        trafficRating: 0,
        completedRoute: false
      });
      setCharCount(0);
    }
    setError(null);
  }, [review, open]);

  // Gestion des changements dans le formulaire
  const handleChange = (field) => (event) => {
    const value = event.target ? event.target.value : event;
    
    setFormData({
      ...formData,
      [field]: value
    });

    if (field === 'comment') {
      setCharCount(event.target.value.length);
    }
  };

  // Gestion du changement de la case à cocher
  const handleCheckboxChange = (event) => {
    setFormData({
      ...formData,
      completedRoute: event.target.checked
    });
  };

  // Validation du formulaire
  const validateForm = () => {
    if (formData.rating === 0) {
      setError('Veuillez attribuer une note globale');
      return false;
    }
    
    if (formData.comment && formData.comment.length > maxCharCount) {
      setError(`Votre commentaire est trop long (maximum ${maxCharCount} caractères)`);
      return false;
    }
    
    return true;
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (review) {
        // Mise à jour d'un avis existant
        result = await updateReview(review._id, {
          ...formData,
          route: routeId
        });
      } else {
        // Création d'un nouvel avis
        result = await addReview({
          ...formData,
          route: routeId
        });
      }
      
      if (result.success) {
        onClose();
        if (onSubmitSuccess) {
          onSubmitSuccess(result.data);
        }
      } else {
        setError(result.message || 'Une erreur est survenue');
      }
    } catch (err) {
      console.error('Erreur lors de la soumission de l\'avis:', err);
      setError('Une erreur est survenue lors de l\'envoi de votre avis');
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur est connecté
  if (!user && open) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        TransitionComponent={Transition}
        fullScreen={fullScreen}
      >
        <DialogTitle>Connexion requise</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vous devez être connecté pour laisser un avis.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fermer</Button>
          <Button 
            color="primary" 
            variant="contained"
            onClick={() => {
              // Rediriger vers la page de connexion
              window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }}
          >
            Se connecter
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const ratingIcons = {
    1: <SentimentVeryDissatisfied fontSize="inherit" />,
    2: <SentimentDissatisfied fontSize="inherit" />,
    3: <SentimentSatisfied fontSize="inherit" />,
    4: <SentimentSatisfiedAlt fontSize="inherit" />,
    5: <SentimentVerySatisfied fontSize="inherit" />
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? null : onClose}
      TransitionComponent={Transition}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        {review ? 'Modifier votre avis' : 'Ajouter un avis'}
        {routeName && (
          <Typography variant="subtitle1" color="text.secondary">
            {routeName}
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3, mt: 1 }}>
          <Typography component="legend" gutterBottom>
            Note globale*
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <StyledRating
              name="rating"
              value={formData.rating}
              onChange={(event, newValue) => {
                handleChange('rating')(newValue);
              }}
              getLabelText={(value) => labels[value]}
              IconContainerComponent={({ value, ...props }) => (
                <span {...props}>{ratingIcons[value]}</span>
              )}
              disabled={loading}
              size="large"
            />
            {formData.rating > 0 && (
              <Box sx={{ ml: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {labels[formData.rating]}
                </Typography>
              </Box>
            )}
          </Box>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.completedRoute}
                onChange={handleCheckboxChange}
                disabled={loading}
                color="primary"
              />
            }
            label="J'ai parcouru cet itinéraire en entier"
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Évaluations détaillées
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Chip 
              icon={<DirectionsBike />} 
              label="Difficulté" 
              size="small" 
              sx={{ mr: 1, minWidth: 100 }}
            />
            <Rating
              name="difficultyRating"
              value={formData.difficultyRating}
              onChange={(event, newValue) => {
                handleChange('difficultyRating')(newValue);
              }}
              disabled={loading}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {formData.difficultyRating > 0 ? 
                `${formData.difficultyRating} (${formData.difficultyRating === 5 ? 'Très difficile' : 
                formData.difficultyRating === 1 ? 'Très facile' : 
                formData.difficultyRating === 2 ? 'Facile' : 
                formData.difficultyRating === 3 ? 'Moyen' : 'Difficile'})` : 
                'Non évalué'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Chip 
              icon={<Landscape />} 
              label="Paysage" 
              size="small" 
              sx={{ mr: 1, minWidth: 100 }}
            />
            <Rating
              name="sceneryRating"
              value={formData.sceneryRating}
              onChange={(event, newValue) => {
                handleChange('sceneryRating')(newValue);
              }}
              disabled={loading}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {formData.sceneryRating > 0 ? `${formData.sceneryRating}/5` : 'Non évalué'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Chip 
              icon={<Terrain />} 
              label="Surface" 
              size="small" 
              sx={{ mr: 1, minWidth: 100 }}
            />
            <Rating
              name="surfaceRating"
              value={formData.surfaceRating}
              onChange={(event, newValue) => {
                handleChange('surfaceRating')(newValue);
              }}
              disabled={loading}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {formData.surfaceRating > 0 ? `${formData.surfaceRating}/5` : 'Non évalué'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip 
              icon={<Traffic />} 
              label="Trafic" 
              size="small" 
              sx={{ mr: 1, minWidth: 100 }}
            />
            <Rating
              name="trafficRating"
              value={formData.trafficRating}
              onChange={(event, newValue) => {
                handleChange('trafficRating')(newValue);
              }}
              disabled={loading}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {formData.trafficRating > 0 ? 
                `${formData.trafficRating} (${formData.trafficRating === 5 ? 'Très calme' : 
                formData.trafficRating === 1 ? 'Très fréquenté' : 
                formData.trafficRating === 2 ? 'Fréquenté' : 
                formData.trafficRating === 3 ? 'Modéré' : 'Calme'})` : 
                'Non évalué'}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <TextField
          autoFocus={!review}
          margin="dense"
          id="comment"
          name="comment"
          label="Votre commentaire"
          placeholder="Partagez votre expérience sur cet itinéraire (facultatif)"
          fullWidth
          multiline
          rows={4}
          value={formData.comment}
          onChange={handleChange('comment')}
          disabled={loading}
          variant="outlined"
          helperText={`${charCount}/${maxCharCount} caractères`}
          error={charCount > maxCharCount}
          InputLabelProps={{
            shrink: true,
          }}
        />
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading || formData.rating === 0 || charCount > maxCharCount}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Envoi en cours...' : review ? 'Mettre à jour' : 'Publier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewForm;
