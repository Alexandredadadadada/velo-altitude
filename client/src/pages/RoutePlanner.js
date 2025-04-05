import React, { useState } from 'react';
import { 
  Container, Typography, Paper, Grid, Box, TextField, 
  Button, Divider, List, ListItem, ListItemText, ListItemIcon,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { 
  Map as MapIcon, 
  Place as PlaceIcon, 
  Terrain as TerrainIcon,
  DirectionsBike as BikeIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  Route as RouteIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

/**
 * Composant de planification d'itinéraires
 * Intègre les fonctionnalités de cartographie pour créer et enregistrer des parcours
 */
const RoutePlanner = () => {
  const { userProfile } = useAuth();
  const [routeDetails, setRouteDetails] = useState({
    name: '',
    startLocation: '',
    endLocation: '',
    difficulty: 'medium',
    includesCols: false,
    distance: 0,
    elevation: 0
  });

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRouteDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Planificateur d'Itinéraires
      </Typography>
      
      <Typography variant="body1" paragraph color="text.secondary">
        Créez et planifiez vos itinéraires cyclistes personnalisés. Intégrez vos cols favoris et partagez avec la communauté.
      </Typography>
      
      <Grid container spacing={3}>
        {/* Section carte */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={3} 
            sx={{ 
              height: 500, 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f5f5f5'
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <MapIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Carte interactive
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', mt: 1 }}>
                La carte se chargera ici avec les données Mapbox. Vous pourrez tracer votre itinéraire en cliquant sur les points de départ et d'arrivée.
              </Typography>
            </Box>
          </Paper>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<SaveIcon />}
              disabled={!routeDetails.name || !routeDetails.startLocation}
            >
              Enregistrer l'itinéraire
            </Button>
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={<ShareIcon />}
              disabled={!routeDetails.name || !routeDetails.startLocation}
            >
              Partager
            </Button>
            <Button 
              variant="outlined"
              startIcon={<RouteIcon />}
            >
              Exporter GPX
            </Button>
          </Box>
        </Grid>
        
        {/* Section détails et formulaire */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Détails de l'itinéraire
            </Typography>
            
            <TextField
              fullWidth
              margin="normal"
              label="Nom de l'itinéraire"
              name="name"
              value={routeDetails.name}
              onChange={handleChange}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Point de départ"
              name="startLocation"
              value={routeDetails.startLocation}
              onChange={handleChange}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Point d'arrivée"
              name="endLocation"
              value={routeDetails.endLocation}
              onChange={handleChange}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="difficulty-label">Difficulté</InputLabel>
              <Select
                labelId="difficulty-label"
                name="difficulty"
                value={routeDetails.difficulty}
                label="Difficulté"
                onChange={handleChange}
              >
                <MenuItem value="easy">Facile</MenuItem>
                <MenuItem value="medium">Moyenne</MenuItem>
                <MenuItem value="hard">Difficile</MenuItem>
                <MenuItem value="expert">Expert</MenuItem>
              </Select>
            </FormControl>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Statistiques estimées
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <BikeIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Distance" 
                  secondary={routeDetails.distance > 0 ? `${routeDetails.distance} km` : "Non calculé"} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <TerrainIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Dénivelé positif" 
                  secondary={routeDetails.elevation > 0 ? `${routeDetails.elevation} m` : "Non calculé"} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PlaceIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Cols sur le parcours" 
                  secondary="Aucun sélectionné" 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Suggestions de cols à proximité */}
      <Paper elevation={2} sx={{ p: 3, mt: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Cols à proximité de votre itinéraire
        </Typography>
        
        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body1">
            Tracez votre itinéraire pour voir les cols à proximité
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default RoutePlanner;
