import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Typography, Breadcrumbs, Link, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import ApiAnalyticsDashboard from '../components/admin/ApiAnalyticsDashboard';

/**
 * Page d'administration pour l'analyse des API
 */
const AdminApiAnalyticsPage = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <Helmet>
        <title>Analyse des API | Administration | Cyclisme Grand Est</title>
      </Helmet>
      
      <Box sx={{ p: 3 }}>
        {/* Fil d'Ariane */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link 
            color="inherit" 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              navigate('/admin');
            }}
          >
            Administration
          </Link>
          <Typography color="text.primary">Analyse des API</Typography>
        </Breadcrumbs>
        
        {/* Contenu principal */}
        <Paper sx={{ p: 3 }}>
          <ApiAnalyticsDashboard />
        </Paper>
        
        {/* Informations supplémentaires */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Informations sur le système de monitoring des API
          </Typography>
          <Typography variant="body2" paragraph>
            Ce tableau de bord présente l'analyse complète de l'utilisation de toutes les API du système. 
            Il permet de surveiller les quotas, les taux d'erreur, et d'identifier les tendances d'utilisation.
          </Typography>
          <Typography variant="body2" paragraph>
            Les données sont collectées automatiquement par le système de monitoring et sont mises à jour en temps réel.
            Pour une analyse plus approfondie, vous pouvez exécuter le script <code>api-usage-analyzer.js</code> depuis
            la console d'administration.
          </Typography>
          <Typography variant="body2" paragraph>
            En cas d'alerte critique, le système enverra automatiquement des notifications par email et SMS aux administrateurs
            configurés dans les paramètres du système.
          </Typography>
          
          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
            Instructions:
          </Typography>
          <ul>
            <li>
              <Typography variant="body2">
                Utilisez l'onglet "VUE D'ENSEMBLE" pour obtenir un aperçu rapide de l'état des API.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                L'onglet "ALERTES" vous permet de voir toutes les alertes actives nécessitant votre attention.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                L'onglet "TENDANCES" montre l'évolution de l'utilisation des API sur la période récente.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                L'onglet "SÉCURITÉ" présente l'état de sécurité des clés API et des tokens d'accès.
              </Typography>
            </li>
          </ul>
        </Paper>
      </Box>
    </AdminLayout>
  );
};

export default AdminApiAnalyticsPage;
