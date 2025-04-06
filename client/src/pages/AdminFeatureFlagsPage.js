import React from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Container, 
  Grid, 
  Card, 
  CardHeader, 
  CardContent
} from '@mui/material';
import FeatureFlagsManager from '../components/admin/FeatureFlagsManager';
import AdminSidebar from '../components/admin/AdminSidebar';
import { useAuth } from '../hooks/useAuthCentral';

/**
 * Page d'administration des feature flags
 * Cette page n'est accessible qu'aux administrateurs
 */
const AdminFeatureFlagsPage = () => {
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
          <AdminSidebar activeItem="feature-flags" />
        </Grid>
        <Grid item xs={12} md={9} lg={10}>
          <Card>
            <CardHeader 
              title="Gestion des Feature Flags" 
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'primary.contrastText' 
              }}
              subheader="Activation et désactivation des fonctionnalités sans redéploiement"
              subheaderTypographyProps={{ color: 'primary.contrastText', opacity: 0.8 }}
            />
            <CardContent>
              <FeatureFlagsManager />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminFeatureFlagsPage;
