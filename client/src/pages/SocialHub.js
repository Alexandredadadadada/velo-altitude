import React from 'react';
import { Container, Typography, Grid, Box, Paper, Button, Avatar } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const SocialHub = () => {
  const { userProfile } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Hub Social Velo-Altitude
      </Typography>
      
      <Typography variant="body1" paragraph color="text.secondary">
        Connectez-vous avec d'autres cyclistes passionnés, partagez vos expériences et découvrez de nouveaux défis.
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Événements à venir
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Challenge des 7 Majeurs - Grand Est
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Relevez le défi des 7 cols mythiques du Grand Est. Départ prévu le 15 juin 2025.
              </Typography>
              <Button variant="outlined" size="small">
                Voir les détails
              </Button>
            </Box>
          </Paper>
          
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Groupes populaires
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Grimpeurs des Alpes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  752 membres - Discussion sur les cols alpins et partage d'expériences
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Nutrition Cycliste
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  483 membres - Échange de recettes et conseils nutritionnels
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Cyclistes à suivre
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src="/assets/images/user1.jpg" />
                <Box>
                  <Typography variant="subtitle2">
                    Sophie Martin
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Spécialiste des cols pyrénéens
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src="/assets/images/user2.jpg" />
                <Box>
                  <Typography variant="subtitle2">
                    Thomas Durand
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expert en entraînement HIIT
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
          
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Défis communautaires
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Défi du mois: 5000m de dénivelé
              </Typography>
              <Typography variant="body2" color="text.secondary">
                312 participants - Termine dans 12 jours
              </Typography>
            </Box>
            <Button variant="contained" fullWidth>
              Rejoindre un défi
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, p: 3, borderRadius: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="body2" align="center" color="text.secondary">
          Le module communautaire est en cours d'expansion. De nouvelles fonctionnalités seront bientôt disponibles!
        </Typography>
      </Box>
    </Container>
  );
};

export default SocialHub;
