import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SentimentDissatisfied as SadIcon } from '@mui/icons-material';

/**
 * Page 404 Not Found - Affichée lorsqu'une route n'existe pas
 */
const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 5, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2
        }}
      >
        <SadIcon sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }} />
        
        <Typography variant="h2" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          404
        </Typography>
        
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Page non trouvée
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" paragraph sx={{ maxWidth: 600, mb: 4 }}>
          La page que vous recherchez n'existe pas ou a été déplacée. 
          Vous pourriez avoir suivi un lien obsolète ou avoir mal saisi l'adresse.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={() => navigate('/')}
          >
            Retour à l'accueil
          </Button>
          
          <Button 
            variant="outlined" 
            color="secondary" 
            size="large"
            onClick={() => navigate(-1)}
          >
            Retour à la page précédente
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          Vous cherchez un col spécifique? Consultez notre <Button 
            color="primary" 
            onClick={() => navigate('/cols')}
            sx={{ textTransform: 'none', fontWeight: 'bold', p: 0, minWidth: 0, verticalAlign: 'baseline' }}
          >
            catalogue de cols
          </Button>.
        </Typography>
      </Paper>
    </Container>
  );
};

export default NotFound;
