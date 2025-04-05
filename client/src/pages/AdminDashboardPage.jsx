import React from 'react';
import { Helmet } from 'react-helmet';
import { Box, Typography, Container, Breadcrumbs, Link } from '@mui/material';
import { Dashboard as DashboardIcon, AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import ApiMonitoringDashboard from '../components/admin/ApiMonitoringDashboard';
import AdminLayout from '../layouts/AdminLayout';

const AdminDashboardPage = () => {
  return (
    <AdminLayout>
      <Helmet>
        <title>Tableau de Bord Admin - Cyclisme Européen</title>
      </Helmet>
      
      <Container maxWidth="xl" sx={{ mt: 3, mb: 5 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link color="inherit" href="/">
            Accueil
          </Link>
          <Link color="inherit" href="/admin">
            Administration
          </Link>
          <Typography color="text.primary">Monitoring API</Typography>
        </Breadcrumbs>
        
        <Box display="flex" alignItems="center" mb={3}>
          <AdminIcon fontSize="large" sx={{ mr: 2 }} />
          <Typography variant="h4" component="h1">
            Administration - Monitoring API
          </Typography>
        </Box>
        
        <ApiMonitoringDashboard />
      </Container>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
