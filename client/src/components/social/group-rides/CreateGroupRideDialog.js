/**
 * CreateGroupRideDialog.js
 * Composant de dialogue pour la création et l'édition de sorties de groupe
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Slider,
  Chip,
  InputAdornment,
  IconButton,
  FormHelperText,
  Switch,
  FormControlLabel,
  Divider,
  Autocomplete
} from '@mui/material';
import {
  Close,
  DirectionsBike,
  Schedule,
  TrendingUp,
  Speed,
  LocationOn,
  Person,
  Group,
  Public,
  Info,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';

import RouteService from '../../../services/routeService';
import MapRouteSelector from './MapRouteSelector';
import { brandConfig } from '../../../config/branding';

// Constantes pour les options de formulaire
const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
  { value: 'expert', label: 'Expert' }
];

const TERRAIN_OPTIONS = [
  { value: 'flat', label: 'Plat' },
  { value: 'hilly', label: 'Vallonné' },
  { value: 'mountain', label: 'Montagneux' },
  { value: 'mixed', label: 'Mixte' }
];

/**
 * Composant de dialogue pour la création/édition de sorties de groupe
 */
const CreateGroupRideDialog = ({ open, onClose, onSubmit, ride = null, userProfile }) => {
  const { t } = useTranslation();
  const editMode = !!ride;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dateTime: '',
    meetingPoint: '',
    routeId: '',
    maxParticipants: 15,
    levelRequired: 'intermediate',
    averageSpeed: 25,
    terrainType: 'mixed',
    isPublic: true,
    tags: []
  });
  const [errors, setErrors] = useState({});
  const [routes, setRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Charger les routes disponibles au montage du composant
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoadingRoutes(true);
        const response = await RouteService.getAllRoutes();
        setRoutes(response);
      } catch (error) {
        console.error('Erreur lors du chargement des itinéraires:', error);
      } finally {
        setLoadingRoutes(false);
      }
    };

    if (open) {
      fetchRoutes();
      
      // Si en mode édition, initialiser le formulaire avec les données de la sortie
      if (editMode && ride) {
        const rideDateTime = new Date(ride.dateTime);
        const formattedDate = rideDateTime.toISOString().slice(0, 16); // Format YYYY-MM-DDThh:mm
        
        setFormData({
          title: ride.title || '',
          description: ride.description || '',
          dateTime: formattedDate,
          meetingPoint: ride.meetingPoint || '',
          routeId: ride.routeId || '',
          maxParticipants: ride.maxParticipants || 15,
          levelRequired: ride.levelRequired || 'intermediate',
          averageSpeed: ride.averageSpeed || 25,
          terrainType: ride.terrainType || 'mixed',
          isPublic: ride.isPublic !== undefined ? ride.isPublic : true,
          tags: ride.tags || []
        });
        
        // Charger les détails de l'itinéraire si disponible
        if (ride.routeId) {
          loadRouteDetails(ride.routeId);
        }
      } else {
        // En mode création, réinitialiser le formulaire
        resetForm();
      }
    }
  }, [open, editMode, ride]);

  // Charger les détails d'un itinéraire
  const loadRouteDetails = async (routeId) => {
    try {
      const route = await RouteService.getRouteById(routeId);
      setSelectedRoute(route);
      
      // Mettre à jour automatiquement le type de terrain en fonction de l'itinéraire
      if (route) {
        let terrainType = 'mixed';
        if (route.elevationGain < 300) {
          terrainType = 'flat';
        } else if (route.elevationGain < 800) {
          terrainType = 'hilly';
        } else {
          terrainType = 'mountain';
        }
        
        setFormData(prev => ({
          ...prev,
          terrainType
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails de l\'itinéraire:', error);
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    // Définir la date par défaut à la prochaine heure pleine
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    const formattedDate = nextHour.toISOString().slice(0, 16); // Format YYYY-MM-DDThh:mm
    
    setFormData({
      title: '',
      description: '',
      dateTime: formattedDate,
      meetingPoint: '',
      routeId: '',
      maxParticipants: 15,
      levelRequired: userProfile?.level || 'intermediate',
      averageSpeed: 25,
      terrainType: 'mixed',
      isPublic: true,
      tags: []
    });
    
    setSelectedRoute(null);
    setErrors({});
  };

  // Gérer les changements de valeur des champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Effacer l'erreur sur ce champ s'il y en a une
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
    
    // Si l'itinéraire change, charger ses détails
    if (name === 'routeId' && value) {
      loadRouteDetails(value);
    }
  };

  // Gérer le changement de l'interrupteur public/privé
  const handleSwitchChange = (e) => {
    setFormData({
      ...formData,
      isPublic: e.target.checked
    });
  };

  // Gérer l'ajout d'un tag
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  // Gérer la suppression d'un tag
  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Valider le formulaire avant soumission
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = t('fieldRequired');
    }
    
    if (!formData.dateTime) {
      newErrors.dateTime = t('fieldRequired');
    } else {
      const selectedDate = new Date(formData.dateTime);
      const now = new Date();
      if (selectedDate <= now) {
        newErrors.dateTime = t('dateMustBeFuture');
      }
    }
    
    if (!formData.meetingPoint.trim()) {
      newErrors.meetingPoint = t('fieldRequired');
    }
    
    if (!formData.routeId) {
      newErrors.routeId = t('fieldRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gérer la soumission du formulaire
  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Sélectionner un itinéraire depuis le sélecteur de carte
  const handleRouteSelection = (route) => {
    if (route) {
      setSelectedRoute(route);
      setFormData({
        ...formData,
        routeId: route.id
      });
      setShowRouteSelector(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            {editMode ? t('editRide') : t('createRide')}
          </Typography>
          <IconButton onClick={onClose} edge="end">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <TextField
              name="title"
              label={t('rideTitle')}
              value={formData.title}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errors.title}
              helperText={errors.title}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              name="dateTime"
              label={t('dateTime')}
              type="datetime-local"
              value={formData.dateTime}
              onChange={handleChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              error={!!errors.dateTime}
              helperText={errors.dateTime}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="description"
              label={t('rideDescription')}
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="meetingPoint"
              label={t('meetingPoint')}
              value={formData.meetingPoint}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errors.meetingPoint}
              helperText={errors.meetingPoint}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn color="error" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal" error={!!errors.routeId} required>
              <InputLabel>{t('selectRoute')}</InputLabel>
              <Select
                name="routeId"
                value={formData.routeId}
                onChange={handleChange}
                label={t('selectRoute')}
              >
                <MenuItem value="">
                  <em>{t('selectRoutePrompt')}</em>
                </MenuItem>
                {routes.map(route => (
                  <MenuItem key={route.id} value={route.id}>
                    {route.name} ({route.distance} km, {route.elevationGain} m)
                  </MenuItem>
                ))}
              </Select>
              {errors.routeId && <FormHelperText>{errors.routeId}</FormHelperText>}
              
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowRouteSelector(true)}
                >
                  {t('browseRouteMap')}
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  component="a"
                  href="/routes/create"
                  target="_blank"
                >
                  {t('createNewRoute')}
                </Button>
              </Box>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              {t('rideSettings')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>{t('levelRequired')}</InputLabel>
              <Select
                name="levelRequired"
                value={formData.levelRequired}
                onChange={handleChange}
                label={t('levelRequired')}
              >
                {LEVEL_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>{t('terrainType')}</InputLabel>
              <Select
                name="terrainType"
                value={formData.terrainType}
                onChange={handleChange}
                label={t('terrainType')}
              >
                {TERRAIN_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ px: 2, mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                {t('averageSpeed')}: {formData.averageSpeed} km/h
              </Typography>
              <Slider
                name="averageSpeed"
                value={formData.averageSpeed}
                onChange={(e, newValue) => setFormData({ ...formData, averageSpeed: newValue })}
                min={15}
                max={40}
                step={1}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value} km/h`}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ px: 2, mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                {t('maxParticipants')}: {formData.maxParticipants}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton 
                  onClick={() => setFormData({ 
                    ...formData, 
                    maxParticipants: Math.max(1, formData.maxParticipants - 1) 
                  })}
                  size="small"
                >
                  <RemoveIcon />
                </IconButton>
                
                <Slider
                  value={formData.maxParticipants}
                  onChange={(e, newValue) => setFormData({ ...formData, maxParticipants: newValue })}
                  min={1}
                  max={50}
                  step={1}
                  sx={{ mx: 2 }}
                />
                
                <IconButton 
                  onClick={() => setFormData({ 
                    ...formData, 
                    maxParticipants: Math.min(50, formData.maxParticipants + 1) 
                  })}
                  size="small"
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublic}
                  onChange={handleSwitchChange}
                  color="primary"
                />
              }
              label={t('publicRide')}
            />
            <Typography variant="caption" color="textSecondary">
              {formData.isPublic 
                ? t('publicRideDescription') 
                : t('privateRideDescription')}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                {t('tags')} ({t('optional')})
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder={t('addTag')}
                  size="small"
                  sx={{ mr: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  {t('add')}
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t('cancel')}
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          color="primary"
        >
          {editMode ? t('updateRide') : t('createRide')}
        </Button>
      </DialogActions>
      
      {/* Dialogue de sélection d'itinéraire sur carte */}
      <Dialog
        open={showRouteSelector}
        onClose={() => setShowRouteSelector(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {t('selectRouteFromMap')}
            </Typography>
            <IconButton onClick={() => setShowRouteSelector(false)} edge="end">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <MapRouteSelector
            onSelectRoute={handleRouteSelection}
            selectedRouteId={formData.routeId}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

CreateGroupRideDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  ride: PropTypes.object,
  userProfile: PropTypes.object
};

export default CreateGroupRideDialog;
