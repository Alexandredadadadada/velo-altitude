import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardHeader,
  CardContent, 
  Grid, 
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  TextField,
  CircularProgress,
  Divider,
  Paper,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  PlayCircle as StartIcon,
  PhotoCamera as CameraIcon,
  AddCircle as AddIcon,
  Upload as UploadIcon,
  CalendarToday as CalendarIcon,
  Timer as TimerIcon,
  Description as DescriptionIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { getColDetailById } from '../../services/colsService';
import StravaActivitySelector from '../social/StravaActivitySelector';

/**
 * Composant pour suivre la progression de l'utilisateur dans un défi
 */
const UserChallengeProgress = () => {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  
  const [challenge, setChallenge] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [colsData, setColsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentColId, setCurrentColId] = useState(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    notes: '',
    photo: null,
    stravaActivityId: null
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Charger les données du défi et la progression de l'utilisateur
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les détails du défi
        const challengeResponse = await axios.get(`/api/challenges/${challengeId}`);
        setChallenge(challengeResponse.data);
        
        // Récupérer la progression de l'utilisateur
        if (user) {
          const progressResponse = await axios.get(`/api/users/${user.id}/challenge-progress/${challengeId}`);
          setUserProgress(progressResponse.data || { 
            userId: user.id,
            challengeId,
            completedCols: [],
            startDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            colsProgress: {}
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Impossible de charger les données du défi. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [challengeId, user]);

  // Charger les détails des cols lorsque le défi est chargé
  useEffect(() => {
    const loadColsData = async () => {
      if (challenge && challenge.cols && challenge.cols.length > 0) {
        try {
          const colsDataObj = {};
          
          // Récupérer les détails de chaque col
          for (const colId of challenge.cols) {
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

    if (challenge) {
      loadColsData();
    }
  }, [challenge]);

  // Vérifier si un col est complété
  const isColCompleted = (colId) => {
    if (!userProgress || !userProgress.completedCols) return false;
    return userProgress.completedCols.includes(colId);
  };

  // Obtenir les détails de progression d'un col
  const getColProgress = (colId) => {
    if (!userProgress || !userProgress.colsProgress) return null;
    return userProgress.colsProgress[colId] || null;
  };

  // Ouvrir la boîte de dialogue d'ajout de progression
  const handleOpenUploadDialog = (colId) => {
    setCurrentColId(colId);
    // Réinitialiser le formulaire
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '',
      notes: '',
      photo: null,
      stravaActivityId: null
    });
    setValidationErrors({});
    setUploadDialogOpen(true);
  };

  // Fermer la boîte de dialogue d'ajout de progression
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setCurrentColId(null);
  };

  // Gérer les changements dans le formulaire
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Gérer le changement de photo
  const handlePhotoChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFormData({
        ...formData,
        photo: event.target.files[0]
      });
    }
  };

  // Gérer la sélection d'une activité Strava
  const handleStravaActivitySelect = (activityId) => {
    setFormData({
      ...formData,
      stravaActivityId: activityId
    });
  };

  // Valider le formulaire
  const validateForm = () => {
    const errors = {};
    
    if (!formData.date) {
      errors.date = "La date est requise";
    }
    
    if (challenge.requirements.photosRequired && !formData.photo) {
      errors.photo = "Une photo du sommet est requise pour ce défi";
    }
    
    if (challenge.requirements.stravaActivities && !formData.stravaActivityId) {
      errors.stravaActivityId = "Une activité Strava est requise pour ce défi";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      // Créer un formData pour l'upload de fichier
      const formDataToSend = new FormData();
      formDataToSend.append('date', formData.date);
      formDataToSend.append('time', formData.time);
      formDataToSend.append('notes', formData.notes);
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }
      if (formData.stravaActivityId) {
        formDataToSend.append('stravaActivityId', formData.stravaActivityId);
      }
      
      // Envoyer les données
      const response = await axios.post(
        `/api/users/${user.id}/challenge-progress/${challengeId}/cols/${currentColId}`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Mettre à jour l'état local avec les nouvelles données
      setUserProgress(response.data);
      
      // Fermer la boîte de dialogue
      handleCloseUploadDialog();
    } catch (err) {
      console.error('Erreur lors de la soumission du formulaire:', err);
      setValidationErrors({
        submit: "Une erreur est survenue lors de l'enregistrement de votre progression"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Supprimer la progression d'un col
  const handleDeleteProgress = async (colId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer votre progression pour ce col ?")) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Supprimer la progression
      const response = await axios.delete(
        `/api/users/${user.id}/challenge-progress/${challengeId}/cols/${colId}`
      );
      
      // Mettre à jour l'état local avec les nouvelles données
      setUserProgress(response.data);
    } catch (err) {
      console.error('Erreur lors de la suppression de la progression:', err);
      setError("Une erreur est survenue lors de la suppression de votre progression");
    } finally {
      setLoading(false);
    }
  };

  // Calculer le pourcentage de progression
  const calculateProgressPercent = () => {
    if (!challenge || !challenge.cols || challenge.cols.length === 0) return 0;
    if (!userProgress || !userProgress.completedCols) return 0;
    
    return Math.round((userProgress.completedCols.length / challenge.cols.length) * 100);
  };

  // Afficher un loader pendant le chargement
  if (loading && !challenge) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress />
      </Box>
    );
  }

  // Afficher un message d'erreur si nécessaire
  if (error && !challenge) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Erreur</AlertTitle>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/challenges')}
        >
          Retour aux défis
        </Button>
      </Box>
    );
  }

  // Afficher un message si le défi n'existe pas
  if (!challenge) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          <AlertTitle>Défi introuvable</AlertTitle>
          Le défi que vous recherchez n'existe pas ou a été supprimé.
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/challenges')}
        >
          Retour aux défis
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* En-tête */}
      <Box 
        sx={{ 
          mb: 4, 
          p: 3, 
          borderRadius: 2, 
          backgroundColor: 'background.paper',
          boxShadow: 2,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: '5px', 
            bgcolor: 'primary.main'
          }}
        >
          <Box 
            sx={{ 
              width: `${calculateProgressPercent()}%`, 
              height: '100%', 
              bgcolor: 'success.main',
              transition: 'width 0.5s ease-in-out'
            }}
          />
        </Box>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <Typography variant="h4" component="h1" gutterBottom>
              {challenge.name}
            </Typography>
            
            <Typography variant="subtitle1" color="text.secondary" paragraph>
              {challenge.description}
            </Typography>
            
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip 
                icon={<StarIcon />} 
                label={`${challenge.rewards.points} points`} 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                label={challenge.difficulty} 
                color="error" 
                variant="outlined" 
              />
              <Chip 
                label={challenge.category} 
                color="secondary" 
                variant="outlined" 
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Votre progression
              </Typography>
              
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={calculateProgressPercent()}
                  size={100}
                  thickness={5}
                  sx={{
                    color: calculateProgressPercent() === 100 
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
                  <Typography variant="h4" component="div" color="text.secondary" fontWeight="bold">
                    {`${calculateProgressPercent()}%`}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" mt={1}>
                {userProgress?.completedCols?.length || 0}/{challenge.cols?.length || 0} cols complétés
              </Typography>
              
              {userProgress?.startDate && (
                <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                  Défi commencé le {format(new Date(userProgress.startDate), 'dd MMMM yyyy', { locale: fr })}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {/* Liste des cols du défi avec progression */}
      <Typography variant="h5" gutterBottom>
        Cols à conquérir
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {challenge.cols.map((colId) => {
          const colData = colsData[colId];
          const completed = isColCompleted(colId);
          const progress = getColProgress(colId);
          
          return (
            <Grid item xs={12} sm={6} md={4} key={colId}>
              <Card 
                variant="outlined" 
                sx={{ 
                  height: '100%',
                  borderColor: completed ? theme.palette.success.main : 'inherit',
                  position: 'relative'
                }}
              >
                {completed && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: -10, 
                      right: -10, 
                      width: 30, 
                      height: 30, 
                      borderRadius: '50%', 
                      bgcolor: theme.palette.success.main, 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      zIndex: 1,
                      boxShadow: 1
                    }}
                  >
                    <CheckCircleIcon fontSize="small" />
                  </Box>
                )}
                
                <CardHeader
                  title={colData?.name || `Col #${colId}`}
                  subheader={
                    colData ? 
                    `${colData.statistics.length} km | ${colData.statistics.elevation_gain} m | ${colData.statistics.avg_gradient}%` : 
                    'Chargement...'
                  }
                />
                
                <CardContent>
                  {completed ? (
                    <Box>
                      <Alert 
                        severity="success" 
                        icon={<CheckCircleIcon fontSize="inherit" />}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      >
                        Col conquis !
                      </Alert>
                      
                      <List dense>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CalendarIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Date" 
                            secondary={format(new Date(progress.date), 'dd MMMM yyyy', { locale: fr })} 
                          />
                        </ListItem>
                        
                        {progress.time && (
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <TimerIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Temps" 
                              secondary={progress.time} 
                            />
                          </ListItem>
                        )}
                        
                        {progress.stravaActivityId && (
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <img 
                                src="/assets/logos/strava.svg" 
                                alt="Strava" 
                                width="18" 
                                height="18" 
                              />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Activité Strava liée" 
                              secondary={
                                <Button 
                                  variant="text" 
                                  size="small" 
                                  component="a"
                                  href={`https://www.strava.com/activities/${progress.stravaActivityId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Voir l'activité
                                </Button>
                              } 
                            />
                          </ListItem>
                        )}
                      </List>
                      
                      <Box display="flex" justifyContent="space-between" mt={2}>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          component="a"
                          href={`/cols/${colId}`}
                        >
                          Détails du col
                        </Button>
                        
                        <IconButton 
                          color="error" 
                          size="small"
                          onClick={() => handleDeleteProgress(colId)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {colData?.location?.region || 'Région non spécifiée'}, {colData?.location?.country || 'Pays non spécifié'}
                      </Typography>
                      
                      <Box display="flex" justifyContent="center" mt={2}>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenUploadDialog(colId)}
                          fullWidth
                        >
                          Marquer comme gravi
                        </Button>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      
      {/* Boîte de dialogue pour ajouter une progression */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={handleCloseUploadDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Valider votre ascension
        </DialogTitle>
        
        <DialogContent dividers>
          {currentColId && colsData[currentColId] && (
            <Typography variant="subtitle1" gutterBottom>
              {colsData[currentColId].name}
            </Typography>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date de l'ascension"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleFormChange}
                fullWidth
                variant="outlined"
                required
                error={!!validationErrors.date}
                helperText={validationErrors.date}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Temps d'ascension (optionnel)"
                name="time"
                value={formData.time}
                onChange={handleFormChange}
                placeholder="ex: 1h45m"
                fullWidth
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <TimerIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Notes (optionnel)"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                multiline
                rows={3}
                fullWidth
                variant="outlined"
                placeholder="Décrivez votre expérience..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Photo au sommet {challenge.requirements.photosRequired && "(obligatoire)"}
              </Typography>
              
              <Button
                variant="outlined"
                component="label"
                startIcon={<CameraIcon />}
                fullWidth
                sx={{ mb: 1 }}
              >
                Choisir une photo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </Button>
              
              {formData.photo && (
                <Typography variant="caption" display="block">
                  {formData.photo.name}
                </Typography>
              )}
              
              {validationErrors.photo && (
                <Typography variant="caption" color="error" display="block">
                  {validationErrors.photo}
                </Typography>
              )}
            </Grid>
            
            {challenge.requirements.stravaActivities && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Activité Strava (obligatoire)
                </Typography>
                
                <StravaActivitySelector 
                  onSelectActivity={handleStravaActivitySelect}
                  selectedActivityId={formData.stravaActivityId}
                />
                
                {validationErrors.stravaActivityId && (
                  <Typography variant="caption" color="error" display="block">
                    {validationErrors.stravaActivityId}
                  </Typography>
                )}
              </Grid>
            )}
            
            {validationErrors.submit && (
              <Grid item xs={12}>
                <Alert severity="error">
                  {validationErrors.submit}
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={submitting}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Enregistrement...' : 'Valider'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserChallengeProgress;
