/**
 * Page de connexion pour Velo-Altitude
 * 
 * Cette page gère l'authentification des utilisateurs en utilisant Auth0.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import { useAuth } from '../auth';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Rediriger vers la page d'origine si l'utilisateur est déjà connecté
  React.useEffect(() => {
    if (isAuthenticated && user) {
      // Vérifier si l'utilisateur vient d'une page spécifique
      const from = new URLSearchParams(location.search).get('from');
      
      // Rediriger vers la page d'origine ou vers la page de profil
      navigate(from || '/profile', { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);
  
  // Gérer le clic sur le bouton de connexion
  const handleLogin = () => {
    login();
  };
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Connexion à Velo-Altitude
          </Typography>
          
          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            Connectez-vous pour accéder à vos données personnelles, suivre vos performances 
            et participer à la communauté Velo-Altitude.
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleLogin}
            sx={{ mt: 2 }}
          >
            Se connecter avec Auth0
          </Button>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              En vous connectant, vous acceptez les conditions d'utilisation et la politique de confidentialité.
            </Typography>
          </Box>
        </Paper>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Velo-Altitude est une application dédiée aux cyclistes passionnés de cols et de défis en montagne.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
