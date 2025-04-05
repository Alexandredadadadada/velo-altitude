import React from 'react';
import { Container, Breadcrumbs, Typography, Link, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Home as HomeIcon, CompareArrows as CompareIcon, Terrain as TerrainIcon } from '@mui/icons-material';
import ColsComparison from '../components/cols/ColsComparison';

/**
 * Page dédiée à la comparaison de cols
 */
const ColsComparisonPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Fil d'Ariane */}
      <Breadcrumbs aria-label="fil d'ariane" sx={{ mb: 3 }}>
        <Link
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Accueil
        </Link>
        <Link
          component={RouterLink}
          to="/cols"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <TerrainIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Cols
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <CompareIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Comparaison
        </Typography>
      </Breadcrumbs>

      {/* Contenu principal */}
      <Box mb={6}>
        <ColsComparison />
      </Box>
    </Container>
  );
};

export default ColsComparisonPage;
