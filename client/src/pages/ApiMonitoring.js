import React from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Container, 
  Grid, 
  Card, 
  CardHeader, 
  CardContent, 
  Typography 
} from '@mui/material';
import ApiMonitoringDashboard from '../components/admin/ApiMonitoringDashboard';
import AdminSidebar from '../components/admin/AdminSidebar';
import { useAuth } from '../hooks/useAuth';

/**
 * Page de monitoring des API
 * Cette page n'est accessible qu'aux administrateurs
 */
const ApiMonitoring = () => {
  // Utiliser le hook useAuth pour vérifier si l'utilisateur est administrateur
  const { isAdmin } = useAuth();

  // Vérifier si l'utilisateur est administrateur
  if (!isAdmin()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3} lg={2}>
          <AdminSidebar activeItem="api-monitoring" />
        </Grid>
        <Grid item xs={12} md={9} lg={10}>
          <Card>
            <CardHeader 
              title="Monitoring des API" 
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'primary.contrastText' 
              }}
            />
            <CardContent sx={{ p: 0 }}>
              <ApiMonitoringDashboard />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ApiMonitoring;
