import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Grid,
  Divider,
  IconButton,
  Avatar,
  CircularProgress,
  Alert,
  useMediaQuery
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import MapIcon from '@mui/icons-material/Map';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import PublishIcon from '@mui/icons-material/Publish';
import MountainIcon from '@mui/icons-material/Terrain';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useCommunity } from '../../../contexts/CommunityContext';

const steps = ['Informations de base', 'Cols et points d\'intérêt', 'Photos et description', 'Aperçu et publication'];

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const ImagePreviewContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
}));

const ImagePreview = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: 150,
  height: 100,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  '& .overlay': {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  '&:hover .overlay': {
    opacity: 1,
  },
}));

// Les options de difficulté
const difficultyOptions = [
  { value: 'facile', label: 'Facile' },
  { value: 'modere', label: 'Modéré' },
  { value: 'difficile', label: 'Difficile' },
  { value: 'tres-difficile', label: 'Très difficile' },
  { value: 'extreme', label: 'Extrême' }
];

// Mock des cols disponibles pour la sélection
const availableCols = [
  { id: 'col1', name: 'Col du Grand Ballon', region: 'Vosges', elevation: 1424 },
  { id: 'col2', name: 'Col de la Schlucht', region: 'Vosges', elevation: 1139 },
  { id: 'col3', name: 'Col du Galibier', region: 'Alpes', elevation: 2642 },
  { id: 'col4', name: 'Col du Tourmalet', region: 'Pyrénées', elevation: 2115 },
  { id: 'col5', name: 'Col d\'Izoard', region: 'Alpes', elevation: 2360 },
  { id: 'col6', name: 'Col de la Croix de Fer', region: 'Alpes', elevation: 2067 },
  { id: 'col7', name: 'Col de l\'Iseran', region: 'Alpes', elevation: 2770 },
  { id: 'col8', name: 'Col d\'Aubisque', region: 'Pyrénées', elevation: 1709 },
  { id: 'col9', name: 'Col de Peyresourde', region: 'Pyrénées', elevation: 1569 },
  { id: 'col10', name: 'Col de la Madeleine', region: 'Alpes', elevation: 2000 }
];

const RouteSharing = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { shareRoute } = useCommunity();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // État du formulaire
  const [routeData, setRouteData] = useState({
    title: '',
    distance: '',
    elevation: '',
    duration: '',
    difficulty: '',
    region: '',
    startLocation: '',
    endLocation: '',
    selectedCols: [],
    images: [],
    description: '',
    tips: ''
  });

  // Règles de validation pour chaque étape
  const validateStep = (step) => {
    switch (step) {
      case 0:
        return (
          routeData.title.trim() !== '' && 
          routeData.distance.trim() !== '' && 
          routeData.elevation.trim() !== '' && 
          routeData.duration.trim() !== '' && 
          routeData.difficulty !== '' &&
          routeData.region.trim() !== ''
        );
      case 1:
        return true; // Les cols sont optionnels
      case 2:
        return routeData.description.trim() !== '';
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setError('');
    } else {
      setError('Veuillez remplir tous les champs obligatoires avant de continuer.');
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setRouteData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColSelect = (event) => {
    const colId = event.target.value;
    const col = availableCols.find(c => c.id === colId);
    
    if (col && !routeData.selectedCols.some(c => c.id === col.id)) {
      setRouteData((prev) => ({
        ...prev,
        selectedCols: [...prev.selectedCols, col]
      }));
    }
  };

  const handleRemoveCol = (colId) => {
    setRouteData((prev) => ({
      ...prev,
      selectedCols: prev.selectedCols.filter(col => col.id !== colId)
    }));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    
    // Limiter à 5 images maximum
    if (routeData.images.length + files.length > 5) {
      setError('Vous ne pouvez pas télécharger plus de 5 images.');
      return;
    }
    
    // Dans une implémentation réelle, ces fichiers seraient téléchargés sur un serveur
    // Pour cette démo, nous allons simplement simuler avec des URL locales
    const newImages = files.map(file => ({
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setRouteData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const handleRemoveImage = (imageId) => {
    const imageToRemove = routeData.images.find(img => img.id === imageId);
    
    if (imageToRemove && imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    setRouteData((prev) => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      setError('Veuillez compléter toutes les informations requises avant de publier.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Préparer les données pour l'envoi
      const preparedData = {
        title: routeData.title,
        description: routeData.description,
        distance: parseFloat(routeData.distance),
        elevation: parseFloat(routeData.elevation),
        duration: routeData.duration,
        difficulty: routeData.difficulty,
        region: routeData.region,
        startLocation: routeData.startLocation,
        endLocation: routeData.endLocation,
        colsIncluded: routeData.selectedCols.map(col => col.name),
        // Dans une implémentation réelle, les images seraient téléchargées sur un serveur
        // et nous stockerions les URLs retournées
        images: routeData.images.map(img => img.preview)
      };
      
      // Appel au contexte pour partager l'itinéraire
      const result = await shareRoute(preparedData);
      
      if (result) {
        setSuccess(true);
        // Rediriger vers la page de l'itinéraire après un court délai
        setTimeout(() => {
          navigate(`/community/routes/${result.id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error sharing route:', err);
      setError('Une erreur est survenue lors de la publication. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Nettoyer les URL d'objets lors du démontage du composant
  useEffect(() => {
    return () => {
      routeData.images.forEach(img => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, []);

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Informations de base
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Titre de l'itinéraire"
                  name="title"
                  value={routeData.title}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Ex: Tour du Mont Blanc en 3 jours"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Distance (km)"
                  name="distance"
                  value={routeData.distance}
                  onChange={handleChange}
                  variant="outlined"
                  type="number"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Dénivelé positif (m)"
                  name="elevation"
                  value={routeData.elevation}
                  onChange={handleChange}
                  variant="outlined"
                  type="number"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Durée"
                  name="duration"
                  value={routeData.duration}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Ex: 3 jours / 5 heures"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Difficulté</InputLabel>
                  <Select
                    value={routeData.difficulty}
                    name="difficulty"
                    onChange={handleChange}
                    label="Difficulté"
                  >
                    {difficultyOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Région"
                  name="region"
                  value={routeData.region}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Ex: Alpes, Pyrénées, Vosges"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Lieu de départ"
                  name="startLocation"
                  value={routeData.startLocation}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Lieu d'arrivée"
                  name="endLocation"
                  value={routeData.endLocation}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </StyledPaper>
        );
        
      case 1:
        return (
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Cols et points d'intérêt
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Ajouter un col</InputLabel>
                <Select
                  value=""
                  onChange={handleColSelect}
                  label="Ajouter un col"
                  IconComponent={() => <AddIcon sx={{ mr: 1 }} />}
                >
                  {availableCols
                    .filter(col => !routeData.selectedCols.some(c => c.id === col.id))
                    .map((col) => (
                      <MenuItem key={col.id} value={col.id}>
                        {col.name} ({col.region}) - {col.elevation}m
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>
            
            {routeData.selectedCols.length === 0 ? (
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  backgroundColor: '#f5f5f5'
                }}
              >
                <MountainIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color="textSecondary">
                  Aucun col sélectionné
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Ajoutez des cols que vous traverserez pendant votre itinéraire
                </Typography>
              </Paper>
            ) : (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Cols sélectionnés :
                </Typography>
                
                <Grid container spacing={2}>
                  {routeData.selectedCols.map((col) => (
                    <Grid item xs={12} key={col.id}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MountainIcon sx={{ mr: 2, color: 'primary.main' }} />
                          <Box>
                            <Typography variant="subtitle2">
                              {col.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {col.region} • {col.elevation}m
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleRemoveCol(col.id)}
                        >
                          <ArrowBackIcon fontSize="small" />
                        </IconButton>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </StyledPaper>
        );
        
      case 2:
        return (
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Photos et description
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Photos de l'itinéraire
              </Typography>
              
              <Button
                component="label"
                variant="outlined"
                startIcon={<ImageIcon />}
              >
                Ajouter des photos
                <VisuallyHiddenInput 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageUpload}
                />
              </Button>
              
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                Maximum 5 photos • JPG, PNG
              </Typography>
              
              <ImagePreviewContainer>
                {routeData.images.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    Aucune photo sélectionnée
                  </Typography>
                ) : (
                  routeData.images.map((image) => (
                    <ImagePreview key={image.id}>
                      <img src={image.preview} alt="Aperçu" />
                      <Box 
                        className="overlay"
                        onClick={() => handleRemoveImage(image.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Supprimer
                        </Typography>
                      </Box>
                    </ImagePreview>
                  ))
                )}
              </ImagePreviewContainer>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Description détaillée*
              </Typography>
              
              <TextField
                required
                fullWidth
                multiline
                rows={6}
                name="description"
                value={routeData.description}
                onChange={handleChange}
                variant="outlined"
                placeholder="Décrivez votre itinéraire : les points forts, les difficultés, les paysages à découvrir..."
                sx={{ mb: 3 }}
              />
              
              <Typography variant="subtitle1" gutterBottom>
                Conseils et astuces
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                name="tips"
                value={routeData.tips}
                onChange={handleChange}
                variant="outlined"
                placeholder="Partagez vos conseils pratiques : meilleures périodes, hébergements recommandés, points de ravitaillement..."
              />
            </Box>
          </StyledPaper>
        );
        
      case 3:
        return (
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Aperçu et publication
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {routeData.title || 'Sans titre'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip 
                      icon={<MapIcon />} 
                      label={`${routeData.distance || '0'} km`} 
                      variant="outlined" 
                    />
                    <Chip 
                      icon={<MountainIcon />} 
                      label={`${routeData.elevation || '0'} m`} 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`Durée: ${routeData.duration || 'Non spécifiée'}`} 
                      variant="outlined" 
                    />
                    {routeData.difficulty && (
                      <Chip 
                        label={`Difficulté: ${difficultyOptions.find(d => d.value === routeData.difficulty)?.label || routeData.difficulty}`} 
                        variant="outlined"
                        color={
                          routeData.difficulty === 'facile' ? 'success' :
                          routeData.difficulty === 'modere' ? 'info' :
                          routeData.difficulty === 'difficile' ? 'warning' :
                          'error'
                        }
                      />
                    )}
                    {routeData.region && (
                      <Chip 
                        label={routeData.region} 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                  
                  {routeData.images.length > 0 && (
                    <Box sx={{ display: 'flex', overflow: 'auto', mb: 2 }}>
                      {routeData.images.map((image) => (
                        <Box 
                          key={image.id}
                          sx={{
                            minWidth: 200,
                            height: 150,
                            mr: 1,
                            borderRadius: 1,
                            overflow: 'hidden',
                            flexShrink: 0
                          }}
                        >
                          <img 
                            src={image.preview} 
                            alt="Aperçu" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                  
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Description
                  </Typography>
                  <Typography paragraph>
                    {routeData.description || 'Aucune description fournie.'}
                  </Typography>
                  
                  {routeData.tips && (
                    <>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Conseils et astuces
                      </Typography>
                      <Typography paragraph>
                        {routeData.tips}
                      </Typography>
                    </>
                  )}
                  
                  {routeData.selectedCols.length > 0 && (
                    <>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Cols traversés
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {routeData.selectedCols.map((col) => (
                          <Chip 
                            key={col.id}
                            icon={<MountainIcon />}
                            label={`${col.name} (${col.elevation}m)`}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </StyledPaper>
        );
        
      default:
        return <Typography>Étape inconnue</Typography>;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        Partager un itinéraire
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Votre itinéraire a été publié avec succès! Redirection en cours...
        </Alert>
      )}
      
      <Stepper 
        activeStep={activeStep} 
        alternativeLabel={!isMobile}
        orientation={isMobile ? 'vertical' : 'horizontal'}
        sx={{ mb: 4 }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {renderStepContent(activeStep)}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          disabled={activeStep === 0 || loading}
          onClick={handleBack}
        >
          Précédent
        </Button>
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <PublishIcon />}
            >
              {loading ? 'Publication...' : 'Publier l\'itinéraire'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={loading}
            >
              Suivant
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default RouteSharing;
