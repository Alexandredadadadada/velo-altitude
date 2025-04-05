import React, { Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import ClientSevenMajorsChallenge from '../../../client/src/components/challenges/SevenMajorsChallenge';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Adaptateur pour le composant SevenMajorsChallenge
 * Ce composant sert d'interface entre la structure principale de l'application
 * et l'implémentation dans le sous-dossier client
 */
const SevenMajorsChallenge = () => {
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/sevenmajorschallenge"
        }
      </script>
      <EnhancedMetaTags
        title="Défis Cyclistes | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
    <Box 
      sx={{ 
        padding: 3, 
        width: '100%', 
        maxWidth: 1200, 
        margin: '0 auto',
        minHeight: '80vh' 
      }}
    >
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ 
          fontWeight: 700, 
          textAlign: 'center', 
          marginBottom: 4,
          color: 'primary.main' 
        }}
      >
        Les 7 Majeurs - Challenge Cycliste
      </Typography>
      
      <Suspense fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress size={60} thickness={4} />
        </Box>
      }>
        <ClientSevenMajorsChallenge />
      </Suspense>
    </Box>
  );
};

export default SevenMajorsChallenge;
