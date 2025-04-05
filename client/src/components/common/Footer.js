import React from 'react';
import { Box, Container, Grid, Typography, Link, Divider, IconButton } from '@mui/material';
import { Facebook, Twitter, Instagram, YouTube } from '@mui/icons-material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        px: 2,
        mt: 'auto',
        backgroundColor: 'primary.dark',
        color: 'white',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Velo-Altitude
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              La référence pour les cyclistes passionnés de montagne. Découvrez, planifiez et relevez vos défis cyclistes en altitude.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton color="inherit" aria-label="Facebook" size="small">
                <Facebook />
              </IconButton>
              <IconButton color="inherit" aria-label="Twitter" size="small">
                <Twitter />
              </IconButton>
              <IconButton color="inherit" aria-label="Instagram" size="small">
                <Instagram />
              </IconButton>
              <IconButton color="inherit" aria-label="YouTube" size="small">
                <YouTube />
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Navigation
            </Typography>
            <Link href="/" color="inherit" display="block" sx={{ mb: 1 }}>
              Accueil
            </Link>
            <Link href="/cols" color="inherit" display="block" sx={{ mb: 1 }}>
              Catalogue de cols
            </Link>
            <Link href="/training" color="inherit" display="block" sx={{ mb: 1 }}>
              Entraînement
            </Link>
            <Link href="/nutrition" color="inherit" display="block" sx={{ mb: 1 }}>
              Nutrition
            </Link>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Ressources
            </Typography>
            <Link href="/mountain" color="inherit" display="block" sx={{ mb: 1 }}>
              Les 7 Majeurs
            </Link>
            <Link href="/routes" color="inherit" display="block" sx={{ mb: 1 }}>
              Planificateur
            </Link>
            <Link href="/community" color="inherit" display="block" sx={{ mb: 1 }}>
              Communauté
            </Link>
            <Link href="/social" color="inherit" display="block" sx={{ mb: 1 }}>
              Hub Social
            </Link>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              À propos
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Notre équipe
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Mentions légales
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Politique de confidentialité
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Conditions d'utilisation
            </Link>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography variant="body2" color="inherit">
            © {currentYear} Velo-Altitude. Tous droits réservés.
          </Typography>
          <Typography variant="body2" color="inherit">
            Partenaire officiel de Grand Est Cyclisme
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
