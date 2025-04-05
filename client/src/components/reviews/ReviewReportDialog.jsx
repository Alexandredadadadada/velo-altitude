import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Slide
} from '@mui/material';
import { Flag, WarningAmber } from '@mui/icons-material';

// Composant pour la transition du dialogue
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Dialogue de signalement d'un avis
 * 
 * @param {Object} props - Propriétés du composant
 * @param {boolean} props.open - Indique si le dialogue est ouvert
 * @param {Function} props.onClose - Fonction appelée à la fermeture du dialogue
 * @param {Function} props.onSubmit - Fonction appelée lors de la soumission du signalement
 * @param {string} props.reviewId - ID de l'avis à signaler
 */
const ReviewReportDialog = ({ open, onClose, onSubmit, reviewId }) => {
  // État local
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Options de signalement
  const reportOptions = [
    { value: 'inappropriate', label: 'Contenu inapproprié ou offensant' },
    { value: 'spam', label: 'Spam ou publicité' },
    { value: 'fake', label: 'Avis frauduleux ou trompeur' },
    { value: 'irrelevant', label: 'Hors sujet' },
    { value: 'other', label: 'Autre raison' }
  ];

  // Gérer le changement de raison
  const handleReasonChange = (event) => {
    setReason(event.target.value);
    if (event.target.value !== 'other') {
      setCustomReason('');
    }
  };

  // Gérer le changement de raison personnalisée
  const handleCustomReasonChange = (event) => {
    setCustomReason(event.target.value);
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setReason('');
    setCustomReason('');
    setError(null);
  };

  // Fermer le dialogue
  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  // Soumettre le signalement
  const handleSubmit = async () => {
    // Validation
    if (!reason) {
      setError('Veuillez sélectionner une raison');
      return;
    }

    if (reason === 'other' && !customReason.trim()) {
      setError('Veuillez préciser la raison du signalement');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Préparer la raison à envoyer
      const reportReason = reason === 'other' ? customReason : reportOptions.find(opt => opt.value === reason)?.label;
      
      // Appeler la fonction de soumission
      await onSubmit(reportReason);
      
      // Réinitialiser le formulaire et fermer le dialogue
      resetForm();
    } catch (err) {
      console.error('Erreur lors du signalement:', err);
      setError('Une erreur est survenue lors du signalement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
        <Flag color="error" sx={{ mr: 1 }} />
        Signaler un avis
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Merci de nous aider à maintenir la qualité des avis. Votre signalement sera examiné par notre équipe de modération.
          </Typography>
        </Box>
        
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">Quelle est la raison de votre signalement ?</FormLabel>
          
          <RadioGroup
            aria-label="report-reason"
            name="report-reason"
            value={reason}
            onChange={handleReasonChange}
          >
            {reportOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio disabled={loading} />}
                label={option.label}
                disabled={loading}
              />
            ))}
          </RadioGroup>
        </FormControl>
        
        {reason === 'other' && (
          <TextField
            margin="dense"
            id="custom-reason"
            label="Précisez la raison"
            fullWidth
            multiline
            rows={3}
            value={customReason}
            onChange={handleCustomReasonChange}
            disabled={loading}
            required
            sx={{ mt: 2 }}
          />
        )}
        
        <Box sx={{ 
          mt: 3, 
          p: 2, 
          bgcolor: 'warning.light', 
          borderRadius: 1,
          display: 'flex',
          alignItems: 'flex-start'
        }}>
          <WarningAmber color="warning" sx={{ mr: 1, mt: 0.3 }} />
          <Typography variant="body2" color="text.secondary">
            Les signalements abusifs peuvent entraîner des restrictions sur votre compte. Veuillez ne signaler que les avis qui enfreignent réellement nos règles de communauté.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading || (!reason || (reason === 'other' && !customReason.trim()))}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Envoi...' : 'Signaler'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewReportDialog;
