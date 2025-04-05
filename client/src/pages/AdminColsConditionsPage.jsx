import React from 'react';
import { Helmet } from 'react-helmet';
import { Box, Typography, Container, Breadcrumbs, Link } from '@mui/material';
import { Dashboard as DashboardIcon, Terrain as MountainIcon } from '@mui/icons-material';
import ColsConditionsDashboard from '../components/admin/ColsConditionsDashboard';
import AdminLayout from '../layouts/AdminLayout';

const AdminColsConditionsPage = () => {
  return (
    <AdminLayout>
      <Helmet>
        <title>Conditions des Cols - Administration - Cyclisme Européen</title>
      </Helmet>
      
      <Container maxWidth="xl" sx={{ mt: 3, mb: 5 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link color="inherit" href="/">
            Accueil
          </Link>
          <Link color="inherit" href="/admin">
            Administration
          </Link>
          <Typography color="text.primary">Conditions des Cols</Typography>
        </Breadcrumbs>
        
        <Box display="flex" alignItems="center" mb={3}>
          <MountainIcon fontSize="large" sx={{ mr: 2 }} />
          <Typography variant="h4" component="h1">
            Surveillance des Conditions des Cols
          </Typography>
        </Box>
        
        <ColsConditionsDashboard />
      </Container>
    </AdminLayout>
  );
};

export default AdminColsConditionsPage;
