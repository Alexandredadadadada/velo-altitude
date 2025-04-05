import React from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Card, CardContent,
  CardMedia, List, ListItem, ListItemText, ListItemIcon, Divider
} from '@mui/material';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import InfoIcon from '@mui/icons-material/Info';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Composant affichant les recommandations nutritionnelles spécifiques à une région
 * @param {Object} props
 * @param {Object} props.recommendations - Données des recommandations régionales
 * @param {string} props.region - Nom de la région
 * @param {string} props.country - Nom du pays
 */
const RegionalRecommendations = ({ recommendations, region, country }) => {
  if (!recommendations) {
    return null;
  }

  const { foods, hydration, specialties } = recommendations;

  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/regionalrecommendations"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Recommandations spécifiques à la région {region}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Section Hydratation */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WaterDropIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Hydratation</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                {hydration.recommendations}
              </Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Eaux locales recommandées:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {hydration.localWaters.map((water, index) => (
                  <Chip key={index} label={water} size="small" color="primary" variant="outlined" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Section Spécialités */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalDiningIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Spécialités pour cyclistes</Typography>
              </Box>
              
              <List dense>
                {specialties.map((specialty, index) => (
                  <ListItem key={index} alignItems="flex-start" sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <InfoIcon fontSize="small" color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={specialty.name}
                      secondary={specialty.description}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Section Aliments locaux */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RestaurantIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Aliments locaux recommandés</Typography>
              </Box>
              
              <Grid container spacing={2}>
                {foods.map((food, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        height: '100%',
                        borderLeft: '4px solid #1976d2'
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="medium">
                        {food.name}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Calories:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {food.nutrients.calories} kcal
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Glucides:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {food.nutrients.carbs}g
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Protéines:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {food.nutrients.protein}g
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Lipides:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {food.nutrients.fat}g
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Note sur l'approche régionale */}
        <Grid item xs={12}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> Ces recommandations sont basées sur les spécificités de la région {region} en {country}. 
              Les aliments locaux peuvent contribuer à une meilleure adaptation à l'environnement et aux conditions d'entraînement dans cette région.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RegionalRecommendations;
