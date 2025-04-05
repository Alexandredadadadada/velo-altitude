import React from 'react';
import { Container, Paper, Box, Breadcrumbs, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { HomeOutlined as HomeIcon, Assessment as StatsIcon } from '@mui/icons-material';
import CommunityStats from '../../components/community/CommunityStats';

/**
 * Page affichant les statistiques globales de la communauté cycliste
 */
const CommunityStatsPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Fil d'Ariane */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: 'background.paper' }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            component={RouterLink}
            to="/"
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center' }}
            color="inherit"
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Accueil
          </Link>
          <Link
            component={RouterLink}
            to="/community"
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center' }}
            color="inherit"
          >
            Communauté
          </Link>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            <StatsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Statistiques
          </Typography>
        </Breadcrumbs>
      </Paper>

      {/* Contenu principal */}
      <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
        <CommunityStats />
      </Paper>
    </Container>
  );
};

export default CommunityStatsPage;
